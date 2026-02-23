import { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const { socket } = useSocket();
    const { user } = useAuth();
    const [selectedChat, setSelectedChat] = useState(null);
    const [chats, setChats] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [typingChats, setTypingChats] = useState([]); // Array of chatIds where someone is typing

    useEffect(() => {
        if (!socket) return;

        socket.on('typing', (data) => {
            const { chatId } = typeof data === 'string' ? { chatId: data } : data;
            if (!typingChats.includes(chatId)) {
                setTypingChats((prev) => [...new Set([...prev, chatId])]);
            }
        });

        socket.on('stopTyping', (data) => {
            const { chatId } = typeof data === 'string' ? { chatId: data } : data;
            setTypingChats((prev) => prev.filter((id) => id !== chatId));
        });

        socket.on('groupUpdated', (updatedChat) => {
            setChats((prevChats) => prevChats.map((chat) => 
                chat._id === updatedChat._id ? { ...chat, ...updatedChat } : chat
            ));

            setSelectedChat((prev) => {
                if (prev?._id === updatedChat._id) {
                    return { ...prev, ...updatedChat };
                }
                return prev;
            });
        });

        socket.on('messageReceived', (newMessage) => {
            // Update chats list to show latest message in sidebar
            setChats((prevChats) => {
                const chatExists = prevChats.some(c => c._id === newMessage.chatId._id);
                
                if (!chatExists) {
                    // Don't add back if archived by current user
                    if (newMessage.chatId.archivedBy && newMessage.chatId.archivedBy.includes(user?._id)) {
                        return prevChats;
                    }
                    
                    // Chat was hidden or is new - add it back
                    const newChatEntry = {
                        ...newMessage.chatId,
                        lastMessage: newMessage,
                        updatedAt: newMessage.createdAt
                    };
                    return [newChatEntry, ...prevChats].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                }

                const updatedChats = prevChats.map((chat) => {
                    if (chat._id === newMessage.chatId._id) {
                        return { ...chat, lastMessage: newMessage, updatedAt: newMessage.createdAt };
                    }
                    return chat;
                });
                // Sort by last message time
                return updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            });

            // Handle notification if not in the chat
            if (!selectedChat || selectedChat._id !== newMessage.chatId._id) {
                setNotifications((prev) => [newMessage, ...prev]);
            }
        });

        socket.on('messagesRead', ({ chatId, userId }) => {
            setChats((prevChats) => prevChats.map((chat) => {
                if (chat._id === chatId && chat.lastMessage && chat.lastMessage.sender !== userId) {
                    return {
                        ...chat,
                        lastMessage: {
                            ...chat.lastMessage,
                            readBy: [...new Set([...(chat.lastMessage.readBy || []), userId])]
                        }
                    };
                }
                return chat;
            }));
        });

        socket.on('messageDeleted', (messageId) => {
            setChats((prevChats) => prevChats.map((chat) => {
                if (chat.lastMessage?._id === messageId) {
                    return {
                        ...chat,
                        lastMessage: { ...chat.lastMessage, isDeleted: true, content: 'This message was deleted' }
                    };
                }
                return chat;
            }));
        });

        socket.on('chatCleared', (chatId) => {
            setChats((prevChats) => prevChats.map((chat) => {
                if (chat._id === chatId) {
                    return { ...chat, lastMessage: null };
                }
                return chat;
            }));
        });

        socket.on('profileUpdated', ({ _id, name, avatar, bio }) => {
            setChats((prevChats) => prevChats.map((chat) => {
                const updatedParticipants = chat.participants.map((p) => 
                    p._id === _id ? { ...p, name, avatar, bio } : p
                );
                return { ...chat, participants: updatedParticipants };
            }));

            setSelectedChat((prev) => {
                if (!prev) return null;
                const updatedParticipants = prev.participants.map((p) => 
                    p._id === _id ? { ...p, name, avatar, bio } : p
                );
                return { ...prev, participants: updatedParticipants };
            });
        });

        socket.on('groupUpdate', (updatedChat) => {
            setChats((prevChats) => prevChats.map((chat) => 
                chat._id === updatedChat._id ? updatedChat : chat
            ));

            setSelectedChat((prev) => {
                if (prev?._id === updatedChat._id) {
                    return updatedChat;
                }
                return prev;
            });
        });

        return () => {
            socket.off('typing');
            socket.off('stopTyping');
            socket.off('messageReceived');
            socket.off('messagesRead');
            socket.off('messageDeleted');
            socket.off('profileUpdated');
            socket.off('groupUpdate');
        };
    }, [socket, selectedChat]);

    return (
        <ChatContext.Provider
            value={{
                selectedChat,
                setSelectedChat,
                chats,
                setChats,
                notifications,
                setNotifications,
                typingChats,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
