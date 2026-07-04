// customers/modals/RejectModal.jsx
import { useState } from 'react';
import { X }        from 'lucide-react';

/**
 * RejectModal
 * Bottom-sheet that captures an optional reason before rejecting a client.
 * Keeps the rejection reason in the database via the reject endpoint.
 */
export const RejectModal = ({ customer, onClose, onConfirm }) => {
  const [reason,   setReason]   = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(customer, reason.trim() || undefined);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl px-5 pt-4 pb-6">
        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-4" />
        <h3 className="font-bold text-slate-900 text-lg mb-1">Reject account?</h3>
        <p className="text-slate-500 text-sm mb-4">
          {customer?.establishmentName} will be notified and won't be able to place orders.
        </p>

        <label className="text-sm font-semibold text-slate-700 block mb-1.5">
          Reason <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="e.g., Drug license is expired or unreadable…"
          rows={3}
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400 resize-none mb-4"
        />

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
            {loading ? 'Rejecting…' : 'Reject Account'}
          </button>
        </div>
      </div>
    </>
  );
};
