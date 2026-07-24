// src/features/Client/BillingPage/hooks/useClientPayments.js
import { useState, useEffect, useCallback } from 'react';
import { clientApi } from '../../../../services/api/clientApi';

export function useClientPayments(clientId) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!clientId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await clientApi.getClientPayments(clientId);
      setPayments(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { payments, loading, error, refetch };
}