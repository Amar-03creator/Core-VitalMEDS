// src/controllers/auditController.js
const Client = require('../models/Client');
const SalesInvoice = require('../models/SalesInvoice');
const PaymentReceipt = require('../models/PaymentReceipt');

exports.runDailyAudit = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // 1. Fetch all required data
    const clients = await Client.find({});
    const invoices = await SalesInvoice.find({ invoiceStatus: { $ne: 'CANCELLED' } }).lean();
    const receipts = await PaymentReceipt.find({}).lean();

    const bulkOperations = [];

    // 2. Process each client
    for (const client of clients) {
      const clientIdStr = client._id.toString();
      
      const clientInvoices = invoices.filter(inv => inv.clientObjectId.toString() === clientIdStr);
      const clientReceipts = receipts.filter(rec => rec.clientObjectId.toString() === clientIdStr);

      // --- A. Calculate Average Payment Time ---
      let totalDaysToPay = 0;
      let paidInvoicesCount = 0;

      clientReceipts.forEach(receipt => {
        receipt.allocatedInvoices.forEach(alloc => {
          const invoice = clientInvoices.find(inv => inv._id.toString() === alloc.invoiceId.toString());
          if (invoice) {
            const days = Math.floor((new Date(receipt.paymentDate) - new Date(invoice.invoiceDate)) / (1000 * 60 * 60 * 24));
            totalDaysToPay += Math.max(0, days);
            paidInvoicesCount++;
          }
        });
      });
      const averagePaymentTime = paidInvoicesCount > 0 ? Math.round(totalDaysToPay / paidInvoicesCount) : 0;

      // --- B. Calculate Credit Score (Your Exact Algorithm) ---
      let maxOverdueDays = 0;
      const termsDays = client.paymentTermsDays || 30; // Fallback to 30 to prevent Division by Zero
      
      clientInvoices.filter(inv => inv.paymentStatus !== 'PAID').forEach(inv => {
        // If dueDate isn't set, calculate it from invoiceDate + terms
        const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(new Date(inv.invoiceDate).getTime() + (termsDays * 24 * 60 * 60 * 1000));
        const overdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
        if (overdue > maxOverdueDays) maxOverdueDays = overdue;
      });

      // Delay Penalty (60% weight)
      const delayRatio = maxOverdueDays > 0 ? (maxOverdueDays / termsDays) : 0;
      const delayPenalty = Math.min(delayRatio, 1) * 60;

      // Credit Limit Penalty (40% weight)
      const limit = client.creditLimit || 0;
      const outstanding = client.totalOutstanding || 0;
      let limitRatio = 0;
      
      if (limit > 0) {
        limitRatio = outstanding / limit;
      } else if (outstanding > 0) {
        limitRatio = 1; // If they have no limit but owe money, max penalty
      }
      const creditPenalty = Math.min(limitRatio, 1) * 40;

      const creditScore = Math.max(0, Math.round(100 - delayPenalty - creditPenalty));

      // --- C. Calculate Party Tier (Volume based) ---
      const recentVolume = clientInvoices
        .filter(inv => new Date(inv.invoiceDate) >= thirtyDaysAgo)
        .reduce((sum, inv) => sum + inv.netAmount, 0);

      let partyTier = 'Silver';
      if (recentVolume >= 100000) partyTier = 'Diamond';
      else if (recentVolume >= 50000) partyTier = 'Platinum';
      else if (recentVolume >= 20000) partyTier = 'Gold';

      // --- D. Calculate Risk Tier ---
      let riskTier = 'Green';
      if ((limit > 0 && outstanding > limit) || maxOverdueDays >= 45 || creditScore < 50) {
        riskTier = 'Red';
      } else if (creditScore < 80 || maxOverdueDays > 0) {
        riskTier = 'Yellow';
      }

      // 3. Prepare Bulk Update
      bulkOperations.push({
        updateOne: {
          filter: { _id: client._id },
          update: {
            $set: {
              averagePaymentTime,
              creditScore,
              partyTier,
              riskTier
            }
          }
        }
      });
    }

    // 4. Execute all updates simultaneously
    if (bulkOperations.length > 0) {
      await Client.bulkWrite(bulkOperations);
    }

    res.status(200).json({ 
      success: true, 
      message: `Audit complete. Updated ${bulkOperations.length} clients.` 
    });

  } catch (error) {
    console.error('Audit Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};