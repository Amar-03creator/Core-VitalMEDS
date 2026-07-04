import { REPLENISH_PRIORITY_CFG } from '../utils/constants';

export const ReplenishmentRow = ({ suggestion, onQtyChange, showCompany = false }) => (
  <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3">
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-slate-900 font-semibold text-base">{suggestion.productName}</p>
        {showCompany && <p className="text-slate-500 text-sm">{suggestion.companyName}</p>}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${REPLENISH_PRIORITY_CFG[suggestion.priority]}`}>
            {suggestion.priority}
          </span>
          <span className="text-slate-500 text-sm">
            Stock: {suggestion.currentStock} · Avg/mo: {suggestion.avgMonthlyDemand}
          </span>
        </div>
        {suggestion.basis && <p className="text-slate-400 text-xs mt-0.5">{suggestion.basis}</p>}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-slate-400 text-xs mb-1">Final Qty</p>
        <input
          type="number"
          min={0}
          value={suggestion.finalQty}
          onChange={(e) => onQtyChange(suggestion.productId, e.target.value)}
          className="w-20 text-base font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-center outline-none focus:border-emerald-400"
        />
      </div>
    </div>
  </div>
);