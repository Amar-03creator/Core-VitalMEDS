// src/features/Client/BillingPage/hooks/useClientInvoices.js
import { useState, useEffect, useCallback } from 'react';
import { clientApi } from '../../../../services/api/clientApi';

export function useClientInvoices(clientId) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!clientId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await clientApi.getClientInvoices(clientId);
      setInvoices(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { invoices, loading, error, refetch };
}