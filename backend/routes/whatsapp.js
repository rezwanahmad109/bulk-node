const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { initSession, getSession, terminateSession } = require('../services/whatsapp/whatsappEngine');
const { messageQueue } = require('../queues/messageQueue');

const WhatsAppSession = require('../models/WhatsAppSession');
const Message = require('../models/Message');
const Contact = require('../models/Contact');

const MAX_CONTACTS_PER_CAMPAIGN = 2000;
const DEFAULT_MIN_DELAY_SECONDS = Number(process.env.MESSAGE_DELAY_MIN_SECONDS) || 5;
const DEFAULT_MAX_DELAY_SECONDS = Number(process.env.MESSAGE_DELAY_MAX_SECONDS) || 15;
const MAX_ALLOWED_DELAY_SECONDS = 300;

const normalizeDelayRange = (minDelay, maxDelay) => {
    const parsedMin = Number(minDelay);
    const parsedMax = Number(maxDelay);

    const minDelaySeconds = Number.isFinite(parsedMin) && parsedMin > 0
        ? Math.floor(parsedMin)
        : DEFAULT_MIN_DELAY_SECONDS;
    const maxDelaySeconds = Number.isFinite(parsedMax) && parsedMax > 0
        ? Math.floor(parsedMax)
        : DEFAULT_MAX_DELAY_SECONDS;

    if (minDelaySeconds > MAX_ALLOWED_DELAY_SECONDS || maxDelaySeconds > MAX_ALLOWED_DELAY_SECONDS) {
        return {
            error: `Delay values must be between 1 and ${MAX_ALLOWED_DELAY_SECONDS} seconds.`,
        };
    }

    if (minDelaySeconds > maxDelaySeconds) {
        return { error: 'minDelay cannot be greater than maxDelay.' };
    }

    return { minDelaySeconds, maxDelaySeconds };
};

