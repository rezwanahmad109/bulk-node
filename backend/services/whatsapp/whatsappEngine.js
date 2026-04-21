const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');

/**
 * WhatsApp Engine — BulkNode Core Service
 *
 * Uses @whiskeysockets/baileys (ESM module) via dynamic import() so it
 * works seamlessly inside our CommonJS Express server without rewriting
 * everything to ES modules.
 *
 * Architecture:
 *  - Each connected WhatsApp account gets its own "session" identified by
 *    a sessionId (e.g. "session_<userId>_<accountIndex>").
 *  - Session auth files are persisted in /sessions/<sessionId>/ so the user
 *    doesn't have to re-scan the QR every time the server restarts.
 *  - Socket.IO is used to push the QR code and connection status updates
 *    to the frontend in real-time.
 */

// In-memory registry of active Baileys sockets
const activeSessions = new Map();

const WhatsAppSession = require('../../models/WhatsAppSession');

// Directory where Baileys saves auth & session files
const SESSION_DIR = path.join(__dirname, '../../sessions');

// Ensure the sessions root directory exists on startup
if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
}

/**
 * initSession — Start (or resume) a WhatsApp session.
 *
 * @param {string} sessionId  - Unique ID for this WhatsApp account session
 * @param {SocketIO.Server} io - Socket.IO server instance (for real-time push)
 * @returns {Promise<object>}  - Resolves with the Baileys socket instance
 */
const initSession = async (sessionId, io) => {
    // Baileys is an ES module — we must use dynamic import() here
    const {
        default: makeWASocket,
        useMultiFileAuthState,
        DisconnectReason,
        fetchLatestBaileysVersion,
        Browsers,
    } = await import('@whiskeysockets/baileys');

    const { default: pino } = await import('pino');

    // Each session gets its own subfolder for Baileys auth state files
    const sessionPath = path.join(SESSION_DIR, sessionId);
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    // Load existing credentials if this session was previously connected
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    // Fetch the latest Baileys WA version to avoid compatibility issues
    const { version } = await fetchLatestBaileysVersion();

    // Create the Baileys socket — the core WhatsApp Web connection
    const sock = makeWASocket({
        version,
        auth: state,
        // Suppress terminal QR — we'll send it to the frontend via Socket.IO
        printQRInTerminal: false,
        // Identify as WhatsApp Web (Desktop) to avoid mobile-only restrictions
        browser: Browsers.ubuntu('Chrome'),
        // Silent logger to keep server logs clean
        logger: pino({ level: 'silent' }),
        // Reduces RAM usage — we don't need full message history on connect
        syncFullHistory: false,
    });

    // Register this socket so other parts of the app can use it (e.g. campaign sender)
    activeSessions.set(sessionId, sock);

    // ── Persist credentials whenever they change ──────────────────────────
    sock.ev.on('creds.update', saveCreds);

    // ── Handle all connection state changes ───────────────────────────────
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // ① QR code received → convert to base64 PNG and push to browser
        if (qr) {
            try {
                // toDataURL returns a "data:image/png;base64,..." string
                // The frontend can drop this directly into an <img> src
                const qrBase64 = await qrcode.toDataURL(qr);

                console.log(`📱 [${sessionId}] QR code generated — awaiting scan`);

                // Emit only to the specific session room (not all clients)
                io.to(sessionId).emit('whatsapp:qr', {
                    sessionId,
                    qr: qrBase64,
                });
            } catch (err) {
                console.error(`❌ [${sessionId}] QR generation error:`, err.message);
            }
        }

        // ② Connection fully open → WhatsApp account connected!
        if (connection === 'open') {
            console.log(`✅ [${sessionId}] WhatsApp Connected!`);

            // Update database status
            await WhatsAppSession.findOneAndUpdate({ sessionId }, {
                status: 'connected',
                phoneNumber: sock.user.id.split(':')[0] // Extract number (e.g. 88017...:1)
            }).exec();

            io.to(sessionId).emit('whatsapp:status', {
                sessionId,
                status: 'connected',
                message: 'WhatsApp connected successfully!',
            });
        }

        // ③ Connection closed → decide whether to reconnect or clean up
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            console.log(`⚠️  [${sessionId}] Connection closed. Reason code: ${statusCode}`);

            if (shouldReconnect) {
                // Network hiccup or server restart — auto-reconnect
                console.log(`🔄 [${sessionId}] Attempting reconnect...`);
                initSession(sessionId, io);
            } else {
                // User logged out from their phone — clean up session files & memory
                console.log(`🚫 [${sessionId}] Logged out — cleaning up session`);
                activeSessions.delete(sessionId);

                // Update database status
                await WhatsAppSession.findOneAndUpdate({ sessionId }, { status: 'disconnected' }).exec();

                // Wipe saved auth files so a fresh QR is generated next time
                if (fs.existsSync(sessionPath)) {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                }

                io.to(sessionId).emit('whatsapp:status', {
                    sessionId,
                    status: 'disconnected',
                    message: 'Session logged out. Please reconnect.',
                });
            }
        }
    });

    return sock;
};

/**
 * getSession — Retrieve an active Baileys socket by sessionId.
 * Returns undefined if the session is not connected.
 */
const getSession = (sessionId) => activeSessions.get(sessionId);

/**
 * getAllSessions — Returns the Map of all currently active sessions.
 * Useful for campaign worker to pick the right WhatsApp account.
 */
const getAllSessions = () => activeSessions;

/**
 * terminateSession — Force-disconnect and clean up a session.
 * Called when a user removes a WhatsApp account from the dashboard.
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
