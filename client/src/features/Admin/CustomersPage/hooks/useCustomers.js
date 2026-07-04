// customers/hooks/useCustomers.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../../../services/api';
import { INITIAL_FILTER_STATE } from '../utils/constants';

export const useCustomers = () => {

  const loadFilters = () => {
    try {
      const saved = sessionStorage.getItem('customerListFilters');
      return saved ? JSON.parse(saved) : INITIAL_FILTER_STATE;
    } catch { return INITIAL_FILTER_STATE; }
  };

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState(loadFilters);
  const [pendingFilters, setPendingFilters] = useState(loadFilters);

  useEffect(() => {
    sessionStorage.setItem('customerListFilters', JSON.stringify(filters));
  }, [filters]);

  // Derived option lists for city + line dropdowns (built from live data)
  const cityOptions = useMemo(() =>
    [...new Set(customers.map(c => c.city).filter(Boolean))].sort(),
    [customers]);

  const lineOptions = useMemo(() =>
    [...new Set(customers.map(c => c.line || c.deliveryRoute).filter(Boolean))].sort(),
    [customers]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filters.status?.length) params.set('status', filters.status.join(','));
      if (filters.businessType?.length) params.set('businessType', filters.businessType.join(','));
      if (filters.tier?.length) params.set('tier', filters.tier.join(','));
      if (filters.riskTier?.length) params.set('riskTier', filters.riskTier.join(','));
      if (filters.cities?.length) params.set('cities', filters.cities.join(','));
      if (filters.lines?.length) params.set('lines', filters.lines.join(','));
      if (filters.scoreRange && filters.scoreRange !== 'All') {
        // Replace en-dash '–' with hyphen before splitting (safe cross-OS)
        const [min, max] = filters.scoreRange.replace('–', '-').split('-').map(Number);
        if (!isNaN(min)) params.set('minScore', min);
        if (!isNaN(max)) params.set('maxScore', max);
      }

      // api.getClients returns { success, count, data: [...] }
      const res = await api.getClients(params.toString());
      setCustomers(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err.message);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const kpis = useMemo(() => ({
    active: customers.filter(c => c.status === 'Active').length,
    pending: customers.filter(c => c.status === 'Pending').length,
    concerned: customers.filter(c => c.status === 'Credit Alert').length,
    outstanding: customers.reduce((s, c) => s + (c.totalOutstanding || 0), 0),
  }), [customers]);

  const applyFilters = () => setFilters({ ...pendingFilters });
  const resetFilters = () => {
    setPendingFilters(INITIAL_FILTER_STATE);
    setFilters(INITIAL_FILTER_STATE);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status) count += filters.status.length;
    if (filters.businessType) count += filters.businessType.length;
    if (filters.tier) count += filters.tier.length;
    if (filters.riskTier) count += filters.riskTier.length;
    if (filters.cities) count += filters.cities.length;
    if (filters.lines) count += filters.lines.length;
    if (filters.scoreRange && filters.scoreRange !== 'All') count += 1;
    return count;
  }, [filters]);

  return {
    customers, loading, error,
    search, setSearch,
    filters, pendingFilters, setPendingFilters,
    applyFilters, resetFilters, activeFilterCount,
    kpis, cityOptions, lineOptions,
    refetch: fetchCustomers,
  };
};