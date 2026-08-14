/**
 * ============================================================================
 * FILE: clientApi.js
 * PURPOSE: Customer Management Domain.
 * DESCRIPTION: Contains all API endpoints related to Business Clients (pharmacies/
 * hospitals). Handles profile CRUD, duplicate checking, OTP-based 
 * suspensions, and document verification requests.
 * ============================================================================
 */

// client/src/services/api/clientApi.js
import { secureFetch, BASE_URL } from './apiCore'; // ✨ FIX: Imported BASE_URL for the public route

export const clientApi = {
  async getClients(queryString = '') {
    const url = `/clients${queryString ? `?${queryString}` : ''}`;
    const res = await secureFetch(url);
    if (!res.ok) throw new Error('Failed to fetch clients');
    return res.json();
  },

  async getClientById(id) {
    const res = await secureFetch(`/clients/${id}`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch client');
    return res.json();
  },

  async createClient(payload) {
    const res = await secureFetch(`/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to create client');
    return res.json();
  },

  async updateClient(id, payload) {
    const res = await secureFetch(`/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to update client');
    return res.json();
  },

  async approveClient(id) {
    const res = await secureFetch(`/clients/${id}/approve`, { method: 'PUT' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to approve client');
    return res.json();
  },

  async rejectClient(id, reason) {
    const res = await secureFetch(`/clients/${id}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to reject client');
    return res.json();
  },

  async updateClientStatus(id, status) {
    const res = await secureFetch(`/clients/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to update status');
    return res.json();
  },

  async getClientInvoices(id) {
    const res = await secureFetch(`/clients/${id}/invoices`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch invoices');
    return res.json();
  },

  async getClientPayments(id) {
    const res = await secureFetch(`/clients/${id}/payments`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch payments');
    return res.json();
  },

  async getClientOrders(id) {
    const res = await secureFetch(`/clients/${id}/orders`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch orders');
    return res.json();
  },

  async getClientFilterOptions(line, city) {
    const params = new URLSearchParams();
    if (line) params.set('line', line);
    if (city) params.set('city', city);
    const res = await secureFetch(`/clients/filter-options?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch filter options');
    return res.json();
  },

  /* ── Client Suspension (OTP) ────────────────────────────────────────── */
  async requestSuspendOtp(id) {
    const res = await secureFetch(`/clients/${id}/suspend/request-otp`, { method: 'POST' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to request OTP');
    return res.json();
  },

  async verifySuspendOtp(id, otp, reason) {
    const res = await secureFetch(`/clients/${id}/suspend/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp, reason }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to verify OTP');
    return res.json();
  },

  async reactivateClient(id) {
    const res = await secureFetch(`/clients/${id}/reactivate`, { method: 'PUT' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to reactivate client');
    return res.json();
  },

  /* ── Document Requests ────────────────────────────────────────────────── */
  async createDocumentRequest(clientId, payload) {
    const res = await secureFetch(`/admin/clients/${clientId}/documents/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to send document request');
    return res.json();
  },

  async getActiveDocumentRequests(clientId) {
    const res = await secureFetch(`/clients/${clientId}/document-requests`);
    if (!res.ok) throw new Error('Failed to fetch document requests');
    return res.json();
  },

  async approveRejectDocumentRequest(requestId, status, rejectionNote = '') {
    const res = await secureFetch(`/admin/documents/requests/${requestId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, rejectionNote }),
    });
    if (!res.ok) throw new Error('Failed to process request');
    return res.json();
  },

  async resolveDocumentRequest(clientId, requestId) {
    const res = await secureFetch(`/clients/${clientId}/document-requests/${requestId}/resolve`, { method: 'PUT' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to resolve request');
    return res.json();
  },

  async verifyClientDocument(clientId, documentType, isVerified, rejectionNote = '') {
    const res = await secureFetch(`/admin/clients/${clientId}/documents/verify`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentType, isVerified, rejectionNote }),
    });
    if (!res.ok) throw new Error('Failed to verify document');
    return res.json();
  },

  /* ── Duplicate Checks (standalone) ────────────────────────────────── */
  async checkDuplicate(field, value) {
    const res = await secureFetch(`/clients/duplicates/check?field=${field}&value=${encodeURIComponent(value)}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async checkDrugLicense(license) {
    const res = await secureFetch(`/drug-licenses/check?license=${encodeURIComponent(license)}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async checkPhone(phone) {
    const res = await secureFetch(`/phones/check?phone=${encodeURIComponent(phone)}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  /* ── Notifications ────────────────────────────────────────────────────── */
  async getNotifications(recipientId, unreadOnly = false) {
    const qs = new URLSearchParams({ recipientId });
    if (unreadOnly) qs.set('unreadOnly', 'true');
    const res = await secureFetch(`/notifications?${qs.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markNotificationRead(id) {
    const res = await secureFetch(`/notifications/${id}/read`, { method: 'PUT' });
    if (!res.ok) throw new Error('Failed to mark notification read');
    return res.json();
  },

  async getAdminNotifications() {
    const res = await secureFetch(`/notifications?recipientRole=admin`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },
  
  async markAllAdminNotificationsRead() {
    const res = await secureFetch(`/notifications/mark-all-read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientRole: 'admin' })
    });
    return res.json();
  },

  /* ── Client Notifications ─────────────────────────────────────────────── */
  async getClientNotifications(clientId) {
    const qs = new URLSearchParams({ recipientId: clientId, recipientRole: 'client' });
    const res = await secureFetch(`/notifications?${qs.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markAllClientNotificationsRead() {
    const res = await secureFetch(`/notifications/mark-all-read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientRole: 'client' })
    });
    if (!res.ok) throw new Error('Failed to mark all as read');
    return res.json();
  },
  
  /* ── Admin: Legacy Client Onboarding ────────────────────────────────── */
  async generateClientInvite(clientId) {
    const res = await secureFetch(`/admin/clients/${clientId}/invite-code`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to generate invite code');
    return res.json();
  },

  // Authenticated route for the Dashboard / About Us page
  async getDistributorPublicProfile() {
    const res = await secureFetch(`/clients/distributor-profile`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch distributor profile');
    return res.json();
  },

  // ✨ NEW: Completely unauthenticated, raw fetch specifically for the Landing Page
  async getPublicContactInfo() {
    const res = await fetch(`${BASE_URL}/clients/public-contact`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch public contact info');
    return res.json();
  }
};