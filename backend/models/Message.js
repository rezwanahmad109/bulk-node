const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    sessionId: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },
    sender: {
        type: String,
        required: true,
    },
    receiver: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    mediaUrl: {
        type: String,
        trim: true,
        default: null,
    },
    campaignName: {
        type: String,
        trim: true,
        default: null,
    },
    minDelaySeconds: {
        type: Number,
        min: 1,
        default: null,
    },
    maxDelaySeconds: {
        type: Number,
        min: 1,
        default: null,
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'sent', 'delivered', 'read', 'failed'],
        default: 'pending',
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    isIncoming: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

messageSchema.index({ userId: 1, sessionId: 1 });

module.exports = mongoose.model('Message', messageSchema);
