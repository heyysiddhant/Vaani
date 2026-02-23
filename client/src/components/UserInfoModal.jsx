import React from 'react';
import { X, Mail, FileText, User, ShieldCheck } from 'lucide-react';

const UserInfoModal = ({ isOpen, onClose, userData }) => {
    if (!isOpen || !userData) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            ></div>
            
            <div className="w-full max-w-sm glass rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 bg-white dark:bg-gray-900 animate-in zoom-in-95 duration-300 relative z-10">
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors z-20 text-gray-500"
                >
                    <X size={20} />
                </button>

                {/* Header/Avatar Section */}
                <div className="relative h-48 bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-gray-100">
                            <img 
                                src={userData.avatar} 
                                alt={userData.name} 
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-8 pt-6 space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{userData.name}</h2>
                        <div className="flex items-center justify-center gap-2 mt-1">
                            <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-[10px] uppercase font-black tracking-widest rounded-full flex items-center gap-1">
                                <ShieldCheck size={10} /> {userData.role || 'User'}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <div className="mt-1 text-primary-600 dark:text-primary-400">
                                <Mail size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Email Address</p>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{userData.email || 'Private'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <div className="mt-1 text-primary-600 dark:text-primary-400">
                                <FileText size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Biography</p>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed italic">
                                    "{userData.bio || 'This user hasn’t written a bio yet.'}"
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-gray-900 dark:bg-gray-800 hover:bg-black dark:hover:bg-gray-700 text-white rounded-2xl font-black shadow-xl transition-all transform active:scale-95"
                    >
                        Close Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserInfoModal;
