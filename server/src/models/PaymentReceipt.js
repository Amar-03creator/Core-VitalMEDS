const mongoose = require('mongoose');

const paymentReceiptSchema = new mongoose.Schema({
    receiptNumber: { type: String, required: true, unique: true }, // e.g., REC-26-001
    seq: { type: Number },
    clientObjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    
    paymentDate: { type: Date, required: true },
    paymentMode: { type: String, enum: ['Cash', 'UPI', 'Cheque', 'BankTransfer'], required: true },
    referenceNumber: { type: String }, // Cheque number or UPI Transaction ID
    totalAmountPaid: { type: Number, required: true },
    
    allocatedInvoices: [{
        invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesInvoice', required: true },
        invoiceNumber: { type: String, required: true },
        amountCleared: { type: Number, required: true }
    }],
    
    unallocatedAmount: { type: Number, default: 0 }, 
    manualAllocation: { type: Boolean, default: true },
    
    adminRemarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('PaymentReceipt', paymentReceiptSchema);