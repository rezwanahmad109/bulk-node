const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a contact name']
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number']
    },
    tags: [{
        type: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Contact', contactSchema);
