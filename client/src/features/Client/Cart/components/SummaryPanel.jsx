// src/features/Client/Cart/components/SummaryPanel.jsx
import { AlertTriangle } from 'lucide-react';

const SummaryPanel = ({
  activeTab,
  itemCount,
  mrpTotal,
  estimatedTotal,
  totalOutstanding,
  creditLimit,
  nearLimit
}) => {
  return (
    <div className="space-y-4">
      {/* ── PRICING BREAKDOWN ── */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-3">
        <div className="flex justify-between text-slate-500 text-sm">
          <span>Total Items</span>
          <span className="font-semibold text-slate-700">{itemCount}</span>
        </div>
        <div className="flex justify-between text-slate-500 text-sm">
          <span>Total MRP</span>
          <span className="font-semibold text-slate-700">₹{mrpTotal.toLocaleString()}</span>
        </div>
        <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
          <span className="font-bold text-slate-900 text-base flex items-center gap-1.5">
            {activeTab === 'order' ? 'Estimated Total' : 'Expected Total'}
            {/* ✨ NEW: (PTR) bracket */}
            <span className="text-sm font-semibold text-slate-500">(PTR)</span>
          </span>
          <span className="font-black text-emerald-600 text-lg sm:text-xl">
            ₹{estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* ── INFO/NOTE BOXES ── */}
      <div className="space-y-3">
        {activeTab === 'inquiry' ? (
          <>
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
              <p className="text-blue-700 text-sm sm:text-base font-medium">
                Wait for a maximum of 24 hours to know the pricing.
              </p>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <p className="text-amber-800 text-sm sm:text-base font-semibold italic">
                Note: You are allowed to send an inquiry only once per day.
              </p>
            </div>
          </>
        ) : (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 space-y-1">
            <p className="text-blue-700 text-sm sm:text-base font-medium">
              The actual invoicing amount for sure will be less or equal to what the expected amount is shown.
            </p>
            <p className="text-blue-600/80 bg-blue-100 rounded-xl px-2 text-sm sm:text-base font-medium italic">
              Additional GST is applicable on the final invoice.
            </p>
          </div>
        )}
      </div>

      {/* ── CREDIT WARNING (Strictly Order tab only) ── */}
      {activeTab === 'order' && nearLimit && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
          <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm sm:text-base font-medium">
            This will bring you close to your credit limit of ₹{creditLimit.toLocaleString()}.
          </p>
        </div>
      )}
    </div>
  );
};

export default SummaryPanel;