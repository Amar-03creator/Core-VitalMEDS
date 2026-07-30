/**
 * ============================================================================
 * FILE: productApi.js
 * PURPOSE: Inventory & Catalog Domain.
 * DESCRIPTION: Handles the global product catalog, company/manufacturer 
 * management, batch tracking, PTR updates, and live stock 
 * availability and replenishment logic.
 * ============================================================================
 */

// client/src/services/api/productApi.js
import { secureFetch,BASE_URL } from './apiCore';

export const productApi = {
  /* ── Companies ────────────────────────────────────────────────────────── */
  async getPublicCompanies() {
    // We use standard 'fetch' here instead of 'secureFetch' so no token is required
    const res = await fetch(`${BASE_URL}/companies/public`);
    if (!res.ok) throw new Error('Failed to fetch public companies');
    return res.json();
  },
  
  async getCompanies() {
    const res = await secureFetch(`/companies`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch companies');
    return res.json();
  },

  async getCompanyById(id) {
    const res = await secureFetch(`/companies/${id}`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch company');
    return res.json();
  },

  async updateCompany(id, data) {
    const res = await secureFetch(`/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to update company');
    return res.json();
  },

  async toggleCompanyStatus(id) {
    const res = await secureFetch(`/companies/${id}/status`, { method: 'PATCH' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to update status');
    return res.json();
  },

  async createCompany(data) {
    const res = await secureFetch(`/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to create company');
    return res.json();
  },

  /* ── Products ─────────────────────────────────────────────────────────── */
  async getProducts(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'All') qs.set(k, v);
    });

    const res = await secureFetch(`/products${qs.toString() ? `?${qs.toString()}` : ''}`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch products');
    return res.json();
  },

  async getProductsByCompany(companyId) {
    const res = await secureFetch(`/products?companyId=${encodeURIComponent(companyId)}`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch products for supplier');
    return res.json();
  },

  async createProduct(data) {
    const res = await secureFetch(`/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to create product');
    return res.json();
  },

  async updateProduct(id, data) {
    const res = await secureFetch(`/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to update product');
    return res.json();
  },
  getUploadSignature: async () => {
    const res = await secureFetch('/products/upload-signature');
    if (!res.ok) throw new Error('Failed to get upload signature');
    return res.json();
  },

  /* ── Products with Batches & Inventory ────────────────────────────────── */
  async getProductsWithBatches() {
    const res = await secureFetch(`/products-with-batches`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch products');
    return res.json();
  },

  async getBatchesByCompany(companyName) {
    const res = await secureFetch(`/products-with-batches/inventory?company=${encodeURIComponent(companyName)}`);
    if (!res.ok) throw new Error('Failed to fetch batches for this supplier');
    const json = await res.json();
    const flatBatches = (json.data || []).flatMap(product =>
      (product.batches || [])
        .filter(b => (b.totalStockQuantity || b.stock || 0) > 0)
        .map(b => ({
          _id: b._id,
          productId: product._id || product.id,
          productName: product.name,
          batchNumber: b.batchNumber || b.no,
          totalStockQuantity: b.totalStockQuantity ?? b.stock ?? 0,
        }))
    );
    return { success: true, data: flatBatches };
  },

  async getInventory(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'All') qs.set(k, v);
    });

    const res = await secureFetch(`/products-with-batches/inventory${qs.toString() ? `?${qs.toString()}` : ''}`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch inventory');
    return res.json();
  },

  async updateBatchPTR(batchId, ptrValue) {
    const res = await secureFetch(`/products-with-batches/batches/${batchId}/ptr`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sellingRate: ptrValue }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to update PTR');
    return res.json();
  },

  /* ── Stock Availability & Replenishment ──────────────────────────────── */
  async checkStockAvailability(items) {
    const res = await secureFetch(`/stock/check-availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to check availability');
    return res.json();
  },

  async generateReplenishmentSuggestions(params) {
    const res = await secureFetch(`/replenishment/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to generate suggestions');
    return res.json();
  },

  async exportPurchaseOrders(items) {
    const res = await secureFetch(`/replenishment/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to export purchase orders');
    return res.blob();
  },

  /* ── Offers & Schemes ─────────────────────────────────────────────────── */
  // async getShortExpiryBatches(months = 6) {
  //   const res = await secureFetch(`/products-with-batches/offers/short-expiry?months=${months}`);
  //   if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch short expiry batches');
  //   return res.json();
  // },

  // async getActiveOffers() {
  //   const res = await secureFetch(`/products-with-batches/offers/active`);
  //   if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch active offers');
  //   return res.json();
  // },

  /* ── Offers & Schemes ─────────────────────────────────────────────────── */
  async getOffersList(status = 'all', months = '6') {
    const res = await secureFetch(`/products-with-batches/offers?status=${status}&months=${months}`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch offers');
    return res.json();
  },

  async updateBatchOffer(batchId, payload) {
    const res = await secureFetch(`/products-with-batches/offers/${batchId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to update offer');
    return res.json();
  }
};