// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { cartApi } from '../services/api/cartApi'; // Ensure this path matches your folder structure!
import { useCurrentClient } from '../hooks/useCurrentClient'; // Ensure this path matches your folder structure!

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // 1. Auth hook to know who is logged in
  const { clientId } = useCurrentClient();

  const [inquiryItems, setInquiryItems] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('cartActiveTab') || 'inquiry');

  // 2. Safety locks to prevent wiping the cloud cart on initial load
  const [isHydrated, setIsHydrated] = useState(false);
  const isInitialMount = useRef(true);

  // ════════════════════════════════════════════════════════════
  // STEP 1: HYDRATION (Cross-Device Load)
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!clientId) {
      setIsHydrated(true); // If guest, just unlock the cart
      return;
    }

    let isMounted = true;
    const fetchCloudCart = async () => {
      try {
        const res = await cartApi.getCart();
        if (isMounted && res.success) {

          // ✨ MAP BACKEND -> FRONTEND & SELF-HEAL PRICES
          const mapItems = (items) => items.map(i => {
            let safeMrp = i.mrp;
            let safeDefaultRate = i.defaultRate;

            // ✨ Self-Healing: If the network drops the MRP, the frontend rescues it from the batch array!
            if ((!safeMrp || safeMrp === 0) && i.batches && i.batches.length > 0) {
              safeMrp = i.batches[0].mrp;
            }
            if ((!safeDefaultRate || safeDefaultRate === 0) && i.batches && i.batches.length > 0) {
              safeDefaultRate = i.batches[0].sellingRate || i.batches[0].defaultRate;
            }

            return {
              ...i,
              mrp: safeMrp || 0,
              defaultRate: safeDefaultRate || 0,
              requestedQty: i.quantity // Map database 'quantity' to UI 'requestedQty'
            };
          });

          setInquiryItems(mapItems(res.data.inquiryItems || []));
          setOrderItems(mapItems(res.data.orderItems || []));
          setIsHydrated(true); // Unlock the sync engine!
        }
      } catch (err) {
        console.error("Failed to hydrate cloud cart:", err);
        if (isMounted) setIsHydrated(true); // Failsafe unlock so UI isn't permanently frozen
      }
    };

    fetchCloudCart();
    return () => { isMounted = false; };
  }, [clientId]);


  // ════════════════════════════════════════════════════════════
  // STEP 2: OPTIMISTIC UI & DEBOUNCED CLOUD SYNC
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    // SECURITY 1: Never push to cloud until the cloud has finished downloading
    if (!isHydrated) return;

    // SECURITY 2: Prevent the initial "mount" from triggering a sync
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // THE DEBOUNCE: Wait 1.5 seconds of inactivity before calling the API
    const timer = setTimeout(async () => {
      if (!clientId) return; // Only sync if logged in

      try {
        // ✨ MAP FRONTEND -> BACKEND: Flatten arrays and rename 'requestedQty' back to 'quantity'
        const buildPayload = (items, type) => items.map(i => ({
          productId: i.productId,
          batchId: i.batchId || null,
          type: type,
          quantity: i.requestedQty
        }));

        const payload = [
          ...buildPayload(inquiryItems, 'inquiry'),
          ...buildPayload(orderItems, 'order')
        ];

        // Silently push to MongoDB
        await cartApi.syncCart(payload);
        console.log("☁️ Cart synced to cloud successfully.");

        // Note: We intentionally DO NOT update local state with the response here. 
        // This prevents race-condition stuttering if the user clicks "+" while the API is in flight!

      } catch (err) {
        console.error("Silent Cart Sync Failed:", err);
        // We do NOT show a toast here to avoid annoying the user on background network drops
      }
    }, 1500);

    return () => clearTimeout(timer); // Reset the 1.5s timer if the user clicks again
  }, [inquiryItems, orderItems, isHydrated, clientId]);


  // Keep active tab preference in quick session storage
  useEffect(() => {
    sessionStorage.setItem('cartActiveTab', activeTab);
  }, [activeTab]);


  // ════════════════════════════════════════════════════════════
  // STEP 3: INSTANT STATE MUTATIONS (No Loading Spinners!)
  // ════════════════════════════════════════════════════════════
  const setterFor = useCallback((tab) => (tab === 'order' ? setOrderItems : setInquiryItems), []);
  const itemsFor = useCallback((tab) => (tab === 'order' ? orderItems : inquiryItems), [orderItems, inquiryItems]);

  const addItem = useCallback((tab, product, qty = 1) => {
    const setItems = setterFor(tab);
    setItems((prev) => {
      const cartItemId = `${product.productId}_${product.batchId || 'standard'}`;
      const existing = prev.find((i) => `${i.productId}_${i.batchId || 'standard'}` === cartItemId);

      if (existing) {
        return prev.map((i) =>
          `${i.productId}_${i.batchId || 'standard'}` === cartItemId
            ? { ...i, requestedQty: i.requestedQty + qty }
            : i
        );
      }

      return [
        ...prev,
        {
          productId: product.productId,
          batchId: product.batchId,
          name: product.name,
          company: product.company,
          companyShortCode: product.companyShortCode,
          packing: product.packing,
          mrp: product.mrp,
          defaultRate: product.defaultRate,
          requestedQty: qty,
          totalStock: product.totalStock,
          images: product.images || [],
          batches: product.batches || [],
          offer: product.offer || null,
          offerApplied: product.offerApplied || false,
        },
      ];
    });
  }, [setterFor]);

  const updateQty = useCallback((tab, productId, batchId, qty) => {
    const setItems = setterFor(tab);
    const safeQty = Math.max(1, Number(qty) || 1);
    const cartItemId = `${productId}_${batchId || 'standard'}`;
    setItems((prev) => prev.map((i) => (`${i.productId}_${i.batchId || 'standard'}` === cartItemId ? { ...i, requestedQty: safeQty } : i)));
  }, [setterFor]);

  const removeItem = useCallback((tab, productId, batchId) => {
    const setItems = setterFor(tab);
    const cartItemId = `${productId}_${batchId || 'standard'}`;
    setItems((prev) => prev.filter((i) => `${i.productId}_${i.batchId || 'standard'}` !== cartItemId));
  }, [setterFor]);

  const clearTab = useCallback((tab) => {
    setterFor(tab)([]);
  }, [setterFor]);

  const loadItems = useCallback((tab, newItems) => {
    setterFor(tab)(newItems);
  }, [setterFor]);

  const value = useMemo(() => ({
    inquiryItems,
    orderItems,
    activeTab,
    setActiveTab,
    itemsFor,
    addItem,
    updateQty,
    removeItem,
    clearTab,
    loadItems,
    inquiryCount: inquiryItems.length,
    orderCount: orderItems.length,
  }), [inquiryItems, orderItems, activeTab, itemsFor, addItem, updateQty, removeItem, clearTab, loadItems]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart() must be used inside <CartProvider>');
  return ctx;
}