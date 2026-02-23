const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');

// @desc    Send a message
// @route   POST /api/message
// @access  Private
exports.sendMessage = async (req, res) => {
    const { content, chatId, messageType, mediaUrl } = req.body;

    if ((!content && !mediaUrl) || !chatId) {
        return res.status(400).json({ message: 'Invalid data passed into request' });
    }

    const newMessage = {
        sender: req.user._id,
        content: content,
        chatId: chatId,
        messageType: messageType || 'text',
        mediaUrl: mediaUrl,
    };

    try {
        const chat = await Chat.findById(chatId);
        if (chat.isDeleted) {
            return res.status(403).json({ message: 'Cannot send messages to a deleted group' });
        }

        let message = await Message.create(newMessage);

        message = await message.populate('sender', 'name avatar');
        message = await message.populate('chatId');
        message = await User.populate(message, {
            path: 'chatId.participants',
            select: 'name email avatar',
        });

        await Chat.findByIdAndUpdate(req.body.chatId, {
            lastMessage: message,
            hiddenBy: [], // Clear hiddenBy so it reappears for everyone
        });

        res.json(message);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all messages for a chat
// @route   GET /api/message/:chatId
// @access  Private
exports.allMessages = async (req, res) => {
    try {
        const messages = await Message.find({ chatId: req.params.chatId })
            .populate('sender', 'name avatar email')
            .populate('chatId');
        res.json(messages);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
// @desc    Mark messages as read
// @route   PUT /api/message/read/:chatId
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id;

        await Message.updateMany(
            { chatId: chatId, sender: { $ne: userId }, readBy: { $ne: userId } },
            { $addToSet: { readBy: userId } }
        );

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
// @desc    Delete a message (soft delete)
// @route   DELETE /api/message/:messageId
// @access  Private
exports.deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized to delete this message' });
        }

        message.isDeleted = true;
        message.content = 'This message was deleted';
        message.mediaUrl = null;
        message.messageType = 'text';
        await message.save();

        res.json({ message: 'Message deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Clear all messages in a chat
// @route   DELETE /api/message/clear/:chatId
// @access  Private
exports.clearChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        
        // Delete all messages for this chat
        await Message.deleteMany({ chatId: chatId });

        // Update the chat's last message to null
        await Chat.findByIdAndUpdate(chatId, { lastMessage: null });

        res.json({ message: 'Chat cleared successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
