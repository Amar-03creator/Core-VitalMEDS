import { formatIndianDate } from './ledgerUtils';

export const LedgerTable = ({ rows, variant = 'compact' }) => {
  if (!rows?.length) return null;

  const gridCols =
    variant === 'full'
      ? 'grid-cols-[80px_1fr_90px_90px_110px_60px]'   // modal
      : 'grid-cols-[55px_1fr_60px_60px_70px_35px]';    // compact (accordion)

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className={`grid ${gridCols} px-2 py-2 bg-slate-900 text-[9px] font-bold text-slate-300 uppercase tracking-wide gap-1 items-center`}>
        <span>Date</span>
        <span>Particulars</span>
        <span className="text-right">Dr(₹)</span>
        <span className="text-right">Cr(₹)</span>
        <span className="text-right">Balance</span>
        <span className="text-right">Days</span>
      </div>

      {rows.map((row, i) => {
        const isOpening = row.isOpening;
        const isClosing = row.isClosing;

        return (
          <div
            key={i}
            className={`grid ${gridCols} px-2 py-2 border-t border-slate-100 text-xs gap-1 items-center
              ${isOpening ? 'bg-amber-50' : isClosing ? 'bg-slate-900' : ''}`}
          >
            <span className={`text-[10px] font-medium ${isClosing ? 'text-slate-400' : 'text-slate-500'}`}>
              {formatIndianDate(row.date)}
            </span>
            <div className="min-w-0 pr-1">
              <p className={`font-semibold truncate text-[11px] ${isOpening ? 'text-amber-800' : isClosing ? 'text-white' : 'text-slate-800'}`}>
                {row.type}
              </p>
              <p className="text-slate-400 font-mono text-[9px] truncate">{row.voucher}</p>
            </div>
            <span className="text-right font-semibold text-red-600 text-[11px]">
              {row.dr > 0 ? row.dr.toLocaleString('en-IN') : ''}
            </span>
            <span className="text-right font-semibold text-emerald-600 text-[11px]">
              {row.cr > 0 ? row.cr.toLocaleString('en-IN') : ''}
            </span>
            <span className={`text-right font-bold text-[11px] ${isOpening ? 'text-amber-700' : isClosing ? 'text-emerald-400' : 'text-slate-900'}`}>
              {Math.abs(row.balance).toLocaleString('en-IN')} {row.balance >= 0 ? 'Dr' : 'Cr'}
            </span>
            <span className="text-right text-[10px] font-medium text-slate-500">
              {row.days ?? '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
};