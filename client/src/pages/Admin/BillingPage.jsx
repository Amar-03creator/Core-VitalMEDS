import { useState } from 'react';
import { FileText, Wallet, BarChart2, BookOpen, Building2 } from 'lucide-react';
import { InvoicesTab } from '../../components/Admin/BillingPage/InvoicesTab';
import { PaymentsTab } from '../../components/Admin/BillingPage/PaymentsTab';
import { AgingTab } from '../../components/Admin/BillingPage/AgingTab';
import { PartyLedgerTab } from '../../components/Admin/BillingPage/PartyLedgerTab';
import { PurchasesTab } from '../../components/Admin/BillingPage/PurchasesTab';
import { GSTModal } from '../../components/Admin/BillingPage/modals/GSTModal';
import { MakeInvoiceModal } from '../../components/Admin/BillingPage/modals/MakeInvoiceModal';

const BillingPage = () => {
  const [activeTab, setActiveTab] = useState('invoices');
  const [showGST, setShowGST] = useState(false);
  const [showMakeInvoice, setShowMakeInvoice] = useState(() => {
    try {
      const saved = sessionStorage.getItem('makeInvoiceState');
      return !!saved; // if there is any saved state, open the modal
    } catch {
      return false;
    }
  });


  const tabs = [
    { key: 'invoices', label: 'Invoices', icon: FileText },
    { key: 'payments', label: 'Payments', icon: Wallet },
    { key: 'aging', label: 'Aging', icon: BarChart2 },
    { key: 'ledger', label: 'Ledger', icon: BookOpen },
    { key: 'purchases', label: 'Purchases', icon: Building2 },
  ];

  return (
    <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-slate-900 text-2xl font-bold">Billing Hub</h1>
        <p className="text-slate-500 text-base">Invoices, payments & outstanding</p>
      </div>

      {/* Fixed grid: 5 equal columns, always shows all tabs with labels */}
      <div className="grid grid-cols-5 gap-1 bg-slate-100 rounded-2xl p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex flex-col items-center gap-0.5 py-2 rounded-xl text-sm font-semibold transition-all
              ${activeTab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'invoices' && <InvoicesTab onGST={() => setShowGST(true)} onMakeInvoice={() => setShowMakeInvoice(true)} />}
      {activeTab === 'payments' && <PaymentsTab />}
      {activeTab === 'aging' && <AgingTab />}
      {activeTab === 'ledger' && <PartyLedgerTab />}
      {activeTab === 'purchases' && <PurchasesTab />}

      {showGST && <GSTModal onClose={() => setShowGST(false)} />}
      {showMakeInvoice && <MakeInvoiceModal onClose={() => setShowMakeInvoice(false)} />}
    </div>
  );
};

export default BillingPage;