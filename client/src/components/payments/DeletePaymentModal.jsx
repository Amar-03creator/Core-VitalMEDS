import { X } from 'lucide-react';

export const DeletePaymentModal = ({ receipt, onClose, onConfirm }) => {
  if (!receipt) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-5">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <h3 className="font-bold text-xl text-slate-900 mb-2">Delete this payment?</h3>
        <p className="text-slate-600 text-lg mb-6 leading-relaxed">
          This will reverse the ₹{receipt.totalAmountPaid?.toLocaleString('en-IN')} payment from{' '}
          {receipt.clientObjectId?.establishmentName || receipt.clientName || 'Party'},
          restoring the original invoice balances. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 text-slate-700 font-semibold py-3.5 rounded-xl text-lg hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(receipt)}
            className="flex-1 bg-red-600 text-white font-bold py-3.5 rounded-xl text-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};