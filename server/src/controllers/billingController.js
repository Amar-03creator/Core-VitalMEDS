// // server/src/controllers/billingController.js
// const Client = require('../models/Client');
// const SalesInvoice = require('../models/SalesInvoice');

// exports.getBillingSummary = async (req, res) => {
//     try {
//         // Find the client using the email attached to the authenticated token
//         const client = await Client.findOne({ 'contacts.email': req.user.email });
//         if (!client) return res.status(404).json({ message: 'Client profile not found.' });

//         const currentMonth = new Date().getMonth();
//         const currentYear = new Date().getFullYear();
        
//         const invoices = await SalesInvoice.find({ 
//             clientObjectId: client._id,
//             invoiceStatus: { $ne: 'CANCELLED' }
//         });

//         // Calculate basic monthly metrics
//         let thisMonthBilled = 0;
//         invoices.forEach(inv => {
//             const invDate = new Date(inv.invoiceDate);
//             if (invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear) {
//                 thisMonthBilled += (inv.netAmount || 0);
//             }
//         });

//         res.json({
//             success: true,
//             summary: {
//                 totalOutstanding: client.totalOutstanding || 0,
//                 creditLimit: client.creditLimit || 0,
//                 creditBalance: client.creditBalance || 0,
//                 thisMonthBilled: thisMonthBilled
//             }
//         });
//     } catch (error) {
//         console.error("Billing Summary Error:", error);
//         res.status(500).json({ message: error.message });
//     }
// };


// server/src/controllers/billingController.js
const mongoose = require('mongoose');
const Client = require('../models/Client');
const SalesInvoice = require('../models/SalesInvoice');
const PaymentReceipt = require('../models/PaymentReceipt');

/**
 * ── 1. High-Level Billing Summary ────────────────────────────────────────
 * Used by the main dashboard to show current limits and this month's active billing.
 */
exports.getBillingSummary = async (req, res) => {
    try {
        // Find the client using the email attached to the authenticated token
        const client = await Client.findOne({ 'contacts.email': req.user.email });
        if (!client) return res.status(404).json({ message: 'Client profile not found.' });

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const invoices = await SalesInvoice.find({ 
            clientObjectId: client._id,
            invoiceStatus: { $ne: 'CANCELLED' } // ✨ FIXED: Ignore voided invoices
        });

        // Calculate basic monthly metrics
        let thisMonthBilled = 0;
        invoices.forEach(inv => {
            const invDate = new Date(inv.invoiceDate);
            if (invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear) {
                thisMonthBilled += (inv.netAmount || 0);
            }
        });

        res.json({
            success: true,
            summary: {
                totalOutstanding: client.totalOutstanding || 0,
                creditLimit: client.creditLimit || 0,
                creditBalance: client.creditBalance || 0,
                thisMonthBilled: thisMonthBilled
            }
        });
    } catch (error) {
        console.error("Billing Summary Error:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * ── 2. Monthly Ledger Aggregation ────────────────────────────────────────
 * Returns month-by-month buckets of Ordered vs Paid amounts for charts/tables.
 */
exports.getClientMonthlySummary = async (req, res) => {
    try {
        const { clientId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(clientId)) {
            return res.status(400).json({ message: 'Invalid clientId.' });
        }
        
        const clientObjectId = new mongoose.Types.ObjectId(clientId);

        const [invoicesByMonth, paymentsByMonth] = await Promise.all([
            SalesInvoice.aggregate([
                // ✨ FIXED: Added CANCELLED check so we don't bill clients for voided invoices
                { $match: { clientObjectId, invoiceStatus: { $ne: 'CANCELLED' } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$invoiceDate' } },
                        // ✨ FIXED: Strictly sum 'netAmount' to prevent double-counting previous arrears
                        ordered: { $sum: '$netAmount' }, 
                        billCount: { $sum: 1 },
                    },
                },
            ]),
            PaymentReceipt.aggregate([
                { $match: { clientObjectId } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$paymentDate' } },
                        // ✨ PERFECT: Matches the totalAmountPaid field in PaymentReceipt model
                        paid: { $sum: '$totalAmountPaid' }, 
                    },
                },
            ]),
        ]);

        const orderedMap = Object.fromEntries(invoicesByMonth.map((m) => [m._id, m]));
        const paidMap = Object.fromEntries(paymentsByMonth.map((m) => [m._id, m.paid]));
        const allMonths = [...new Set([...Object.keys(orderedMap), ...Object.keys(paidMap)])].sort();

        const summary = {};
        let runningOutstanding = 0;

        allMonths.forEach((month) => {
            const ordered = orderedMap[month]?.ordered || 0;
            const billCount = orderedMap[month]?.billCount || 0;
            const paid = paidMap[month] || 0;
            
            const prevDue = runningOutstanding;
            runningOutstanding = runningOutstanding + ordered - paid;
            
            summary[month] = { ordered, billCount, prevDue, paid, outstanding: runningOutstanding };
        });

        res.json({ success: true, data: summary });
    } catch (err) {
        console.error('getClientMonthlySummary error:', err);
        res.status(500).json({ message: err.message });
    }
};