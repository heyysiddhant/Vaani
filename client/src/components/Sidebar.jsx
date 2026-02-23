import EmojiPicker from 'emoji-picker-react';
import GroupInfoModal from './GroupInfoModal';
import UserInfoModal from './UserInfoModal';
import api from '../services/api';
import { Search, Plus, LogOut, MessageSquare, Users, Settings, X, Moon, Sun, User as UserIcon, Camera, Trash2, Info, Archive } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import logo from '../assets/vaani.png';

const GroupChatModal = ({ isOpen, onClose, users, onCreate }) => {
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);

    const handleSelect = (user) => {
        if (selectedUsers.find(u => u._id === user._id)) {
            setSelectedUsers(selectedUsers.filter((u) => u._id !== user._id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const handleSubmit = () => {
        if (!groupName || selectedUsers.length < 2) {
            return toast.error('Please name the group and select at least 2 users');
        }
        onCreate(groupName, selectedUsers);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="glass w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-gray-900 dark:text-white animate-in zoom-in-95 duration-300">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="font-bold">Create Group Chat</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Group Name</label>
                        <input
                            type="text"
                            placeholder="Engineering Team, etc."
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Select Participants</label>
                        <div className="max-h-60 overflow-y-auto space-y-1 border border-gray-100 dark:border-gray-800 rounded-lg p-1">
                            {users.map((u) => (
                                <div 
                                    key={u._id} 
                                    onClick={() => handleSelect(u)}
                                    className={`p-2 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${
                                        selectedUsers.find(su => su._id === u._id) 
                                        ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300' 
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    <img src={u.avatar} className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700" alt={u.name} />
                                    <span className="text-sm font-medium">{u.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button 
                        onClick={handleSubmit}
                        className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold shadow-lg shadow-primary-500/30 transition-all transform active:scale-95"
                    >
                        Create Group
                    </button>
                </div>
            </div>
        </div>
    );
};

const Sidebar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { chats, setChats, setSelectedChat, selectedChat, typingChats } = useChat();
    const { socket, onlineUsers } = useSocket();
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [allPotentialUsers, setAllPotentialUsers] = useState([]);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
    const [isUserInfoModalOpen, setIsUserInfoModalOpen] = useState(false);
    const [viewingUser, setViewingUser] = useState(null);
    const [isGroupInfoModalOpen, setIsGroupInfoModalOpen] = useState(false);
    const [viewingGroup, setViewingGroup] = useState(null);

    const toggleDarkMode = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDarkMode(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDarkMode(true);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [chatsRes, usersRes] = await Promise.all([
                    api.get('/chat'),
                    api.get('/user')
                ]);
                setChats(chatsRes.data);
                setAllPotentialUsers(usersRes.data);
            } catch (error) {
                toast.error('Failed to load initial data');
            }
        };
        fetchData();
    }, [setChats]);

    useEffect(() => {
        if (!socket) return;
        socket.on('profileUpdated', ({ _id, name, avatar, bio }) => {
            setAllPotentialUsers((prev) => prev.map(u => u._id === _id ? { ...u, name, avatar, bio } : u));
        });
        return () => socket.off('profileUpdated');
    }, [socket]);

    const handleViewProfile = (e, userToView) => {
        e.stopPropagation(); // Avoid triggering chat access
        setViewingUser(userToView);
        setIsUserInfoModalOpen(true);
    };

    const handleViewGroupProfile = (e, chat) => {
        e.stopPropagation();
        setViewingGroup(chat);
        setIsGroupInfoModalOpen(true);
    };

    const handleSearch = async (e) => {
        setSearch(e.target.value);
        if (e.target.value.trim().length > 1) {
            try {
                const { data } = await api.get(`/user?search=${e.target.value}`);
                setSearchResults(data);
            } catch (error) {
                console.error('Search failed', error);
            }
        } else {
            setSearchResults([]);
        }
    };

    const accessChat = async (userId) => {
        try {
            const { data } = await api.post('/chat', { userId });
            if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);
            navigate(`/dashboard/${data._id}`);
            setSearch('');
            setSearchResults([]);
        } catch (error) {
            toast.error('Error accessing chat');
        }
    };

    const createGroup = async (name, users) => {
        try {
            const { data } = await api.post('/chat/group', {
                name,
                users: JSON.stringify(users.map(u => u._id))
            });
            setChats([data, ...chats]);
            navigate(`/dashboard/${data._id}`);
            toast.success(`Group "${name}" created!`);
        } catch (error) {
            toast.error('Failed to create group');
        }
    };

    const handleArchiveChat = async (e, chatId) => {
        e.stopPropagation();
        if (!window.confirm('Archive this chat? It will be moved to the Archived section and reappear if you receive a new message.')) return;
        
        try {
            await api.put('/chat/archive', { chatId });
            setChats(prev => prev.filter(c => c._id !== chatId));
            if (selectedChat?._id === chatId) {
                setSelectedChat(null);
                navigate('/dashboard');
            }
            toast.success('Chat archived');
        } catch (error) {
            toast.error('Failed to archive chat');
        }
    };

    const handleHideChat = async (e, chatId) => {
        e.stopPropagation();
        if (!window.confirm('Remove this chat from your list? It will reappear if you receive a new message.')) return;
        
        try {
            await api.put('/chat/hide', { chatId });
            setChats(prev => prev.filter(c => c._id !== chatId));
            if (selectedChat?._id === chatId) {
                setSelectedChat(null);
                navigate('/dashboard');
            }
            toast.success('Chat removed');
        } catch (error) {
            toast.error('Failed to remove chat');
        }
    };

    return (
        <div className={`w-full md:w-80 h-full border-r border-gray-200/50 dark:border-gray-800/50 flex flex-col bg-white dark:bg-gray-950 transition-colors ${
            selectedChat ? 'hidden md:flex' : 'flex'
        }`}>
            {/* Header */}
            <div className="p-5 flex items-center justify-between border-b border-gray-100/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-950/50 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <img src={logo} alt="Vaani Logo" className="w-9 h-9 rounded-xl shadow-lg object-cover" />
                    <h1 className="text-2xl font-black text-gradient tracking-tight">Vaani</h1>
                </div>
                <div className="flex gap-1">
                    <button 
                        onClick={logout} 
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full text-gray-600 dark:text-gray-400 hover:text-red-600 transition-colors"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {/* Search Section */}
            <div className="p-4 relative bg-white dark:bg-gray-950">
                <div className="relative group">
                    <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm text-gray-900 dark:text-white"
                        value={search}
                        onChange={handleSearch}
                    />
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                    <div className="absolute left-4 right-4 mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden ring-4 ring-black/5">
                        {searchResults.map((user) => (
                            <button
                                key={user._id}
                                onClick={() => accessChat(user._id)}
                                className="w-full p-3 flex items-center gap-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0"
                            >
                                <img 
                                    src={user.avatar} 
                                    alt={user.name} 
                                    className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-gray-700 cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all" 
                                    onClick={(e) => handleViewProfile(e, user)}
                                />
                                <div className="text-left overflow-hidden">
                                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto space-y-0.5 px-2">
                <div className="px-4 py-3 flex items-center justify-between text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    <span>Direct Messages</span>
                    <button 
                        onClick={() => setIsGroupModalOpen(true)}
                        className="p-1 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-600 rounded transition-colors"
                        title="New Group Chat"
                    >
                        <Plus size={16} />
                    </button>
                </div>
                
                {chats.length === 0 && (
                    <div className="p-8 text-center">
                        <MessageSquare className="mx-auto mb-2 text-gray-300 dark:text-gray-700" size={32} />
                        <p className="text-sm text-gray-400">No chats yet. Search for a friend!</p>
                    </div>
                )}

                {chats.map((chat) => {
                    const otherParticipant = chat.isGroup ? null : chat.participants.find((p) => p._id.toString() !== user._id.toString());
                    const isOnline = otherParticipant && onlineUsers.includes(otherParticipant._id.toString());
                    const onlineCount = chat.isGroup ? chat.participants.filter(p => onlineUsers.includes(p._id.toString())).length : 0;
                    const isActive = selectedChat?._id === chat._id;

                    return (
                        <div
                            key={chat._id}
                            onClick={() => navigate(`/dashboard/${chat._id}`)}
                            className={`w-full p-3.5 flex items-center gap-3.5 rounded-2xl transition-all duration-300 group cursor-pointer ${
                                isActive 
                                ? 'bg-linear-to-r from-primary-600/90 to-primary-500/90 text-white shadow-xl shadow-primary-500/20 active:scale-[0.98]' 
                                : 'hover:bg-gray-100/50 dark:hover:bg-gray-900/50 text-gray-900 dark:text-gray-300 active:scale-[0.99]'
                            }`}
                        >
                            <div className="relative flex-shrink-0">
                                <img
                                    src={chat.isGroup ? (chat.groupAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${chat.groupName}`) : otherParticipant?.avatar}
                                    alt={chat.groupName || otherParticipant?.name}
                                    className="w-11 h-11 rounded-full object-cover border-2 border-transparent transition-all hover:ring-2 hover:ring-primary-500"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        chat.isGroup ? handleViewGroupProfile(e, chat) : handleViewProfile(e, otherParticipant);
                                    }}
                                />
                                {(!chat.isGroup && isOnline) && (
                                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-[3px] rounded-full ${isActive ? 'border-primary-600' : 'border-white dark:border-gray-950'}`}></div>
                                )}
                                {(chat.isGroup && onlineCount > 0) && (
                                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-[3px] rounded-full flex items-center justify-center text-[7px] font-black text-white ${isActive ? 'border-primary-600' : 'border-white dark:border-gray-950'}`}>
                                        {onlineCount}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <div className="flex justify-between items-baseline gap-2 mb-0.5">
                                    <div className="flex flex-col min-w-0">
                                        <h3 className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                                            {chat.groupName || otherParticipant?.name}
                                        </h3>
                                        {chat.isGroup && (
                                            <p className={`text-[10px] font-bold ${isActive ? 'text-primary-100' : onlineCount > 0 ? 'text-green-500' : 'text-gray-500'}`}>
                                                {onlineCount > 0 ? `${onlineCount} member${onlineCount > 1 ? 's' : ''} online` : 'Offline'}
                                            </p>
                                        )}
                                    </div>
                                    <span className={`text-[10px] flex-shrink-0 ${isActive ? 'text-primary-100' : 'text-gray-400'}`}>
                                        {chat.updatedAt ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                    <p className={`text-xs truncate font-medium ${isActive ? 'text-primary-50' : typingChats.includes(chat._id) ? 'text-primary-500 animate-pulse' : 'text-gray-500'}`}>
                                        {typingChats.includes(chat._id) ? (
                                            'Typing...'
                                        ) : chat.lastMessage ? (
                                            <>
                                                <span className="font-semibold">{chat.lastMessage.sender._id === user._id ? 'You: ' : ''}</span>
                                                {chat.lastMessage.content}
                                            </>
                                        ) : 'Start a conversation'}
                                    </p>
                                    <div className="flex items-center gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => handleArchiveChat(e, chat._id)}
                                            className={`p-1.5 rounded-xl transition-all ${isActive ? 'text-white hover:bg-white/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-500'}`}
                                            title="Archive Chat"
                                        >
                                            <Archive size={14} />
                                        </button>
                                        <button 
                                            onClick={(e) => handleHideChat(e, chat._id)}
                                            className={`p-1.5 rounded-xl transition-all ${isActive ? 'text-white hover:bg-white/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-500'}`}
                                            title="Remove Chat"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Current User Bar */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 relative">
                {/* Settings Dropdown */}
                {isSettingsOpen && (
                    <div className="absolute bottom-20 left-4 right-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden ring-4 ring-black/5 animate-in slide-in-from-bottom-2 duration-200">
                        <button 
                            onClick={() => {
                                navigate('/settings');
                                setIsSettingsOpen(false);
                            }}
                            className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-bold text-gray-700 dark:text-gray-300 border-b border-gray-50 dark:border-gray-800/50"
                        >
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                                <Settings size={18} />
                            </div>
                            Settings
                        </button>
                        <button 
                            onClick={() => {
                                navigate('/archived');
                                setIsSettingsOpen(false);
                            }}
                            className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-bold text-gray-700 dark:text-gray-300 border-b border-gray-50 dark:border-gray-800/50"
                        >
                            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center">
                                <Archive size={18} />
                            </div>
                            Archived Chats
                        </button>
                        <button 
                            onClick={() => {
                                toggleDarkMode();
                                setIsSettingsOpen(false);
                            }}
                            className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-bold text-gray-700 dark:text-gray-300 border-b border-gray-50 dark:border-gray-800/50"
                        >
                            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
                                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </div>
                            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                        </button>
                        <button 
                            onClick={() => {
                                navigate('/about');
                                setIsSettingsOpen(false);
                            }}
                            className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-bold text-gray-700 dark:text-gray-300 border-b border-gray-50 dark:border-gray-800/50"
                        >
                            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center">
                                <Info size={18} />
                            </div>
                            About Vaani
                        </button>
                        <button 
                            onClick={() => {
                                logout();
                                setIsSettingsOpen(false);
                            }}
                            className="w-full p-4 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-sm font-bold text-red-600 dark:text-red-400"
                        >
                            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center">
                                <LogOut size={18} />
                            </div>
                            Logout
                        </button>
                    </div>
                )}

                <div 
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className={`flex items-center gap-3 p-2.5 rounded-2xl transition-all cursor-pointer group ${isSettingsOpen ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/20' : 'hover:bg-gray-50 dark:hover:bg-gray-900'}`}
                >
                    <div className="relative">
                        <img src={user?.avatar} alt={user?.name} className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-950 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-900 dark:text-white truncate tracking-tight">{user?.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest truncate">{user?.role}</p>
                    </div>
                    <Settings className={`text-gray-400 group-hover:text-primary-500 transition-transform duration-300 ${isSettingsOpen ? 'rotate-90 text-primary-500' : ''}`} size={18} />
                </div>
            </div>

            <GroupChatModal 
                isOpen={isGroupModalOpen} 
                onClose={() => setIsGroupModalOpen(false)}
                users={allPotentialUsers}
                onCreate={createGroup}
            />

            <UserInfoModal 
                isOpen={isUserInfoModalOpen} 
                onClose={() => setIsUserInfoModalOpen(false)} 
                userData={viewingUser} 
            />

            <GroupInfoModal
                isOpen={isGroupInfoModalOpen}
                onClose={() => setIsGroupInfoModalOpen(false)}
                chatData={viewingGroup}
                onUpdate={(updatedChat) => {
                    setChats(prev => prev.map(c => c._id === updatedChat._id ? updatedChat : c));
                    setViewingGroup(updatedChat);
                }}
            />
        </div>
    );
};

export default Sidebar;
