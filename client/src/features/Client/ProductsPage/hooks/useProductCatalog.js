// Whenever I add a new field to the Backend Database model (like thresholds, weights, or dimensions), I MUST add it to the mapProduct function in the Frontend Hooks, or the frontend will strip it out and it will be undefined!

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../../services/api';

const NEAR_EXPIRY_DAYS = 180;

const mapProduct = (raw) => {
  const batches = raw.batches || [];
  const availableBatches = batches.filter((b) => (b.stock || 0) > 0);
  
  const thresholdDays = raw.shortExpiryThreshold || 90;
  const msPerDay = 1000 * 60 * 60 * 24;
  const now = Date.now();
  
  const safeBatches = availableBatches.filter(b => {
    if (!b.expiry && !b.expiryDate) return false;
    const d = new Date(b.expiry || b.expiryDate).getTime();
    return !isNaN(d) && ((d - now) / msPerDay) > thresholdDays;
  });

  const mrpSource = safeBatches.length > 0 ? safeBatches : (availableBatches.length > 0 ? availableBatches : batches);
  const mrp = mrpSource.length > 0 ? Math.max(...mrpSource.map((b) => b.mrp || 0)) : (raw.mrp || 0);
  
  const totalStock = raw.totalStock !== undefined ? raw.totalStock : batches.reduce((sum, b) => sum + (b.stock || 0), 0);

  const nearExpiry = batches.some((b) => {
    if (!b.expiry || (b.stock || 0) === 0) return false;
    const days = (new Date(b.expiry).getTime() - now) / msPerDay;
    return days >= 0 && days <= NEAR_EXPIRY_DAYS;
  });

  // ✨ FIX: Extract Cloudinary images array properly without overriding it with a single photoUrl string
  const rawImages = raw.images?.length > 0 ? raw.images : (raw.photoUrl ? [raw.photoUrl] : []);
  const processedImages = rawImages
    .map(img => typeof img === 'object' && img !== null ? (img.secure_url || img.url) : img)
    .filter(Boolean);

  return {
    productId: raw.productId || raw.id, 
    name: raw.name,
    company: raw.company,
    companyShortCode: raw.companyShortCode || raw.company, 
    categories: raw.categories || [],
    description: raw.description || '',
    usageTips: raw.usageTips || '',
    photoUrl: processedImages[0] || null,
    compositions: raw.compositions || [],
    packing: raw.packing,
    type: raw.type || raw.packing,
    hsn: raw.hsn,
    gstRate: raw.gstRate,
    defaultRate: raw.defaultRate || 0,
    mrp,
    totalStock,
    nearExpiry,
    images: processedImages,
    batches,
    shortExpiryThreshold: raw.shortExpiryThreshold || 90,
    lowStockThreshold: raw.lowStockThreshold || 50,
    criticalStockThresholdPercent: raw.criticalStockThresholdPercent || 50,
  };
};

export function useProductCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getProductsWithBatches();
      setProducts((res.data || []).map(mapProduct));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}