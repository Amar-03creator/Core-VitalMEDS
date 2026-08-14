import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../../../services/api';

export const useCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState(() => sessionStorage.getItem('companySearch') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      sessionStorage.setItem('companySearch', search);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // In the future, you can pass ?search=debouncedSearch to the backend
      const res = await api.getCompanies();
      setCompanies(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load companies');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  // Frontend filtering (until backend search is implemented)
  const filtered = useMemo(() => {
    if (!debouncedSearch) return companies;
    const s = debouncedSearch.toLowerCase();
    return companies.filter(c =>
      c.companyName?.toLowerCase().includes(s) ||
      c.shortCode?.toLowerCase().includes(s) ||
      c.city?.toLowerCase().includes(s)
    );
  }, [companies, debouncedSearch]);

  return {
    companies: filtered,
    totalCount: companies.length,
    loading,
    error,
    search,
    setSearch,
    refetch: fetchCompanies,
  };
};