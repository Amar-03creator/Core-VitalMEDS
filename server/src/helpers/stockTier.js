// server/src/helpers/stockTier.js

/**
 * Computes the stock-disclosure tier for a requested quantity.
 *
 * This exists so the "don't reveal exact stock" rule is enforced ONCE,
 * server-side — the frontend never sees a raw stock number and decides
 * for itself whether to hide it. It asks this helper (via the
 * check-availability endpoint) and renders whatever tier comes back.
 *
 * Tiers:
 *  - 'ok'          → fulfillable, nothing to flag.
 *  - 'limited'     → fulfillable now, but flagged because either the
 *                    requested qty is ~70%+ of current stock, OR fulfilling
 *                    it would drop remaining stock below lowStockThreshold.
 *                    Exact qty is NOT disclosed.
 *  - 'critical'    → current stock <= criticalDisclosureThreshold
 *                    (default 50% of lowStockThreshold). Exact qty MAY be
 *                    shown — this is the one tier where disclosure is
 *                    explicitly permitted.
 *  - 'unavailable' → requested qty exceeds current stock, and stock is
 *                    still above the critical threshold. Exact qty is
 *                    NOT disclosed.
 */
const LIMITED_AVAILABILITY_RATIO = 0.7; // 70%

function computeStockTier({
  requestedQty,
  currentStock,
  lowStockThreshold = 50,
  criticalThresholdPercent = 50, // % of lowStockThreshold, admin-configurable on Product
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
          message: `Selected quantity is currently unavailable. Please reduce the requested quantity and try again.`,
        };
  }

  // Fulfillable — but is the underlying stock itself critical, or does
  // taking this qty push things into "limited availability" territory?
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
      message: `is in limited availability. Final supplied quantities will be confirmed during invoicing and may vary depending on stock availability at that time.`,
    };
  }

  return { tier: 'ok', availableQty: null, message: null };
}

module.exports = { computeStockTier, LIMITED_AVAILABILITY_RATIO };