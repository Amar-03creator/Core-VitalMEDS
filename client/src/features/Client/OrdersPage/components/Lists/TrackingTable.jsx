import { Eye, ChevronRight } from 'lucide-react';
import { formatMoney, formatDate } from '../../utils';

export default function TrackingTable({ records, onClick }) {
  return (
    <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-sm font-bold uppercase tracking-wider">
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Details</th>
            <th className="px-4 py-3">Items</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Bill Type</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {records.map((r) => (
            <tr key={r._id} onClick={() => onClick(r.raw)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
              <td className="px-4 py-3 font-mono text-base font-bold text-slate-500">{r.recordId}</td>
              <td className="px-4 py-3 text-slate-700 text-base whitespace-nowrap">{formatDate(r.date)}</td>
              <td className="px-4 py-3 text-slate-800 text-base max-w-[200px] truncate">
                {r.subtitle || <span className="text-slate-300">—</span>}
              </td>
              <td className="px-4 py-3 text-blue-600 font-bold text-base hover:underline">{r.itemCount} items</td>
              <td className="px-4 py-3 font-bold text-slate-900 text-base">
                {formatMoney(r.amount)} {r.isEst && <span className="text-slate-400 text-[11px] font-bold uppercase ml-1">est.</span>}
              </td>
              <td className="px-4 py-3">
                {r.billPreference ? (
                  <span className={`text-sm font-bold px-2 py-0.5 rounded border ${r.billPreference === 'Cash' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{r.billPreference}</span>
                ) : <span className="text-slate-300">—</span>}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded-full ${r.meta.bg} ${r.meta.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${r.meta.dot}`} /> {r.meta.label}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-400">
                {r.showEyeIcon ? <Eye size={20} className="text-violet-600" /> : <ChevronRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}