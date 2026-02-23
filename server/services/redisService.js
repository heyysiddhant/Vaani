const { redisClient } = require('../config/redis');

const USER_PRESENCE_KEY = 'user:presence:';
const ACTIVE_SESSIONS_KEY = 'user:sessions:';

exports.setUserOnline = async (userId, socketId) => {
    if (!redisClient.isOpen) return;
    try {
        await redisClient.set(`${USER_PRESENCE_KEY}${userId}`, 'online');
        await redisClient.sAdd(`${ACTIVE_SESSIONS_KEY}${userId}`, socketId);
    } catch (error) {
        console.error('Redis setUserOnline Error:', error);
    }
};

exports.setUserOffline = async (userId, socketId) => {
    if (!redisClient.isOpen) return false;
    try {
        await redisClient.sRem(`${ACTIVE_SESSIONS_KEY}${userId}`, socketId);
        const remainingSessions = await redisClient.sCard(`${ACTIVE_SESSIONS_KEY}${userId}`);
        if (remainingSessions === 0) {
            await redisClient.del(`${USER_PRESENCE_KEY}${userId}`);
            return true; // Fully offline
        }
        return false; // Still online in other sessions
    } catch (error) {
        console.error('Redis setUserOffline Error:', error);
        return false;
    }
};

exports.forceUserOffline = async (userId) => {
    if (!redisClient.isOpen) return;
    try {
        await redisClient.del(`${USER_PRESENCE_KEY}${userId}`);
        await redisClient.del(`${ACTIVE_SESSIONS_KEY}${userId}`);
    } catch (error) {
        console.error('Redis forceUserOffline Error:', error);
    }
};

exports.isUserOnline = async (userId) => {
    if (!redisClient.isOpen) return false;
    try {
        const presence = await redisClient.get(`${USER_PRESENCE_KEY}${userId}`);
        return presence === 'online';
    } catch (error) {
        console.error('Redis isUserOnline Error:', error);
        return false;
    }
};

exports.getUserSocketIds = async (userId) => {
    if (!redisClient.isOpen) return [];
    try {
        return await redisClient.sMembers(`${ACTIVE_SESSIONS_KEY}${userId}`);
    } catch (error) {
        console.error('Redis getUserSocketIds Error:', error);
        return [];
    }
};
exports.getAllOnlineUsers = async () => {
    if (!redisClient.isOpen) return [];
    try {
        const keys = await redisClient.keys(`${USER_PRESENCE_KEY}*`);
        const userIds = keys.map(key => key.replace(USER_PRESENCE_KEY, ''));
        return userIds;
    } catch (error) {
        console.error('Redis getAllOnlineUsers Error:', error);
        return [];
    }
};
exports.clearAllPresenceData = async () => {
    if (!redisClient.isOpen) return;
    try {
        const presenceKeys = await redisClient.keys(`${USER_PRESENCE_KEY}*`);
        const sessionKeys = await redisClient.keys(`${ACTIVE_SESSIONS_KEY}*`);
        const allKeys = [...presenceKeys, ...sessionKeys];
        
        if (allKeys.length > 0) {
            await redisClient.del(allKeys);
            console.log(`Cleared ${allKeys.length} stale Redis presence/session keys`);
        }
    } catch (error) {
        console.error('Redis clearAllPresenceData Error:', error);
    }
};
