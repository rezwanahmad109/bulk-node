const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
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
    name: {
        type: String,
        required: [true, 'Please add a contact name'],
        trim: true,
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number'],
        trim: true,
    },
    tags: [{
        type: String,
        trim: true,
    }],
}, {
    timestamps: true,
});

contactSchema.index({ userId: 1, sessionId: 1 });

module.exports = mongoose.model('Contact', contactSchema);
