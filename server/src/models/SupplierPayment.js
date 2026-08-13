const mongoose = require('mongoose');

const supplierPaymentSchema = new mongoose.Schema({
    voucherNumber: { 
        type: String, 
        required: true, 
        unique: true 
    },
    supplierObjectId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Company', 
        required: true 
    },
    paymentDate: { 
        type: Date, 
        required: true 
    },
    paymentMode: { 
        type: String, 
        enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other'], 
        required: true 
    },
    referenceNumber: { 
        type: String 
    },
    totalAmountPaid: { 
        type: Number, 
        required: true 
    },
    
    // ✨ FIFO Tracking: Which specific purchase bills did this payment clear?
    allocatedBills: [
        {
            billId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseBill' },
            invoiceNumber: { type: String },
            amountCleared: { type: Number }
        }
    ],
    
    // ✨ Advance Wallet: Money left over after clearing all pending bills
    unallocatedAmount: { 
        type: Number, 
        default: 0 
    },
    
    adminRemarks: { 
        type: String 
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Admin' 
    }
}, { timestamps: true });

module.exports = mongoose.model('SupplierPayment', supplierPaymentSchema);