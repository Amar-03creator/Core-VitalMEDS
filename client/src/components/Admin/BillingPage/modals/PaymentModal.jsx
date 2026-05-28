import { useState, useMemo } from 'react';
import { X, Zap } from 'lucide-react';
import { ALL_CLIENTS } from '../utils/constants';
import { calcFIFO } from '../utils/helpers';

export const PaymentModal = ({ onClose }) => {
  const [client, setClient] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate]     = useState(new Date().toISOString().split('T')[0]);
  const [mode, setMode]     = useState('Cash');
  const [ref, setRef]       = useState('');

  const fifo = useMemo(() => client && amount ? calcFIFO(client, amount) : null, [client, amount]);

  const handleAmountChange = (e) => {
    const val = e.target.value;
    // Allow empty or valid number
    if (val === '') {
      setAmount('');
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        setAmount(val);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
      <div className="w-full bg-white rounded-t-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-lg">Record Payment</h3>
          <button onClick={onClose}><X size={22} className="text-slate-400" /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-sm text-slate-600 block mb-1.5 font-semibold">Party</label>
            <select value={client} onChange={e => { setClient(e.target.value); setAmount(''); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none">
              <option value="">Select party...</option>
              {ALL_CLIENTS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-1.5 font-semibold">Amount (₹)</label>
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              onWheel={(e) => e.preventDefault()}
              onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
              placeholder="0"
              inputMode="decimal"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-600 block mb-1.5 font-semibold">Payment Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none" />
            </div>
            <div>
              <label className="text-sm text-slate-600 block mb-1.5 font-semibold">Mode</label>
              <select value={mode} onChange={e => setMode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none">
                {['Cash', 'UPI', 'Cheque', 'Bank Transfer'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-1.5 font-semibold">
              {mode === 'Cash' ? 'Receipt No. (give to party)' : 'Reference No.'}
            </label>
            <input type="text" value={ref} onChange={e => setRef(e.target.value)}
              placeholder={mode === 'Cash' ? 'RCPT-0025' : mode === 'UPI' ? 'UPI ref...' : mode === 'Cheque' ? 'Cheque no...' : 'NEFT ref...'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-base text-slate-800 outline-none focus:border-emerald-400" />
          </div>
          {fifo && fifo.alloc.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-blue-200">
                <Zap size={14} className="text-blue-600" />
                <p className="text-blue-700 text-sm font-bold">FIFO Auto-Allocation Preview</p>
              </div>
              <div className="px-4 py-2 space-y-1.5">
                {fifo.alloc.map(a => (
                  <div key={a.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${a.willPay ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="text-sm text-blue-800 font-mono">{a.id.slice(-9)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-blue-700 font-semibold">₹{a.applied.toLocaleString()}</span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${a.willPay ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {a.willPay ? '✓ PAID' : `₹${a.newDue.toLocaleString()} left`}
                      </span>
                    </div>
                  </div>
                ))}
                {fifo.leftover > 0 && (
                  <p className="text-sm text-blue-600 font-semibold pt-1 border-t border-blue-200">
                    ₹{fifo.leftover.toLocaleString()} → advance credit
                  </p>
                )}
              </div>
            </div>
          )}
          <button disabled={!client || !amount || !ref}
            className="w-full bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 rounded-xl text-base">
            Save Payment Receipt
          </button>
        </div>
      </div>
    </div>
  );
};