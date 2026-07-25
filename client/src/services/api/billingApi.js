// client/src/services/api/billingApi.js
import { secureFetch } from './apiCore';

export const billingApi = {
  // Fetches top-level credit limit, outstanding, and this month's billed amount
  async getBillingSummary() {
    const res = await secureFetch(`/billing/summary`);
    if (!res.ok) throw new Error('Failed to fetch billing summary');
    return res.json();
  },

  // Fetches month-by-month buckets of Ordered vs Paid amounts
  async getClientMonthlySummary(clientId) {
    const res = await secureFetch(`/billing/monthly-summary/${clientId}`);
    if (!res.ok) throw new Error('Failed to fetch monthly summary');
    return res.json();
  }
};