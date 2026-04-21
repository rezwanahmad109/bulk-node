const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { initSession, getSession, terminateSession } = require('../services/whatsapp/whatsappEngine');

const WhatsAppSession = require('../models/WhatsAppSession');

/**
 * POST /api/whatsapp/connect
 * Protected — requires JWT token.
 *
 * Initiates a new WhatsApp session for the authenticated user.
 */
router.post('/connect', protect, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, error: 'Please provide a name for this account.' });
        }

        // Build a unique session ID
        const uniqueId = Math.random().toString(36).substring(7);
        const sessionId = `session_${req.user.id}_${uniqueId}`;

        const io = req.app.get('io');

        // Create session in database
        const session = await WhatsAppSession.create({
            userId: req.user.id,
            sessionId,
            name,
            status: 'connecting'
        });

        // Start Baileys in the background
        initSession(sessionId, io).catch((err) => {
            console.error(`❌ Session init failed for ${sessionId}:`, err.message);
            WhatsAppSession.findOneAndUpdate({ sessionId }, { status: 'disconnected' }).exec();
            io.to(sessionId).emit('whatsapp:error', {
                sessionId,
                message: 'Failed to start WhatsApp engine.',
            });
        });

        res.status(202).json({
            success: true,
            message: 'WhatsApp connection initiated.',
            sessionId,
            session
        });
    } catch (error) {
        console.error('WhatsApp connect route error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/whatsapp/sessions
 * Protected — requires JWT token.
 *
 * Returns all WhatsApp accounts connected or configured by the user.
 */
router.get('/sessions', protect, async (req, res) => {
    try {
        const sessions = await WhatsAppSession.find({ userId: req.user.id })
            .select('-authState')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, sessions });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch sessions.' });
    }
});

/**
 * GET /api/whatsapp/status/:sessionId
 * Protected — requires JWT token.
 *
 * Quick check to see if a session is currently active in memory.
 * Used by the frontend Account Manager to show Connected/Disconnected badge.
 */
router.get('/status/:sessionId', protect, async (req, res) => {
    const { sessionId } = req.params;

    // Verify the session belongs to the requesting user (security check)
    if (!sessionId.startsWith(`session_${req.user.id}`)) {
        return res.status(403).json({ success: false, error: 'Unauthorized session access.' });
    }

    const session = getSession(sessionId);
    res.status(200).json({
        success: true,
        sessionId,
        connected: !!session,
        status: session ? 'connected' : 'disconnected',
    });
});

/**
 * DELETE /api/whatsapp/disconnect/:sessionId
 * Protected — requires JWT token.
 *
 * Logs out and permanently removes a WhatsApp session.
 * The user will need to re-scan a QR code to reconnect this account.
 */
router.delete('/disconnect/:sessionId', protect, async (req, res) => {
    const { sessionId } = req.params;

    // Security: ensure user can only disconnect their own sessions
    if (!sessionId.startsWith(`session_${req.user.id}`)) {
        return res.status(403).json({ success: false, error: 'Unauthorized session access.' });
    }

    try {
        await terminateSession(sessionId);
        res.status(200).json({
            success: true,
            message: 'WhatsApp session disconnected and removed.',
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to disconnect session.' });
    }
});

module.exports = router;
