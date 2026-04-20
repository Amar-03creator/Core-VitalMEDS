const mongoose = require('mongoose');
const companySchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    shortCode: String,
    status: { 
        type: String, 
        enum: ['Active', 'Inactive'], 
        default: 'Active' 
    },
    representatives: [{ 
        name: String, 
        role: String, 
        phone: String, 
        email: String 
    }],
    gstin: String, 
    drugLicense: String, 
    billingAddress: String,
    leadTimeDays: Number, 
    minimumOrderValue: Number,
    pendingRefunds: { type: Number, default: 0 },
    advancePaid: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });
module.exports = mongoose.model('Company', companySchema);