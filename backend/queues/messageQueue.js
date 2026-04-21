const IORedis = require('ioredis');
const { Queue, Worker } = require('bullmq');
const Message = require('../models/Message');
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

const updateMessageStatus = async (messageId, status) => {
    if (!messageId) return;
    await Message.findByIdAndUpdate(messageId, { status }).exec();
};

const createMessageWorker = () => {
    if (messageWorker) return messageWorker;

    messageWorker = new Worker(
        QUEUE_NAME,
        async (job) => {
            const { messageId, receiver, message, sessionId } = job.data;

            try {
                const activeSession = getSession(sessionId);
                if (!activeSession) {
                    throw new Error('WhatsApp session is not connected.');
                }

                // Human-like randomized delay before each send action.
                const delayMs = randomInt(delaySecondsMin, delaySecondsMax) * 1000;
                await sleep(delayMs);

                const jid = normalizeToJid(receiver);
                await activeSession.sendMessage(jid, { text: message });

                await updateMessageStatus(messageId, 'sent');

                processedMessageCount += 1;
                if (processedMessageCount % cooldownEvery === 0) {
                    // Cooldown after a burst to reduce ban-risk behavior.
                    const cooldownMs = randomInt(cooldownMinMs, cooldownMaxMs);
                    await sleep(cooldownMs);
                }

                return { status: 'sent', jid };
            } catch (error) {
                await updateMessageStatus(messageId, 'failed');
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
