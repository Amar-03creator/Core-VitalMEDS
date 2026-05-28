import { useState } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { RECEIPTS, MODE_EMOJI } from './utils/constants';
import { PaymentModal } from './modals/PaymentModal';

export const PaymentsTab = () => {
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded]   = useState(null);

  return (
    <div className="space-y-4">
      <button onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3.5 rounded-2xl text-base">
        <Plus size={18} /> Record New Payment
      </button>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
        {RECEIPTS.map(r => (
          <div key={r.id}>
            <button onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50">
              <span className="text-2xl shrink-0">{MODE_EMOJI[r.mode]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-slate-900 font-semibold text-base">{r.client}</p>
                <p className="text-slate-500 text-sm">{r.line} · {r.mode}
                  {r.ref && <span className="font-mono"> · {r.ref}</span>}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-emerald-600 font-bold text-base">+₹{r.amount.toLocaleString()}</p>
                <p className="text-slate-500 text-sm">{r.date.slice(5).replace('-', ' ')}</p>
              </div>
              <ChevronDown size={16} className={`text-slate-300 shrink-0 transition-transform ${expanded === r.id ? 'rotate-180' : ''}`} />
            </button>
            {expanded === r.id && (
              <div className="px-4 pb-3 pt-0 bg-slate-50 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Applied to invoices</p>
                {r.allocated.length === 0
                  ? <p className="text-sm text-slate-500">Recorded as advance</p>
                  : r.allocated.map(a => (
                    <div key={a.id} className="flex items-center justify-between py-1.5">
                      <span className="font-mono text-sm text-slate-600">{a.id}</span>
                      <span className="text-base font-semibold text-slate-800">₹{a.amt.toLocaleString()}</span>
                    </div>
                  ))
                }
                <p className="text-xs text-slate-400 font-mono mt-1 pt-1 border-t border-slate-200">{r.id}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      {showModal && <PaymentModal onClose={() => setShowModal(false)} />}
    </div>
  );
};