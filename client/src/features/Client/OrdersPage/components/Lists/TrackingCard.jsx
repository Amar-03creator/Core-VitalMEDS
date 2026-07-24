import { Eye } from 'lucide-react';
import { formatMoney, formatDate } from '../../utils';

export default function TrackingCard({ record, onClick }) {
  return (
    <button onClick={onClick} className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 md:hidden shadow-sm mb-2 relative hover:bg-slate-50 transition-colors">
      {record.showEyeIcon && (
        <div className="absolute top-3 right-3 text-violet-600 bg-violet-50 p-1.5 rounded-full z-10 pointer-events-none">
          <Eye size={18} />
        </div>
      )}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-600 text-base font-bold font-mono">{record.recordId}</span>
          <span className={`flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded-full ${record.meta.bg} ${record.meta.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${record.meta.dot}`} /> {record.meta.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-slate-900 font-bold text-lg">{formatMoney(record.amount)}</span>
          {record.isEst && <span className="text-slate-400 text-sm font-bold uppercase">est.</span>}
          <span className="text-slate-300 text-base">|</span>
          <span className="text-blue-600 font-bold text-base underline">{record.itemCount} items</span>
          {record.billPreference && (
            <span className={`text-sm font-bold px-1.5 py-0.5 rounded border ${record.billPreference === 'Cash' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
              {record.billPreference}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-1.5">
          <p className="text-slate-500 text-sm font-medium">{formatDate(record.date)}</p>
          {record.subtitle && (
            <>
              <span className="text-slate-300 text-sm">•</span>
              <p className="text-slate-500 text-sm font-medium truncate">{record.subtitle}</p>
            </>
          )}
        </div>
      </div>
    </button>
  );
}