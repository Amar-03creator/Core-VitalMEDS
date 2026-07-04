import { useState, useEffect } from 'react';
import { FileText, Wallet, BookOpen, Building2 } from 'lucide-react';
import { InvoicesTab } from '../../features/Admin/BillingPage/components/InvoicesTab';
import { PaymentsTab } from '../../features/Admin/BillingPage/components/PaymentsTab';
import { LedgersTab } from '../../features/Admin/BillingPage/components/LedgersTab'; 
import { PurchasesTab } from '../../features/Admin/BillingPage/components/PurchasesTab';
import { GSTModal } from '../../features/Admin/BillingPage/modals/GSTModal';
import { MakeInvoiceModal } from '../../modals/MakeInvoiceModal';

const STORAGE_KEY = 'billingActiveTab';

const BillingPage = () => {
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    // Safety fallback: if the browser remembers the old deleted tabs, route to the new one
    if (saved === 'aging' || saved === 'ledger') return 'ledgers';
    return saved || 'invoices';
  });

  const [showGST, setShowGST] = useState(false);
  const [showMakeInvoice, setShowMakeInvoice] = useState(false);

  // Persist active tab
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, activeTab);
  }, [activeTab]);

  // ★ FIXED: Removed aging, kept ledgers
  const tabs = [
    { key: 'invoices', label: 'Invoices', icon: FileText },
    { key: 'payments', label: 'Payments', icon: Wallet },
    { key: 'ledgers', label: 'Ledgers', icon: BookOpen },
    { key: 'purchases', label: 'Purchases', icon: Building2 },
  ];

  return (
    <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-slate-900 text-2xl font-bold">Billing Hub</h1>
        <p className="text-slate-500 text-base">Invoices, payments & outstanding</p>
      </div>

      {/* ★ FIXED: Changed to grid-cols-4 for the 4 tabs */}
      <div className="grid grid-cols-4 gap-1 bg-slate-100 rounded-2xl p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex flex-col items-center gap-0.5 py-2 rounded-xl text-sm font-semibold transition-all
              ${activeTab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'invoices' && <InvoicesTab onGST={() => setShowGST(true)} onMakeInvoice={() => setShowMakeInvoice(true)} />}
      {activeTab === 'payments' && <PaymentsTab />}
      {/* ★ FIXED: Render the new unified tab */}
      {activeTab === 'ledgers' && <LedgersTab />}
      {activeTab === 'purchases' && <PurchasesTab />}

      {showGST && <GSTModal onClose={() => setShowGST(false)} />}
      {showMakeInvoice && <MakeInvoiceModal onClose={() => setShowMakeInvoice(false)} />}
    </div>
  );
};

export default BillingPage;