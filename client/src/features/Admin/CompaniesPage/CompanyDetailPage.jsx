import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';
import { COMPANY_DETAIL_TABS } from './utils/constants';
import { ProfileTab } from './tabs/ProfileTab';
import { PurchaseBillsTab } from './tabs/PurchaseBillsTab';
import { DebitNotesTab } from './tabs/DebitNotesTab';
import { ReplenishmentTab } from './tabs/ReplenishmentTab';

/**
 * CompanyDetailPage
 * The "360° View" — header + tab shell. Each tab is its own small
 * component (per the decomposition requirement); this file only
 * orchestrates which one is visible and owns the shared `company` state
 * so all tabs see fresh data after edits.
 */
export const CompanyDetailPage = ({ companyId, onBack, onAddPurchaseBill, billsRefreshKey }) => {
  const [company, setCompany] = useState(null);
  const [allCompanies, setAllCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  const fetchCompany = async () => {
    try {
      const res = await api.getCompanyById(companyId);
      setCompany(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load company');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
    api.getCompanies().then(res => setAllCompanies(res.data || [])).catch(() => {});
  }, [companyId]);

  if (loading) {
    return <p className="py-10 text-center text-slate-500 text-base">Loading supplier…</p>;
  }

  if (!company) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-slate-500 text-base mb-3">Supplier not found.</p>
        <button onClick={onBack} className="text-emerald-600 font-semibold">← Back to Companies</button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100">
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div className="min-w-0">
          <h1 className="text-slate-900 text-lg font-bold truncate">{company.companyName}</h1>
          <p className="text-slate-500 text-sm">{company.shortCode || 'Supplier'} · {company.status}</p>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 overflow-x-auto">
        {COMPANY_DETAIL_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 whitespace-nowrap px-3 py-2 rounded-xl text-sm font-semibold transition-all
              ${activeTab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <ProfileTab company={company} onCompanyUpdated={setCompany} />
      )}
      {activeTab === 'bills' && (
        <PurchaseBillsTab company={company} onAddBill={() => onAddPurchaseBill?.(company)} refreshKey={billsRefreshKey} />
      )}
      {activeTab === 'debitNotes' && (
        <DebitNotesTab company={company} onCompanyUpdated={setCompany} />
      )}
      {activeTab === 'replenishment' && (
        <ReplenishmentTab company={company} allCompanies={allCompanies} />
      )}
    </div>
  );
};