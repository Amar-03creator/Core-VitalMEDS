const PaymentReceipt = require('../models/PaymentReceipt');
const SalesInvoice = require('../models/SalesInvoice');
const Client = require('../models/Client');
const mongoose = require('mongoose');


// Create a new payment receipt
exports.createPaymentReceipt = async (req, res) => {
  try {
    const { clientObjectId, paymentDate, paymentMode, referenceNumber, totalAmountPaid, allocatedInvoices, adminRemarks } = req.body;

    if (!clientObjectId || !paymentDate || !paymentMode || !totalAmountPaid) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const unpaidInvoices = await SalesInvoice.find({ 
      clientObjectId: new mongoose.Types.ObjectId(clientObjectId), 
      paymentStatus: { $in: ['UNPAID', 'PARTIALLY_PAID'] } })
      .sort({ invoiceDate: 1 });

    const client = await Client.findById(clientObjectId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    let remainingAmount = totalAmountPaid;
    let actuallyAllocatedAmount = 0;
    const allocatedInvoicesList = [];

    for (const invoice of unpaidInvoices) {
      let amountCleared = 0

      if (remainingAmount <= 0) break;   // We are out of cash, stop looking at bills!

      if (remainingAmount >= invoice.dueAmount) {
        amountCleared = invoice.dueAmount;
        remainingAmount -= invoice.dueAmount;
        invoice.dueAmount = 0;
        invoice.paymentStatus = 'PAID';
      } else {
        amountCleared = remainingAmount;
        invoice.dueAmount -= remainingAmount;
        remainingAmount = 0;
        invoice.paymentStatus = 'PARTIALLY_PAID';
      }
      actuallyAllocatedAmount += amountCleared;
      allocatedInvoicesList.push({
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        amountCleared
      });
      await invoice.save();

    }

    client.totalOutstanding -= actuallyAllocatedAmount;
    if (remainingAmount > 0) {
      client.creditBalance += remainingAmount;
    };
    function calculateOutstandingDays(clientObjectId) {
      return SalesInvoice.aggregate([
        {
          $match:
            { clientObjectId: new mongoose.Types.ObjectId(clientObjectId), paymentStatus: { $in: ['UNPAID', 'PARTIALLY_PAID'] } }
        },
        {
          $project:
            { daysOutstanding: { $divide: [{ $subtract: [new Date(), "$invoiceDate"] }, 1000 * 60 * 60 * 24] } }
        },
        {
          $group:
            { _id: null, averageDaysOutstanding: { $avg: "$daysOutstanding" } }
        }
      ]);
    }
    const aggResult = await calculateOutstandingDays(clientObjectId);
    client.outstandingDays = aggResult.length > 0 ? aggResult[0].averageDaysOutstanding : 0;
    await client.save();

    // 1. Get Date Boundaries
    const currentYear = new Date().getFullYear();
    const yearStr = currentYear.toString().slice(-2); // "26"
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

    // 2. Fetch the last receipt and calculate nextSeq FIRST
    const lastReceipt = await PaymentReceipt.findOne({
      clientObjectId: client._id, // Use the MongoDB _id for searching relationships!
      createdAt: { $gte: yearStart, $lte: yearEnd }
    }).sort({ createdAt: -1 });

    const nextSeq = lastReceipt ? lastReceipt.seq + 1 : 1;

    // 3. NOW format the strings
    const paddedSeq = String(nextSeq).padStart(3, '0');
    const partyCode = client.clientId; // e.g., "CUST-APOLLO-001"
    const generatedReceiptNumber = `REC-${partyCode}-${yearStr}-${paddedSeq}`;


    const newReceipt = new PaymentReceipt({
      receiptNumber: generatedReceiptNumber,
      seq: nextSeq,
      clientObjectId: client._id,  // Store ObjectId reference to Client 
      paymentDate,
      paymentMode,
      referenceNumber,
      totalAmountPaid,
      allocatedInvoices: allocatedInvoicesList,
      unallocatedAmount: remainingAmount,
      manualAllocation: false,
      adminRemarks
    });

    await newReceipt.save();

    res.status(201).json({ message: "Payment receipt created successfully", paymentReceipt: newReceipt });

  } catch (error) {
    console.error("Error creating payment receipt:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// --- THE RECONCILIATION ENGINE ---
// This is a powerful tool to fix any discrepancies in the Client's totalOutstanding field. It goes back to the source of truth (the SalesInvoices) and recalculates everything from scratch, then forces the Client profile to match that true math. Use this if you ever suspect the Client's totalOutstanding is incorrect for any reason.
exports.reconcileClientLedger = async (req, res) => {
    try {
        const { clientObjectId } = req.params;

        const client = await Client.findById(clientObjectId);
        if (!client) return res.status(404).json({ message: "Client not found" });

        // 1. Ask the database for EVERY unpaid bill this client has
        const unpaidInvoices = await SalesInvoice.find({
            clientObjectId: new mongoose.Types.ObjectId(clientObjectId),
            paymentStatus: { $in: ['UNPAID', 'PARTIALLY_PAID'] }
        });

        // 2. Add up the exact math from scratch
        let trueDebt = 0;
        unpaidInvoices.forEach(invoice => {
            trueDebt += invoice.dueAmount;
        });

        // 3. Force the Client profile to match the true math
        client.totalOutstanding = trueDebt;
        
        // 4. If they have debt, they shouldn't have a credit balance. Reset it.
        if (trueDebt > 0) {
            client.creditBalance = 0; 
        }

        await client.save();

        res.status(200).json({
            message: "Ledger Reconciled Successfully!",
            previousGlitchyDebt: client.totalOutstanding, // Just to see what it was
            newTrueDebt: trueDebt
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




