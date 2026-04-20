const mongoose = require('mongoose');
const auditLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userRole: { type: String, enum: ['admin', 'client'] },
    action: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE'] },
    entityType: { type: String, enum: ['Invoice', 'Payment', 'Order', 'Inquiry'] },
    entityId: mongoose.Schema.Types.ObjectId,
    changes: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('AuditLog', auditLogSchema);