const buildContactGroups = (contacts) => {
    const groupsMap = new Map();

    for (const contact of contacts) {
        const contactTags = Array.isArray(contact.tags)
            ? contact.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
            : [];
        const normalizedTags = contactTags.length ? contactTags : ['Ungrouped'];

        for (const tag of normalizedTags) {
            if (!groupsMap.has(tag)) {
                groupsMap.set(tag, {
                    id: tag,
                    name: tag,
                    contactIds: [],
                });
            }

            groupsMap.get(tag).contactIds.push(contact.id);
        }
    }

    return Array.from(groupsMap.values())
        .map((group) => ({
            ...group,
            count: group.contactIds.length,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
};

const ensureActiveSessionForUser = async (userId) => {
    const existingActive = await WhatsAppSession.findOne({
        userId,
        isActive: true,
    }).select('_id sessionId status');

    if (existingActive && String(existingActive.status || '').toLowerCase() === 'connected') {
        return existingActive;
    }

    if (existingActive) {
        await WhatsAppSession.updateOne({ _id: existingActive._id }, { isActive: false });
    }

    const fallbackActive = await WhatsAppSession.findOne({
        userId,
        status: 'connected',
    }).sort({ updatedAt: -1, createdAt: -1 }).select('_id sessionId status');

    if (!fallbackActive) {
        return null;
    }

    try {
        await WhatsAppSession.updateOne({ _id: fallbackActive._id }, { isActive: true });
        return fallbackActive;
    } catch (error) {
        if (error.code === 11000) {
            return WhatsAppSession.findOne({ userId, isActive: true }).select('_id sessionId status');
        }
        throw error;
    }
};

/**
 * POST /api/whatsapp/connect
 * Protected - requires JWT token.
 *
 * Initiates a new WhatsApp session for the authenticated user.
 */
router.post('/connect', protect, async (req, res) => {
    try {
        const name = req.body?.name?.trim();
        if (!name) {
            return res.status(400).json({ success: false, error: 'Please provide a name for this account.' });
        }

        // Build a unique session ID
        const uniqueId = Math.random().toString(36).substring(7);
        const sessionId = `session_${req.user._id}_${uniqueId}`;

        const io = req.app.get('io');
        const hasActiveSession = await WhatsAppSession.exists({
            userId: req.user._id,
            isActive: true,
        });

        // Create session in database
        const session = await WhatsAppSession.create({
            userId: req.user._id,
            sessionId,
            name,
            status: 'connecting',
            isActive: !hasActiveSession,
        });

        // Start Baileys in the background
        initSession(sessionId, io).catch((err) => {
            console.error(`Session init failed for ${sessionId}:`, err.message);
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
            session,
        });
    } catch (error) {
        console.error('WhatsApp connect route error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to initiate WhatsApp connection.' });
    }
});

/**
 * GET /api/whatsapp/sessions
 * Protected - requires JWT token.
 *
 * Returns all WhatsApp accounts connected or configured by the user.
 */
router.get('/sessions', protect, async (req, res) => {
    try {
        await ensureActiveSessionForUser(req.user._id);

        const sessions = await WhatsAppSession.find({ userId: req.user._id })
            .select('-authState')
            .sort({ isActive: -1, createdAt: -1 });

        res.status(200).json({ success: true, sessions });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch sessions.' });
    }
});

/**
 * PUT /api/whatsapp/sessions/:sessionId/active
 * Protected - requires JWT token.
 *
 * Marks one connected WhatsApp session as active for campaign sending.
 */
router.put('/sessions/:sessionId/active', protect, async (req, res) => {
    const { sessionId } = req.params;

    try {
        const ownedSession = await WhatsAppSession.findOne({
            sessionId,
            userId: req.user._id,
        }).select('_id sessionId status isActive');

        if (!ownedSession) {
            return res.status(404).json({ success: false, error: 'Session not found.' });
        }

        if (String(ownedSession.status || '').toLowerCase() !== 'connected') {
            return res.status(409).json({
                success: false,
                error: 'Only connected sessions can be set as active.',
            });
        }

        await WhatsAppSession.updateMany(
            { userId: req.user._id, isActive: true, _id: { $ne: ownedSession._id } },
            { isActive: false }
        );

        try {
            await WhatsAppSession.updateOne(
                { _id: ownedSession._id, userId: req.user._id },
                { isActive: true }
            );
        } catch (duplicateKeyError) {
            if (duplicateKeyError.code === 11000) {
                return res.status(409).json({
                    success: false,
                    error: 'Another account was set active at the same time. Please retry.',
                });
            }
            throw duplicateKeyError;
        }

        const sessions = await WhatsAppSession.find({ userId: req.user._id })
            .select('-authState')
            .sort({ isActive: -1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: 'Active WhatsApp account updated.',
            activeSessionId: ownedSession.sessionId,
            sessions,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Failed to set active session.' });
    }
});

/**
 * GET /api/whatsapp/status/:sessionId
 * Protected - requires JWT token.
 *
 * Quick check to see if a session is currently active in memory.
 * Used by the frontend Account Manager to show Connected/Disconnected badge.
 */
router.get('/status/:sessionId', protect, async (req, res) => {
    const { sessionId } = req.params;

    try {
        const sessionRecord = await WhatsAppSession.findOne({
            sessionId,
            userId: req.user._id,
        }).select('sessionId status');

        if (!sessionRecord) {
            return res.status(404).json({ success: false, error: 'Session not found.' });
        }

        const activeSession = getSession(sessionId);
        const isConnected = !!activeSession;

        res.status(200).json({
            success: true,
            sessionId,
            connected: isConnected,
            status: isConnected ? 'connected' : sessionRecord.status,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch session status.' });
    }
});

/**
 * DELETE /api/whatsapp/disconnect/:sessionId
 * Protected - requires JWT token.
 *
 * Logs out and permanently removes a WhatsApp session.
 * The user will need to re-scan a QR code to reconnect this account.
 */
router.delete('/disconnect/:sessionId', protect, async (req, res) => {
    const { sessionId } = req.params;

    try {
        const sessionRecord = await WhatsAppSession.findOne({
            sessionId,
            userId: req.user._id,
        }).select('_id sessionId isActive');

        if (!sessionRecord) {
            return res.status(404).json({ success: false, error: 'Session not found.' });
        }

        await terminateSession(sessionId);
        await WhatsAppSession.deleteOne({ _id: sessionRecord._id });

        if (sessionRecord.isActive) {
            const fallbackSession = await WhatsAppSession.findOne({
                userId: req.user._id,
                status: 'connected',
            }).sort({ updatedAt: -1, createdAt: -1 }).select('_id');

            if (fallbackSession) {
                await WhatsAppSession.updateOne({ _id: fallbackSession._id }, { isActive: true });
            }
        }

        res.status(200).json({
            success: true,
            message: 'WhatsApp session disconnected and deleted.',
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to disconnect session.' });
    }
});

/**
 * POST /api/whatsapp/campaign/launch
 * Protected - requires JWT token.
 *
 * Queues campaign messages for background processing via BullMQ.
 */
router.get('/campaign/audience', protect, async (req, res) => {
    try {
        const ensuredActiveSession = await ensureActiveSessionForUser(req.user._id);

        const activeSession = ensuredActiveSession
            ? await WhatsAppSession.findOne({
                userId: req.user._id,
                sessionId: ensuredActiveSession.sessionId,
            }).select('sessionId name status isActive').lean()
            : null;

        if (!activeSession) {
            return res.status(200).json({
                success: true,
                activeSession: null,
                contacts: [],
                groups: [],
            });
        }

        const contacts = await Contact.find({
            userId: req.user._id,
            sessionId: activeSession.sessionId,
        })
            .select('_id name phone tags')
            .sort({ name: 1, createdAt: -1 })
            .lean();

        const normalizedContacts = contacts.map((contact) => ({
            id: String(contact._id),
            name: String(contact.name || '').trim() || 'Unnamed Contact',
            phone: String(contact.phone || '').trim(),
            tags: Array.isArray(contact.tags) ? contact.tags : [],
        }));

        const groups = buildContactGroups(normalizedContacts);

        return res.status(200).json({
            success: true,
            activeSession,
            contacts: normalizedContacts,
            groups,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Failed to load campaign audience.' });
    }
});

router.post('/campaign/launch', protect, async (req, res) => {
    try {
        const { contacts, message, campaignName, mediaUrl, minDelay, maxDelay } = req.body;

        if (!Array.isArray(contacts) || contacts.length === 0 || !String(message || '').trim()) {
            return res.status(400).json({
                success: false,
                error: 'contacts and message are required.',
            });
        }

        if (contacts.length > MAX_CONTACTS_PER_CAMPAIGN) {
            return res.status(413).json({
                success: false,
                error: `A single campaign can include up to ${MAX_CONTACTS_PER_CAMPAIGN} contacts.`,
            });
        }

        const ensuredActive = await ensureActiveSessionForUser(req.user._id);
        const activeAccount = ensuredActive
            ? await WhatsAppSession.findOne({
                userId: req.user._id,
                sessionId: ensuredActive.sessionId,
            }).select('sessionId status name')
            : null;

        if (!activeAccount) {
            return res.status(409).json({
                success: false,
                error: 'No active WhatsApp account selected. Set one account as active first.',
            });
        }

        if (String(activeAccount.status || '').toLowerCase() !== 'connected') {
            return res.status(409).json({
                success: false,
                error: 'Active WhatsApp session is not connected.',
            });
        }

        if (!getSession(activeAccount.sessionId)) {
            return res.status(409).json({
                success: false,
                error: 'Active WhatsApp session is not open. Please reconnect this account.',
            });
        }

        const delayConfig = normalizeDelayRange(minDelay, maxDelay);
        if (delayConfig.error) {
            return res.status(400).json({ success: false, error: delayConfig.error });
        }

        const normalizedContacts = contacts
            .map((contact) => {
                if (typeof contact === 'string') {
                    return { receiver: contact };
                }
                return { receiver: contact?.receiver || contact?.phone };
            })
            .filter((contact) => String(contact.receiver || '').trim().length > 0);

        if (normalizedContacts.length === 0) {
            return res.status(400).json({ success: false, error: 'No valid contact receivers found.' });
        }

        if (normalizedContacts.length > MAX_CONTACTS_PER_CAMPAIGN) {
            return res.status(413).json({
                success: false,
                error: `A single campaign can include up to ${MAX_CONTACTS_PER_CAMPAIGN} contacts.`,
            });
        }

        const cleanedCampaignName = String(campaignName || '').trim();
        const normalizedMediaUrl = String(mediaUrl || '').trim();

        if (normalizedMediaUrl && !/^https?:\/\//i.test(normalizedMediaUrl)) {
            return res.status(400).json({
                success: false,
                error: 'mediaUrl must be a valid http/https URL.',
            });
        }

        const messageDocs = normalizedContacts.map((contact) => ({
            userId: req.user._id,
            sessionId: activeAccount.sessionId,
            sender: 'campaign',
            receiver: String(contact.receiver).trim(),
            content: String(message).trim(),
            mediaUrl: normalizedMediaUrl || null,
            campaignName: cleanedCampaignName || null,
            minDelaySeconds: delayConfig.minDelaySeconds,
            maxDelaySeconds: delayConfig.maxDelaySeconds,
            status: 'pending',
            isIncoming: false,
        }));

        const createdMessages = await Message.insertMany(messageDocs);
        const insertedIds = createdMessages.map((queuedMessage) => queuedMessage._id);

        const jobs = createdMessages.map((queuedMessage) => ({
            name: `campaign-message-${queuedMessage._id}`,
            data: {
                messageId: queuedMessage._id.toString(),
                userId: req.user._id.toString(),
                receiver: queuedMessage.receiver,
                message: queuedMessage.content,
                mediaUrl: queuedMessage.mediaUrl,
                sessionId: queuedMessage.sessionId,
                campaignName: queuedMessage.campaignName,
                minDelaySeconds: delayConfig.minDelaySeconds,
                maxDelaySeconds: delayConfig.maxDelaySeconds,
            },
        }));

        try {
            await messageQueue.addBulk(jobs);
        } catch (queueError) {
            await Message.deleteMany({
                _id: { $in: insertedIds },
                userId: req.user._id,
                sessionId: activeAccount.sessionId,
            });
            throw queueError;
        }

        return res.status(202).json({
            success: true,
            message: 'Campaign accepted and queued for background processing.',
            queuedCount: jobs.length,
            activeSessionId: activeAccount.sessionId,
            activeAccountName: activeAccount.name,
        });
    } catch (error) {
        console.error('Campaign launch error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to launch campaign.',
        });
    }
});

module.exports = router;
