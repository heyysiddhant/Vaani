import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { 
    ArrowLeft, 
    Camera, 
    Check, 
    FileText,
    Loader2, 
    Lock, 
    User, 
    Mail,
    Upload,
    Trash2,
    ShieldCheck,
    AlertTriangle,
    ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';
import cloudinaryService from '../services/cloudinaryService';

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';

const SettingsPage = () => {
    const navigate = useNavigate();
    const { user, setUser } = useAuth();
    
    // Profile States
    const [name, setName] = useState(user?.name || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
    
    // Password States
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    
    // Deletion States
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Cropper States
    const [image, setImage] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const onCropComplete = useCallback((_croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                return toast.error('File too large (max 5MB)');
            }
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImage(reader.result);
                setIsCropping(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const getCroppedImg = async (imageSrc, pixelCrop) => {
        const image = new Image();
        image.src = imageSrc;
        await new Promise((resolve) => (image.onload = resolve));

        const canvas = document.createElement('canvas');
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg');
        });
    };

    const handleUploadAvatar = async () => {
        try {
            setIsUploading(true);
            const croppedImageBlob = await getCroppedImg(image, croppedAreaPixels);
            
            // Create a file from the blob
            const file = new File([croppedImageBlob], 'avatar.jpg', { type: 'image/jpeg' });
            
            const url = await cloudinaryService.uploadToCloudinary(file);
            
            if (url) {
                // Immediately update profile in backend
                const { data } = await api.put('/user/profile', { name, avatar: url, bio });
                
                // Update local states & context
                setAvatar(url);
                setUser(data);
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                localStorage.setItem('userInfo', JSON.stringify({ ...userInfo, ...data }));
                
                setIsCropping(false);
                setImage(null);
                toast.success('Avatar updated successfully!');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update avatar');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveAvatar = async () => {
        if (!window.confirm('Are you sure you want to remove your avatar?')) return;
        
        try {
            setIsRemovingAvatar(true);
            const { data } = await api.put('/user/profile', { name, avatar: DEFAULT_AVATAR, bio });
            
            setUser(data);
            setAvatar(DEFAULT_AVATAR);
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            localStorage.setItem('userInfo', JSON.stringify({ ...userInfo, ...data }));
            
            toast.success('Avatar removed successfully!');
        } catch (error) {
            toast.error('Failed to remove avatar');
        } finally {
            setIsRemovingAvatar(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            setIsSavingProfile(true);
            const { data } = await api.put('/user/profile', { name, avatar, bio });
            setUser(data);
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            localStorage.setItem('userInfo', JSON.stringify({ ...userInfo, ...data }));
            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return toast.error('Passwords do not match');
        }
        try {
            setIsSavingPassword(true);
            await api.put('/user/updatepassword', { currentPassword, newPassword });
            toast.success('Password updated successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        if (deletePassword !== deleteConfirmPassword) {
            return toast.error('Passwords do not match');
        }
        
        if (!window.confirm('PERMANENT ACTION: Are you absolutely sure you want to delete your account? This cannot be undone.')) return;

        try {
            setIsDeletingAccount(true);
            await api.delete('/user/profile', { data: { password: deletePassword } });
            toast.success('Account deleted successfully');
            
            // Clear local storage and logout
            localStorage.removeItem('userInfo');
            setUser(null);
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete account');
        } finally {
            setIsDeletingAccount(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
            {/* Nav Header */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">Settings</h1>
                </div>
            </div>

            <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
                {/* Profile Card */}
                <section className="glass rounded-[2rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50">
                    <div className="p-8 border-b border-gray-50 dark:border-gray-800 bg-linear-to-br from-gray-50 to-white dark:from-gray-800/20 dark:to-transparent">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            {/* Avatar Section */}
                            <div className="relative group">
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-primary-500/20 shadow-2xl relative bg-gray-100 dark:bg-gray-800">
                                    <img src={avatar} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 flex flex-col gap-2">
                                    <label className="bg-primary-600 text-white p-2.5 rounded-2xl shadow-lg border-4 border-white dark:border-gray-900 cursor-pointer hover:bg-primary-700 transition-colors">
                                        <Upload size={20} />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                    {avatar !== DEFAULT_AVATAR && (
                                        <button 
                                            onClick={handleRemoveAvatar}
                                            disabled={isRemovingAvatar}
                                            className="bg-red-500 text-white p-2.5 rounded-2xl shadow-lg border-4 border-white dark:border-gray-900 hover:bg-red-600 transition-colors disabled:opacity-50"
                                            title="Remove Avatar"
                                        >
                                            {isRemovingAvatar ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={20} />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{user?.name}</h2>
                                <p className="text-sm font-bold text-gray-500 mb-4">{user?.email}</p>
                                <span className="px-4 py-1.5 bg-gray-900 dark:bg-primary-900/40 text-white dark:text-primary-300 text-[10px] uppercase font-black tracking-widest rounded-full">
                                    Validated {user?.role}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <User size={14} /> Full Name
                                    </label>
                                    <input 
                                        type="text" 
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/20 transition-all dark:text-white"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Mail size={14} /> Email Address
                                    </label>
                                    <input 
                                        type="email" 
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl opacity-50 cursor-not-allowed dark:text-white"
                                        value={user?.email}
                                        disabled
                                    />
                                    <p className="text-[10px] text-gray-400 italic">Email cannot be changed</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <FileText size={14} /> Biography
                                        </label>
                                        <span className={`text-[10px] font-black ${bio.length >= 51 ? 'text-red-500' : 'text-gray-400'}`}>
                                            {bio.length}/51
                                        </span>
                                    </div>
                                    <textarea 
                                        rows="3"
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/20 transition-all dark:text-white resize-none text-sm"
                                        placeholder="Tell us about yourself..."
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value.slice(0, 51))}
                                    ></textarea>
                                </div>
                                
                                <button 
                                    type="submit"
                                    disabled={isSavingProfile}
                                    className="w-full px-10 py-4 bg-linear-to-br from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white rounded-2xl font-black shadow-2xl shadow-primary-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isSavingProfile ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                                    Update Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </section>

                {/* Security Section */}
                <section className="glass rounded-[2rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/10">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">Security</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Password & Authentication</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-lg">
                        <div className="space-y-4">
                            <input 
                                type="password" 
                                placeholder="Current Password"
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/20 transition-all dark:text-white"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input 
                                    type="password" 
                                    placeholder="New Password"
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/20 transition-all dark:text-white"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                                <input 
                                    type="password" 
                                    placeholder="Confirm New"
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/20 transition-all dark:text-white"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={isSavingPassword}
                            className="w-full py-4 bg-gray-900 dark:bg-gray-800 hover:bg-black dark:hover:bg-gray-700 text-white rounded-2xl font-black shadow-xl transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {isSavingPassword ? <Loader2 className="animate-spin" size={20} /> : <Lock size={20} />}
                            Update Password
                        </button>
                    </form>
                </section>

                {/* Danger Zone Section */}
                <section className="glass rounded-[2rem] overflow-hidden shadow-2xl border border-red-100/50 dark:border-red-900/20 bg-white dark:bg-red-950/20 p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/10">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">Danger Zone</h2>
                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Delete your account permanently</p>
                        </div>
                    </div>

                    {!showDeleteConfirm ? (
                        <div className="space-y-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Once you delete your account, there is no going back. All your messages, chats, and data will be permanently removed. Please be certain.
                            </p>
                            <button 
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-8 py-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-900/50 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition-all flex items-center gap-2"
                            >
                                <AlertTriangle size={18} />
                                Delete Account Permanently
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleDeleteAccount} className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-start gap-3">
                                <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                                <p className="text-xs text-red-800 dark:text-red-400 leading-relaxed font-medium">
                                    To confirm deletion, please enter your password. This action is irreversible and all your data will be lost forever.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Password</label>
                                    <input 
                                        type="password" 
                                        placeholder="Type password..."
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-4 focus:ring-red-500/10 transition-all dark:text-white"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Confirm Password</label>
                                    <input 
                                        type="password" 
                                        placeholder="Confirm..."
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-4 focus:ring-red-500/10 transition-all dark:text-white"
                                        value={deleteConfirmPassword}
                                        onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                <button 
                                    type="submit"
                                    disabled={isDeletingAccount}
                                    className="flex-[2] py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black shadow-xl shadow-red-500/20 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 order-2 sm:order-1"
                                >
                                    {isDeletingAccount ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                                    Permanently Delete My Account
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-black hover:bg-gray-200 dark:hover:bg-gray-700 transition-all order-1 sm:order-2"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            </main>

            {/* Cropper Modal */}
            {isCropping && (
                <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="flex-1 relative">
                        <Cropper
                            image={image}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                            cropShape="round"
                            showGrid={false}
                        />
                    </div>
                    <div className="p-8 bg-black/40 border-t border-white/5 flex flex-col gap-6 items-center">
                        <div className="w-full max-w-xs space-y-2">
                            <div className="flex justify-between text-[10px] text-white/50 uppercase font-black uppercase tracking-[0.2em]">
                                <span>Zoom Level</span>
                                <span>{Math.round(zoom * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary-500"
                            />
                        </div>
                        <div className="flex gap-4 w-full max-w-md">
                            <button 
                                onClick={() => setIsCropping(false)}
                                className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleUploadAvatar}
                                disabled={isUploading}
                                className="flex-[2] py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black shadow-2xl shadow-primary-500/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                                Apply Crop
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
