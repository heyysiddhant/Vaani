const redis = require('redis');

const redisClient = redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 5) {
                console.warn('Redis reconnection failed. Max retries reached. Presence tracking will be unavailable.');
                return false; // Stop retrying
            }
            return Math.min(retries * 500, 5000); // Exponential backoff with delay
        },
        connectTimeout: 5000
    }
});

redisClient.on('error', (err) => {
    // Only log if the client is actually open and encounters an error
    // ECONNREFUSED during connection is handled by the reconnectStrategy and connectRedis catch block
    if (redisClient.isOpen) {
        console.error('Redis Client Error:', err);
    }
});

redisClient.on('connect', () => console.log('Redis Client Connected'));

const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        // Initial connection failure handled gracefully by reconnectStrategy
    }
};

module.exports = { redisClient, connectRedis };
