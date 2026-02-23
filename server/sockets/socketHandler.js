const jwt = require('jsonwebtoken');
const { 
    setUserOnline,
    setUserOffline, 
    forceUserOffline,
    getUserSocketIds,
    getAllOnlineUsers
} = require('../services/redisService');

const socketHandler = (io) => {
    // Authentication Middleware for Socket.io
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
            if (err) return next(new Error('Authentication error: Invalid token'));
            socket.userId = decoded.id;
            next();
        });
    });

    io.on('connection', async (socket) => {
        const userId = socket.userId;
        console.log(`User connected: ${userId} (${socket.id})`);

        // Handle online status
        await setUserOnline(userId, socket.id);
        socket.join(userId); // Personal room for multi-device support
        
        // Send initial online users list
        const onlineUsers = await getAllOnlineUsers();
        socket.emit('getOnlineUsers', onlineUsers);
        
        socket.broadcast.emit('userOnline', userId);

        socket.on('joinChat', (chatId) => {
            socket.join(chatId);
            console.log(`User ${userId} joined chat: ${chatId}`);
        });

        socket.on('leaveChat', (chatId) => {
            socket.leave(chatId);
            console.log(`User ${userId} left chat: ${chatId}`);
        });

        socket.on('sendMessage', (message) => {
            const chat = message.chatId;
            if (!chat || !chat.participants) return console.log('Chat participants not defined');

            chat.participants.forEach((user) => {
                if (user._id === message.sender._id) return;
                // Emit to the user's personal room for all their devices
                io.to(user._id).emit('messageReceived', message);
            });
        });

        socket.on('typing', (chatId) => {
            socket.in(chatId).emit('typing', { chatId, userId });
        });

        socket.on('stopTyping', (chatId) => {
            socket.in(chatId).emit('stopTyping', { chatId, userId });
        });

        socket.on('readMessages', ({ chatId, userId }) => {
            socket.in(chatId).emit('messagesRead', { chatId, userId });
        });

        socket.on('deleteMessage', ({ messageId, chatId }) => {
            socket.in(chatId).emit('messageDeleted', messageId);
        });

        socket.on('clearChat', (chatId) => {
            socket.in(chatId).emit('chatCleared', chatId);
        });

        socket.on('groupUpdate', (updatedChat) => {
            if (!updatedChat || !updatedChat.participants) return;
            updatedChat.participants.forEach((participant) => {
                // Emit to each user's personal room
                io.to(participant._id).emit('groupUpdated', updatedChat);
            });
        });

        // WebRTC Signaling
        socket.on('callUser', (data) => {
            const { userToCall, signalData, from, name, callType } = data;
            io.to(userToCall).emit('callUser', { signal: signalData, from, name, callType });
        });

        socket.on('answerCall', (data) => {
            io.to(data.to).emit('callAccepted', data.signal);
        });

        socket.on('rejectCall', (data) => {
            io.to(data.to).emit('callRejected');
        });

        socket.on('endCall', (data) => {
            io.to(data.to).emit('callEnded');
        });

        socket.on('manualLogout', async () => {
            console.log(`User manual logout: ${userId}`);
            await forceUserOffline(userId);
            socket.broadcast.emit('userOffline', userId);
            socket.disconnect();
        });

        socket.on('disconnect', async () => {
            console.log(`User disconnected: ${userId} (${socket.id})`);
            const fullyOffline = await setUserOffline(userId, socket.id);
            if (fullyOffline) {
                socket.broadcast.emit('userOffline', userId);
            }
        });
    });
};

module.exports = socketHandler;
