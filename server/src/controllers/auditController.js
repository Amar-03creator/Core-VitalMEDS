const Client = require('../models/Client');
const SalesInvoice = require('../models/SalesInvoice');
const PaymentReceipt = require('../models/PaymentReceipt');
const Product = require('../models/Product');
const Batch = require('../models/Batch');

exports.runFullSystemAudit = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Initialize Audit Counters
    let expiredBatchesCount = 0;
    let nearExpiryUpdatedCount = 0;
    let fixedInventoryCount = 0;
    let fixedLedgerCount = 0;

    /* ══════════════════════════════════════════════════════════
       PART 1: AUTOMATED BATCH EXPIRY SWEEPER
       ══════════════════════════════════════════════════════════ */
    // Find all currently active batches
    const activeBatches = await Batch.find({ isActive: true });
    const batchBulkOps = [];

    for (const batch of activeBatches) {
      const daysToExpiry = Math.ceil((new Date(batch.expiryDate) - now) / (1000 * 60 * 60 * 24));
      
      if (daysToExpiry < 0) {
        // Batch has expired — Kill it
        batchBulkOps.push({
          updateOne: {
            filter: { _id: batch._id },
            update: { $set: { isActive: false, nearExpiry: false } }
          }
        });
        expiredBatchesCount++;
      } else {
        // Batch is still alive — Check if it crossed the near-expiry threshold
        const threshold = batch.shortExpiryThreshold || 90;
        const isNearExpiry = daysToExpiry <= threshold;
        
        if (batch.nearExpiry !== isNearExpiry) {
          batchBulkOps.push({
            updateOne: {
              filter: { _id: batch._id },
              update: { $set: { nearExpiry: isNearExpiry } }
            }
          });
          nearExpiryUpdatedCount++;
        }
      }
    }

    if (batchBulkOps.length > 0) {
      await Batch.bulkWrite(batchBulkOps);
    }

    /* ══════════════════════════════════════════════════════════
       PART 2: INVENTORY SYNC AUDIT (GHOST STOCK FIX)
       ══════════════════════════════════════════════════════════ */
    // Now that expired batches are deactivated, recalculate true physical stock
    const products = await Product.find({});
    const validBatches = await Batch.find({ isActive: true });
    const productBulkOps = [];

    for (const product of products) {
      const productBatches = validBatches.filter(b => b.productId.toString() === product._id.toString());
      const trueStock = productBatches.reduce((sum, batch) => sum + (batch.totalStockQuantity || 0), 0);

      if (product.totalStock !== trueStock) {
        productBulkOps.push({
          updateOne: {
            filter: { _id: product._id },
            update: { $set: { totalStock: trueStock } }
          }
        });
        fixedInventoryCount++;
      }
    }

    if (productBulkOps.length > 0) {
      await Product.bulkWrite(productBulkOps);
    }

    /* ══════════════════════════════════════════════════════════
       PART 3, 4 & 5: CLIENT SCORE, DEBT SYNC, AND AGING SWEEPER
       ══════════════════════════════════════════════════════════ */
    const clients = await Client.find({});
    const invoices = await SalesInvoice.find({ invoiceStatus: { $ne: 'CANCELLED' } }).lean();
    const receipts = await PaymentReceipt.find({}).lean();
    const clientBulkOps = [];

    for (const client of clients) {
      const clientIdStr = client._id.toString();
      const clientInvoices = invoices.filter(inv => inv.clientObjectId.toString() === clientIdStr);
      const clientReceipts = receipts.filter(rec => rec.clientObjectId.toString() === clientIdStr);

      // --- Part 3: Score & Tier Calculation ---
      let totalDaysToPay = 0;
      let paidInvoicesCount = 0;

      clientReceipts.forEach(receipt => {
        receipt.allocatedInvoices?.forEach(alloc => {
          const invoice = clientInvoices.find(inv => inv._id.toString() === alloc.invoiceId?.toString());
          if (invoice) {
            const days = Math.floor((new Date(receipt.paymentDate) - new Date(invoice.invoiceDate)) / (1000 * 60 * 60 * 24));
            totalDaysToPay += Math.max(0, days);
            paidInvoicesCount++;
          }
        });
      });
      const averagePaymentTime = paidInvoicesCount > 0 ? Math.round(totalDaysToPay / paidInvoicesCount) : 0;

      let maxOverdueDays = 0;
      const termsDays = client.paymentTermsDays || 30; 
      
      const unpaidInvoices = clientInvoices.filter(inv => inv.paymentStatus !== 'PAID');
      unpaidInvoices.forEach(inv => {
        const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(new Date(inv.invoiceDate).getTime() + (termsDays * 24 * 60 * 60 * 1000));
        const overdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
        if (overdue > maxOverdueDays) maxOverdueDays = overdue;
      });

      // --- Part 4: Financial Ledger Sync (Ghost Debt) ---
      // Sum the absolute mathematical truth of what is currently owed
      const trueOutstanding = unpaidInvoices.reduce((sum, inv) => sum + (inv.dueAmount || 0), 0);
      if (client.totalOutstanding !== trueOutstanding) {
        fixedLedgerCount++;
      }

      // --- Part 5: Aging Debt Sweeper ---
      let outstandingDate = null;
      let outstandingDays = 0;

      if (trueOutstanding > 0 && unpaidInvoices.length > 0) {
        // Sort unpaid invoices oldest first to find the anchor date of the debt
        unpaidInvoices.sort((a, b) => new Date(a.invoiceDate) - new Date(b.invoiceDate));
        outstandingDate = new Date(unpaidInvoices[0].invoiceDate);
        outstandingDays = Math.floor((now - outstandingDate) / (1000 * 60 * 60 * 24));
      }

      // --- Risk & Tier Math ---
      const delayRatio = maxOverdueDays > 0 ? (maxOverdueDays / termsDays) : 0;
      const delayPenalty = Math.min(delayRatio, 1) * 60;

      const limit = client.creditLimit || 0;
      let limitRatio = 0;
      
      if (limit > 0) {
        limitRatio = trueOutstanding / limit;
      } else if (trueOutstanding > 0) {
        limitRatio = 1; 
      }
      const creditPenalty = Math.min(limitRatio, 1) * 40;
      const creditScore = Math.max(0, Math.round(100 - delayPenalty - creditPenalty));

      const recentVolume = clientInvoices
        .filter(inv => new Date(inv.invoiceDate) >= thirtyDaysAgo)
        .reduce((sum, inv) => sum + inv.netAmount, 0);

      let partyTier = 'Silver';
      if (recentVolume >= 100000) partyTier = 'Diamond';
      else if (recentVolume >= 50000) partyTier = 'Platinum';
      else if (recentVolume >= 20000) partyTier = 'Gold';

      let riskTier = 'Green';
      if ((limit > 0 && trueOutstanding > limit) || maxOverdueDays >= 45 || creditScore < 50) {
        riskTier = 'Red';
      } else if (creditScore < 80 || maxOverdueDays > 0) {
        riskTier = 'Yellow';
      }

      // Bundle all calculated updates into a single operation per client
      clientBulkOps.push({
        updateOne: {
          filter: { _id: client._id },
          update: {
            $set: { 
              averagePaymentTime, 
              creditScore, 
              partyTier, 
              riskTier,
              totalOutstanding: trueOutstanding, // Part 4 Output
              outstandingDate,                   // Part 5 Output
              outstandingDays                    // Part 5 Output
            }
          }
        }
      });
    }

    if (clientBulkOps.length > 0) {
      await Client.bulkWrite(clientBulkOps);
    }

    /* ══════════════════════════════════════════════════════════
       REPORT GENERATION
       ══════════════════════════════════════════════════════════ */
    res.status(200).json({ 
      success: true, 
      message: 'System Audit Complete!',
      metrics: {
        expiredBatchesDeactivated: expiredBatchesCount,
        nearExpiryAlertsUpdated: nearExpiryUpdatedCount,
        inventoryDesyncsFixed: fixedInventoryCount,
        ledgerDesyncsFixed: fixedLedgerCount,
        clientsProfiled: clientBulkOps.length
      }
    });

  } catch (error) {
    console.error('System Audit Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};