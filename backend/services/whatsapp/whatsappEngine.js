const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');

// In-memory registry of active Baileys sockets.
const activeSessions = new Map();

const WhatsAppSession = require('../../models/WhatsAppSession');

// Directory where Baileys stores auth/session files.
const SESSION_DIR = path.join(__dirname, '../../sessions');
if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
}

/**
 * initSession - Start (or resume) a WhatsApp session.
 * @param {string} sessionId
 * @param {SocketIO.Server} io
 * @returns {Promise<object>}
 */
const initSession = async (sessionId, io) => {
    const existingSession = activeSessions.get(sessionId);
    if (existingSession) {
        return existingSession;
    }

    const {
        default: makeWASocket,
        useMultiFileAuthState,
        DisconnectReason,
        fetchLatestBaileysVersion,
        Browsers,
    } = await import('@whiskeysockets/baileys');

    const { default: pino } = await import('pino');

    const sessionPath = path.join(SESSION_DIR, sessionId);
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome'),
        logger: pino({ level: 'silent' }),
        syncFullHistory: false,
    });

    activeSessions.set(sessionId, sock);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            try {
                const qrBase64 = await qrcode.toDataURL(qr);
                io.to(sessionId).emit('whatsapp:qr', {
                    sessionId,
                    qr: qrBase64,
                });
            } catch (err) {
                console.error(`[${sessionId}] QR generation error:`, err.message);
            }
        }

        if (connection === 'open') {
            console.log(`[${sessionId}] WhatsApp connected.`);

            await WhatsAppSession.findOneAndUpdate(
                { sessionId },
                {
                    status: 'connected',
                    phoneNumber: sock.user?.id ? sock.user.id.split(':')[0] : null,
                }
            ).exec();

            io.to(sessionId).emit('whatsapp:status', {
                sessionId,
                status: 'connected',
                message: 'WhatsApp connected successfully.',
            });
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            console.log(`[${sessionId}] Connection closed. statusCode=${statusCode}`);

            activeSessions.delete(sessionId);

            if (shouldReconnect) {
                console.log(`[${sessionId}] Reconnect scheduled.`);
                setTimeout(() => {
                    initSession(sessionId, io).catch((err) => {
                        console.error(`[${sessionId}] Reconnect failed:`, err.message);
                    });
                }, 3000);
                return;
            }

            console.log(`[${sessionId}] Logged out, cleaning session files.`);

            await WhatsAppSession.findOneAndUpdate(
                { sessionId },
                { status: 'disconnected' }
            ).exec();

            if (fs.existsSync(sessionPath)) {
                fs.rmSync(sessionPath, { recursive: true, force: true });
            }

            io.to(sessionId).emit('whatsapp:status', {
                sessionId,
                status: 'disconnected',
                message: 'Session logged out. Please reconnect.',
            });
        }
    });

    return sock;
};

const getSession = (sessionId) => activeSessions.get(sessionId);
const getAllSessions = () => activeSessions;

/**
 * terminateSession - Force disconnect and cleanup.
 */
const terminateSession = async (sessionId) => {
    const sock = activeSessions.get(sessionId);
    if (sock) {
        await sock.logout();
        activeSessions.delete(sessionId);
    }

    const sessionPath = path.join(SESSION_DIR, sessionId);
    if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
    }
};

module.exports = { initSession, getSession, getAllSessions, terminateSession };
