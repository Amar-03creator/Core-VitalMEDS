// src/features/Admin/CustomersPage/detail/tabs/PaymentsTab.jsx
import { useState } from 'react';
import { Plus, CreditCard } from 'lucide-react';
import { PaymentModal as RecordPaymentModal } from '../../../../../components/payments/PaymentModal';
import { PaymentCard } from '@/components/payments/PaymentCard';
import { downloadReceiptPDF, printReceiptPDF } from '../../../../../components/payments/receipt';
import { usePaymentActions } from '@/components/payments/usePaymentActions';
import { DeletePaymentModal } from '@/components/payments/DeletePaymentModal';
import { PaymentModal } from '../../../../../components/payments/PaymentModal';   // for editing
import { isWithinEditWindow } from '@/components/payments/paymentUtils';
import { toast } from 'sonner';

const Skeleton = () => (
  <div className="animate-pulse space-y-3 mt-2">
    {[1, 2, 3].map(i => (
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

export const PaymentsTab = ({ payments, client, onPaymentRecorded, isSuspended }) => {
  const [recordOpen, setRecordOpen] = useState(false);

  const {
    editingReceipt,
    deletingReceipt,
    handleEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleDeleteConfirm,
    handleCancelDelete,
    handleDelete,
  } = usePaymentActions({ onChanged: onPaymentRecorded });

  if (!payments) return <Skeleton />;

  const sorted = [...payments].sort(
    (a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)
  );
  const total = sorted.reduce((s, r) => s + (r.totalAmountPaid || 0), 0);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-base font-semibold text-slate-700">
            {sorted.length} receipt{sorted.length !== 1 ? 's' : ''}
          </p>
          {total > 0 && (
            <p className="text-sm text-emerald-600 font-semibold">
              ₹{total.toLocaleString('en-IN')} collected total
            </p>
          )}
        </div>
        <button
          onClick={() => {
            // ✨ Throw error toast if suspended!
            if (isSuspended) return toast.error("Cannot record payments for a suspended account.");
            setRecordOpen(true);
          }}
          // ✨ Grey out the button if suspended
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors ${
            isSuspended ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}
        >
          <Plus size={15} /> Record Payment
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <CreditCard size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-base font-medium">No payments recorded</p>
          <p className="text-sm mt-1">Tap &quot;Record Payment&quot; to log a receipt</p>
        </div>
      ) : (
        <div className="space-y-3 pb-20">
          {sorted.map(rec => {
            const editable = isWithinEditWindow(rec);
            return (
              <PaymentCard
                key={rec._id}
                receipt={rec}
                variant="customer"
                showActions={true}
                onDownload={downloadReceiptPDF}
                onPrint={printReceiptPDF}
                onEdit={editable ? () => handleEdit(rec) : undefined}
                onDelete={editable ? () => handleDeleteConfirm(rec) : undefined}
                editable={editable}
              />
            );
          })}
        </div>
      )}

      {recordOpen && client && (
        <RecordPaymentModal
          prefillClient={client}
          lockClient={true}
          onClose={() => setRecordOpen(false)}
          onSaved={() => { setRecordOpen(false); onPaymentRecorded?.(); }}
        />
      )}

      {editingReceipt && (
        <PaymentModal
          editingReceipt={editingReceipt}
          onClose={handleCancelEdit}
          onSaved={handleSaveEdit}
        />
      )}

      {deletingReceipt && (
        <DeletePaymentModal
          receipt={deletingReceipt}
          onClose={handleCancelDelete}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
};