// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getWithTTL, setWithTTL } from '../utils/sessionStorageTTL';

const STORAGE_KEY = 'client_cart_draft';

const CartContext = createContext(null);

/**
 * Holds the two arrays the doc calls for — `inquiryItems` and `orderItems`
 * — completely separate from each other. An item added via "Add to
 * Inquiry" on the Products page only ever shows up in the Inquiry tab;
 * "Add to Order" only ever lands in the Order Now tab. There is no shared
 * list underneath (that was the old ClientInquiryPage.jsx design, and
 * it's exactly what the doc asked NOT to do).
 *
 * Item shape kept in each array (superset of what the backend needs —
 * mapped down to { productId, batchId, requestedQty, estimatedPrice,
 * estimatedLineTotal } right before hitting POST /api/inquiries or
 * /api/orders — see ClientCart.jsx's buildSubmissionItems):
 *   {
 *     productId, name, company, packing, mrp, defaultRate,
 *     requestedQty,
 *     totalStock, // sum of batch stock — used by useStockAvailability's fallback
 *     images, batches, // carried along in case a future offer feature needs them
 *     offer: { batchId, availableQty, expiryDate, price } | null,
 *     offerApplied: boolean,
 *   }
 */
export function CartProvider({ children }) {
  const [inquiryItems, setInquiryItems] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [activeTab, setActiveTab] = useState('inquiry'); // 'inquiry' | 'order'
  const [hydrated, setHydrated] = useState(false);

  // Hydrate once on mount from the TTL'd draft, if one exists.
  useEffect(() => {
    const restored = getWithTTL(STORAGE_KEY);
    if (restored) {
      setInquiryItems(restored.inquiryItems || []);
      setOrderItems(restored.orderItems || []);
      setActiveTab(restored.activeTab || 'inquiry');
    }
    setHydrated(true);
  }, []);

  // Persist the whole draft as one blob whenever it changes.
  useEffect(() => {
    if (!hydrated) return; // don't overwrite the draft with empty state before hydration runs
    setWithTTL(STORAGE_KEY, { inquiryItems, orderItems, activeTab });
  }, [inquiryItems, orderItems, activeTab, hydrated]);

  const setterFor = useCallback((tab) => (tab === 'order' ? setOrderItems : setInquiryItems), []);
  const itemsFor = useCallback((tab) => (tab === 'order' ? orderItems : inquiryItems), [orderItems, inquiryItems]);

  const addItem = useCallback((tab, product, qty = 1) => {
    const setItems = setterFor(tab);
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.productId ? { ...i, requestedQty: i.requestedQty + qty } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.productId,
          name: product.name,
          company: product.company,
          packing: product.packing,
          mrp: product.mrp,
          defaultRate: product.defaultRate,
          requestedQty: qty,
          totalStock: product.totalStock,
          images: product.images || [],
          batches: product.batches || [],
          offer: product.offer || null,
          offerApplied: false,
        },
      ];
    });
  }, [setterFor]);

  const updateQty = useCallback((tab, productId, qty) => {
    const setItems = setterFor(tab);
    const safeQty = Math.max(1, Number(qty) || 1);
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, requestedQty: safeQty } : i)));
  }, [setterFor]);

  const removeItem = useCallback((tab, productId) => {
    const setItems = setterFor(tab);
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, [setterFor]);

  const toggleOffer = useCallback((tab, productId) => {
    const setItems = setterFor(tab);
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, offerApplied: !i.offerApplied } : i)));
  }, [setterFor]);

  const clearTab = useCallback((tab) => {
    setterFor(tab)([]);
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
    toggleOffer,
    clearTab,
    inquiryCount: inquiryItems.length,
    orderCount: orderItems.length,
  }), [inquiryItems, orderItems, activeTab, itemsFor, addItem, updateQty, removeItem, toggleOffer, clearTab]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart() must be used inside <CartProvider>');
  return ctx;
}