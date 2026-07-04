// client/src/features/Admin/CustomersPage/detail/CustomerDetailPage.jsx
import { useState } from 'react';
import { Edit, UserX, ShieldCheck } from 'lucide-react';   // keep imports for modals
import { useCustomerDetail } from '../hooks/useCustomerDetail';
import { SuspendOtpModal }   from '../modals/SuspendOtpModal'; // ✨ NEW: Using the secure OTP modal
import { EditCustomerModal } from '../modals/EditCustomerModal';
import { CardContent }       from '../components/CustomerCard';
import { STATUS_CFG }        from '../utils/constants';
import { OverviewTab }  from './tabs/OverviewTab';
import { InvoicesTab }  from './tabs/InvoicesTab';
import { PaymentsTab }  from './tabs/PaymentsTab';
import { LedgerTab }    from './tabs/LedgerTab';
import { OrdersTab }    from './tabs/OrdersTab';
import { useBackHandler } from '../../../../hooks/useBackHandler';
import { api } from '@/services/api';
import { toast } from 'sonner';

const TABS = [
  { key: 'overview', label: 'Overview'  },
  { key: 'orders',   label: 'Orders'    },
  { key: 'invoices', label: 'Invoices'  },
  { key: 'payments', label: 'Payments'  },
  { key: 'ledger',   label: 'Ledger'    },
];

export const CustomerDetailPage = ({
  clientId,
  customer,
  onListChange, // Callback to notify parent list of changes (e.g., suspension)
}) => {
  const {
    client, loading, error,
    activeTab, setActiveTab,
    invoices, payments, orders,
    refetch, refetchInvoices, refetchPayments,
  } = useCustomerDetail(clientId);

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [editOpen,    setEditOpen]    = useState(false);

  useBackHandler(
    activeTab !== 'overview', 
    () => setActiveTab('overview'), 
    `tab_${clientId}` // Static ID so it survives F5 reloads!
  );

  const displayClient = client || customer;

  // ✨ NEW: Check if the account is currently suspended
  const isSuspended = displayClient?.status === 'Suspended';
  const [reactivating, setReactivating] = useState(false);

  const handleReactivate = async () => {
    if (reactivating) return;
    setReactivating(true);
    try {
      await api.reactivateClient(clientId);
      toast.success('Account successfully reactivated!');
      if (onListChange) onListChange(); // Close drawer & refresh list
    } catch (err) {
      toast.error(err.message || 'Failed to reactivate account');
      setReactivating(false);
    }
  };

  return (
    <div className="h-full flex flex-col">

      {/* ── Sticky header — card content only, no action buttons ── */}
      <div className="shrink-0 bg-white">
        {displayClient ? (
          <div className="border-b border-slate-100">
            <CardContent customer={displayClient} />
          </div>
        ) : (
          <div className="p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="w-14 h-14 bg-slate-100 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-slate-100 rounded w-2/3" />
                <div className="h-4 bg-slate-100 rounded w-1/3" />
              </div>
            </div>
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex border-t border-slate-100 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors shrink-0
                ${activeTab === key ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 pb-24">
        {loading && !client && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-red-500 text-base">{error}</p>
            <button onClick={refetch} className="text-slate-500 text-sm underline mt-2">Retry</button>
          </div>
        )}

        {client && (
          <>
            {activeTab === 'overview' && (
              <OverviewTab 
                client={client} 
                onEdit={!isSuspended ? () => setEditOpen(true) : undefined} 
                onSuspend={!isSuspended ? () => setSuspendOpen(true) : undefined} 
                onReactivate={isSuspended ? handleReactivate : undefined} // ✨ ADDED
              />
            )}
            {activeTab === 'orders' && <OrdersTab orders={orders} />}
            {activeTab === 'invoices' && (
              <InvoicesTab
                invoices={invoices}
                client={client}
                isSuspended={isSuspended}
                onInvoiceCreated={() => { refetchInvoices(); refetch(); }}
              />
            )}
            {activeTab === 'payments' && (
              <PaymentsTab
                payments={payments}
                client={client}
                isSuspended={isSuspended}
                onPaymentRecorded={() => { refetchPayments(); refetch(); }}
              />
            )}
            {activeTab === 'ledger' && <LedgerTab clientId={clientId} client={client} />}
          </>
        )}
      </div>

      {/* Modals */}
      {editOpen && displayClient && !isSuspended && (
        <EditCustomerModal
          client={displayClient}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); refetch(); }}
        />
      )}

      {/* ✨ REPLACED standard SuspendModal with SuspendOtpModal */}
      {suspendOpen && !isSuspended && (
        <SuspendOtpModal
          customer={displayClient}
          onClose={() => setSuspendOpen(false)}
          onConfirmSuccess={() => { 
            setSuspendOpen(false); 
            if (onListChange) onListChange(); // ✨ FIX: Gracefully close and reload
          }}
        />
      )}
    </div>
  );
};