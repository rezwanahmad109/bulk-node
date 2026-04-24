const IORedis = require('ioredis');
const { Queue, Worker } = require('bullmq');
const Message = require('../models/Message');
const WhatsAppSession = require('../models/WhatsAppSession');
const { getSession } = require('../services/whatsapp/whatsappEngine');

const QUEUE_NAME = 'message-queue';

const REDIS_CONNECTION_OPTIONS = process.env.REDIS_URL
    ? {
        connectionName: 'bulknode-message-queue',
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    }
    : {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: Number(process.env.REDIS_DB) || 0,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    };

const redisConnection = process.env.REDIS_URL
    ? new IORedis(process.env.REDIS_URL, REDIS_CONNECTION_OPTIONS)
    : new IORedis(REDIS_CONNECTION_OPTIONS);

const messageQueue = new Queue(QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: Number(process.env.MESSAGE_JOB_ATTEMPTS) || 2,
        backoff: {
            type: 'exponential',
            delay: Number(process.env.MESSAGE_JOB_BACKOFF_MS) || 5000,
        },
        removeOnComplete: {
            age: Number(process.env.MESSAGE_JOB_KEEP_COMPLETED_SECONDS) || 86400,
            count: Number(process.env.MESSAGE_JOB_KEEP_COMPLETED_COUNT) || 1000,
        },
        removeOnFail: {
            age: Number(process.env.MESSAGE_JOB_KEEP_FAILED_SECONDS) || 604800,
            count: Number(process.env.MESSAGE_JOB_KEEP_FAILED_COUNT) || 5000,
        },
    },
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const delaySecondsMin = Number(process.env.MESSAGE_DELAY_MIN_SECONDS) || 5;
const delaySecondsMax = Number(process.env.MESSAGE_DELAY_MAX_SECONDS) || 15;
const cooldownEvery = Number(process.env.MESSAGE_COOLDOWN_EVERY_COUNT) || 20;
const cooldownMinMs = Number(process.env.MESSAGE_COOLDOWN_MIN_MS) || 60000;
const cooldownMaxMs = Number(process.env.MESSAGE_COOLDOWN_MAX_MS) || 120000;

let processedMessageCount = 0;
let messageWorker = null;

const normalizeDelayRange = (minInput, maxInput) => {
    const parsedMin = Number(minInput);
    const parsedMax = Number(maxInput);

    const minSeconds = Number.isFinite(parsedMin) && parsedMin > 0
        ? Math.floor(parsedMin)
        : delaySecondsMin;
    const maxSeconds = Number.isFinite(parsedMax) && parsedMax > 0
        ? Math.floor(parsedMax)
        : delaySecondsMax;

    if (minSeconds <= maxSeconds) {
        return { minSeconds, maxSeconds };
    }

    return { minSeconds: maxSeconds, maxSeconds: minSeconds };
};

const normalizeToJid = (receiver) => {
    const raw = String(receiver || '').trim();

    if (!raw) {
        throw new Error('Receiver is required.');
    }

    if (raw.endsWith('@s.whatsapp.net') || raw.endsWith('@g.us')) {
        return raw;
    }

    const digits = raw.replace(/\D/g, '');
    if (!digits) {
        throw new Error('Receiver number is invalid.');
    }

    return `${digits}@s.whatsapp.net`;
};

const updateMessageStatus = async ({ messageId, userId, sessionId, status }) => {
    if (!messageId || !userId) return;
    await Message.findOneAndUpdate(
        { _id: messageId, userId, sessionId },
        { status }
    ).exec();
};

const claimMessageForProcessing = async ({ messageId, userId, sessionId }) => {
    if (!messageId || !userId || !sessionId) return null;

    return Message.findOneAndUpdate(
        {
            _id: messageId,
            userId,
            sessionId,
            status: { $in: ['pending', 'failed'] },
        },
        { status: 'processing' },
        { new: true }
    ).lean();
};

