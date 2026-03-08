import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { useChat } from '../context/ChatContext';

const Dashboard = () => {
    const { chatId } = useParams();
    const { setSelectedChat, chats } = useChat();

    // Sync selectedChat with URL chatId
    useEffect(() => {
        if (chatId && chats.length > 0) {
            const chat = chats.find(c => c._id === chatId);
            if (chat) {
                setSelectedChat(chat);
            }
        } else if (!chatId) {
            setSelectedChat(null);
        }
    }, [chatId, chats, setSelectedChat]);

    return (
        <div className="flex items-center justify-center h-screen w-full bg-cover bg-center overflow-hidden relative" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1557683311-eac922347aa1?q=80&w=2029&auto=format&fit=crop')" }}>
            {/* Aesthetic Overlay */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-0"></div>

            {/* Master Glass UI Container */}
            <div className="z-10 w-full max-w-[1400px] h-full md:h-[90vh] md:rounded-[2rem] glass-panel overflow-hidden flex flex-col md:flex-row shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <Sidebar />
                <ChatWindow />
            </div>
        </div>
    );
};

export default Dashboard;
