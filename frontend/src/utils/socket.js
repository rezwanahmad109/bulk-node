import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * Socket Service
 *
 * Provides a single socket instance for the entire frontend.
 * We use autoConnect: false to ensure we only connect when the user is logged in
 * or when the specific page needs it.
 */
export const socket = io(SOCKET_URL, {
    autoConnect: true, // Connect automatically on load for now
    withCredentials: true,
    transports: ['websocket', 'polling'], // Fallback to polling if websocket blocks
});

// Debug logs for development
socket.on('connect', () => {
    console.log('🔌 Connected to BulkNode Socket Server:', socket.id);
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected from Socket Server');
});

export default socket;
