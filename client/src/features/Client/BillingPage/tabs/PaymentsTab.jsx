// src/features/Client/BillingPage/tabs/PaymentsTab.jsx
import { useState } from 'react';
import { Plus, CreditCard } from 'lucide-react';
import { PaymentCard } from '../../../../components/payments/PaymentCard';
import { downloadReceiptPDF, printReceiptPDF } from '../../../../components/payments/receipt';
import { useClientPayments } from '../hooks/useClientPayments';
import MakePaymentPreviewModal from '../modals/MakePaymentPreviewModal';

const Skeleton = () => (
  <div className="animate-pulse space-y-3 mt-2">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between">
        <div className="space-y-2.5 flex-1">
          <div className="h-4 bg-slate-100 rounded w-36" />
          <div className="h-3.5 bg-slate-100 rounded w-28" />
        </div>
        <div className="h-5 bg-slate-100 rounded w-24" />
      </div>
    ))}
  </div>
);

const PaymentsTab = ({ client }) => {
  const { payments, loading, error, refetch } = useClientPayments(client?._id);
  const [makePaymentOpen, setMakePaymentOpen] = useState(false);

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-base sm:text-lg">{error}</p>
        <button onClick={refetch} className="text-slate-500 text-sm sm:text-base underline mt-2">Retry</button>
      </div>
    );
  }

  const sorted = [...payments].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
  const total = sorted.reduce((s, r) => s + (r.totalAmountPaid || 0), 0);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-base sm:text-lg font-semibold text-slate-700">
            {sorted.length} receipt{sorted.length !== 1 ? 's' : ''}
          </p>
          {total > 0 && (
            <p className="text-sm sm:text-base text-emerald-600 font-semibold">
              ₹{total.toLocaleString('en-IN')} paid total
            </p>
          )}
        </div>
        <button
          onClick={() => setMakePaymentOpen(true)}
          className="flex items-center gap-2 bg-emerald-500 text-white text-sm sm:text-base font-semibold px-4 py-2.5 rounded-xl"
        >
          <Plus size={16} /> Make Payment
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <CreditCard size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-base sm:text-lg font-medium">No payments recorded</p>
        </div>
      ) : (
        <div className="space-y-3 pb-20">
          {sorted.map((rec) => (
            // No editable/onEdit/onDelete passed — read-only for the
            // client, per your answer. Download/Print still work since
            // those are gated independently of the edit row.
            <PaymentCard
              key={rec._id}
              receipt={rec}
              variant="customer"
              showActions={true}
              onDownload={downloadReceiptPDF}
              onPrint={printReceiptPDF}
            />
          ))}
        </div>
      )}

      {makePaymentOpen && <MakePaymentPreviewModal onClose={() => setMakePaymentOpen(false)} />}
    </>
  );
};

export default PaymentsTab;