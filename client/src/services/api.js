// client/src/services/api.js
const BASE_URL = 'http://192.168.1.6:5000/api';

export const api = {
  /* ── Companies ────────────────────────────────────────────────────────── */
  async getCompanies() {
    const res = await fetch(`${BASE_URL}/companies`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch companies');
    return res.json();
  },

  async getCompanyById(id) {
    const res = await fetch(`${BASE_URL}/companies/${id}`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch company');
    return res.json();
  },

  async updateCompany(id, data) {
    const res = await fetch(`${BASE_URL}/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to update company');
    return res.json();
  },

  async toggleCompanyStatus(id) {
    const res = await fetch(`${BASE_URL}/companies/${id}/status`, { method: 'PATCH' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to update status');
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
  async getProducts(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'All') qs.set(k, v);
    });

    const res = await fetch(`${BASE_URL}/products${qs.toString() ? `?${qs.toString()}` : ''}`);
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

  async updateProduct(id, data) {
    const res = await fetch(`${BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to update product');
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

  async getPurchaseBillsBySupplier(supplierId) {
    const res = await fetch(`${BASE_URL}/purchase-bills/supplier/${encodeURIComponent(supplierId)}`);
    if (!res.ok) throw new Error('Failed to fetch purchase bills');
    return res.json();
  },

  async getPurchaseBillById(id) {
    const res = await fetch(`${BASE_URL}/purchase-bills/${id}`);
    if (!res.ok) throw new Error('Failed to fetch purchase bill');
    return res.json();
  },

  async recordPurchasePayment(data) {
    const res = await fetch(`${BASE_URL}/purchase-bills/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to record payment');
    return res.json();
  },

  async cancelPurchaseBill(id, reason, adminId) {
    const res = await fetch(`${BASE_URL}/purchase-bills/${id}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, adminId }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to cancel purchase bill');
    return res.json();
  },

  /* ── Products with Batches ────────────────────────────────────────────── */
  async getProductsWithBatches() {
    const res = await fetch(`${BASE_URL}/products-with-batches`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch products');
    return res.json();
  },

  async getBatchesByCompany(companyName) {
    const res = await fetch(`${BASE_URL}/products-with-batches/inventory?company=${encodeURIComponent(companyName)}`);
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

  /* ── Inventory & Batches ──────────────────────────────────────────────── */
  async getInventory(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'All') qs.set(k, v);
    });

    const res = await fetch(`${BASE_URL}/products-with-batches/inventory${qs.toString() ? `?${qs.toString()}` : ''}`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch inventory');
    return res.json();
  },

  async updateBatchPTR(batchId, ptrValue) {
    const res = await fetch(`${BASE_URL}/products-with-batches/batches/${batchId}/ptr`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sellingRate: ptrValue }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to update PTR');
    return res.json();
  },

/* ── Clients (Customers) ──────────────────────────────────────────────── */

  /**
   * GET /api/clients?{queryString}
   */
  async getClients(queryString = '') {
    const url = `${BASE_URL}/clients${queryString ? `?${queryString}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch clients');
    return res.json(); // Standardized
  },

  /**
   * GET /api/clients/:id
   */
  async getClientById(id) {
    const res = await fetch(`${BASE_URL}/clients/${id}`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch client');
    return res.json(); // Standardized
  },

  /**
   * POST /api/clients
   */
  async createClient(payload) {
    const res = await fetch(`${BASE_URL}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to create client');
    return res.json();
  },

  /**
   * PUT /api/clients/:id
   */
  async updateClient(id, payload) {
    const res = await fetch(`${BASE_URL}/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to update client');
    return res.json();
  },

  async checkDuplicate(field, value) {
    // ✨ Changed /duplicates/check to /clients/duplicates/check
    const res = await fetch(`${BASE_URL}/clients/duplicates/check?field=${field}&value=${encodeURIComponent(value)}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  /**
   * PUT /api/clients/:id/approve
   */
  async approveClient(id) {
    const res = await fetch(`${BASE_URL}/clients/${id}/approve`, { method: 'PUT' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to approve client');
    return res.json();
  },

  /**
   * PUT /api/clients/:id/reject
   */
  async rejectClient(id, reason) {
    const res = await fetch(`${BASE_URL}/clients/${id}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to reject client');
    return res.json();
  },

  /**
   * PUT /api/clients/:id/status
   */
  async updateClientStatus(id, status) {
    const res = await fetch(`${BASE_URL}/clients/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to update status');
    return res.json();
  },

  /**
   * GET /api/clients/:id/invoices
   */
  async getClientInvoices(id) {
    const res = await fetch(`${BASE_URL}/clients/${id}/invoices`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch invoices');
    return res.json();
  },

  /**
   * GET /api/clients/:id/payments
   */
  async getClientPayments(id) {
    const res = await fetch(`${BASE_URL}/clients/${id}/payments`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch payments');
    return res.json();
  },

  /**
   * GET /api/clients/:id/orders
   */
  async getClientOrders(id) {
    const res = await fetch(`${BASE_URL}/clients/${id}/orders`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch orders');
    return res.json();
  },

  /**
   * GET /api/clients/filter-options
   */
  async getClientFilterOptions(line, city) {
    const params = new URLSearchParams();
    if (line) params.set('line', line);
    if (city) params.set('city', city);
    const res = await fetch(`${BASE_URL}/clients/filter-options?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch filter options');
    return res.json();
  },

  /* ── Client Suspension (OTP) ────────────────────────────────────────── */
  async requestSuspendOtp(id) {
    const res = await fetch(`${BASE_URL}/clients/${id}/suspend/request-otp`, { method: 'POST' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to request OTP');
    return res.json();
  },

  async verifySuspendOtp(id, otp, reason) {
    const res = await fetch(`${BASE_URL}/clients/${id}/suspend/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp, reason }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to verify OTP');
    return res.json();
  },

  // Reactivate Client
  async reactivateClient(id) {
    const res = await fetch(`${BASE_URL}/clients/${id}/reactivate`, { method: 'PUT' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to reactivate client');
    return res.json();
  },

  /* ── Duplicate Checks ────────────────────────────────────────────────── */
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

  /* ── Ledger ───────────────────────────────────────────────────────────── */
  async getLedger({ scope, partyId, line, city, from, to }) {
    const params = new URLSearchParams({ scope, from, to });
    if (partyId) params.set('partyId', partyId);
    if (line) params.set('line', line);
    if (city) params.set('city', city);
    const res = await fetch(`${BASE_URL}/ledger?${params.toString()}`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch ledger');
    return res.json();
  },

  /* ── Dashboard ────────────────────────────────────────────────────────── */
  async getDashboardStats() {
    const res = await fetch(`${BASE_URL}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  async runAudit() {
    const res = await fetch(`${BASE_URL}/audit/run`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to run audit');
    return res.json();
  },

  /* ── Debit Notes ──────────────────────────────────────────────────────── */
  async createDebitNote(data) {
    const res = await fetch(`${BASE_URL}/debit-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to create debit note');
    return res.json();
  },

  async getDebitNotesBySupplier(supplierId) {
    const res = await fetch(`${BASE_URL}/debit-notes/supplier/${encodeURIComponent(supplierId)}`);
    if (!res.ok) throw new Error('Failed to fetch debit notes');
    return res.json();
  },

  async markDebitNoteApplied(id, adjustedNote, adminId) {
    const res = await fetch(`${BASE_URL}/debit-notes/${id}/apply`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adjustedNote, adminId }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to mark debit note applied');
    return res.json();
  },

  /* ── Smart Replenishment ──────────────────────────────────────────────── */
  async generateReplenishmentSuggestions(params) {
    const res = await fetch(`${BASE_URL}/replenishment/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to generate suggestions');
    return res.json();
  },

  async exportPurchaseOrders(items) {
    const res = await fetch(`${BASE_URL}/replenishment/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to export purchase orders');
    return res.blob();
  },
};