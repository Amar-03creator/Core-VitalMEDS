const mongoose = require('mongoose');
const supportTicketSchema = new mongoose.Schema({
    ticketId: { type: String, required: true, unique: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    type: { type: String, enum: ['order_issue', 'billing_issue', 'general'] },
    referenceId: String,
    message: { type: String, required: true },
    status: { type: String, enum: ['open', 'seen', 'resolved', 'discarded'], default: 'open' },
    adminResponse: String,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    resolvedAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });
module.exports = mongoose.model('SupportTicket', supportTicketSchema);