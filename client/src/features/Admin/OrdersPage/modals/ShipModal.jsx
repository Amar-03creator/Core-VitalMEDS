import { useState } from 'react';
import { X, Truck, Loader2 } from 'lucide-react';

export default function ShipModal({ order, onClose, onConfirm, busy }) {
  const [dispatch, setDispatch] = useState({
    transportMode: '', vehicleNumber: '', lrNumber: '', courierName: '', trackingId: '', trackingUrl: '',
  });
  const set = (k, v) => setDispatch((d) => ({ ...d, [k]: v }));

  return (
    <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="text-slate-900 font-bold text-lg">Mark {order.orderId} Shipped</h3>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <p className="text-slate-500 text-sm">Dispatch details are optional but show up on the client's tracking view.</p>
        <div className="grid grid-cols-2 gap-2">
          <input value={dispatch.transportMode} onChange={(e) => set('transportMode', e.target.value)} placeholder="Transport mode" className="border border-slate-200 rounded-xl px-3 py-2 text-sm col-span-2" />
          <input value={dispatch.vehicleNumber} onChange={(e) => set('vehicleNumber', e.target.value)} placeholder="Vehicle number" className="border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          <input value={dispatch.lrNumber} onChange={(e) => set('lrNumber', e.target.value)} placeholder="LR number" className="border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          <input value={dispatch.courierName} onChange={(e) => set('courierName', e.target.value)} placeholder="Courier name" className="border border-slate-200 rounded-xl px-3 py-2 text-sm col-span-2" />
          <input value={dispatch.trackingId} onChange={(e) => set('trackingId', e.target.value)} placeholder="Tracking ID" className="border border-slate-200 rounded-xl px-3 py-2 text-sm col-span-2" />
          <input value={dispatch.trackingUrl} onChange={(e) => set('trackingUrl', e.target.value)} placeholder="Tracking URL" className="border border-slate-200 rounded-xl px-3 py-2 text-sm col-span-2" />
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100">Nevermind</button>
          <button onClick={() => onConfirm(dispatch)} disabled={busy}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-cyan-600 disabled:opacity-60 flex items-center justify-center gap-1.5">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />} Confirm Shipped
          </button>
        </div>
      </div>
    </div>
  );
}