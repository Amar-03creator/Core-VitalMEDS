// server/src/helpers/inventoryFifo.js

const Batch = require('../models/Batch');

/**
 * Deduct qty units from a batch, oldest lot first.
 * Returns { lotConsumption: [{ batchId, lotId, qty }, ...] }
 */
async function deductFifo(batchId, qty, session) {
  if (qty <= 0) return { lotConsumption: [] };

  const batch = await Batch.findById(batchId).session(session);
  if (!batch) throw new Error(`Batch not found: ${batchId}`);

  if (batch.totalStockQuantity < qty) {
    throw new Error(
      `Insufficient stock in Batch ${batch.batchNumber}. Need ${qty}, have ${batch.totalStockQuantity}.`
    );
  }

  const lotsOldestFirst = [...batch.purchaseLots].sort(
    (a, b) => new Date(a.dateReceived) - new Date(b.dateReceived)
  );

  let remaining = qty;
  const lotConsumption = [];

  for (const lot of lotsOldestFirst) {
    if (remaining <= 0) break;
    if (lot.remainingQty <= 0) continue;

    const takeFromThisLot = Math.min(lot.remainingQty, remaining);
    lot.remainingQty -= takeFromThisLot;
    remaining -= takeFromThisLot;

    lotConsumption.push({
      batchId: batch._id,
      lotId: lot._id,
      qty: takeFromThisLot,
    });
  }

  if (remaining > 0) {
    throw new Error(
      `Stock ledger mismatch in Batch ${batch.batchNumber}: could not allocate full quantity from lots.`
    );
  }

  batch.totalStockQuantity -= qty;
  await batch.save({ session });

  return { lotConsumption };
}

/**
 * Restore qty units back to a batch, undoing a PREVIOUS deduction.
 * Restoration happens against the exact lots recorded in lotConsumption,
 * most-recently-consumed first (LIFO undo).
 */
async function restoreFromLots(batchId, qtyToRestore, lotConsumption, session) {
  if (qtyToRestore <= 0) return lotConsumption;

  const batch = await Batch.findById(batchId).session(session);
  if (!batch) throw new Error(`Batch not found: ${batchId}`);

  const remainingConsumption = [...lotConsumption];
  let toRestore = qtyToRestore;

  for (let i = remainingConsumption.length - 1; i >= 0 && toRestore > 0; i--) {
    const entry = remainingConsumption[i];
    const giveBack = Math.min(entry.qty, toRestore);

    const lot = batch.purchaseLots.find(l => l._id.equals(entry.lotId));
    if (lot) {
      lot.remainingQty += giveBack;
    }

    entry.qty -= giveBack;
    toRestore -= giveBack;

    if (entry.qty <= 0) {
      remainingConsumption.splice(i, 1);
    }
  }

  if (toRestore > 0) {
    throw new Error(
      `Could not fully restore stock for Batch ${batch.batchNumber}: lotConsumption history exhausted before full quantity was restored.`
    );
  }

  batch.totalStockQuantity += qtyToRestore;
  await batch.save({ session });

  return remainingConsumption;
}

/**
 * Adjust an existing invoice line from oldQty -> newQty.
 *   - If newQty < oldQty: restore the difference back to original lots.
 *   - If newQty > oldQty: deduct the difference via fresh FIFO.
 *   - If newQty === oldQty: no-op.
 *
 * Returns the NEW lotConsumption array to store on the invoice item.
 */
async function adjustLotConsumption(batchId, oldQty, newQty, existingLotConsumption, session) {
  const delta = newQty - oldQty;

  if (delta === 0) {
    return existingLotConsumption;
  }

  if (delta < 0) {
    // Qty reduced — restore the difference back to the exact lots it came from
    return await restoreFromLots(batchId, Math.abs(delta), existingLotConsumption, session);
  }

  // delta > 0 — qty increased, deduct the extra via fresh FIFO and append
  const { lotConsumption: newEntries } = await deductFifo(batchId, delta, session);
  return [...existingLotConsumption, ...newEntries];
}

module.exports = { deductFifo, restoreFromLots, adjustLotConsumption };