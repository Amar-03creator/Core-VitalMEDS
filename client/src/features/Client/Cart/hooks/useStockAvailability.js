import { useState, useEffect, useRef } from 'react';
import { api } from '../../../../services/api';
import { computeStockTier } from '../../../../utils/stockTier';

const DEBOUNCE_MS = 400;

const localTierFor = (item) => {
  let stockToCheck = item.totalStock || 0;
  
  if (item.batchId && item.batches) {
    // 1. OFFER ROW: Checks only its specific batch stock
    const batch = item.batches.find(b => String(b._id) === String(item.batchId) || String(b.id) === String(item.batchId) || String(b.no) === String(item.batchId));
    if (batch) {
      stockToCheck = batch.stock ?? batch.remainingUnits ?? batch.totalStockQuantity ?? item.totalStock;
    }
  } else if (!item.batchId && item.batches) {
    // 2. NORMAL ROW: Checks Global Stock MINUS Fenced Offer Batches
    let offerStockToExclude = 0;
    item.batches.forEach(b => {
      // Find batches that have an active offer
      if (b.offer && (b.offer.isActive || b.offer.description)) {
        offerStockToExclude += (b.stock ?? b.remainingUnits ?? b.totalStockQuantity ?? 0);
      }
    });
    stockToCheck = Math.max(0, stockToCheck - offerStockToExclude);
  }

  return computeStockTier({
    requestedQty: item.requestedQty,
    currentStock: stockToCheck,
    lowStockThreshold: 50,
    criticalThresholdPercent: 50,
  });
};

export function useStockAvailability(items) {
  // ✨ UPGRADE: Switched to Key map instead of purely ProductID
  const [tierByKey, setTierByKey] = useState({});
  const [checking, setChecking] = useState(false);
  const latestRequestId = useRef(0);

  const depKey = JSON.stringify(items.map((i) => [i.productId, i.batchId, i.requestedQty]));

  useEffect(() => {
    if (items.length === 0) {
      setTierByKey({});
      return;
    }

    const requestId = ++latestRequestId.current;
    setChecking(true);

    const timer = setTimeout(async () => {
      try {
        const payload = items.map((i) => ({ 
            productId: i.productId, 
            batchId: i.batchId, 
            requestedQty: i.requestedQty 
        }));
        
        const res = await api.checkStockAvailability(payload);
        if (requestId !== latestRequestId.current) return;

        const byKey = {};
        (res.data || []).forEach((r, idx) => {
          const item = items[idx];
          const cartKey = `${item.productId}_${item.batchId || 'standard'}`;
          byKey[cartKey] = r.message === 'Product not found.'
              ? localTierFor(item)
              : { tier: r.tier, availableQty: r.availableQty, message: r.message };
        });
        setTierByKey(byKey);
      } catch {
        if (requestId !== latestRequestId.current) return;
        const byKey = {};
        items.forEach((item) => { 
            const cartKey = `${item.productId}_${item.batchId || 'standard'}`;
            byKey[cartKey] = localTierFor(item); 
        });
        setTierByKey(byKey);
      } finally {
        if (requestId === latestRequestId.current) setChecking(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [depKey]);

  return { tierByKey, checking };
}