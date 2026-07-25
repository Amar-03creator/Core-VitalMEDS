// features/Client/Reorder/hooks/useReorderSuggestions.js
import { useState, useEffect } from 'react';

const ORDER_WINDOW = 5;

/**
 * Suggested prefill qty for one product, from its quantities across the
 * last 5 non-cancelled orders that included it:
 *
 *   average = sum(qty) / number of orders it appeared in
 *   mode    = the most frequently repeated qty value. If every value is
 *             distinct (no repeats), there's no real mode — falls back
 *             to the average itself, so the formula below degrades to a
 *             plain average instead of picking something arbitrary. A
 *             tie for "most frequent" is resolved by averaging the tied
 *             values together.
 *   result  = round((mode + average) / 2), minimum 1.
 */
function computeSuggestedQty(quantities) {
  if (!quantities.length) return 1;

  const sum = quantities.reduce((a, b) => a + b, 0);
  const average = sum / quantities.length;

  const freq = new Map();
  quantities.forEach((q) => freq.set(q, (freq.get(q) || 0) + 1));
  const maxFreq = Math.max(...freq.values());

  let mode = average;
  if (maxFreq > 1) {
    const tied = [...freq.entries()].filter(([, count]) => count === maxFreq).map(([value]) => value);
    mode = tied.reduce((a, b) => a + b, 0) / tied.length;
  }

  return Math.max(1, Math.round((mode + average) / 2));
}

/**
 * Builds the Reorder list: unique products from the client's last 5
 * non-cancelled orders, each carrying a suggestedQty plus its CURRENT
 * catalog data (mrp/stock/packing can all drift since the order was
 * placed, so these always reflect what's true right now, not the old
 * order snapshot). Each entry is the full catalog product object
 * (spread) plus suggestedQty/inStock/resolvedShortCode — so it can be
 * handed straight to addItem() unmodified, the same shape
 * ProductSearchAdd.jsx already passes it.
 *
 * Products no longer in the live catalog (discontinued) are dropped —
 * you can't reorder something that no longer exists.
 *
 * Display order follows recency: since orders are walked newest-to-
 * oldest and a Map remembers insertion order, a product's position in
 * the list is simply "which of the last 5 orders it most recently
 * appeared in."
 */
export function useReorderSuggestions(clientId, authAxios, catalogProducts) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!clientId || !catalogProducts || catalogProducts.length === 0) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authAxios.get('/api/orders', { params: { clientId } });
        const allOrders = res.data.data || res.data || [];

        const recentOrders = allOrders
          .filter((o) => o.status !== 'Cancelled')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, ORDER_WINDOW);

        const qtyByProduct = new Map();
        recentOrders.forEach((order) => {
          (order.items || []).forEach((item) => {
            const pid = String(item.productId?._id || item.productId);
            const qty = item.finalQty || item.chargeableQty || 0;
            if (!qty) return;
            if (!qtyByProduct.has(pid)) qtyByProduct.set(pid, []);
            qtyByProduct.get(pid).push(qty);
          });
        });

        const list = [];
        for (const [pid, quantities] of qtyByProduct.entries()) {
          const product = catalogProducts.find((p) => p.productId === pid);
          if (!product) continue; // discontinued / no longer in catalog

          list.push({
            ...product,
            inStock: (product.totalStock || 0) > 0,
            resolvedShortCode: product.companyShortCode || product.companyDetails?.[0]?.shortCode || product.company,
            suggestedQty: computeSuggestedQty(quantities),
          });
        }

        if (!cancelled) setSuggestions(list);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load your recent orders.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- catalogProducts is gated on .length, not identity, so a fresh array reference each render doesn't cause a refetch loop
  }, [clientId, authAxios, catalogProducts.length, reloadToken]);

  return { suggestions, loading, error, refetch: () => setReloadToken((t) => t + 1) };
}