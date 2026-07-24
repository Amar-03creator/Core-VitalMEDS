// src/features/Client/Cart/utils/cartMath.js

/**
 * "Total (on MRP)" — the raw MRP of every line, no discount applied.
 */
/**
 * Estimated per-unit rate, per the spec's cascade:
 *   1. An applied offer's price, if any (kept for when a real offer field exists).
 *   2. rateByProductId[productId] — resolved by useEstimatedRates.js, which
 *      itself tries GET /purchase-bills/last-rates/:productId ("the rate
 *      from the last ordered batch from the supplier") first.
 *   3. product.defaultRate, already computed server-side by
 *      getProductsWithBatches.
 *   4. mrp * 0.8 — the doc's explicit floor when nothing else is known.
 */

export const getMrpTotal = (items) => items.reduce((sum, i) => sum + (i.mrp || 0) * i.requestedQty, 0);

export const getEstimatedUnitPrice = (item, rateByKey = {}) => {
  // ✨ Fix: Looks directly at the specific Offer's PTR logic
  if (item.offerApplied && item.offer) {
      return item.offer.offerPTR || item.offer.price || (item.mrp * 0.8);
  }

  const cartKey = `${item.productId}_${item.batchId || 'standard'}`;
  const resolved = rateByKey[cartKey];
  
  if (typeof resolved === 'number' && resolved > 0) return resolved;
  if (item.defaultRate > 0) return item.defaultRate;
  
  return (item.mrp || 0) * 0.8;
};

export const getEstimatedLineTotal = (item, rateByKey) => getEstimatedUnitPrice(item, rateByKey) * item.requestedQty;
export const getEstimatedTotal = (items, rateByKey) => items.reduce((sum, i) => sum + getEstimatedLineTotal(i, rateByKey), 0);

export const wouldExceedCreditLimit = (totalOutstanding, creditLimit, estimatedTotal) => totalOutstanding + estimatedTotal > creditLimit;
export const isNearCreditLimit = (totalOutstanding, creditLimit, estimatedTotal, ratio = 0.9) => totalOutstanding + estimatedTotal > creditLimit * ratio;