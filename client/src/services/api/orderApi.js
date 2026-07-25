/**
 * ============================================================================
 * FILE: orderApi.js
 * PURPOSE: Order & Inquiry Fulfillment Domain.
 * DESCRIPTION: Manages the entire B2B sales lifecycle. Handles the transition 
 * from initial Inquiries (RFQs) to admin Quotes, and finally to 
 * Placed, Shipped, and Delivered Orders.
 * ============================================================================
 */

// client/src/services/api/orderApi.js
import { secureFetch } from './apiCore';

export const orderApi = {
  /* ── Inquiries (RFQ) ─────────────────────────────────────────────────── */
  async createInquiry(data) {
    const res = await secureFetch(`/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to send inquiry');
    return res.json();
  },

  async getInquiries(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
    const res = await secureFetch(`/inquiries${qs.toString() ? `?${qs.toString()}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch inquiries');
    return res.json();
  },

  async getInquiryById(id) {
    const res = await secureFetch(`/inquiries/${id}`);
    if (!res.ok) throw new Error('Failed to fetch inquiry');
    return res.json();
  },

  async deleteInquiry(id) {
    const res = await secureFetch(`/inquiries/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to delete inquiry');
    return res.json();
  },

  async rejectInquiryQuote(id, reason) {
    const res = await secureFetch(`/inquiries/${id}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to reject quote');
    return res.json();
  },

  async markInquiryViewed(id) {
    const res = await secureFetch(`/inquiries/${id}/viewed`, { method: 'PUT' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to mark inquiry viewed');
    return res.json();
  },

  async sendInquiryQuote(id, data) {
    const res = await secureFetch(`/inquiries/${id}/quote`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to send quote');
    return res.json();
  },

  /* ── Orders ───────────────────────────────────────────────────────────── */
  async createOrder(data) {
    const res = await secureFetch(`/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to place order');
    return res.json();
  },

  async convertInquiryToOrder(inquiryId, clientNote) {
    const res = await secureFetch(`/orders/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inquiryId, clientNote }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to convert inquiry to order');
    return res.json();
  },

  async startEditOrder(id) {
    const res = await secureFetch(`/orders/${id}/start-edit`, { method: 'POST' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to start editing this order');
    return res.json();
  },

  async cancelEditOrder(id) {
    const res = await secureFetch(`/orders/${id}/cancel-edit`, { method: 'POST' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to cancel editing this order');
    return res.json();
  },

  async updateOrder(id, data) {
    const res = await secureFetch(`/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to update order');
    return res.json();
  },

  async confirmOrder(id) {
    const res = await secureFetch(`/orders/${id}/confirm`, { method: 'PUT' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to confirm order');
    return res.json();
  },

  async packOrder(id) {
    const res = await secureFetch(`/orders/${id}/pack`, { method: 'PUT' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to mark packed');
    return res.json();
  },

  async shipOrder(id, dispatchDetails) {
    const res = await secureFetch(`/orders/${id}/ship`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dispatchDetails }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to mark order shipped');
    return res.json();
  },

  async cancelInvoice(id, reason) {
    const res = await secureFetch(`/orders/${id}/cancel-invoice`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to cancel invoice');
    return res.json();
  },

  async sharePricing(id) {
    const res = await secureFetch(`/orders/${id}/share-pricing`, { method: 'PUT' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to share pricing');
    return res.json();
  },

  async getOrders(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
    const res = await secureFetch(`/orders${qs.toString() ? `?${qs.toString()}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async getOrderById(id) {
    const res = await secureFetch(`/orders/${id}`);
    if (!res.ok) throw new Error('Failed to fetch order');
    return res.json();
  },

  async cancelOrder(id, reason, cancelledBy = 'client') {
    const res = await secureFetch(`/orders/${id}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, cancelledBy }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to cancel order');
    return res.json();
  },

  async confirmOrderDelivery(id) {
    const res = await secureFetch(`/orders/${id}/deliver`, { method: 'PUT' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to confirm delivery');
    return res.json();
  },

  async downloadOrderInvoice(orderId) {
    const res = await secureFetch(`/orders/${orderId}/invoice/pdf`);
    if (!res.ok) throw new Error('Failed to download invoice');
    return res.blob();
  },
};