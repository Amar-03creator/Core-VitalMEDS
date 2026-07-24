// src/features/Client/Cart/utils/alertsBuilder.js

export function buildAlerts(items, tierByKey) {
  const alerts = [];
  const unavailable = [];
  const critical = [];

  items.forEach((item) => {
    // Look up the exact row using the Composite Key
    const cartKey = `${item.productId}_${item.batchId || 'standard'}`;
    const tier = tierByKey?.[cartKey];
    
    // Appends "(Offer Scheme)" to the name if it is the offer batch row!
    const displayName = item.offerApplied ? `${item.name} (Offer Scheme)` : item.name;

    if (tier) {
      if (tier.tier === 'unavailable') unavailable.push(displayName);
      if (tier.tier === 'critical') critical.push({ name: displayName, qty: tier.availableQty });
      // The 'limited' tier is intentionally ignored here to reduce UI noise!
    }
  });

  unavailable.forEach((name) => {
    alerts.push({
      type: 'warning',
      text: `${name} is currently unavailable for the requested quantity. Please reduce the quantity to continue.`,
    });
  });

  critical.forEach(({ name, qty }) => {
    alerts.push({
      type: 'warning',
      text: `${name} is in critical stock! Only ${qty} units left. Final supplied quantity will be confirmed during invoicing.`,
    });
  });

  return alerts;
}