const getMessageStatus = async ({ messageId, userId, sessionId }) => {
    if (!messageId || !userId || !sessionId) return null;

    const doc = await Message.findOne({
        _id: messageId,
        userId,
        sessionId,
    }).select('status').lean();

    return doc?.status || null;
};

const createMessageWorker = () => {
    if (messageWorker) return messageWorker;

    messageWorker = new Worker(
        QUEUE_NAME,
        async (job) => {
            const { messageId, userId, receiver, message, mediaUrl, sessionId } = job.data;
            let messageClaimed = false;
            let messageSent = false;

            try {
                if (!userId || !sessionId) {
                    throw new Error('Job payload missing userId or sessionId.');
                }

                const claimedMessage = await claimMessageForProcessing({
                    messageId,
                    userId,
                    sessionId,
                });

                if (!claimedMessage) {
                    const existingStatus = await getMessageStatus({
                        messageId,
                        userId,
                        sessionId,
                    });

                    if (['processing', 'sent', 'delivered', 'read'].includes(existingStatus)) {
                        return {
                            status: 'skipped',
                            reason: `already-${existingStatus}`,
                        };
                    }

                    throw new Error('Message is not in a sendable state.');
                }

                messageClaimed = true;

                const ownedSession = await WhatsAppSession.findOne({
                    userId,
                    sessionId,
                }).select('status').lean();

                if (!ownedSession) {
                    throw new Error('Session ownership validation failed.');
                }

                if (String(ownedSession.status || '').toLowerCase() !== 'connected') {
                    throw new Error('WhatsApp session is not connected in database state.');
                }

                const activeSession = getSession(sessionId);
                if (!activeSession) {
                    throw new Error('WhatsApp session is not connected.');
                }

                // Human-like randomized delay before each send action.
                const { minSeconds, maxSeconds } = normalizeDelayRange(
                    job.data?.minDelaySeconds,
                    job.data?.maxDelaySeconds
                );
                const delayMs = randomInt(minSeconds, maxSeconds) * 1000;
                await sleep(delayMs);

                const jid = normalizeToJid(receiver);
                const normalizedMediaUrl = String(mediaUrl || '').trim();
                const normalizedText = String(message || '').trim();

                if (normalizedMediaUrl) {
                    await activeSession.sendMessage(jid, {
                        image: { url: normalizedMediaUrl },
                        caption: normalizedText || undefined,
                    });
                } else {
                    await activeSession.sendMessage(jid, { text: normalizedText });
                }

                messageSent = true;

                await updateMessageStatus({
                    messageId,
                    userId,
                    sessionId,
                    status: 'sent',
                });

                processedMessageCount += 1;
                if (processedMessageCount % cooldownEvery === 0) {
                    // Cooldown after a burst to reduce ban-risk behavior.
                    const cooldownMs = randomInt(cooldownMinMs, cooldownMaxMs);
                    await sleep(cooldownMs);
                }

                return { status: 'sent', jid };
            } catch (error) {
                if (messageSent) {
                    try {
                        await updateMessageStatus({
                            messageId,
                            userId,
                            sessionId,
                            status: 'sent',
                        });
                    } catch (statusSyncError) {
                        console.error(`[Queue] Post-send status sync failed for ${messageId}: ${statusSyncError.message}`);
                    }
                } else if (messageClaimed) {
                    await updateMessageStatus({
                        messageId,
                        userId,
                        sessionId,
                        status: 'failed',
                    });
                }

                throw error;
            }
        },
        {
            connection: redisConnection,
            concurrency: 1,
        }
    );

    messageWorker.on('completed', (job) => {
        console.log(`[Queue] Job completed: ${job.id}`);
    });

    messageWorker.on('failed', (job, err) => {
        console.error(`[Queue] Job failed: ${job?.id} - ${err.message}`);
    });

    messageWorker.on('error', (err) => {
        console.error(`[Queue] Worker error: ${err.message}`);
    });

    return messageWorker;
};

module.exports = {
    messageQueue,
    createMessageWorker,
};
