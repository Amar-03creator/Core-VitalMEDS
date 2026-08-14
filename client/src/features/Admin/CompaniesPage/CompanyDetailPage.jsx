import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCompanyDetail } from './hooks/useCompanyDetail';
import { CompanyCardContent } from './components/CompanyCard';
import { COMPANY_DETAIL_TABS } from './utils/constants';
import { ProfileTab } from './tabs/ProfileTab';
import { PurchaseBillsTab } from './tabs/PurchaseBillsTab';
import { DebitNotesTab } from './tabs/DebitNotesTab';
import { ReplenishmentTab } from './tabs/ReplenishmentTab';
import { useBackHandler } from '../../../hooks/useBackHandler';

export const CompanyDetailPage = ({ companyId, initialCompany, onBack, onAddPurchaseBill, billsRefreshKey }) => {
  const { company, setCompany, loading, error, activeTab, setActiveTab, refetch } = useCompanyDetail(companyId);

  useBackHandler(
    activeTab !== 'profile',
    () => setActiveTab('profile'),
    `companyTab_${companyId}`
  );

  const displayCompany = company || initialCompany;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      // ✨ Added pt-[2px] so the white box drops 2px, but the blurred backdrop stays flush!
      className="h-full flex flex-col bg-slate-900/10 absolute inset-0 z-10 backdrop-blur-[2px] pt-[2px]"
    >
      
      {/* The constrained container matching the list view width */}
      <div className="max-w-2xl mx-auto w-full h-full flex flex-col bg-white shadow-2xl border-x border-slate-200 relative overflow-hidden">
        
        {/* HEADER */}
        <div className="shrink-0 bg-white shadow-sm z-20">
          <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-100">
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
              <ArrowLeft size={18} className="text-slate-600" />
            </button>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Supplier Details</span>
          </div>

          {displayCompany ? (
            <motion.div layoutId={`company-card-${displayCompany._id}`} className="bg-white">
              <CompanyCardContent company={displayCompany} />
            </motion.div>
          ) : (
            <div className="h-24 flex items-center justify-center">
               <div className="animate-spin w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full" />
            </div>
          )}

          <div className="flex overflow-x-auto border-t border-slate-100 px-2" style={{ scrollbarWidth: 'none' }}>
            {COMPANY_DETAIL_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors shrink-0 ${activeTab === key ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 bg-slate-50">
          {error && (
            <div className="text-center py-10">
              <p className="text-red-500">{error}</p>
              <button onClick={refetch} className="mt-2 text-slate-500 underline font-semibold">Retry</button>
            </div>
          )}

          {company && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              {activeTab === 'profile' && <ProfileTab company={company} onCompanyUpdated={setCompany} />}
              {activeTab === 'bills' && <PurchaseBillsTab company={company} onAddBill={() => onAddPurchaseBill?.(company)} refreshKey={billsRefreshKey} />}
              {activeTab === 'debitNotes' && <DebitNotesTab company={company} onCompanyUpdated={setCompany} />}
              {activeTab === 'replenishment' && <ReplenishmentTab company={company} />}
            </motion.div>
          )}
        </div>

      </div>
    </motion.div>
  );
};