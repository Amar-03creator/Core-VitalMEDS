// src/features/Client/ProductsPage/hooks/useProductCatalog.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../../services/api';

const NEAR_EXPIRY_DAYS = 180;

const mapProduct = (raw) => {
  const batches = raw.batches || [];
  const availableBatches = batches.filter((b) => (b.stock || 0) > 0);
  const mrpSource = availableBatches.length > 0 ? availableBatches : batches;
  const mrp = mrpSource.length > 0 ? Math.max(...mrpSource.map((b) => b.mrp || 0)) : 0;
  const totalStock = batches.reduce((sum, b) => sum + (b.stock || 0), 0);

  const now = Date.now();
  const nearExpiry = batches.some((b) => {
    if (!b.expiry || (b.stock || 0) === 0) return false;
    const days = (new Date(b.expiry).getTime() - now) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= NEAR_EXPIRY_DAYS;
  });

  return {
    productId: raw.id,
    name: raw.name,
    company: raw.company,
    
    // ★ FIX: Map the new fields we added to the backend!
    companyShortCode: raw.companyShortCode || raw.company, 
    categories: raw.categories || [],
    description: raw.description || '',
    usageTips: raw.usageTips || '',
    photoUrl: raw.photoUrl || null,
    
    compositions: raw.compositions || [],
    packing: raw.packing,
    type: raw.type || raw.packing,
    hsn: raw.hsn,
    gstRate: raw.gstRate,
    defaultRate: raw.defaultRate || 0,
    mrp,
    totalStock,
    nearExpiry,
    images: raw.photoUrl ? [raw.photoUrl] : [],
    batches,
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