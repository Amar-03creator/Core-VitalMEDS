// // src/features/Client/BillingPage/hooks/useClientBillingSummary.js
// import { useState, useEffect, useCallback } from 'react';
// import { financeApi } from '../../../../services/api/financeApi';

// export function useClientBillingSummary(clientId) {
//   const [summary, setSummary] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const refetch = useCallback(async () => {
//     if (!clientId) { setLoading(false); return; }
//     setLoading(true);
//     try {
//       const res = await financeApi.getClientMonthlySummary(clientId);
//       setSummary(res.data || {});
//       setError(null);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }, [clientId]);

//   useEffect(() => { refetch(); }, [refetch]);

//   return { summary, loading, error, refetch };
// }


// src/features/Client/BillingPage/hooks/useClientBillingSummary.js
import { useState, useEffect, useCallback } from 'react';
// ✨ FIX: Switched from financeApi to our new dedicated billingApi
import { billingApi } from '../../../../services/api/billingApi';

export function useClientBillingSummary(clientId) {
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!clientId) { setLoading(false); return; }
    setLoading(true);
    try {
      // ✨ FIX: Pointing to the newly created method
      const res = await billingApi.getClientMonthlySummary(clientId);
      setSummary(res.data || {});
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { summary, loading, error, refetch };
}