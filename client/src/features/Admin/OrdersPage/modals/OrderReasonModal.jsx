import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

export default function OrderReasonModal({ title, message, actionLabel, onClose, onConfirm, busy }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="text-slate-900 font-bold text-lg">{title}</h3>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        {message && <p className="text-slate-500 text-sm">{message}</p>}
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
          placeholder="Reason (visible to the client)"
          className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100">Nevermind</button>
          <button onClick={() => onConfirm(reason)} disabled={busy}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 disabled:opacity-60 flex items-center justify-center gap-1.5">
            {busy ? <Loader2 size={14} className="animate-spin" /> : null} {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}