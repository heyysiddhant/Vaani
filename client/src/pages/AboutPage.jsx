import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Info, 
    Sparkles, 
    Linkedin, 
    ExternalLink, 
    Heart, 
    MessageSquare, 
    ShieldCheck, 
    Zap, 
    Globe, 
    Github
} from 'lucide-react';
import logo from '../assets/vaani.png';

const AboutPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors selection:bg-primary-500/30">
            {/* Navigation Header */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all text-gray-500 group active:scale-90"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wider">Mission & Evolution</h1>
                            <p className="text-[10px] font-bold text-primary-500 uppercase tracking-[0.2em]">About Vaani</p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">
                {/* Hero Section */}
                <section className="relative rounded-[3rem] overflow-hidden bg-linear-to-br from-primary-600 to-indigo-700 p-12 text-white shadow-3xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
                    
                    <div className="relative z-10 max-w-2xl space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest">
                            <Sparkles size={14} className="text-yellow-300" />
                            Establishing The Future
                        </div>
                        <h2 className="text-5xl md:text-6xl font-black leading-tight tracking-tighter flex items-center gap-4">
                            Bridging Worlds Through <div className="flex items-center gap-3">
                                <img src={logo} alt="Vaani Logo" className="w-12 h-12 md:w-16 md:h-16 rounded-3xl shadow-2xl object-cover" />
                                <span className="text-primary-200">Vaani</span>
                            </div>
                        </h2>
                        <p className="text-lg md:text-xl text-primary-50/80 font-medium leading-relaxed">
                            A mission to create the most intuitive, beautiful, and secure communication platform for the next generation.
                        </p>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column: Vision & Features */}
                    <div className="lg:col-span-7 space-y-12">
                        <div className="space-y-6">
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                                <Info className="text-primary-500" size={32} />
                                The Vision
                            </h3>
                            <div className="space-y-4 text-gray-600 dark:text-gray-400 text-lg leading-relaxed font-medium">
                                <p>
                                    In an era where digital noise is everywhere, **Vaani** stands as a sanctuary for meaningful connection. We believe that technology should fade into the background, leaving only the warmth of human interaction.
                                </p>
                                <p>
                                    Our journey started with a simple question: *How can we make digital conversations feel more real?* The answer led us to build a platform where aesthetics meets performance, ensuring that every word you speak, every file you share, and every moment you experience is handled with care.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl hover:shadow-2xl transition-all group">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <ShieldCheck size={24} />
                                </div>
                                <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2">Secure by Design</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                                    Privacy isn't an afterthought. We've built Vaani with security at its core, ensuring your data stays yours.
                                </p>
                            </div>
                            <div className="p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl hover:shadow-2xl transition-all group">
                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Zap size={24} />
                                </div>
                                <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2">Ultra Performance</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                                    Experience real-time low-latency communication powered by modern socket architecture.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Developer & Stats */}
                    <div className="lg:col-span-5 space-y-12">
                        {/* Developer Spotlight */}
                        <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-8 border border-primary-500/10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
                            
                            <div className="space-y-8 relative z-10">
                                <div className="text-center space-y-4">
                                    <div className="w-24 h-24 mx-auto rounded-3xl bg-linear-to-br from-primary-500 to-indigo-600 p-1 shadow-2xl rotate-6 group-hover:rotate-0 transition-all duration-500">
                                        <div className="w-full h-full bg-white dark:bg-gray-950 rounded-[calc(1.5rem-4px)] flex items-center justify-center font-black text-primary-600 text-3xl">SM</div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
                                            The Mind Behind <Heart size={10} className="text-red-500 fill-red-500 animate-pulse" />
                                        </p>
                                        <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Siddhant Mishra</h3>
                                        <p className="text-sm text-gray-500 font-medium italic mt-2">Full Stack Developer & Visionary</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <a 
                                        href="https://linkedin.com/in/siddhant2908" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="w-full py-4 bg-[#0077b5] hover:bg-[#005a8a] text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                                    >
                                        <Linkedin size={20} />
                                        Connect on LinkedIn
                                        <ExternalLink size={14} />
                                    </a>
                                </div>

                                <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center justify-between text-gray-400 mb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Current Stack</span>
                                        <Globe size={16} />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {['MERN Stack', 'Socket.io', 'Tailwind v4', 'Cloudinary', 'Lucide'].map(tech => (
                                            <span key={tech} className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-bold rounded-lg border border-gray-100 dark:border-gray-800">
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Version Info */}
                        <div className="bg-linear-to-br from-gray-900 to-black dark:from-primary-950 dark:to-gray-950 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary-500 via-indigo-500 to-primary-500 opacity-50"></div>
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-2xl font-black tracking-tight">Vaani 0.01</h4>
                                        <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">Public Beta Version</p>
                                    </div>
                                    <span className="animate-pulse flex h-3 w-3 rounded-full bg-primary-500 shadow-lg shadow-primary-500/50"></span>
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed font-medium">
                                    We are just getting started. This version includes core group features, real-time messaging, and high-end personalization.
                                </p>
                                <div className="pt-4 space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500 italic">Coming Soon:</p>
                                    <div className="space-y-1">
                                        {['End-to-End Encryption', 'Message Reactions', 'Voice Notes', 'Enhanced Media Browser'].map(item => (
                                            <div key={item} className="flex items-center gap-2 text-xs font-bold text-gray-300">
                                                <div className="w-1 h-1 bg-primary-500 rounded-full"></div>
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <footer className="pt-12 border-t border-gray-100 dark:border-gray-800 text-center space-y-6">
                    <div className="flex justify-center gap-6">
                        <MessageSquare className="text-primary-500/30" size={40} />
                    </div>
                    <div>
                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2">Vaani Messenger</p>
                        <p className="text-xs text-gray-500 font-medium">© 2026 Vaani. Crafted with passion for the global community.</p>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default AboutPage;
