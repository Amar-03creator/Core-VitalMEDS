const PaymentReceipt = require('../models/PaymentReceipt');
const SalesInvoice = require('../models/SalesInvoice');
const Client = require('../models/Client');
const mongoose = require('mongoose');

const EDIT_WINDOW_DAYS = 30;

/**
 * Returns true if the receipt is still within the editable window
 * (30 days from its paymentDate).
 */
function isWithinEditWindow(receipt) {
  const refDate = new Date(receipt.paymentDate);
  const daysSince = (Date.now() - refDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince <= EDIT_WINDOW_DAYS;
}

/**
 * Reverses a receipt's effect on its allocated invoices and the client
 * ledger. Shared by both update and delete.
 */
async function reverseReceiptEffects(receipt, session) {
  const client = await Client.findById(receipt.clientObjectId).session(session);
  if (!client) throw new Error('Client not found');

  // Undo each allocated invoice's payment
  for (const alloc of receipt.allocatedInvoices) {
    const invoice = await SalesInvoice.findById(alloc.invoiceId).session(session);
    if (!invoice) continue; // invoice may have been deleted separately — skip gracefully
    invoice.dueAmount += alloc.amountCleared;
    invoice.paymentStatus = invoice.dueAmount >= invoice.totalPayable ? 'UNPAID' : 'PARTIALLY_PAID';
    await invoice.save({ session });
  }

  // Undo the client ledger effects
  const totalAllocated = receipt.allocatedInvoices.reduce((s, a) => s + a.amountCleared, 0);
  client.totalOutstanding = (client.totalOutstanding || 0) + totalAllocated;
  client.creditBalance = (client.creditBalance || 0) - (receipt.unallocatedAmount || 0);
  if (client.creditBalance < 0) client.creditBalance = 0; // defensive floor

  // Recompute outstandingDate from what remains unpaid
  const oldestUnpaid = await SalesInvoice.findOne({
    clientObjectId: client._id,
    paymentStatus: { $in: ['UNPAID', 'PARTIALLY_PAID'] },
  }).sort({ invoiceDate: 1 }).session(session);
  client.outstandingDate = oldestUnpaid ? oldestUnpaid.invoiceDate : null;

  await client.save({ session });
  return client;
}


// Create a new payment receipt
exports.createPaymentReceipt = async (req, res) => {
  try {
    const {
      clientObjectId, paymentDate, paymentMode, referenceNumber, totalAmountPaid, adminRemarks,
    } = req.body;

    if (!clientObjectId || !paymentDate || !paymentMode || !totalAmountPaid) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const client = await Client.findById(clientObjectId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    const unpaidInvoices = await SalesInvoice.find({
      clientObjectId: new mongoose.Types.ObjectId(clientObjectId),
      paymentStatus: { $in: ['UNPAID', 'PARTIALLY_PAID'] },
    }).sort({ invoiceDate: 1 });

    let remainingAmount = totalAmountPaid;
    let actuallyAllocatedAmount = 0;
    const allocatedInvoicesList = [];

    for (const invoice of unpaidInvoices) {
      if (remainingAmount <= 0) break;

      const toPay = Math.min(remainingAmount, invoice.dueAmount);
      invoice.dueAmount -= toPay;
      remainingAmount -= toPay;
      actuallyAllocatedAmount += toPay;

      if (invoice.dueAmount === 0) {
        invoice.paymentStatus = 'PAID';
      } else {
        invoice.paymentStatus = 'PARTIALLY_PAID';
      }

      allocatedInvoicesList.push({
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        amountCleared: toPay,
      });

      await invoice.save();
    }

    client.totalOutstanding = (client.totalOutstanding || 0) - actuallyAllocatedAmount;
    if (remainingAmount > 0) {
      client.creditBalance = (client.creditBalance || 0) + remainingAmount;
    }

    const oldestUnpaid = await SalesInvoice.findOne({
      clientObjectId: new mongoose.Types.ObjectId(clientObjectId),
      paymentStatus: { $in: ['UNPAID', 'PARTIALLY_PAID'] },
    }).sort({ invoiceDate: 1 });

    client.outstandingDate = oldestUnpaid ? oldestUnpaid.invoiceDate : null;

    const aggResult = await SalesInvoice.aggregate([
      { $match: { clientObjectId: new mongoose.Types.ObjectId(clientObjectId), paymentStatus: { $in: ['UNPAID', 'PARTIALLY_PAID'] } } },
      { $project: { daysOutstanding: { $divide: [{ $subtract: [new Date(), "$invoiceDate"] }, 1000 * 60 * 60 * 24] } } },
      { $group: { _id: null, averageDaysOutstanding: { $avg: "$daysOutstanding" } } }
    ]);
    client.outstandingDays = aggResult.length > 0 ? aggResult[0].averageDaysOutstanding : 0;

    await client.save();

    const currentYear = new Date().getFullYear();
    const yearStr = currentYear.toString().slice(-2);
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

    const lastReceipt = await PaymentReceipt.findOne({
      clientObjectId: client._id,
      createdAt: { $gte: yearStart, $lte: yearEnd },
    }).sort({ createdAt: -1 });

    const nextSeq = lastReceipt ? lastReceipt.seq + 1 : 1;
    const paddedSeq = String(nextSeq).padStart(3, '0');
    const partyCode = client.clientId || 'UNKNOWN'; 
    const receiptNumber = `REC-${partyCode}-${yearStr}-${paddedSeq}`;

    const newReceipt = new PaymentReceipt({
      receiptNumber, seq: nextSeq, clientObjectId: client._id, paymentDate, paymentMode,
      referenceNumber, totalAmountPaid, allocatedInvoices: allocatedInvoicesList,
      unallocatedAmount: remainingAmount, manualAllocation: false, adminRemarks,
    });

    await newReceipt.save();
    await newReceipt.populate('clientObjectId', 'establishmentName city line');

    res.status(201).json({
      message: "Payment receipt created successfully",
      paymentReceipt: newReceipt,
    });
  } catch (error) {
    console.error("Error creating payment receipt:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// The Update Function
exports.updatePaymentReceipt = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { id } = req.params;
        const { paymentDate, paymentMode, referenceNumber, totalAmountPaid, adminRemarks } = req.body;
        let updatedReceipt;

        await session.withTransaction(async () => {
            const receipt = await PaymentReceipt.findById(id).session(session);
            if (!receipt) throw new Error('Receipt not found');
            if (!isWithinEditWindow(receipt)) {
                throw new Error(`This payment can no longer be edited (older than ${EDIT_WINDOW_DAYS} days).`);
            }

            await reverseReceiptEffects(receipt, session);

            const client = await Client.findById(receipt.clientObjectId).session(session);
            const newAmount = totalAmountPaid !== undefined ? parseFloat(totalAmountPaid) : receipt.totalAmountPaid;

            const unpaidInvoices = await SalesInvoice.find({
                clientObjectId: client._id,
                paymentStatus: { $in: ['UNPAID', 'PARTIALLY_PAID'] },
            }).sort({ invoiceDate: 1 }).session(session);

            let remaining = newAmount;
            let actuallyAllocated = 0;
            const allocatedList = [];

            for (const invoice of unpaidInvoices) {
                if (remaining <= 0) break;
                const toPay = Math.min(remaining, invoice.dueAmount);
                invoice.dueAmount -= toPay;
                remaining -= toPay;
                actuallyAllocated += toPay;
                invoice.paymentStatus = invoice.dueAmount === 0 ? 'PAID' : 'PARTIALLY_PAID';
                allocatedList.push({ invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber, amountCleared: toPay });
                await invoice.save({ session });
            }

            client.totalOutstanding = (client.totalOutstanding || 0) - actuallyAllocated;
            if (remaining > 0) client.creditBalance = (client.creditBalance || 0) + remaining;

            const oldestUnpaid = await SalesInvoice.findOne({
                clientObjectId: client._id,
                paymentStatus: { $in: ['UNPAID', 'PARTIALLY_PAID'] },
            }).sort({ invoiceDate: 1 }).session(session);
            client.outstandingDate = oldestUnpaid ? oldestUnpaid.invoiceDate : null;

            await client.save({ session });

            receipt.paymentDate = paymentDate || receipt.paymentDate;
            receipt.paymentMode = paymentMode || receipt.paymentMode;
            receipt.referenceNumber = referenceNumber !== undefined ? referenceNumber : receipt.referenceNumber;
            receipt.totalAmountPaid = newAmount;
            receipt.allocatedInvoices = allocatedList;
            receipt.unallocatedAmount = remaining;
            receipt.adminRemarks = adminRemarks !== undefined ? adminRemarks : receipt.adminRemarks;
            
            await receipt.save({ session });
            updatedReceipt = receipt;
        });
        
        // Populate client name for frontend state updating
        await updatedReceipt.populate('clientObjectId', 'establishmentName city line');

        res.status(200).json({ message: 'Payment receipt updated successfully', paymentReceipt: updatedReceipt });
    } catch (error) {
        console.error('updatePaymentReceipt error:', error);
        res.status(error.message?.includes('no longer be edited') ? 403 : 500).json({ message: error.message });
    } finally {
        await session.endSession();
    }
};

// The Delete Function
exports.deletePaymentReceipt = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { id } = req.params;
        let deletedNumber;
        await session.withTransaction(async () => {
            const receipt = await PaymentReceipt.findById(id).session(session);
            if (!receipt) throw new Error('Receipt not found');
            if (!isWithinEditWindow(receipt)) {
                throw new Error(`This payment can no longer be deleted (older than ${EDIT_WINDOW_DAYS} days).`);
            }
            await reverseReceiptEffects(receipt, session);
            deletedNumber = receipt.receiptNumber;
            await PaymentReceipt.findByIdAndDelete(id).session(session);
        });
        res.status(200).json({ message: `Receipt ${deletedNumber} deleted and ledger reversed.` });
    } catch (error) {
        console.error('deletePaymentReceipt error:', error);
        res.status(error.message?.includes('no longer be deleted') ? 403 : 500).json({ message: error.message });
    } finally {
        await session.endSession();
    }
};


exports.reconcileClientLedger = async (req, res) => {
    try {
        const { clientObjectId } = req.params;
        const client = await Client.findById(clientObjectId);
        if (!client) return res.status(404).json({ message: "Client not found" });

        const unpaidInvoices = await SalesInvoice.find({
            clientObjectId: new mongoose.Types.ObjectId(clientObjectId),
            paymentStatus: { $in: ['UNPAID', 'PARTIALLY_PAID'] }
        });

        let trueDebt = 0;
        unpaidInvoices.forEach(invoice => { trueDebt += invoice.dueAmount; });

        client.totalOutstanding = trueDebt;
        if (trueDebt > 0) client.creditBalance = 0; 
        
        await client.save();
        res.status(200).json({ message: "Ledger Reconciled Successfully!", previousGlitchyDebt: client.totalOutstanding, newTrueDebt: trueDebt });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllPaymentReceipts = async (req, res) => {
  try {
    const { line, city, partyId, from, to, sort } = req.query;
 
    let clientIdFilter = null;
 
    if (partyId) {
      clientIdFilter = [new mongoose.Types.ObjectId(partyId)];
    } else if (line || city) {
      const clientQuery = {};
      if (line) clientQuery.line = line;
      if (city) clientQuery.city = city;
      const matchingClients = await Client.find(clientQuery, '_id');
      clientIdFilter = matchingClients.map(c => c._id);
    }
 
    const receiptQuery = {};
    if (clientIdFilter) receiptQuery.clientObjectId = { $in: clientIdFilter };
 
    if (from || to) {
      receiptQuery.paymentDate = {};
      if (from) receiptQuery.paymentDate.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        receiptQuery.paymentDate.$lte = toDate;
      }
    }
 
    let sortSpec = { paymentDate: -1 }; 
    if (sort === 'date_asc') sortSpec = { paymentDate: 1 };
    else if (sort === 'amount_desc') sortSpec = { totalAmountPaid: -1 };
    else if (sort === 'amount_asc') sortSpec = { totalAmountPaid: 1 };
 
    const receipts = await PaymentReceipt.find(receiptQuery)
      .sort(sortSpec)
      .populate('clientObjectId', 'establishmentName city line');
 
    res.status(200).json({ success: true, data: receipts });
  } catch (error) {
    console.error('getAllPaymentReceipts error:', error);
    res.status(500).json({ message: error.message });
  }
};