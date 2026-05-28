import { X, Printer } from 'lucide-react';

export const LedgerDialog = ({ party, onClose }) => {
  const ledger = [
    { date: '01 Feb', type: 'Opening Balance', voucher: '—',               dr: 12000, cr: 0,     balance: 12000, days: null },
    { date: '05 Mar', type: 'Sales (Credit Bill)', voucher: 'MIL-03-025-022', dr: 34500, cr: 0,   balance: 46500, days: 44 },
    { date: '10 Mar', type: 'Payment (UPI)',     voucher: 'REC-25-003',     dr: 0,     cr: 22000, balance: 24500, days: null },
    { date: '01 Apr', type: 'Sales (Credit Bill)', voucher: 'MIL-04-025-030', dr: 50000, cr: 0,   balance: 74500, days: 22 },
    { date: '05 Apr', type: 'Credit Note',       voucher: 'CN-001',         dr: 0,     cr: 3000,  balance: 71500, days: null },
  ];
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
      <div className="w-full bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="font-bold text-slate-900 text-lg">{party.client}</p>
            <p className="text-slate-500 text-sm">{party.line} · Last 90 days</p>
          </div>
          <button onClick={onClose}><X size={22} className="text-slate-400" /></button>
        </div>
        <div className="px-4 py-3">
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-[50px_1fr_60px_60px_80px_40px] bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              <span>Date</span><span>Particulars</span>
              <span className="text-right">Dr ₹</span><span className="text-right">Cr ₹</span>
              <span className="text-right">Balance</span><span className="text-right">Days</span>
            </div>
            {ledger.map((row, i) => (
              <div key={i} className={`grid grid-cols-[50px_1fr_60px_60px_80px_40px] px-3 py-2 border-t border-slate-100 text-sm
                ${i === 0 ? 'bg-amber-50' : ''}`}>
                <span className="text-slate-500 text-xs">{row.date}</span>
                <div>
                  <p className={`font-medium leading-tight ${i === 0 ? 'text-amber-700' : 'text-slate-800'}`}>{row.type}</p>
                  <p className="text-slate-400 font-mono text-[10px]">{row.voucher}</p>
                </div>
                <span className="text-right font-medium text-red-600">{row.dr > 0 ? row.dr.toLocaleString() : ''}</span>
                <span className="text-right font-medium text-emerald-600">{row.cr > 0 ? row.cr.toLocaleString() : ''}</span>
                <span className="text-right font-bold text-slate-900 text-sm">{row.balance.toLocaleString()} Dr</span>
                <span className="text-right text-slate-500 text-xs">{row.days || '—'}</span>
              </div>
            ))}
            <div className="grid grid-cols-[1fr_auto] bg-slate-900 px-3 py-2.5">
              <span className="text-white font-bold text-sm">Closing Balance</span>
              <span className="text-emerald-400 font-black text-base">{party.outstanding.toLocaleString()} Dr</span>
            </div>
          </div>
          <button className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold py-3 rounded-xl mt-3 text-sm">
            <Printer size={15} /> Print / Download Statement
          </button>
        </div>
      </div>
    </div>
  );
};