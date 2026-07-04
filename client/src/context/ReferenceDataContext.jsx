// src/context/ReferenceDataContext.jsx
import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

const ReferenceDataContext = createContext(null);

const mapCompany = (c) => ({
  id: c._id, _id: c._id, companyName: c.companyName,
  billingAddress: c.billingAddress || '', gstin: c.gstin || '',
  city: c.city || '', state: c.state || '', pincode: c.pincode || '',
});

export const ReferenceDataProvider = ({ children }) => {
  const [companies, setCompanies] = useState([]);

  const refetchCompanies = useCallback(async () => {
    const res = await api.getCompanies();
    const mapped = (res.data || []).map(mapCompany);
    setCompanies(mapped);
    return mapped;
  }, []);

  // Called the INSTANT AddCompanyModal's API call resolves — no second
  // network round trip, so every consumer of `companies` re-renders in
  // the same tick, regardless of how deeply nested that consumer is.
  const addCompanyOptimistic = useCallback((created) => {
    setCompanies(prev =>
      prev.some(c => c._id === created._id) ? prev : [...prev, mapCompany(created)]
    );
  }, []);

  useEffect(() => { refetchCompanies(); }, [refetchCompanies]);

  return (
    <ReferenceDataContext.Provider value={{ companies, refetchCompanies, addCompanyOptimistic }}>
      {children}
    </ReferenceDataContext.Provider>
  );
};

export const useReferenceData = () => {
  const ctx = useContext(ReferenceDataContext);
  if (!ctx) throw new Error('useReferenceData must be used within ReferenceDataProvider');
  return ctx;
};