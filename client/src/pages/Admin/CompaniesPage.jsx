import { useState } from 'react';
import { CompaniesListView } from '../../features/Admin/CompaniesPage/CompaniesListView';
import { CompanyDetailPage } from '../../features/Admin/CompaniesPage/CompanyDetailPage';
import { PurchaseEntryModal } from '../../modals/AddPurchaseBillModal/PurchaseEntryModal';
import { api } from '../../services/api';
import { toast } from 'sonner';

const CompaniesPage = () => {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showPurchaseEntry, setShowPurchaseEntry] = useState(false);
  const [billsRefreshKey, setBillsRefreshKey] = useState(0);

  // ★ NEW — needed by PurchaseEntryModal's `companies` prop. Fetched the
  // exact same way PurchasesTab.jsx does (mapping _id -> id), since that's
  // the shape the modal's internal `.find(c => c.id === ...)` lookups expect.
  const [purchaseModalCompanies, setPurchaseModalCompanies] = useState([]);

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
      toast.error('Failed to load suppliers for purchase entry');
    }
  };

  const handleAddPurchaseBill = async () => {
    await fetchCompaniesForPurchaseModal();
    setShowPurchaseEntry(true);
  };

  // If a company is selected, show the detail view
  if (selectedCompany) {
    return (
      <>
        <CompanyDetailPage
          companyId={selectedCompany._id}
          onBack={() => setSelectedCompany(null)}
          onAddPurchaseBill={handleAddPurchaseBill}
          billsRefreshKey={billsRefreshKey}
        />

        {showPurchaseEntry && (
          <PurchaseEntryModal
            onClose={() => {
              setShowPurchaseEntry(false);
              setBillsRefreshKey(k => k + 1);
            }}
            companies={purchaseModalCompanies}
            onCompanyAdded={fetchCompaniesForPurchaseModal}
            onProductAdded={() => {}}
            lockedSupplierId={selectedCompany._id}
          />
        )}
      </>
    );
  }

  // Otherwise show the list view
  return (
    <CompaniesListView
      onSelectCompany={(company) => setSelectedCompany(company)}
    />
  );
};

export default CompaniesPage;