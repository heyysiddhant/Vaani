import EmojiPicker from 'emoji-picker-react';
import GroupInfoModal from './GroupInfoModal';
import UserInfoModal from './UserInfoModal';
import api from '../services/api';
import { Search, Plus, LogOut, MessageSquare, Settings, X, User as UserIcon, Trash2, Info, Archive } from 'lucide-react';
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
            <div className="glass w-full max-w-md rounded-[2rem] shadow-2xl shadow-black/20 overflow-hidden text-gray-900 animate-in zoom-in-95 duration-300 border border-white/20">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white/50">
                    <h3 className="font-bold text-lg tracking-tight">Create Group Chat</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-900">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Group Name</label>
                        <input
                            type="text"
                            placeholder="Engineering Team, etc."
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm font-medium"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Select Participants</label>
                        <div className="max-h-60 overflow-y-auto space-y-1 p-1 bg-gray-50/50 rounded-xl border border-gray-100">
                            {users.map((u) => (
                                <div 
                                    key={u._id} 
                                    onClick={() => handleSelect(u)}
                                    className={`p-2.5 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                                        selectedUsers.find(su => su._id === u._id) 
                                        ? 'bg-primary-50 text-primary-700 font-semibold ring-1 ring-primary-500/20' 
                                        : 'hover:bg-white text-gray-700 font-medium'
                                    }`}
                                >
                                    <img src={u.avatar} className="w-9 h-9 rounded-full object-cover shadow-sm bg-white" alt={u.name} />
                                    <span className="text-sm">{u.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button 
                        onClick={handleSubmit}
                        className="w-full py-3.5 bg-gradient-to-br from-primary-500 to-indigo-600 hover:from-primary-400 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-primary-500/25 transition-all transform active:scale-[0.98] border border-white/10"
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
    const [isUserInfoModalOpen, setIsUserInfoModalOpen] = useState(false);
    const [viewingUser, setViewingUser] = useState(null);
    const [isGroupInfoModalOpen, setIsGroupInfoModalOpen] = useState(false);
    const [viewingGroup, setViewingGroup] = useState(null);

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
        <div className={`h-full flex flex-shrink-0 transition-colors ${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] lg:w-[380px]`}>
            {/* 1) Extreme Left Navigation Strip */}
            <div className="w-20 h-full glass-nav flex flex-col items-center py-6 flex-shrink-0 relative z-20">
                <div className="p-2 mb-8 bg-white/20 rounded-2xl shadow-inner border border-white/20">
                    <img src={logo} alt="Vaani Logo" className="w-10 h-10 object-cover" />
                </div>

                <div className="flex flex-col gap-6 flex-1 w-full items-center">
                    <button className="p-3 bg-white/40 text-gray-900 rounded-2xl shadow-sm border border-white/40 relative group">
                        <MessageSquare size={24} />
                        <div className="absolute right-0 top-0 w-2.5 h-2.5 bg-primary-500 rounded-full border-2 border-white/50 translate-x-1/2 -translate-y-1/4"></div>
                        <span className="absolute left-14 bg-black/80 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Chats</span>
                    </button>
                    
                    <button onClick={() => navigate('/archived')} className="p-3 text-gray-500 hover:bg-white/20 rounded-2xl transition-all relative group">
                        <Archive size={24} />
                        <span className="absolute left-14 bg-black/80 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Archived</span>
                    </button>

                    <button onClick={() => navigate('/about')} className="p-3 text-gray-500 hover:bg-white/20 rounded-2xl transition-all relative group">
                        <Info size={24} />
                        <span className="absolute left-14 bg-black/80 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">About</span>
                    </button>
                </div>

                <div className="flex flex-col gap-6 items-center mt-auto w-full relative">
                    <button 
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className={`p-3 rounded-2xl transition-all relative group ${isSettingsOpen ? 'bg-white/30 text-gray-900' : 'text-gray-500 hover:bg-white/20'}`}
                    >
                        <Settings size={24} className={isSettingsOpen ? 'animate-spin-slow' : ''} />
                    </button>

                    {/* Settings Flyout Menu */}
                    {isSettingsOpen && (
                        <div className="absolute bottom-20 left-16 w-56 bg-white/80 backdrop-blur-3xl border border-white/40 rounded-3xl shadow-2xl shadow-black/20 z-50 overflow-hidden animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="p-2 space-y-1">
                                <button onClick={() => { navigate('/settings'); setIsSettingsOpen(false); }} className="w-full p-3 flex items-center gap-3 hover:bg-white/50 rounded-2xl transition-colors text-sm font-bold text-gray-800">
                                    <UserIcon size={18} className="text-primary-500" /> My Profile
                                </button>
                                <div className="h-[1px] bg-gray-200 my-1 mx-2" />
                                <button onClick={() => { logout(); setIsSettingsOpen(false); }} className="w-full p-3 flex items-center gap-3 hover:bg-red-500/20 rounded-2xl transition-colors text-sm font-bold text-red-600">
                                    <LogOut size={18} /> Logout
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="relative group cursor-pointer" onClick={(e) => handleViewProfile(e, user)}>
                        <img src={user?.avatar} alt={user?.name} className="w-12 h-12 rounded-full border-2 border-white/60 object-cover shadow-lg" />
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white/80 rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* 2) Chat List Area */}
            <div className="flex-1 h-full flex flex-col glass-sidebar relative z-10">
                {/* Header Substrip */}
                <div className="p-6 pb-2 flex items-center justify-between">
                    <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Vaani</h1>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Active Users • {onlineUsers.length}</p>
                    </div>
                    <button 
                        onClick={() => setIsGroupModalOpen(true)}
                        className="p-2.5 bg-white/40 hover:bg-white/60 rounded-xl text-gray-900 transition-all border border-white/30 shadow-sm"
                        title="New Group Chat"
                    >
                        <Plus size={18} />
                    </button>
                </div>

            <div className="p-4 relative order-last mt-auto border-t border-white/10">
                <div className="relative group">
                    <Search className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-primary-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-12 pr-4 py-3 glass-input rounded-2xl text-sm font-medium placeholder-gray-500"
                        value={search}
                        onChange={handleSearch}
                    />
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                    <div className="absolute left-4 right-4 mt-2 bg-white/90 backdrop-blur-2xl border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        {searchResults.map((user) => (
                            <button
                                key={user._id}
                                onClick={() => accessChat(user._id)}
                                className="w-full p-3 flex items-center gap-3 hover:bg-primary-50 transition-colors border-b border-gray-50 last:border-0"
                            >
                                <img 
                                    src={user.avatar} 
                                    alt={user.name} 
                                    className="w-10 h-10 rounded-full object-cover border border-gray-100 cursor-pointer shadow-sm bg-white" 
                                    onClick={(e) => handleViewProfile(e, user)}
                                />
                                <div className="text-left overflow-hidden">
                                    <p className="font-bold text-sm text-gray-900 truncate">{user.name}</p>
                                    <p className="text-xs text-gray-500 font-medium truncate">{user.email}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto space-y-1 px-3">
                <div className="px-3 py-2 flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 mb-2">
                    <span>Direct Messages</span>
                </div>
                
                {chats.length === 0 && (
                    <div className="px-6 py-12 text-center animate-in fade-in duration-500">
                        <div className="w-16 h-16 bg-primary-50 text-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
                            <MessageSquare size={28} />
                        </div>
                        <p className="text-sm font-bold text-gray-600 mb-1">No chats yet</p>
                        <p className="text-xs font-medium text-gray-400">Search for a friend to start!</p>
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
                            className={`w-full p-3 flex items-center gap-3.5 rounded-2xl transition-all duration-300 group cursor-pointer ${
                                isActive 
                                ? 'bg-gradient-to-br from-primary-500 to-indigo-600 text-white shadow-lg shadow-primary-500/20 active:scale-[0.98]' 
                                : 'hover:bg-white text-gray-900 active:scale-[0.99] border border-transparent hover:border-gray-200/50 shadow-sm hover:shadow-md'
                            }`}
                        >
                            <div className="relative flex-shrink-0">
                                <img
                                    src={chat.isGroup ? (chat.groupAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${chat.groupName}`) : otherParticipant?.avatar}
                                    alt={chat.groupName || otherParticipant?.name}
                                    className={`w-12 h-12 rounded-full object-cover transition-all shadow-sm ${isActive ? 'ring-2 ring-white/30' : 'ring-1 ring-gray-200 group-hover:ring-primary-500/50'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        chat.isGroup ? handleViewGroupProfile(e, chat) : handleViewProfile(e, otherParticipant);
                                    }}
                                />
                                {(!chat.isGroup && isOnline) && (
                                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-[3px] rounded-full ${isActive ? 'border-indigo-600' : 'border-white'}`}></div>
                                )}
                                {(chat.isGroup && onlineCount > 0) && (
                                    <div className={`absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-[3px] rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-sm ${isActive ? 'border-indigo-600' : 'border-white'}`}>
                                        {onlineCount}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <div className="flex justify-between items-baseline gap-2 mb-0.5">
                                    <h3 className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-gray-900'}`}>
                                        {chat.groupName || otherParticipant?.name}
                                    </h3>
                                    <span className={`text-[10px] font-semibold flex-shrink-0 ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                                        {chat.updatedAt ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                    <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                        {chat.isGroup && (
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                Group
                                            </span>
                                        )}
                                        <p className={`text-[13px] truncate font-medium ${isActive ? 'text-white/90' : typingChats.includes(chat._id) ? 'text-primary-500 animate-pulse' : 'text-gray-500'}`}>
                                            {typingChats.includes(chat._id) ? (
                                                'Typing...'
                                            ) : chat.lastMessage ? (
                                                <>
                                                    <span className="font-semibold text-[12px] opacity-80">{chat.lastMessage.sender._id === user._id ? 'You: ' : ''}</span>
                                                    {chat.lastMessage.content || 'Sent media'}
                                                </>
                                            ) : 'Start a conversation'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => handleArchiveChat(e, chat._id)}
                                            className={`p-1.5 rounded-lg transition-all ${isActive ? 'text-white/80 hover:bg-white/20 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-primary-500'}`}
                                            title="Archive Chat"
                                        >
                                            <Archive size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
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
