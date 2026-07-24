import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

export default function ReasonModal({ title, actionLabel, danger, hideReason, message, onClose, onConfirm, busy }) {
  const [reason, setReason] = useState('');
  return (
    // ✨ FIXED: Elevated z-index to 130 to ensure it is above all other modals (OrderDetails is 110)
    <div className="fixed inset-0 z-[130] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 space-y-4 shadow-2xl animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h3 className="text-slate-900 font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400 hover:text-slate-700" /></button>
        </div>
        {message && <p className="text-slate-600 text-base -mt-1">{message}</p>}
        {!hideReason && (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            rows={3}
            className="w-full text-base border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        )}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-base font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">Nevermind</button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={busy}
            className={`flex-1 py-2.5 rounded-xl text-base font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-60 transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'}`}
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            {actionLabel}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp { animation: slideUp 0.2s ease-out; }
      `}</style>
    </div>
  );
}