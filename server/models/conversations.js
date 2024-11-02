const mongoose = require('mongoose')

module.exports = mongoose.model('Convo', new mongoose.Schema({
    from: {
        type: String,
        required: true,
    },
    to: {
        type: String,
        required: true,
    },
    messages: {
        type: Array,
        default: []
    }
}, { timestamps: true }), 'conversations')