const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
    recipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
    recipientRole: { type: String, enum: ['admin', 'client'], required: true },
    type: { type: String, enum: ['registration', 'inquiry', 'order', 'payment', 'alert'] },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: String,
    isRead: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model('Notification', notificationSchema);