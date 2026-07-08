// src/features/Client/Cart/hooks/useStockAvailability.js
import { useState, useEffect, useRef } from 'react';
import { api } from '../../../../services/api';
import { computeStockTier } from '../../../../utils/stockTier';

const DEBOUNCE_MS = 400;

// getProductsWithBatches doesn't return lowStockThreshold or
// criticalStockThresholdPercent per product, so this fallback uses the
// Product schema's own defaults (50 units / 50%) rather than a per-item
// value it doesn't have. It's only ever hit if the live call below fails
// (network issue, product deleted mid-session) — the real
// /api/stock/check-availability call is the source of truth and now runs
// against real Mongo ids, so it should succeed the vast majority of the time.
const localTierFor = (item) =>
  computeStockTier({
    requestedQty: item.requestedQty,
    currentStock: item.totalStock,
    lowStockThreshold: 50,
    criticalThresholdPercent: 50,
  });

/**
 * Re-checks stock for every item in the active tab whenever quantities
 * change, debounced so typing a quantity doesn't fire a request per
 * keystroke. Prefers the real POST /api/stock/check-availability call;
 * falls back to computing the tier locally (see localTierFor above) for
 * any single item the backend can't resolve.
 */
export function useStockAvailability(items) {
  const [tierByProductId, setTierByProductId] = useState({});
  const [checking, setChecking] = useState(false);
  const latestRequestId = useRef(0);

  const depKey = JSON.stringify(items.map((i) => [i.productId, i.requestedQty]));

  useEffect(() => {
    if (items.length === 0) {
      setTierByProductId({});
      return;
    }

    const requestId = ++latestRequestId.current;
    setChecking(true);

    const timer = setTimeout(async () => {
      try {
        const payload = items.map((i) => ({ productId: i.productId, requestedQty: i.requestedQty }));
        const res = await api.checkStockAvailability(payload);
        if (requestId !== latestRequestId.current) return; // superseded by a newer check

        const byId = {};
        (res.data || []).forEach((r, idx) => {
          byId[r.productId] =
            r.message === 'Product not found.'
              ? localTierFor(items[idx])
              : { tier: r.tier, availableQty: r.availableQty, message: r.message };
        });
        setTierByProductId(byId);
      } catch {
        if (requestId !== latestRequestId.current) return;
        const byId = {};
        items.forEach((item) => { byId[item.productId] = localTierFor(item); });
        setTierByProductId(byId);
      } finally {
        if (requestId === latestRequestId.current) setChecking(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- depKey is items' value-comparison key
  }, [depKey]);

  return { tierByProductId, checking };
}