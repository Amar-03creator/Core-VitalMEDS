

/**
 * ============================================================================
 * FILE: financeApi.js
 * PURPOSE: Billing & Accounting Domain.
 * DESCRIPTION: Manages all financial transactions including Sales Invoices, 
 * Purchase Bills (from suppliers), Payment Receipts, Debit Notes, 
 * and fetching system Dashboard stats/audits.
 * ============================================================================
 */

import { secureFetch } from './apiCore';

export const financeApi = {
  /* ── Purchase Bills ───────────────────────────────────────────────────── */

  async getPurchaseBills() {
    const res = await secureFetch(`/purchase-bills`);
    if (!res.ok) throw new Error('Failed to fetch purchase bills');
    return res.json();
  },
  
  async getLastRatesForProduct(productId) {
    const res = await secureFetch(`/purchase-bills/last-rates/${encodeURIComponent(productId)}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async createPurchaseBill(data) {
    const res = await secureFetch(`/purchase-bills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to save purchase bill');
    return res.json();
  },

  async getPurchaseBillsBySupplier(supplierId) {
    const res = await secureFetch(`/purchase-bills/supplier/${encodeURIComponent(supplierId)}`);
    if (!res.ok) throw new Error('Failed to fetch purchase bills');
    return res.json();
  },

  async getPurchaseBillById(id) {
    const res = await secureFetch(`/purchase-bills/${id}`);
    if (!res.ok) throw new Error('Failed to fetch purchase bill');
    return res.json();
  },

  async recordPurchasePayment(data) {
    const res = await secureFetch(`/purchase-bills/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to record payment');
    return res.json();
  },

  async cancelPurchaseBill(id, reason, adminId) {
    const res = await secureFetch(`/purchase-bills/${id}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, adminId }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to cancel purchase bill');
    return res.json();
  },

  /* ── Supplier Payments (Outward) ──────────────────────────────────────── */
  async createSupplierPayment(data) {
    const res = await secureFetch(`/supplier-payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to record supplier payment');
    return res.json();
  },

  async getSupplierPayments() {
    const res = await secureFetch(`/supplier-payments`);
    if (!res.ok) throw new Error('Failed to fetch supplier payments');
    return res.json();
  },

  async deleteSupplierPayment(id) {
    const res = await secureFetch(`/supplier-payments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to delete supplier payment');
    return res.json();
  },

  async reconcileSupplierLedger(supplierId) {
    const res = await secureFetch(`/supplier-payments/reconcile/${encodeURIComponent(supplierId)}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to reconcile ledger');
    return res.json();
  },

  /* ── Sales Invoices ───────────────────────────────────────────────────── */
  async createSalesInvoice(data) {
    const res = await secureFetch(`/sales-invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to create invoice');
    return res.json();
  },

  async getSalesInvoices() {
    const res = await secureFetch(`/sales-invoices`);
    if (!res.ok) throw new Error('Failed to fetch invoices');
    return res.json();
  },

  async updateSalesInvoice(id, data) {
    const res = await secureFetch(`/sales-invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to update invoice');
    return res.json();
  },

  async deleteSalesInvoice(id) {
    const res = await secureFetch(`/sales-invoices/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to delete invoice');
    return res.json();
  },

  async getSalesInvoiceById(id) {
    const res = await secureFetch(`/sales-invoices/${id}`);
    if (!res.ok) throw new Error('Failed to fetch invoice');
    return res.json();
  },

  /* ── Payment Receipts ─────────────────────────────────────────────────── */
  async createPaymentReceipt(data) {
    const res = await secureFetch(`/payment-receipts`, {
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
    const res = await secureFetch(`/payment-receipts${qs ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch receipts');
    return res.json();
  },

  async updatePaymentReceipt(id, data) {
    const res = await secureFetch(`/payment-receipts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to update payment receipt');
    return res.json();
  },

  async deletePaymentReceipt(id) {
    const res = await secureFetch(`/payment-receipts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to delete payment receipt');
    return res.json();
  },

  /* ── Debit Notes ──────────────────────────────────────────────────────── */
  async createDebitNote(data) {
    const res = await secureFetch(`/debit-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to create debit note');
    return res.json();
  },

  async getDebitNotesBySupplier(supplierId) {
    const res = await secureFetch(`/debit-notes/supplier/${encodeURIComponent(supplierId)}`);
    if (!res.ok) throw new Error('Failed to fetch debit notes');
    return res.json();
  },

  async markDebitNoteApplied(id, adjustedNote, adminId) {
    const res = await secureFetch(`/debit-notes/${id}/apply`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adjustedNote, adminId }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to mark debit note applied');
    return res.json();
  },

  /* ── Ledger & Dashboard ────────────────────────────────────────────────── */
  async getLedger({ scope, partyId, line, city, from, to }) {
    const params = new URLSearchParams({ scope, from, to });
    if (partyId) params.set('partyId', partyId);
    if (line) params.set('line', line);
    if (city) params.set('city', city);
    const res = await secureFetch(`/ledger?${params.toString()}`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch ledger');
    return res.json();
  },

  async getDashboardStats() {
    const res = await secureFetch(`/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  async runAudit() {
    const res = await secureFetch(`/audit/run`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to run audit');
    return res.json();
  },

  async getTopProductsByRange(year, fromMonth, toMonth) {
    const res = await secureFetch(`/dashboard/top-products-range?year=${year}&fromMonth=${fromMonth}&toMonth=${toMonth}`);
    if (!res.ok) throw new Error('Failed to fetch top products range');
    return res.json();
  },
};