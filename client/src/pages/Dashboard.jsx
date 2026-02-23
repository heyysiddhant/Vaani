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
        <div className="flex h-screen w-full bg-white dark:bg-gray-900 overflow-hidden">
            <Sidebar />
            <ChatWindow />
        </div>
    );
};

export default Dashboard;
