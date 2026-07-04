// src/controllers/auditController.js
const Client = require('../models/Client');
const SalesInvoice = require('../models/SalesInvoice');
const PaymentReceipt = require('../models/PaymentReceipt');
const Product = require('../models/Product');
const Batch = require('../models/Batch');

exports.runFullSystemAudit = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    /* ══════════════════════════════════════════════════════════
       PART 1: CLIENT CREDIT SCORE & TIER AUDIT
       ══════════════════════════════════════════════════════════ */
    const clients = await Client.find({});
    const invoices = await SalesInvoice.find({ invoiceStatus: { $ne: 'CANCELLED' } }).lean();
    const receipts = await PaymentReceipt.find({}).lean();
    const bulkOperations = [];

    for (const client of clients) {
      const clientIdStr = client._id.toString();
      const clientInvoices = invoices.filter(inv => inv.clientObjectId.toString() === clientIdStr);
      const clientReceipts = receipts.filter(rec => rec.clientObjectId.toString() === clientIdStr);

      // --- A. Average Payment Time ---
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

      // --- B. Credit Score ---
      let maxOverdueDays = 0;
      const termsDays = client.paymentTermsDays || 30; 
      
      clientInvoices.filter(inv => inv.paymentStatus !== 'PAID').forEach(inv => {
        const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(new Date(inv.invoiceDate).getTime() + (termsDays * 24 * 60 * 60 * 1000));
        const overdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
        if (overdue > maxOverdueDays) maxOverdueDays = overdue;
      });

      const delayRatio = maxOverdueDays > 0 ? (maxOverdueDays / termsDays) : 0;
      const delayPenalty = Math.min(delayRatio, 1) * 60;

      const limit = client.creditLimit || 0;
      const outstanding = client.totalOutstanding || 0;
      let limitRatio = 0;
      
      if (limit > 0) {
        limitRatio = outstanding / limit;
      } else if (outstanding > 0) {
        limitRatio = 1; 
      }
      const creditPenalty = Math.min(limitRatio, 1) * 40;
      const creditScore = Math.max(0, Math.round(100 - delayPenalty - creditPenalty));

      // --- C. Party Tier ---
      const recentVolume = clientInvoices
        .filter(inv => new Date(inv.invoiceDate) >= thirtyDaysAgo)
        .reduce((sum, inv) => sum + inv.netAmount, 0);

      let partyTier = 'Silver';
      if (recentVolume >= 100000) partyTier = 'Diamond';
      else if (recentVolume >= 50000) partyTier = 'Platinum';
      else if (recentVolume >= 20000) partyTier = 'Gold';

      // --- D. Risk Tier ---
      let riskTier = 'Green';
      if ((limit > 0 && outstanding > limit) || maxOverdueDays >= 45 || creditScore < 50) {
        riskTier = 'Red';
      } else if (creditScore < 80 || maxOverdueDays > 0) {
        riskTier = 'Yellow';
      }

      bulkOperations.push({
        updateOne: {
          filter: { _id: client._id },
          update: {
            $set: { averagePaymentTime, creditScore, partyTier, riskTier }
          }
        }
      });
    }

    if (bulkOperations.length > 0) {
      await Client.bulkWrite(bulkOperations);
    }

    /* ══════════════════════════════════════════════════════════
       PART 2: INVENTORY SYNC AUDIT (GHOST STOCK FIX)
       ══════════════════════════════════════════════════════════ */
    const products = await Product.find({});
    let fixedInventoryCount = 0;

    for (const product of products) {
      const batches = await Batch.find({ 
        productId: product._id,
        isActive: true 
      });

      // Calculate TRUE sum of physical stock
      const trueStock = batches.reduce((sum, batch) => sum + (batch.totalStockQuantity || 0), 0);

      if (product.totalStock !== trueStock) {
        product.totalStock = trueStock;
        await product.save();
        fixedInventoryCount++;
        console.log(`[AUDIT] Fixed ${product.name}: Was ${product.totalStock}, corrected to ${trueStock}`);
      }
    }

    /* ══════════════════════════════════════════════════════════
       PART 3: COMBINED RESPONSE
       ══════════════════════════════════════════════════════════ */
    res.status(200).json({ 
      success: true, 
      message: `System Audit Complete! Updated ${bulkOperations.length} clients and fixed ${fixedInventoryCount} out-of-sync inventory items.` 
    });

  } catch (error) {
    console.error('System Audit Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};