import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        if (user) {
            const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
                auth: {
                    token: localStorage.getItem('token'),
                },
            });

            setSocket(newSocket);

            newSocket.on('getOnlineUsers', (users) => {
                setOnlineUsers(users);
            });

            newSocket.on('userOnline', (userId) => {
                setOnlineUsers((prev) => [...new Set([...prev, userId])]);
            });

            newSocket.on('userOffline', (userId) => {
                setOnlineUsers((prev) => prev.filter((id) => id !== userId));
            });

            return () => {
                newSocket.close();
            };
        } else {
            // User logged out, emit manualLogout before closing if socket exists
            if (socket) {
                socket.emit('manualLogout');
                socket.disconnect();
                setSocket(null);
            }
        }
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
