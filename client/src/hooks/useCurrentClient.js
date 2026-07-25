// src/hooks/useCurrentClient.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const getClientId = () => localStorage.getItem('clientId');

const isSameCalendarDay = (a, b) => {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

export function useCurrentClient() {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    const clientId = getClientId();
    if (!clientId) {
      setLoading(false);
      setError('No logged-in client found.');
      return;
    }
    
    setLoading(true);
    try {
      const res = await api.getClientById(clientId);
      // Depending on your backend response structure, it might be nested in `data`
      setClient(res.data || res);
      setError(null);
    } catch (err) {
      console.error("Fetch client error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    refetch(); 
  }, [refetch]);

  /* ── REAL PRODUCTION RETURN ─────────────────────────────────────────── */
  return {
    client,
    clientId: client?._id || getClientId(),
    
    // Gating strictly enforced by MongoDB 'status' field
    isApproved: !!client?.isApproved,
    isSuspended: !!client?.isSuspended,
    
    // Financials pulled directly from the client document
    creditLimit: client?.creditLimit || 0,
    totalOutstanding: client?.totalOutstanding || 0,
    
    // Inquiry gating based on exact timestamp in DB
    hasSentInquiryToday: isSameCalendarDay(client?.lastInquiryDate, new Date()),
    
    loading,
    error,
    refetch,
  };
}