import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * Socket Service
 *
 * Keep autoConnect disabled so authenticated pages can attach JWT first.
 */
export const socket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
    transports: ['websocket', 'polling'],
});

export const connectSocketWithToken = (token) => {
    if (socket.connected && socket.auth?.token !== token) {
        socket.disconnect();
    }

    if (token) {
        socket.auth = { token };
    }

    if (!socket.connected) {
        socket.connect();
    }

    return socket;
};

// Debug logs for development
socket.on('connect', () => {
    console.log('Connected to BulkNode Socket Server:', socket.id);
});

socket.on('disconnect', () => {
    console.log('Disconnected from Socket Server');
});

export default socket;
