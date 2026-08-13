const mongoose = require('mongoose');
const SupplierPayment = require('../models/SupplierPayment');
const PurchaseBill = require('../models/PurchaseBill');
const Company = require('../models/Company');

const EDIT_WINDOW_DAYS = 30;

function isWithinEditWindow(payment) {
    const refDate = new Date(payment.paymentDate);
    const daysSince = (Date.now() - refDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= EDIT_WINDOW_DAYS;
}

// ✨ Helper to generate voucher numbers (e.g., SPV-2605-001)
async function generateVoucherNumber(session) {
    const dateStr = new Date().toISOString().slice(2, 7).replace('-', ''); // YYMM
    const lastPayment = await SupplierPayment.findOne({ voucherNumber: new RegExp(`^SPV-${dateStr}`) })
        .sort({ createdAt: -1 })
        .session(session);
    
    let nextNum = 1;
    if (lastPayment) {
        const lastSeq = parseInt(lastPayment.voucherNumber.split('-')[2], 10);
        if (!isNaN(lastSeq)) nextNum = lastSeq + 1;
    }
    return `SPV-${dateStr}-${nextNum.toString().padStart(3, '0')}`;
}

async function reversePaymentEffects(payment, session) {
    const company = await Company.findById(payment.supplierObjectId).session(session);
    if (!company) throw new Error('Supplier Company not found');

    // 1. Undo each allocated bill's payment
    for (const alloc of payment.allocatedBills) {
        const bill = await PurchaseBill.findById(alloc.billId).session(session);
        if (!bill) continue; 
        
        bill.dueAmount += alloc.amountCleared;
        bill.paidAmount -= alloc.amountCleared;
        bill.paymentStatus = bill.dueAmount >= bill.netAmount ? 'UNPAID' : 'PARTIALLY_PAID';
        await bill.save({ session });
    }

    // 2. Undo the company ledger effects
    const totalAllocated = payment.allocatedBills.reduce((s, a) => s + a.amountCleared, 0);
    company.totalOutstanding = (company.totalOutstanding || 0) + totalAllocated;
    company.advancePaid = (company.advancePaid || 0) - (payment.unallocatedAmount || 0);
    
    if (company.advancePaid < 0) company.advancePaid = 0; 

    await company.save({ session });
    return company;
}

exports.createSupplierPayment = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { supplierObjectId, paymentDate, paymentMode, referenceNumber, totalAmountPaid, adminRemarks } = req.body;

        if (!supplierObjectId || !paymentDate || !paymentMode || !totalAmountPaid) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        let newPayment;
        await session.withTransaction(async () => {
            const company = await Company.findById(supplierObjectId).session(session);
            if (!company) throw new Error("Company not found");

            // ✨ Fetch all unpaid bills for this supplier (Oldest First)
            const unpaidBills = await PurchaseBill.find({
                supplierId: supplierObjectId,
                paymentStatus: { $in: ['UNPAID', 'PARTIALLY_PAID'] },
                isCancelled: { $ne: true } 
            }).sort({ invoiceDate: 1 }).session(session);

            let remainingAmount = parseFloat(totalAmountPaid);
            let actuallyAllocatedAmount = 0;
            const allocatedBillsList = [];

            // ✨ FIFO Engine: Pay off bills until money runs out
            for (const bill of unpaidBills) {
                if (remainingAmount <= 0) break;

                const toPay = Math.min(remainingAmount, bill.dueAmount);
                bill.dueAmount -= toPay;
                bill.paidAmount = (bill.paidAmount || 0) + toPay;
                remainingAmount -= toPay;
                actuallyAllocatedAmount += toPay;

                bill.paymentStatus = bill.dueAmount === 0 ? 'PAID' : 'PARTIALLY_PAID';

                allocatedBillsList.push({
                    billId: bill._id,
                    invoiceNumber: bill.invoiceNumber,
                    amountCleared: toPay,
                });

                await bill.save({ session });
            }

            // ✨ Update Ledger: Reduce debt, add leftover to advance
            company.totalOutstanding = (company.totalOutstanding || 0) - actuallyAllocatedAmount;
            if (remainingAmount > 0) {
                company.advancePaid = (company.advancePaid || 0) + remainingAmount;
            }
            await company.save({ session });

            const voucherNumber = await generateVoucherNumber(session);

            newPayment = new SupplierPayment({
                voucherNumber,
                supplierObjectId: company._id, 
                paymentDate, 
                paymentMode,
                referenceNumber, 
                totalAmountPaid, 
                allocatedBills: allocatedBillsList,
                unallocatedAmount: remainingAmount, 
                adminRemarks,
                createdBy: req.admin?._id
            });

            await newPayment.save({ session });
        });

        await newPayment.populate('supplierObjectId', 'companyName shortCode city');

        res.status(201).json({ message: "Payment Voucher created successfully", data: newPayment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        await session.endSession();
    }
};

exports.deleteSupplierPayment = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { id } = req.params;
        let deletedNumber;
        
        await session.withTransaction(async () => {
            const payment = await SupplierPayment.findById(id).session(session);
            if (!payment) throw new Error('Payment Voucher not found');
            
            if (!isWithinEditWindow(payment)) {
                throw new Error(`This payment can no longer be deleted (older than ${EDIT_WINDOW_DAYS} days).`);
            }
            
            await reversePaymentEffects(payment, session);
            deletedNumber = payment.voucherNumber;
            await SupplierPayment.findByIdAndDelete(id).session(session);
        });
        
        res.status(200).json({ message: `Voucher ${deletedNumber} deleted and ledger reversed successfully.` });
    } catch (error) {
        res.status(error.message?.includes('no longer be deleted') ? 403 : 500).json({ message: error.message });
    } finally {
        await session.endSession();
    }
};

exports.getAllSupplierPayments = async (req, res) => {
    try {
        const payments = await SupplierPayment.find()
            .sort({ paymentDate: -1, createdAt: -1 })
            .populate('supplierObjectId', 'companyName shortCode city');
        res.status(200).json({ success: true, count: payments.length, data: payments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.reconcileSupplierLedger = async (req, res) => {
    try {
        const { supplierObjectId } = req.params;
        const company = await Company.findById(supplierObjectId);
        if (!company) return res.status(404).json({ message: "Company not found" });

        const unpaidBills = await PurchaseBill.find({
            supplierId: supplierObjectId,
            paymentStatus: { $in: ['UNPAID', 'PARTIALLY_PAID'] },
            isCancelled: { $ne: true }
        });

        let trueDebt = 0;
        unpaidBills.forEach(bill => { trueDebt += (bill.dueAmount || 0); });

        company.totalOutstanding = trueDebt;
        if (trueDebt > 0) company.advancePaid = 0; 
        
        await company.save();
        res.status(200).json({ message: "Supplier Ledger Reconciled Successfully!", newTrueDebt: trueDebt });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};