/**
 * ============================================================================
 * FILE: adminApi.js
 * PURPOSE: Admin Profile & Security Vault Domain.
 * DESCRIPTION: Handles fetching the admin profile, updating legal info, 
 * triggering Cognito invites for Competent Persons, and handling 
 * the highly secure MFA Vault verifications.
 * ============================================================================
 */

import { secureFetch } from './apiCore';

export const adminApi = {
  // Fetch the current admin's profile, role, and vault lock status
  async getAdminProfile() {
    const res = await secureFetch(`/admin/me`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch admin profile');
    return res.json();
  },

  // Update standard profile details (within 72h grace period)
  async updateAdminProfile(payload) {
    const res = await secureFetch(`/admin/me/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to update profile');
    return res.json();
  },

  // Update business legal info (GSTIN, DrugsBazaar, Drug Licenses)
  async updateLegalInfo(payload) {
    const res = await secureFetch(`/admin/me/legal`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to update legal info');
    return res.json();
  },

  // Verify Cognito password to unlock the Vault and apply changes
  async verifyVaultChange(payload) {
    const res = await secureFetch(`/admin/me/vault/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Vault authorization failed');
    return res.json();
  },

  // Send an AWS Cognito invite to a new/returning Competent Person
  async inviteCompetentPerson() {
    const res = await secureFetch(`/admin/me/cp/invite`, { method: 'POST' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to send invite');
    return res.json();
  },

  // Precheck if an email is already in use
  async precheckAdminContact(email) {
    const res = await secureFetch(`/admin/me/contact/precheck`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Email check failed');
    return res.json();
  },

  // Update basic contact details
  async updateAdminContact(payload) {
    const res = await secureFetch(`/admin/me/contact`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to update contact');
    return res.json();
  }
};