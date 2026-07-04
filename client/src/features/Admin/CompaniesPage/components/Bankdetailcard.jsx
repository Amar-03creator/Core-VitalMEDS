import { Landmark } from 'lucide-react';

export const BankDetailCard = ({ bank }) => (
  <div className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 flex items-start gap-2.5">
    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
      <Landmark size={14} className="text-slate-500" />
    </div>
    <div className="min-w-0">
      <p className="text-slate-800 font-semibold text-base">{bank.bankName}</p>
      <p className="text-slate-500 text-sm">A/c {bank.accountNumber}</p>
      <p className="text-slate-500 text-sm">IFSC {bank.ifscCode} · {bank.branch}</p>
    </div>
  </div>
);