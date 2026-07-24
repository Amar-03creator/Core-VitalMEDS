// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getWithTTL, setWithTTL } from '../utils/sessionStorageTTL';

const STORAGE_KEY = 'client_cart_draft';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [inquiryItems, setInquiryItems] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [activeTab, setActiveTab] = useState('inquiry'); 
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const restored = getWithTTL(STORAGE_KEY);
    if (restored) {
      setInquiryItems(restored.inquiryItems || []);
      setOrderItems(restored.orderItems || []);
      setActiveTab(restored.activeTab || 'inquiry');
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return; 
    setWithTTL(STORAGE_KEY, { inquiryItems, orderItems, activeTab });
  }, [inquiryItems, orderItems, activeTab, hydrated]);

  const setterFor = useCallback((tab) => (tab === 'order' ? setOrderItems : setInquiryItems), []);
  const itemsFor = useCallback((tab) => (tab === 'order' ? orderItems : inquiryItems), [orderItems, inquiryItems]);

  const addItem = useCallback((tab, product, qty = 1) => {
    const setItems = setterFor(tab);
    setItems((prev) => {
      // ✨ UPGRADE: Unique Key combining Product ID and Batch ID
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