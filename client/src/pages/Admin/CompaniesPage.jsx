import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';

import { CompaniesListView } from '../../features/Admin/CompaniesPage/CompaniesListView';
import { CompanyDetailPage } from '../../features/Admin/CompaniesPage/CompanyDetailPage';
import { PurchaseEntryModal } from '../../modals/AddPurchaseBillModal/PurchaseEntryModal';
import { api } from '../../services/api';
import { useBackHandler } from '../../hooks/useBackHandler';

const CompaniesPage = () => {
  // Store the ID for F5 reloads
  const [selectedCompanyId, setSelectedCompanyId] = useState(() => {
    return sessionStorage.getItem('selectedCompanyId') || null;
  });
  
  // Store the full object temporarily just to make the animation perfectly smooth
  const [initialCompanyData, setInitialCompanyData] = useState(null);

  const [showPurchaseEntry, setShowPurchaseEntry] = useState(false);
  const [billsRefreshKey, setBillsRefreshKey] = useState(0);
  const [purchaseModalCompanies, setPurchaseModalCompanies] = useState([]);

  useEffect(() => {
    if (selectedCompanyId) sessionStorage.setItem('selectedCompanyId', selectedCompanyId);
    else sessionStorage.removeItem('selectedCompanyId');
  }, [selectedCompanyId]);

  useEffect(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

  useBackHandler(
    !!selectedCompanyId,
    () => {
      setSelectedCompanyId(null);
      setInitialCompanyData(null);
    },
    'companyDetailView'
  );

  const fetchCompaniesForPurchaseModal = async () => {
    try {
      const res = await api.getCompanies();
      setPurchaseModalCompanies((res.data || []).map(c => ({
        id: c._id,
        companyName: c.companyName,
        billingAddress: c.billingAddress || '',
        gstin: c.gstin || '',
        city: c.city || '',
        state: c.state || '',
        pincode: c.pincode || '',
      })));
    } catch {
      toast.error('Failed to load suppliers');
    }
  };

  const handleAddPurchaseBill = async () => {
    await fetchCompaniesForPurchaseModal();
    setShowPurchaseEntry(true);
  };

  const closeDetail = () => {
    setSelectedCompanyId(null);
    setInitialCompanyData(null);
  };

  return (
    <>
      {/* ✨ NEW: AnimatePresence allows components to animate as they mount/unmount */}
      <AnimatePresence mode="wait">
        {selectedCompanyId ? (
          <CompanyDetailPage
            key="detail"
            companyId={selectedCompanyId}
            initialCompany={initialCompanyData}
            onBack={closeDetail}
            onAddPurchaseBill={handleAddPurchaseBill}
            billsRefreshKey={billsRefreshKey}
          />
        ) : (
          <CompaniesListView
            key="list"
            onSelectCompany={(company) => {
              setInitialCompanyData(company);
              setSelectedCompanyId(company._id);
            }}
          />
        )}
      </AnimatePresence>

      {showPurchaseEntry && (
        <PurchaseEntryModal
          onClose={() => {
            setShowPurchaseEntry(false);
            setBillsRefreshKey(k => k + 1);
          }}
          companies={purchaseModalCompanies}
          onCompanyAdded={fetchCompaniesForPurchaseModal}
          onProductAdded={() => {}}
          lockedSupplierId={selectedCompanyId}
        />
      )}
    </>
  );
};

export default CompaniesPage;