const mongoose = require('mongoose');

/**
 * WhatsAppSession Model
 * Supports one user having multiple WhatsApp sessions simultaneously.
 * Each document represents one linked WhatsApp device/number.
 */
const whatsAppSessionSchema = new mongoose.Schema({
    // The BulkNode user who owns this session
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    // A unique identifier for this Baileys session (used for session file storage)
    sessionId: {
        type: String,
        required: true,
        unique: true,
    },

    // The WhatsApp phone number linked to this session
    phoneNumber: {
        type: String,
        default: null,
    },

    // The display name pulled from the WhatsApp account
    pushName: {
        type: String,
        default: 'Unnamed Account',
    },

    // Connection status updated in real-time by the Baileys connection event
    status: {
        type: String,
        enum: ['connecting', 'connected', 'disconnected'],
        default: 'connecting',
    },

    // Stores the Baileys session creds as JSON (auth state)
    // For production, consider encrypting this field at rest
    authState: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
        select: false, // Never return session credentials in normal queries
    },

}, {
    timestamps: true,
});

// Index for fast lookups by userId (user's dashboard view)
whatsAppSessionSchema.index({ userId: 1 });

module.exports = mongoose.model('WhatsAppSession', whatsAppSessionSchema);
