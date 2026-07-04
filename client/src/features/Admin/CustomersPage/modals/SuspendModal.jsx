// customers/modals/SuspendModal.jsx
import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';

/**
 * SuspendModal
 * Confirmation bottom-sheet before suspending a customer.
 * More intentional UX than window.confirm().
 */
export const SuspendModal = ({ customer, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(customer);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl px-5 pt-4 pb-6">
        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-4" />

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <ShieldAlert size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Suspend account?</h3>
            <p className="text-xs text-slate-500">{customer?.establishmentName}</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
          This will block all new orders and inquiries from this pharmacy until the account
          is re-activated. Existing invoices and payment history are unaffected.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 text-slate-700 font-semibold py-3 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl disabled:opacity-50"
          >
            {loading ? 'Suspending…' : 'Suspend'}
          </button>
        </div>
      </div>
    </>
  );
};
