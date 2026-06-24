// client/src/services/api.js
const BASE_URL = 'http://192.168.1.6:5000/api';

export const api = {
  /* ── Companies ────────────────────────────────────────────────────────── */
  async getCompanies() {
    const res = await fetch(`${BASE_URL}/companies`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch companies');
    return res.json();
  },

  async createCompany(data) {
    const res = await fetch(`${BASE_URL}/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to create company');
    return res.json();
  },

  /* ── Products ─────────────────────────────────────────────────────────── */
  async getProducts() {
    const res = await fetch(`${BASE_URL}/products`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch products');
    return res.json();
  },

  async getProductsByCompany(companyId) {
    const res = await fetch(`${BASE_URL}/products?companyId=${encodeURIComponent(companyId)}`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch products for supplier');
    return res.json();
  },

  async createProduct(data) {
    const res = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to create product');
    return res.json();
  },

  /* ── Purchase Bills ───────────────────────────────────────────────────── */
  async getLastRatesForProduct(productId) {
    const res = await fetch(`${BASE_URL}/purchase-bills/last-rates/${encodeURIComponent(productId)}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async createPurchaseBill(data) {
    const res = await fetch(`${BASE_URL}/purchase-bills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to save purchase bill');
    return res.json();
  },

  /* ── Products with Batches ────────────────────────────────────────────── */
  async getProductsWithBatches() {
    const res = await fetch(`${BASE_URL}/products-with-batches`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch products');
    return res.json();
  },

  /* ── Sales Invoices ───────────────────────────────────────────────────── */
  async createSalesInvoice(data) {
    const res = await fetch(`${BASE_URL}/sales-invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to create invoice');
    return res.json();
  },

  async getSalesInvoices() {
    const res = await fetch(`${BASE_URL}/sales-invoices`);
    if (!res.ok) throw new Error('Failed to fetch invoices');
    return res.json();
  },

  async updateSalesInvoice(id, data) {
    const res = await fetch(`${BASE_URL}/sales-invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to update invoice');
    return res.json();
  },

  async deleteSalesInvoice(id) {
    const res = await fetch(`${BASE_URL}/sales-invoices/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to delete invoice');
    return res.json();
  },

  async getSalesInvoiceById(id) {
    const res = await fetch(`${BASE_URL}/sales-invoices/${id}`);
    if (!res.ok) throw new Error('Failed to fetch invoice');
    return res.json();
  },

  /* ── Clients & Duplicates ─────────────────────────────────────────────── */
  async checkDrugLicense(license) {
    const res = await fetch(`${BASE_URL}/drug-licenses/check?license=${encodeURIComponent(license)}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async checkPhone(phone) {
    const res = await fetch(`${BASE_URL}/phones/check?phone=${encodeURIComponent(phone)}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async checkDuplicate(field, value) {
    const res = await fetch(`${BASE_URL}/duplicates/check?field=${field}&value=${encodeURIComponent(value)}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getClients() {
    const res = await fetch(`${BASE_URL}/clients`);
    if (!res.ok) throw new Error('Failed to fetch clients');
    return res.json();
  },

  async getClientFilterOptions(line, city) {
    const params = new URLSearchParams();
    if (line) params.set('line', line);
    if (city) params.set('city', city);
    const res = await fetch(`${BASE_URL}/clients/filter-options?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch filter options');
    return res.json();
  },

  /* ── Payment Receipts ─────────────────────────────────────────────────── */
  async createPaymentReceipt(data) {
    const res = await fetch(`${BASE_URL}/payment-receipts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to create payment receipt');
    return res.json();
  },

  async getPaymentReceipts(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, v);
    });
    const qs = params.toString();
    const res = await fetch(`${BASE_URL}/payment-receipts${qs ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch receipts');
    return res.json();
  },

  // ★ ADDED HERE INSIDE THE OBJECT:
  async updatePaymentReceipt(id, data) {
    const res = await fetch(`${BASE_URL}/payment-receipts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to update payment receipt');
    return res.json();
  },

  async deletePaymentReceipt(id) {
    const res = await fetch(`${BASE_URL}/payment-receipts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to delete payment receipt');
    return res.json();
  },



  async getLedger({ scope, partyId, line, city, from, to }) {
    const params = new URLSearchParams({ scope, from, to });
    if (partyId) params.set('partyId', partyId);
    if (line) params.set('line', line);
    if (city) params.set('city', city);
    const res = await fetch(`${BASE_URL}/ledger?${params.toString()}`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch ledger');
    return res.json();
  },

  async getDashboardStats() {
    const res = await fetch(`${BASE_URL}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  // Add this near your getDashboardStats function
  async runAudit() {
    const res = await fetch(`${BASE_URL}/audit/run`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to run audit');
    return res.json();
  },
};