import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { Send, Image, FileText, Phone, Video, MoreVertical, Smile, MessageSquare, ArrowLeft, Download, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import VideoCallModal from './VideoCallModal';
import UserInfoModal from './UserInfoModal';
import cloudinaryService from '../services/cloudinaryService';
import EmojiPicker from 'emoji-picker-react';
import GroupInfoModal from './GroupInfoModal';

const ChatWindow = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { selectedChat, setSelectedChat } = useChat();
    const { socket, onlineUsers } = useSocket();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [typing, setTyping] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isCallModalOpen, setIsCallModalOpen] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [callType, setCallType] = useState('video');
    const [isUserInfoModalOpen, setIsUserInfoModalOpen] = useState(false);
    const [viewingUser, setViewingUser] = useState(null);
    const [isGroupInfoModalOpen, setIsGroupInfoModalOpen] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (selectedChat) {
            const fetchMessages = async () => {
                try {
                    const { data } = await api.get(`/message/${selectedChat._id}`);
                    setMessages(data);
                    socket?.emit('joinChat', selectedChat._id);
                    // Mark messages as read
                    await api.put(`/message/read/${selectedChat._id}`);
                    socket?.emit('readMessages', { chatId: selectedChat._id, userId: user._id });
                } catch (error) {
                    toast.error('Failed to load messages');
                }
            };
            fetchMessages();
        }
    }, [selectedChat, socket]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!socket) return;

        socket.on('messageReceived', (newMessage) => {
            if (selectedChat && selectedChat._id === newMessage.chatId._id) {
                setMessages((prev) => [...prev, newMessage]);
                if (document.visibilityState === 'visible') {
                    api.put(`/message/read/${selectedChat._id}`);
                    socket?.emit('readMessages', { chatId: selectedChat._id, userId: user._id });
                }
            }
        });

        socket.on('messagesRead', ({ chatId, userId }) => {
            if (chatId === selectedChat?._id) {
                setMessages((prev) => prev.map(m => {
                    if (m.sender._id !== userId && !m.readBy.includes(userId)) {
                        return { ...m, readBy: [...m.readBy, userId] };
                    }
                    return m;
                }));
            }
        });

        socket.on('messageDeleted', (messageId) => {
            setMessages((prev) => prev.map(m => m._id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m));
        });

        socket.on('typing', (data) => {
            const { chatId, userId: typingId } = typeof data === 'string' ? { chatId: data, userId: null } : data;
            if (chatId === selectedChat?._id) {
                setIsTyping(true);
                if (selectedChat.isGroup && typingId) {
                    const typingPerson = selectedChat.participants.find(p => p._id === typingId);
                    if (typingPerson) setTypingUser(typingPerson.name);
                }
            }
        });
        socket.on('stopTyping', (data) => {
            const { chatId } = typeof data === 'string' ? { chatId: data } : data;
            if (chatId === selectedChat?._id) {
                setIsTyping(false);
                setTypingUser(null);
            }
        });
        
        socket.on('chatCleared', (chatId) => {
            if (chatId === selectedChat?._id) {
                setMessages([]);
            }
        });

        socket.on('callUser', (data) => {
            setCallType(data.callType || 'video');
            setIncomingCall(data);
            setIsCallModalOpen(true);
        });

        return () => {
            socket.off('messageReceived');
            socket.off('messagesRead');
            socket.off('typing');
            socket.off('stopTyping');
            socket.off('chatCleared');
            socket.off('callUser');
        };
    }, [socket, selectedChat]);

    useEffect(() => {
        if (!socket) return;
        socket.on('messageDeleted', (messageId) => {
            setMessages((prev) => prev.map(m => m._id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m));
        });
        return () => socket.off('messageDeleted');
    }, [socket]);

    const handleDownload = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename || 'downloaded_image';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            toast.error('Failed to download image');
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;
        try {
            await api.delete(`/message/${messageId}`);
            setMessages((prev) => prev.map(m => m._id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m));
            socket?.emit('deleteMessage', { messageId, chatId: selectedChat._id });
            toast.success('Message deleted');
        } catch (error) {
            toast.error('Failed to delete message');
        }
    };

    const handleClearChat = async () => {
        if (!window.confirm('Are you sure you want to clear all messages in this chat? This cannot be undone.')) return;
        try {
            await api.delete(`/message/clear/${selectedChat._id}`);
            setMessages([]);
            socket?.emit('clearChat', selectedChat._id);
            setShowMenu(false);
            toast.success('Chat cleared');
        } catch (error) {
            toast.error('Failed to clear chat');
        }
    };

    const handleViewProfile = (userToView) => {
        if (selectedChat?.isGroup && !userToView) {
            setIsGroupInfoModalOpen(true);
        } else {
            setViewingUser(userToView);
            setIsUserInfoModalOpen(true);
        }
    };

    const handleSendMessage = async (e, mediaUrl = null, messageType = 'text') => {
        if (e) e.preventDefault();
        if (selectedChat?.isDeleted) return;
        if (!newMessage.trim() && !mediaUrl) return;

        socket?.emit('stopTyping', selectedChat._id);
        setTyping(false);

        try {
            const { data } = await api.post('/message', {
                content: mediaUrl ? '' : newMessage,
                chatId: selectedChat._id,
                messageType,
                mediaUrl,
            });
            setNewMessage('');
            setMessages([...messages, data]);
            socket?.emit('sendMessage', data);
        } catch (error) {
            toast.error('Failed to send message');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const toastId = toast.loading('Uploading media...');
        try {
            const url = await cloudinaryService.uploadToCloudinary(file);
            const type = file.type.startsWith('image/') ? 'image' : 'file';
            await handleSendMessage(null, url, type);
            toast.update(toastId, { render: 'Uploaded successfully', type: 'success', isLoading: false, autoClose: 3000 });
        } catch (error) {
            toast.update(toastId, { render: 'Upload failed', type: 'error', isLoading: false, autoClose: 3000 });
        }
    };

    const typingHandler = (e) => {
        setNewMessage(e.target.value);
        if (!socket) return;

        if (!typing) {
            setTyping(true);
            socket.emit('typing', selectedChat._id);
        }

        let lastTypingTime = new Date().getTime();
        setTimeout(() => {
            let timeNow = new Date().getTime();
            let timeDiff = timeNow - lastTypingTime;
            if (timeDiff >= 3000 && typing) {
                socket.emit('stopTyping', selectedChat._id);
                setTyping(false);
            }
        }, 3000);
    };
    
    const onEmojiClick = (emojiObject) => {
        setNewMessage((prev) => prev + emojiObject.emoji);
        setShowEmojiPicker(false);
    };

    if (!selectedChat) {
        return (
            <div className="hidden md:flex flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors">
                <div className="text-center animate-subtle-float">
                    <div className="bg-linear-to-br from-primary-500/20 to-primary-600/20 p-6 rounded-3xl inline-block mb-6 shadow-2xl shadow-primary-500/10 backdrop-blur-3xl">
                        <MessageSquare size={56} className="text-primary-600" />
                    </div>
                    <h2 className="text-4xl font-black mb-3 tracking-tighter text-gradient">Vaani</h2>
                    <p className="text-gray-500 font-medium tracking-tight">Select a conversation to start messaging</p>
                </div>
            </div>
        );
    }

    const otherParticipant = selectedChat?.isGroup ? null : selectedChat?.participants.find((p) => p._id.toString() !== user._id.toString());
    const isOnline = otherParticipant && onlineUsers.includes(otherParticipant._id.toString());
    const onlineCount = selectedChat?.isGroup ? selectedChat.participants.filter(p => onlineUsers.includes(p._id.toString())).length : 0;

    return (
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-950/50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800/50 backdrop-blur-md bg-white/80 dark:bg-gray-950/80 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/dashboard')} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors mr-1">
                        <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    
                    <div className="relative cursor-pointer group" onClick={() => handleViewProfile(null)}>
                        <img 
                            src={selectedChat?.isGroup ? (selectedChat.groupAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedChat.groupName}`) : otherParticipant?.avatar} 
                            alt="Avatar" 
                            className="w-10 h-10 rounded-full object-cover border-2 border-primary-500/20 group-hover:ring-2 group-hover:ring-primary-500 transition-all" 
                        />
                        {(!selectedChat?.isGroup && isOnline) && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-950 rounded-full"></div>
                        )}
                        {(selectedChat?.isGroup && onlineCount > 0) && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-950 rounded-full flex items-center justify-center text-[6px] font-black text-white">
                                {onlineCount}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 leading-tight">
                            {selectedChat?.isGroup ? selectedChat.groupName : otherParticipant?.name}
                        </h3>
                        <p className={`text-[11px] font-medium ${selectedChat?.isGroup ? (onlineCount > 0 ? 'text-green-500' : 'text-gray-400') : (isOnline ? 'text-green-500' : 'text-gray-400')}`}>
                            {selectedChat?.isGroup 
                                ? (onlineCount > 0 ? `${onlineCount} member${onlineCount > 1 ? 's' : ''} online` : 'Offline')
                                : (isOnline ? 'Online' : 'Offline')}
                        </p>
                    </div>
                </div>
 <div className="flex gap-4 text-gray-500 dark:text-gray-400">
                    <button 
                        onClick={() => {
                            setCallType('audio');
                            setIsCallModalOpen(true);
                        }}
                        className="hover:text-primary-600 transition-colors"
                        title="Audio Call"
                    >
                        <Phone size={20} />
                    </button>
                    <button 
                        onClick={() => {
                            setCallType('video');
                            setIsCallModalOpen(true);
                        }}
                        className="hover:text-primary-600 transition-colors"
                        title="Video Call"
                    >
                        <Video size={20} />
                    </button>
                    <div className="relative">
                        <button 
                            onClick={() => setShowMenu(!showMenu)}
                            className={`p-2 rounded-full transition-colors ${showMenu ? 'bg-gray-100 dark:bg-gray-800 text-primary-600' : 'hover:text-primary-600'}`}
                            title="Menu"
                        >
                            <MoreVertical size={20} />
                        </button>
                        
                        {showMenu && (
                            <>
                                <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setShowMenu(false)}
                                ></div>
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        onClick={handleClearChat}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                        Clear Chat
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m) => (
                    <div key={m._id} className={`flex items-end gap-2 animate-in slide-in-from-bottom-2 duration-300 group/msg ${m.sender._id === user._id ? 'flex-row-reverse' : 'flex-row'}`}>
                        {m.sender._id !== user._id && (
                            <img 
                                src={m.sender.avatar} 
                                alt={m.sender.name}
                                className="w-8 h-8 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleViewProfile(m.sender)}
                            />
                        )}
                        <div className={`relative max-w-[75%] p-4 rounded-2xl shadow-sm ${
                            m.sender._id === user._id 
                            ? 'bg-linear-to-br from-primary-600 to-primary-700 text-white rounded-br-none shadow-primary-500/10' 
                            : 'bg-gray-100 dark:bg-gray-900 dark:border dark:border-gray-800/50 rounded-bl-none'
                        }`}>
                            {m.sender._id === user._id && !m.isDeleted && (
                                <button 
                                    onClick={() => handleDeleteMessage(m._id)}
                                    className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover/msg:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                            {m.messageType === 'image' && (
                                <div className="relative group/img">
                                    <img src={m.mediaUrl} alt="shared" className="rounded-lg mb-2 max-h-60 object-cover" />
                                    <button 
                                        onClick={() => handleDownload(m.mediaUrl, `image_${m._id}.jpg`)}
                                        className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
                                    >
                                        <Download size={16} />
                                    </button>
                                </div>
                            )}
                            {m.messageType === 'file' && (
                                <a href={m.mediaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline mb-2">
                                    <FileText size={16} /> View File
                                </a>
                            )}
                            <p className={`text-sm ${m.isDeleted ? 'italic text-gray-400 opacity-70' : ''}`}>
                                {m.isDeleted ? 'This message was deleted' : m.content}
                            </p>
                            <div className="flex justify-between items-end gap-2 mt-1">
                                <span className={`text-[10px] block ${m.sender._id === user._id ? 'text-primary-100' : 'text-gray-500'}`}>
                                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {m.sender._id === user._id && (
                                    <div className="flex -space-x-1">
                                        <Send size={10} className={m.readBy.length > 0 ? 'text-white' : 'text-primary-200'} />
                                        {m.readBy.length > 0 && <Send size={10} className="text-white" />}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="flex flex-col gap-1">
                            {typingUser && (
                                <span className="text-[10px] text-gray-500 ml-1 font-medium">{typingUser} is typing...</span>
                            )}
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-bl-none w-fit">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                {selectedChat?.isDeleted ? (
                    <div className="flex flex-col items-center justify-center py-4 px-8 text-center bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-3">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-1">Group Deleted</h3>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
                            This group has been deleted by an admin. You can no longer send messages, images or files here.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                        <div className="flex gap-2 text-gray-500">
                            <button 
                                type="button" 
                                onClick={() => fileInputRef.current.click()}
                                className="hover:text-primary-600"
                            >
                                <Image size={22} />
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileUpload} 
                                className="hidden" 
                                accept="image/*,application/pdf"
                            />
                        </div>
                        <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            className="w-full py-2 px-4 bg-gray-50 dark:bg-gray-800 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={newMessage}
                            onChange={typingHandler}
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="absolute right-3 top-2 text-gray-500 hover:text-primary-600"
                        >
                            <Smile size={20} />
                        </button>
                        {showEmojiPicker && (
                            <div className="absolute bottom-12 right-0 z-50">
                                <EmojiPicker onEmojiClick={onEmojiClick} theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'} />
                            </div>
                        )}
                    </div>
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-full disabled:opacity-50 transition-colors"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                )}
            </div>

            <VideoCallModal 
                isOpen={isCallModalOpen} 
                onClose={() => {
                    setIsCallModalOpen(false);
                    setIncomingCall(null);
                }}
                remoteUser={incomingCall ? { _id: incomingCall.from, name: incomingCall.name } : otherParticipant}
                isIncoming={!!incomingCall}
                incomingSignal={incomingCall?.signal}
                callType={callType}
            />

            <UserInfoModal 
                isOpen={isUserInfoModalOpen} 
                onClose={() => setIsUserInfoModalOpen(false)} 
                userData={viewingUser} 
            />

            <GroupInfoModal 
                isOpen={isGroupInfoModalOpen}
                onClose={() => setIsGroupInfoModalOpen(false)}
                chatData={selectedChat}
                onUpdate={(updatedChat) => {
                    setSelectedChat(updatedChat);
                }}
            />
        </div>
    );
};

export default ChatWindow;
