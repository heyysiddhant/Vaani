import React, { useState, useRef, useEffect } from 'react';
import { X, Mail, FileText, User, ShieldCheck, Edit2, Camera, Trash2, UserPlus, Save, Loader2, Search, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import cloudinaryService from '../services/cloudinaryService';

const GroupInfoModal = ({ isOpen, onClose, chatData, onUpdate }) => {
    const { user } = useAuth();
    const { socket, onlineUsers } = useSocket();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(chatData?.groupName || '');
    const [description, setDescription] = useState(chatData?.groupDescription || '');
    const [avatar, setAvatar] = useState(chatData?.groupAvatar || '');
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Add member state
    const [showAddMember, setShowAddMember] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    
    const fileInputRef = useRef(null);

    // Sync state when chatData changes
    useEffect(() => {
        if (chatData) {
            setName(chatData.groupName || '');
            setDescription(chatData.groupDescription || '');
            setAvatar(chatData.groupAvatar || '');
        }
    }, [chatData]);

    if (!isOpen || !chatData) return null;

    const isAdmin = chatData.groupAdmin._id === user._id;

    const handleUpdate = async () => {
        if (!name.trim()) return toast.error('Group name is required');
        setIsUpdating(true);
        try {
            const { data } = await api.put('/chat/group-details', {
                chatId: chatData._id,
                groupName: name,
                groupDescription: description,
                groupAvatar: avatar,
            });
            onUpdate(data);
            socket?.emit('groupUpdate', data);
            setIsEditing(false);
            toast.success('Group details updated');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update group');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteAvatar = async () => {
        if (!window.confirm('Are you sure you want to delete the group avatar?')) return;
        const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${chatData.groupName}`;
        setAvatar(defaultAvatar);
        
        // If we are not currently editing, save it immediately
        if (!isEditing) {
            setIsUpdating(true);
            try {
                const { data } = await api.put('/chat/group-details', {
                    chatId: chatData._id,
                    groupAvatar: defaultAvatar,
                });
                onUpdate(data);
                socket?.emit('groupUpdate', data);
                toast.success('Group avatar deleted');
            } catch (error) {
                toast.error('Failed to delete avatar');
            } finally {
                setIsUpdating(true);
            }
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const toastId = toast.loading('Uploading avatar...');
        try {
            const url = await cloudinaryService.uploadToCloudinary(file);
            setAvatar(url);
            toast.update(toastId, { render: 'Uploaded successfully', type: 'success', isLoading: false, autoClose: 3000 });
        } catch (error) {
            toast.update(toastId, { render: 'Upload failed', type: 'error', isLoading: false, autoClose: 3000 });
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm('Are you sure you want to remove this member?')) return;
        try {
            const { data } = await api.put('/chat/groupremove', {
                chatId: chatData._id,
                userId,
            });
            onUpdate(data);
            socket?.emit('groupUpdate', data);
            toast.success('Member removed');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to remove member');
        }
    };

    const handleDeleteGroup = async () => {
        if (!window.confirm('PERMANENT ACTION: Are you sure you want to delete this group? All history will become read-only.')) return;
        setIsUpdating(true);
        try {
            const { data } = await api.put('/chat/delete', { chatId: chatData._id });
            onUpdate(data);
            socket?.emit('groupUpdate', data); // Inform others
            toast.success('Group deleted');
            setIsEditing(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete group');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setMemberSearch(query);
        if (query.trim().length > 1) {
            setSearchLoading(true);
            try {
                const { data } = await api.get(`/user?search=${query}`);
                // Filter out users who are already in the group
                const filtered = data.filter(u => !chatData.participants.find(p => p._id === u._id));
                setSearchResults(filtered);
            } catch (error) {
                console.error('Search failed', error);
            } finally {
                setSearchLoading(false);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleAddMember = async (userId) => {
        try {
            const { data } = await api.put('/chat/groupadd', {
                chatId: chatData._id,
                userId,
            });
            onUpdate(data);
            socket?.emit('groupUpdate', data);
            setMemberSearch('');
            setSearchResults([]);
            setShowAddMember(false);
            toast.success('Member added successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add member');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            ></div>
            
            <div className="w-full max-w-md glass rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 bg-white dark:bg-gray-900 animate-in zoom-in-95 duration-300 relative z-10 flex flex-col max-h-[90vh]">
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors z-20 text-gray-500"
                >
                    <X size={20} />
                </button>

                {/* Header/Avatar Section */}
                <div className="relative h-48 bg-linear-to-br from-primary-500 to-primary-700 flex flex-col items-center justify-center flex-shrink-0">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                    <div className="relative group">
                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-gray-100">
                            <img 
                                src={isEditing ? avatar : chatData.groupAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${chatData.groupName}`} 
                                alt={chatData.groupName} 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {isEditing && (
                            <div className="absolute bottom-0 right-0 flex gap-1">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg text-primary-600 hover:scale-110 transition-transform"
                                    title="Change Avatar"
                                >
                                    <Camera size={16} />
                                </button>
                                <button 
                                    onClick={handleDeleteAvatar}
                                    className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg text-red-500 hover:scale-110 transition-transform"
                                    title="Delete Avatar"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleAvatarChange} 
                            className="hidden" 
                            accept="image/*"
                        />
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    <div className="text-center">
                        {isEditing ? (
                            <input 
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full text-2xl font-black text-center bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-primary-500 py-2"
                                placeholder="Group Name"
                            />
                        ) : (
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{chatData.groupName}</h2>
                        )}
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-[10px] uppercase font-black tracking-widest rounded-full">
                                {chatData.participants.length} Members
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Description */}
                        <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <div className="mt-1 text-primary-600 dark:text-primary-400">
                                <FileText size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Description</p>
                                {isEditing ? (
                                    <textarea 
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full text-sm font-medium bg-transparent border-none focus:ring-0 p-0 resize-none h-20"
                                        placeholder="Add a description..."
                                    />
                                ) : (
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed italic">
                                        "{chatData.groupDescription || 'No description provided.'}"
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Members List */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Group Members {showAddMember && '(Searching...)'}</p>
                                {isAdmin && (
                                    <button 
                                        onClick={() => setShowAddMember(!showAddMember)}
                                        className={`text-[10px] font-black flex items-center gap-1 uppercase tracking-widest transition-colors ${showAddMember ? 'text-red-500' : 'text-primary-600 hover:text-primary-700'}`}
                                    >
                                        {showAddMember ? <X size={12} /> : <UserPlus size={12} />}
                                        {showAddMember ? 'Cancel' : 'Add Member'}
                                    </button>
                                )}
                            </div>

                            {/* Add Member Search */}
                            {showAddMember && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            type="text"
                                            value={memberSearch}
                                            onChange={handleSearch}
                                            placeholder="Search users to add..."
                                            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-primary-500"
                                            autoFocus
                                        />
                                    </div>
                                    {searchResults.length > 0 && (
                                        <div className="max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-800/50 rounded-xl p-1 space-y-1 border border-primary-500/10">
                                            {searchResults.map((u) => (
                                                <div key={u._id} className="flex items-center justify-between p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors group/add">
                                                    <div className="flex items-center gap-2">
                                                        <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full" />
                                                        <span className="text-xs font-bold">{u.name}</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleAddMember(u._id)}
                                                        className="p-1.5 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-lg opacity-0 group-hover/add:opacity-100 transition-opacity"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {memberSearch.length > 1 && searchResults.length === 0 && !searchLoading && (
                                        <p className="text-[10px] text-center text-gray-500 py-2">No users found or all already added</p>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {chatData.participants.map((participant) => {
                                    const isOnline = onlineUsers.includes(participant._id);
                                    const isUserAdmin = chatData.groupAdmin._id === participant._id;
                                    
                                    return (
                                        <div key={participant._id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group/member">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <img 
                                                        src={participant.avatar} 
                                                        alt={participant.name} 
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                    {isOnline && (
                                                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-950 rounded-full"></div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{participant.name}</p>
                                                        {isUserAdmin && <ShieldCheck size={12} className="text-primary-600" title="Group Admin" />}
                                                    </div>
                                                    <p className="text-[10px] text-gray-500">{isOnline ? 'Online' : 'Offline'}</p>
                                                </div>
                                            </div>
                                            {isAdmin && participant._id !== user._id && (
                                                <button 
                                                    onClick={() => handleRemoveMember(participant._id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover/member:opacity-100 transition-opacity"
                                                    title="Remove Member"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 pt-0 border-t border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex-shrink-0">
                    <div className="flex gap-3 mt-4">
                        {isAdmin && !chatData.isDeleted && (
                            <button
                                onClick={() => isEditing ? handleUpdate() : setIsEditing(true)}
                                disabled={isUpdating}
                                className={`flex-1 py-4 flex items-center justify-center gap-2 rounded-2xl font-black shadow-xl transition-all transform active:scale-95 ${
                                    isEditing 
                                    ? 'bg-primary-600 hover:bg-primary-700 text-white' 
                                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {isUpdating ? <Loader2 size={18} className="animate-spin" /> : (isEditing ? <Save size={18} /> : <Edit2 size={18} />)}
                                {isEditing ? 'Save Changes' : 'Edit Group'}
                            </button>
                        )}
                        {isAdmin && !chatData.isDeleted && isEditing && (
                            <button
                                onClick={handleDeleteGroup}
                                disabled={isUpdating}
                                className="flex-1 py-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-2xl font-black transition-all hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center gap-2"
                            >
                                <Trash2 size={18} />
                                Delete Group
                            </button>
                        )}
                        {isEditing && (
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setName(chatData.groupName);
                                    setDescription(chatData.groupDescription);
                                    setAvatar(chatData.groupAvatar);
                                }}
                                className="px-6 py-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl font-black transition-all hover:bg-red-100 dark:hover:bg-red-900/40"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                    {!isEditing && (
                        <button
                            onClick={onClose}
                            className="w-full mt-3 py-4 bg-gray-900 dark:bg-gray-800 hover:bg-black dark:hover:bg-gray-700 text-white rounded-2xl font-black shadow-xl transition-all transform active:scale-95"
                        >
                            Close Details
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupInfoModal;
