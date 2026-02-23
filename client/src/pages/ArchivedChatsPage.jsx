import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Archive, 
    MessageSquare, 
    Users, 
    Trash2, 
    ChevronRight, 
    Inbox
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { toast } from 'react-toastify';

const ArchivedChatsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { setChats, setSelectedChat } = useChat();
    const [archivedChats, setArchivedChats] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchArchivedChats = async () => {
        try {
            const { data } = await api.get('/chat/archived');
            setArchivedChats(data);
        } catch (error) {
            toast.error('Failed to fetch archived chats');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArchivedChats();
    }, []);

    const handleUnarchive = async (chatId) => {
        try {
            await api.put('/chat/archive', { chatId });
            setArchivedChats(prev => prev.filter(c => c._id !== chatId));
            
            // Refresh main chats list if needed (optional, will refresh on dashboard load)
            // But let's be proactive:
            const { data: updatedChats } = await api.get('/chat');
            setChats(updatedChats);
            
            toast.success('Chat unarchived');
        } catch (error) {
            toast.error('Failed to unarchive chat');
        }
    };

    const handleOpenChat = (chat) => {
        setSelectedChat(chat);
        navigate(`/dashboard/${chat._id}`);
    };

    const getChatName = (chat) => {
        if (chat.isGroup) return chat.groupName;
        const otherParticipant = chat.participants.find(p => p._id !== user._id);
        return otherParticipant?.name || 'Unknown User';
    };

    const getChatAvatar = (chat) => {
        if (chat.isGroup) return chat.groupAvatar;
        const otherParticipant = chat.participants.find(p => p._id !== user._id);
        return otherParticipant?.avatar;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors selection:bg-primary-500/30">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all text-gray-500 group active:scale-90"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wider">Archived Chats</h1>
                            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.2em]">Hidden Conversations</p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 py-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Cache...</p>
                    </div>
                ) : archivedChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-800">
                            <Inbox size={48} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Your Archive is Empty</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs font-medium">
                                Conversations you archive will appear here. They stay hidden from your main list until a new message arrives.
                            </p>
                        </div>
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-primary-500/20 active:scale-95"
                        >
                            Back to Conversations
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-6 px-2">
                            Showing {archivedChats.length} Archived {archivedChats.length === 1 ? 'Conversation' : 'Conversations'}
                        </p>
                        
                        <div className="grid gap-3">
                            {archivedChats.map((chat) => (
                                <div 
                                    key={chat._id}
                                    className="group relative bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 p-4 transition-all hover:shadow-2xl hover:shadow-primary-500/5 hover:-translate-y-1"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <img 
                                                src={getChatAvatar(chat)} 
                                                alt={getChatName(chat)}
                                                className="w-14 h-14 rounded-2xl object-cover border-2 border-white dark:border-gray-800 shadow-lg"
                                            />
                                            {chat.isGroup ? (
                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-500 rounded-lg flex items-center justify-center text-white border-2 border-white dark:border-gray-900 shadow-sm">
                                                    <Users size={12} />
                                                </div>
                                            ) : (
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0" onClick={() => handleOpenChat(chat)}>
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="text-lg font-black text-gray-900 dark:text-white truncate tracking-tight cursor-pointer hover:text-primary-500 transition-colors">
                                                    {getChatName(chat)}
                                                </h3>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tabular-nums">
                                                    {new Date(chat.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate font-medium">
                                                {chat.lastMessage ? (
                                                    <>
                                                        <span className="text-primary-500/70">{chat.lastMessage.sender._id === user._id ? 'You: ' : ''}</span>
                                                        {chat.lastMessage.content}
                                                    </>
                                                ) : 'No messages yet'}
                                            </p>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <button 
                                                onClick={() => handleUnarchive(chat._id)}
                                                className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all font-bold text-xs flex items-center gap-2 group/btn"
                                                title="Unarchive Chat"
                                            >
                                                <Archive size={16} className="group-hover/btn:rotate-12 transition-transform" />
                                                <span className="hidden sm:inline">Unarchive</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Info Card */}
                {archivedChats.length > 0 && (
                    <div className="mt-12 p-6 bg-linear-to-br from-amber-500/5 to-primary-500/5 rounded-[2.5rem] border border-amber-500/10 dark:border-amber-500/20 flex items-start gap-4">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
                            <Info size={20} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">About Archiving</h4>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                                Archived chats will stay here as long as no new messages are received. Once a new message arrives, the chat will automatically jump back to your main list.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const Info = ({ size }) => <Archive size={size} />; // Fallback icon

export default ArchivedChatsPage;
