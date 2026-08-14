import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../../services/api';

const getTabKey = (id) => `companyDetailTab_${id}`;

export const useCompanyDetail = (companyId) => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState(() => {
    return companyId ? sessionStorage.getItem(getTabKey(companyId)) || 'profile' : 'profile';
  });

  // Persist tab state across reloads
  useEffect(() => {
    if (companyId) sessionStorage.setItem(getTabKey(companyId), activeTab);
  }, [activeTab, companyId]);

  const fetchCompany = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCompanyById(companyId);
      setCompany(res?.data ?? null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetchCompany(); }, [fetchCompany]);

  return {
    company, 
    setCompany,
    loading, 
    error,
    activeTab, 
    setActiveTab,
    refetch: fetchCompany,
  };
};