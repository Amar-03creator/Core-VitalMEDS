// src/hooks/useCurrentClient.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

/**
 * NOTE — placeholder auth wiring: this reads the logged-in client's id
 * from localStorage('clientId'), since there's no AuthContext in what's
 * been shared so far. Swap the `getClientId()` body below for however
 * your login flow actually stores the session (JWT decode, a real
 * AuthContext, etc.) — nothing else in this hook, or in the components
 * that consume it, needs to change.
 */
const getClientId = () => localStorage.getItem('clientId');

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
      setClient(res.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  // return {
  //   client,
  //   clientId: client?._id || getClientId(),
  //   // Client.js exposes these as virtuals (status === 'Active' / 'Suspended')
  //   // — see server/src/models/Client.js.
  //   isApproved: !!client?.isApproved,
  //   isSuspended: !!client?.isSuspended,
  //   creditLimit: client?.creditLimit || 0,
  //   totalOutstanding: client?.totalOutstanding || 0,
  //   loading,
  //   error,
  //   refetch,
  // };

  return {
    client,
    clientId: client?._id || getClientId(),
    // MOCKED FOR DEMO: Hardcoding to true so you can access Order tabs
    isApproved: true,
    isSuspended: false,
    creditLimit: client?.creditLimit || 500000, // Optional: Give yourself a fake credit limit to test
    totalOutstanding: client?.totalOutstanding || 0,
    loading,
    error,
    refetch,
  };
}