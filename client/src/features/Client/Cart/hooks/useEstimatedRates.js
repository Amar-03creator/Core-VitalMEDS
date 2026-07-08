// src/features/Client/Cart/hooks/useEstimatedRates.js
import { useState, useEffect, useRef } from 'react';
import { api } from '../../../../services/api';

/**
 * Resolves "the rate from the last ordered batch from the supplier" per
 * item in the cart. Tries, in order:
 *
 *  1. GET /purchase-bills/last-rates/:productId (api.getLastRatesForProduct)
 *     — this is the distributor's own last PURCHASE rate from ITS
 *     supplier, not a per-client order-history rate. I couldn't find a
 *     matching handler in the purchaseBillController.js I was given (no
 *     exports.getLastRates or similar), so this call may 404 for you —
 *     that's fine, it just falls through to step 2/3. If your backend
 *     does implement this and returns a shape other than
 *     `{ rate }` / `{ data: { rate } }` / `{ lastRate }`, update the
 *     three lines below that read `res?.rate ?? ...` to match.
 *     Also: this endpoint has no client dimension, so if what you
 *     actually want is "the rate THIS CLIENT was last charged," that's a
 *     different, currently-nonexistent endpoint (client+product joined
 *     against Order/SalesInvoice history) — flagging since the spec's
 *     wording ("if the customer has no order history…") reads as
 *     client-specific, but no such endpoint exists to call.
 *  2. product.defaultRate, already computed server-side.
 *  3. mrp * 0.8, the doc's explicit floor.
 *
 * Steps 2/3 are cheap and synchronous, so this hook only needs to do
 * async work for step 1 — everything else is resolved instantly by
 * cartMath.js's getEstimatedUnitPrice, which re-applies the same cascade
 * as a safety net even if this hook hasn't resolved yet.
 */
export function useEstimatedRates(items) {
  const [rateByProductId, setRateByProductId] = useState({});
  const requestKey = items.map((i) => i.productId).join(',');
  const latest = useRef(0);

  useEffect(() => {
    if (items.length === 0) { setRateByProductId({}); return; }
    const reqId = ++latest.current;

    (async () => {
      const entries = await Promise.all(
        items.map(async (item) => {
          try {
            const res = await api.getLastRatesForProduct(item.productId);
            const rate = res?.rate ?? res?.data?.rate ?? res?.lastRate ?? res?.data?.lastRate ?? null;
            if (typeof rate === 'number' && rate > 0) return [item.productId, rate];
          } catch {
            // No purchase history yet, or the endpoint isn't wired up — fall through.
          }
          if (item.defaultRate > 0) return [item.productId, item.defaultRate];
          return [item.productId, (item.mrp || 0) * 0.8];
        })
      );
      if (reqId === latest.current) setRateByProductId(Object.fromEntries(entries));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- requestKey is items' value-comparison key
  }, [requestKey]);

  return rateByProductId;
}