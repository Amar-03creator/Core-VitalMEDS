// src/features/Admin/CustomersPage/hooks/useCustomerDetail.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../../services/api';

const getTabKey = (clientId) => `custDetailTab_${clientId}`;

export const useCustomerDetail = (clientId) => {
  const [client,    setClient]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    return clientId ? sessionStorage.getItem(getTabKey(clientId)) || 'overview' : 'overview';
  });

  // null = not yet fetched, [] = fetched but empty
  const [invoices, setInvoices] = useState(null);
  const [payments, setPayments] = useState(null);
  const [orders,   setOrders]   = useState(null);

  // Persist active tab whenever it changes
  useEffect(() => {
    if (clientId) {
      sessionStorage.setItem(getTabKey(clientId), activeTab);
    }
  }, [activeTab, clientId]);

  // ── Core client — shows error in UI, not as a toast ──────────────
  const fetchClient = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getClientById(clientId);
      setClient(res?.data ?? null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetchClient(); }, [fetchClient]);

  // ── Tab fetchers — silent failure, no toast (FIX 5) ─────────────
  const fetchInvoices = useCallback(async () => {
    if (!clientId) return;
    try {
      const res = await api.getClientInvoices(clientId);
      setInvoices(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setInvoices([]);
    }
  }, [clientId]);

  const fetchPayments = useCallback(async () => {
    if (!clientId) return;
    try {
      const res = await api.getClientPayments(clientId);
      setPayments(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setPayments([]);
    }
  }, [clientId]);

  const fetchOrders = useCallback(async () => {
    if (!clientId) return;
    try {
      const res = await api.getClientOrders(clientId);
      setOrders(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setOrders([]);
    }
  }, [clientId]);

  // Lazy-load on first tab visit
  useEffect(() => {
    if (activeTab === 'invoices' && invoices === null) fetchInvoices();
    if (activeTab === 'payments' && payments === null) fetchPayments();
    if (activeTab === 'orders'   && orders   === null) fetchOrders();
  }, [activeTab, invoices, payments, orders, fetchInvoices, fetchPayments, fetchOrders]);

  return {
    client, loading, error, setClient,
    activeTab, setActiveTab,
    invoices, payments, orders,
    refetch:         fetchClient,
    refetchInvoices: fetchInvoices,
    refetchPayments: fetchPayments,
    refetchOrders:   fetchOrders,
  };
};