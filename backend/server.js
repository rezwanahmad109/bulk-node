// Load env vars FIRST — must be before anything else reads process.env
require('dotenv').config();

const express = require('express');
const http = require('http');           // Required to attach Socket.IO to Express
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Connect to MongoDB Atlas
connectDB();

const app = express();

// ── Create HTTP server (wraps Express so Socket.IO can share the same port) ──
const server = http.createServer(app);

// ── Initialize Socket.IO ──────────────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Make the io instance accessible in any route via req.app.get('io')
app.set('io', io);

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Frontend joins a session room so QR & status events are targeted
    // e.g. socket.emit('join-session', 'session_64abc123_0')
    socket.on('join-session', (sessionId) => {
        socket.join(sessionId);
        console.log(`📡 Socket ${socket.id} joined room: ${sessionId}`);
    });

    socket.on('disconnect', () => {
        console.log(`❌ Socket disconnected: ${socket.id}`);
    });
});

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());

// ── CORS — allow only the Vite dev frontend ───────────────────────────────────
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body Parser ───────────────────────────────────────────────────────────────
app.use(express.json());

// ── Health Check Route ────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ message: 'BulkNode API Server is running', version: '1.0.0' });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/whatsapp', require('./routes/whatsapp'));

// Placeholder routes — activated in future phases
// app.use('/api/campaigns', require('./routes/campaigns'));
// app.use('/api/contacts', require('./routes/contacts'));

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        return res.status(404).json({ success: false, error: 'Resource not found' });
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        return res.status(400).json({ success: false, error: 'Duplicate field value entered' });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ success: false, error: message });
    }

    res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'Server Error',
    });
});

// ── Start Server ──────────────────────────────────────────────────────────────
// Use the HTTP server (not app.listen) so Socket.IO shares the same port
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔌 Socket.IO ready`);
});



