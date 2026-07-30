// src/pages/Client/ClientBillingPage.jsx
import { useState } from 'react';
import { useCurrentClient } from '../../hooks/useCurrentClient';
import SummaryTab from '../../features/Client/BillingPage/tabs/SummaryTab';
import InvoicesTab from '../../features/Client/BillingPage/tabs/InvoicesTab';
import PaymentsTab from '../../features/Client/BillingPage/tabs/PaymentsTab';
import CreditTab from '../../features/Client/BillingPage/tabs/CreditTab';
import LedgerTab from '../../features/Client/BillingPage/tabs/LedgerTab';

const TABS = [
  { key: 'summary', label: 'Summary' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'payments', label: 'Payments' },
  { key: 'credit', label: 'Credit' },
  { key: 'ledger', label: 'Ledger' },
];

const ClientBillingPage = () => {
  const { client, loading, error, refetch } = useCurrentClient();
  const [activeTab, setActiveTab] = useState('summary');

  return (
    <div className="max-w-3xl mx-auto">
      <div className="px-4 sm:px-6 pt-5 pb-2">
        <h1 className="text-slate-900 text-2xl sm:text-3xl font-bold">Billing</h1>
        <p className="text-slate-500 text-base sm:text-lg mt-0.5">Your invoices, payments, and account ledger</p>
      </div>

      <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-5 py-3 text-base sm:text-lg font-semibold whitespace-nowrap border-b-2 transition-colors shrink-0 ${
              activeTab === key ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-4 sm:px-6 py-5">
        {loading && !client ? (
          <p className="text-slate-400 text-base sm:text-lg text-center py-16">Loading…</p>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-500 text-base sm:text-lg">{error}</p>
            <button onClick={refetch} className="text-slate-500 text-sm sm:text-base underline mt-2">Retry</button>
          </div>
        ) : (
          <>
            {activeTab === 'summary' && <SummaryTab client={client} />}
            {activeTab === 'invoices' && <InvoicesTab client={client} />}
            {activeTab === 'payments' && <PaymentsTab client={client} />}
            {activeTab === 'credit' && <CreditTab />}
            {activeTab === 'ledger' && <LedgerTab client={client} />}
          </>
        )}
      </div>
    </div>
  );
};

export default ClientBillingPage;