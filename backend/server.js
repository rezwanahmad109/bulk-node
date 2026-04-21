// Load env vars FIRST - must be before anything else reads process.env
require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const WhatsAppSession = require('./models/WhatsAppSession');
const { initSession } = require('./services/whatsapp/whatsappEngine');
const { createMessageWorker } = require('./queues/messageQueue');

// Connect to MongoDB Atlas
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Make the io instance accessible in any route via req.app.get('io')
app.set('io', io);

const rehydrateConnectedSessions = async () => {
    try {
        const reconnectableSessions = await WhatsAppSession.find({
            status: { $in: ['connected', 'CONNECTED'] },
        }).select('sessionId');

        if (!reconnectableSessions.length) {
            console.log('Session rehydration: no connected sessions to restore.');
            return;
        }

        console.log(`Session rehydration: attempting to restore ${reconnectableSessions.length} session(s).`);

        for (const session of reconnectableSessions) {
            try {
                await initSession(session.sessionId, io);
            } catch (error) {
                console.error(`Session rehydration failed for ${session.sessionId}: ${error.message}`);
                await WhatsAppSession.findOneAndUpdate(
                    { sessionId: session.sessionId },
                    { status: 'disconnected' }
                ).exec();
            }
        }
    } catch (error) {
        console.error(`Session rehydration error: ${error.message}`);
    }
};

const resolveSocketUserId = (socket) => {
    const token = socket.handshake?.auth?.token;

    if (!token) {
        return null;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.id;
    } catch (error) {
        return null;
    }
};

// Socket.IO connection handler
io.on('connection', (socket) => {
    const userId = resolveSocketUserId(socket);
    if (userId) {
        socket.userId = userId;
    }

    console.log(`Socket connected: ${socket.id}`);

    // Frontend joins a session room so QR & status events are targeted.
    socket.on('join-session', async (sessionId) => {
        try {
            if (!sessionId || typeof sessionId !== 'string') {
                socket.disconnect(true);
                return;
            }

            const verifiedUserId = resolveSocketUserId(socket);
            if (!verifiedUserId) {
                socket.disconnect(true);
                return;
            }

            const session = await WhatsAppSession.findOne({ sessionId }).select('userId');
            if (!session || session.userId.toString() !== verifiedUserId) {
                socket.disconnect(true);
                return;
            }

            socket.userId = verifiedUserId;
            socket.join(sessionId);
            console.log(`Socket ${socket.id} joined room: ${sessionId}`);
        } catch (error) {
            console.error('Socket join-session error:', error.message);
            socket.disconnect(true);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

app.use(helmet());

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'BulkNode API Server is running', version: '1.0.0' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/whatsapp', require('./routes/whatsapp'));

// Placeholder routes - activated in future phases
// app.use('/api/campaigns', require('./routes/campaigns'));
// app.use('/api/contacts', require('./routes/contacts'));

app.use((err, req, res, next) => {
    console.error(err.stack);

    if (err.name === 'CastError') {
        return res.status(404).json({ success: false, error: 'Resource not found' });
    }

    if (err.code === 11000) {
        return res.status(400).json({ success: false, error: 'Duplicate field value entered' });
    }

    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message);
        return res.status(400).json({ success: false, error: message });
    }

    res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'Server Error',
    });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Socket.IO ready');

    // Start background queue worker on API boot.
    createMessageWorker();

    // Restore previously connected WhatsApp sessions automatically.
    rehydrateConnectedSessions();
});
