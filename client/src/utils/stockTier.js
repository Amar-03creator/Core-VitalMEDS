// src/utils/stockTier.js

/**
 * Mirrors server/src/helpers/stockTier.js EXACTLY (same ratios, same tier
 * names, same messages) so the UI behaves identically whether a tier came
 * back from the real /api/stock/check-availability call or from this
 * local fallback.
 *
 * This fallback exists for one reason: the Products/Cart pages currently
 * run on demoProducts.js (no real Mongo _id), so a live call to the
 * backend will 404 for every item. useStockAvailability.js tries the real
 * endpoint first and only falls back to this when that call fails — once
 * the pages are wired to real products, this file can stay as a safety
 * net or be deleted, your call.
 */
const LIMITED_AVAILABILITY_RATIO = 0.7;

export function computeStockTier({
  requestedQty,
  currentStock,
  lowStockThreshold = 50,
  criticalThresholdPercent = 50,
}) {
  const qty = Number(requestedQty) || 0;
  const stock = Number(currentStock) || 0;
  const criticalThreshold = lowStockThreshold * (criticalThresholdPercent / 100);
  const isCritical = stock <= criticalThreshold;
  const canFulfill = qty <= stock;

  if (!canFulfill) {
    return isCritical
      ? {
          tier: 'critical',
          availableQty: stock,
          message: `is in critical stock. Only ${stock} units are currently available. Final supplied quantity will be confirmed during invoicing.`,
        }
      : {
          tier: 'unavailable',
          availableQty: null,
          message: 'Selected quantity is currently unavailable. Please reduce the requested quantity and try again.',
        };
  }

  if (isCritical) {
    return {
      tier: 'critical',
      availableQty: stock,
      message: `is in critical stock. Only ${stock} units are currently available. Final supplied quantity will be confirmed during invoicing.`,
    };
  }

  const remainingAfter = stock - qty;
  const nearsRatio = stock > 0 && qty / stock >= LIMITED_AVAILABILITY_RATIO;
  const dipsBelowLowStock = remainingAfter < lowStockThreshold;

  if (nearsRatio || dipsBelowLowStock) {
    return {
      tier: 'limited',
      availableQty: null,
      message: 'is in limited availability. Final supplied quantities will be confirmed during invoicing and may vary depending on stock availability at that time.',
    };
  }

  return { tier: 'ok', availableQty: null, message: null };
}