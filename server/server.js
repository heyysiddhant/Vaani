require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const { clearAllPresenceData } = require('./services/redisService');
const socketHandler = require('./sockets/socketHandler');

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true
    }
});

socketHandler(io);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Define exact origins for local dev, but allow Vercel/dynamic domains in production if specified
const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'https://vaani-beta0-0-3-1.vercel.app' // Explicitly add specific typical Vercel patterns if known
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // If it's a Vercel preview deployment or main deployment, allow it dynamically
        if (origin.endsWith('.vercel.app') || origin === process.env.CLIENT_URL) {
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) === -1) {
            console.log(`[CORS Blocked] Origin: ${origin}`);
            return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(helmet());
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    // In production (Render), log basic requests to help debug
    app.use(morgan('short'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/user', userRoutes);

app.get('/', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Welcome to Vaani API' });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Vaani Server is running' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Port
const PORT = process.env.PORT || 5000;

// Start Server
const startServer = async () => {
    console.log('--- Starting Vaani Server Initialization ---');
    console.log(`Node Environment: ${process.env.NODE_ENV}`);
    console.log(`Port Configured: ${PORT}`);
    
    try {
        console.log('[1/3] Connecting to MongoDB...');
        await connectDB();
        console.log('[1/3] MongoDB Connection: SUCCESS');

        console.log('[2/3] Connecting to Redis...');
        await connectRedis();
        console.log('[2/3] Redis Connection: SUCCESS');

        console.log('[3/3] Clearing stale presence data...');
        await clearAllPresenceData();
        console.log('[3/3] Presence Data Cleared: SUCCESS');

        server.listen(PORT, () => {
            console.log(`\n✅ Server successfully bound to port ${PORT}`);
            console.log(`🚀 Vaani API is ready to accept connections.\n`);
        });

        // Handle process errors gracefully to avoid silent crashes on Render
        process.on('unhandledRejection', (err) => {
            console.error('\n❌ UNHANDLED REJECTION! Shutting down gracefully...');
            console.error(err.name, err.message);
            console.error(err.stack);
            server.close(() => {
                process.exit(1);
            });
        });

    } catch (error) {
        console.error('\n❌ CRITICAL: Failed to start server during initialization phase.');
        console.error(`Error Details: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
};

startServer();
