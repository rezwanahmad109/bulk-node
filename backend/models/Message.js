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
    status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
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
