// src/features/Client/Cart/utils/alertsBuilder.js

const joinNames = (names) => {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
};

/**
 * Builds the Alerts field per Section D of the doc:
 *  - one line per item that's 'unavailable' (exact qty NOT disclosed)
 *  - one line per item that's 'critical' (exact qty IS disclosed)
 *  - ONE consolidated line naming every 'limited' item together
 *  - one note per item that has an unapplied offer
 *
 * Order matters here (warnings before notes) so the most actionable
 * items sit at the top of the panel.
 */
export function buildAlerts(items, tierByProductId) {
  const alerts = [];
  const unavailable = [];
  const critical = [];
  const limited = [];
  const offers = [];

  items.forEach((item) => {
    const tier = tierByProductId[item.productId];
    if (tier) {
      if (tier.tier === 'unavailable') unavailable.push(item.name);
      if (tier.tier === 'critical') critical.push({ name: item.name, qty: tier.availableQty });
      if (tier.tier === 'limited') limited.push(item.name);
    }
    if (item.offer && !item.offerApplied) offers.push(item.name);
  });

  unavailable.forEach((name) => {
    alerts.push({
      type: 'warning',
      text: `Selected quantity for ${name} is currently unavailable. Please reduce the requested quantity and try again.`,
    });
  });

  critical.forEach(({ name, qty }) => {
    alerts.push({
      type: 'warning',
      text: `${name} is in critical stock. Only ${qty} units are currently available. Final supplied quantity will be confirmed during invoicing.`,
    });
  });

  if (limited.length > 0) {
    const verb = limited.length > 1 ? 'are' : 'is';
    alerts.push({
      type: 'warning',
      text: `${joinNames(limited)} ${verb} in limited availability. Final supplied quantities will be confirmed during invoicing and may vary depending on stock availability at that time.`,
    });
  }

  offers.forEach((name) => {
    alerts.push({ type: 'note', text: `${name} has a promotional offer available on a specific batch.` });
  });

  return alerts;
}