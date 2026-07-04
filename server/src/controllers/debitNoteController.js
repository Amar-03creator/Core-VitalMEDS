const mongoose = require('mongoose');
const DebitNote = require('../models/DebitNote');
const Batch = require('../models/Batch');
const Product = require('../models/Product');
const Company = require('../models/Company');
const { getNextSequence } = require('../helpers/sequenceHelper');

/* ── createDebitNote ──────────────────────────────────────────
   "Return to Company" flow (doc section 4.2):
   1. Fetch the Batch.
   2. Walk purchaseLots oldest-first (FIFO), deduct qtyReturned from remainingQty.
   3. Record which purchase invoices the returned stock came from (lotAllocations).
   4. Reduce totalStockQuantity on the batch + totalStock on the Product.
   5. Create the DebitNote with status 'Pending Adjustment'.
   6. Increase the supplier's pendingRefunds.                                      */
exports.createDebitNote = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { supplierId, returnDate, itemsToReturn, adminId } = req.body;
        // itemsToReturn: [{ productId, batchId, reason, qtyReturned }]

        if (!supplierId || !itemsToReturn || itemsToReturn.length === 0) {
            return res.status(400).json({ message: 'supplierId and at least one item to return are required.' });
        }

        let savedNote;
        let totalRefund = 0;

        await session.withTransaction(async () => {
            const supplier = await Company.findById(supplierId).session(session);
            if (!supplier) throw new Error('Supplier not found.');

            const processedItems = [];

            for (const reqItem of itemsToReturn) {
                const batch = await Batch.findById(reqItem.batchId).session(session);
                if (!batch) throw new Error(`Batch not found: ${reqItem.batchId}`);

                let qtyToReturn = reqItem.qtyReturned;
                if (qtyToReturn <= 0) continue;
                if (qtyToReturn > batch.totalStockQuantity) {
                    throw new Error(`Cannot return ${qtyToReturn} units of batch ${batch.batchNumber} — only ${batch.totalStockQuantity} in stock.`);
                }

                // FIFO: oldest dateReceived first
                const sortedLots = [...batch.purchaseLots]
                    .filter(l => l.remainingQty > 0)
                    .sort((a, b) => new Date(a.dateReceived) - new Date(b.dateReceived));

                const lotAllocations = [];
                let weightedRateSum = 0;
                let qtyRemainingToAllocate = qtyToReturn;

                for (const lot of sortedLots) {
                    if (qtyRemainingToAllocate <= 0) break;
                    const takeFromLot = Math.min(lot.remainingQty, qtyRemainingToAllocate);

                    // Mutate the actual lot inside batch.purchaseLots
                    const realLot = batch.purchaseLots.find(
                        l => String(l.purchaseInvoiceId) === String(lot.purchaseInvoiceId) &&
                             l.dateReceived?.getTime?.() === lot.dateReceived?.getTime?.()
                    ) || batch.purchaseLots.id?.(lot._id);

                    if (realLot) realLot.remainingQty -= takeFromLot;

                    lotAllocations.push({
                        purchaseInvoiceId: lot.purchaseInvoiceId,
                        invoiceNumber: lot.invoiceNumber,
                        qty: takeFromLot,
                    });

                    weightedRateSum += takeFromLot * lot.purchaseRate;
                    qtyRemainingToAllocate -= takeFromLot;
                }

                if (qtyRemainingToAllocate > 0) {
                    throw new Error(`Could not fully allocate return for batch ${batch.batchNumber} against existing purchase lots.`);
                }

                const avgPurchaseRate = weightedRateSum / qtyToReturn;
                const refundAmount = parseFloat((weightedRateSum).toFixed(2));
                totalRefund += refundAmount;

                batch.totalStockQuantity = Math.max(0, batch.totalStockQuantity - qtyToReturn);
                if (batch.totalStockQuantity === 0) batch.isActive = false;
                await batch.save({ session });

                await Product.findByIdAndUpdate(
                    reqItem.productId,
                    { $inc: { totalStock: -qtyToReturn } },
                    { session }
                );

                processedItems.push({
                    productId: reqItem.productId,
                    productName: batch.productName,
                    batchId: batch._id,
                    batchNumber: batch.batchNumber,
                    reason: reqItem.reason || 'Other',
                    lotAllocations,
                    qtyReturned: qtyToReturn,
                    purchaseRate: parseFloat(avgPurchaseRate.toFixed(2)),
                    refundAmount,
                });
            }

            if (processedItems.length === 0) {
                throw new Error('No valid items to return.');
            }

            const seq = await getNextSequence('debitNote', session);
            const debitNoteNumber = `DN-${String(seq).padStart(4, '0')}`;

            const note = new DebitNote({
                debitNoteNumber,
                seq,
                supplierId,
                supplierName: supplier.companyName,
                originalPurchaseInvoiceId: processedItems[0]?.lotAllocations?.[0]?.purchaseInvoiceId,
                returnDate: returnDate || new Date(),
                itemsReturned: processedItems,
                totalRefundExpected: parseFloat(totalRefund.toFixed(2)),
                status: 'Pending Adjustment',
                createdBy: adminId,
            });

            await note.save({ session });

            supplier.pendingRefunds = (supplier.pendingRefunds || 0) + note.totalRefundExpected;
            await supplier.save({ session });

            savedNote = note;
        });

        res.status(201).json({ message: 'Debit note created and stock adjusted.', data: savedNote });
    } catch (error) {
        console.error('createDebitNote error:', error);
        res.status(400).json({ message: error.message });
    } finally {
        await session.endSession();
    }
};

/* ── getDebitNotesBySupplier ─────────────────────────────────── ★ NEW */
exports.getDebitNotesBySupplier = async (req, res) => {
    try {
        const { supplierId } = req.params;
        const notes = await DebitNote.find({ supplierId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: notes.length, data: notes });
    } catch (error) {
        console.error('getDebitNotesBySupplier error:', error);
        res.status(500).json({ error: error.message });
    }
};

/* ── markDebitNoteApplied ────────────────────────────────────── ★ NEW
   Admin confirms the supplier has adjusted the amount in a later bill.
   Reduces the supplier's pendingRefunds accordingly.                  */
exports.markDebitNoteApplied = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { id } = req.params;
        const { adjustedNote, adminId } = req.body;

        await session.withTransaction(async () => {
            const note = await DebitNote.findById(id).session(session);
            if (!note) throw new Error('Debit note not found.');
            if (note.status === 'Adjusted') throw new Error('This debit note is already marked as applied.');

            note.status = 'Adjusted';
            note.adjustedAt = new Date();
            note.adjustedNote = adjustedNote || '';
            note.updatedBy = adminId;
            await note.save({ session });

            const supplier = await Company.findById(note.supplierId).session(session);
            if (supplier) {
                supplier.pendingRefunds = Math.max(0, (supplier.pendingRefunds || 0) - note.totalRefundExpected);
                await supplier.save({ session });
            }
        });

        res.status(200).json({ message: 'Debit note marked as applied.' });
    } catch (error) {
        console.error('markDebitNoteApplied error:', error);
        res.status(400).json({ message: error.message });
    } finally {
        await session.endSession();
    }
};