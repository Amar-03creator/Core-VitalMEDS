// src/features/Client/BillingPage/modals/MakePaymentPreviewModal.jsx
import { X, Construction } from 'lucide-react';

const MakePaymentPreviewModal = ({ onClose }) => (
  <div className="fixed inset-0 z-[100] bg-black/60 flex items-end">
    <div className="w-full bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto relative">
      <div className="sticky top-0 bg-white flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 z-10">
        <h3 className="font-bold text-slate-900 text-xl sm:text-2xl">Make Payment</h3>
        <button onClick={onClose} aria-label="Close">
          <X size={28} className="text-slate-400" />
        </button>
      </div>

      {/* Same shape as the real Record Payment modal — blurred and inert */}
      <div className="px-6 py-6 space-y-6 blur-sm pointer-events-none select-none opacity-60">
        <div>
          <label className="text-base sm:text-lg text-slate-600 block mb-2 font-semibold">Amount (₹)</label>
          <input
            disabled
            placeholder="0"
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-lg sm:text-xl font-bold text-slate-800"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-base sm:text-lg text-slate-600 block mb-2 font-semibold">Payment Date</label>
            <input
              disabled
              type="date"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-base sm:text-lg text-slate-800"
            />
          </div>
          <div>
            <label className="text-base sm:text-lg text-slate-600 block mb-2 font-semibold">Mode</label>
            <select
              disabled
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-base sm:text-lg text-slate-800"
            >
              <option>Cash</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-base sm:text-lg text-slate-600 block mb-2 font-semibold">Reference No.</label>
          <input
            disabled
            placeholder="Ref…"
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-base sm:text-lg text-slate-800"
          />
        </div>

        <button disabled className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl text-lg sm:text-xl">
          Save Payment
        </button>
      </div>

      {/* "Under development" overlay */}
      <div className="absolute inset-0 top-16 flex items-center justify-center px-8 pointer-events-none">
        <div className="bg-white border-2 border-amber-300 rounded-3xl px-6 py-8 text-center shadow-xl max-w-xs pointer-events-auto">
          <Construction size={36} className="text-amber-500 mx-auto mb-3" />
          <p className="text-slate-900 font-bold text-lg sm:text-xl">This modal is under development</p>
          <p className="text-slate-500 text-sm sm:text-base mt-2">
            Online payment submission is coming soon. For now, please coordinate payments with your sales representative.
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default MakePaymentPreviewModal;