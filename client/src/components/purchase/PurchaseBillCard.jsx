// src/features/Admin/BillingPage/components/PurchaseBillCard.jsx
import { ChevronUp } from 'lucide-react';
import { STATUS_CFG } from '../../features/Admin/BillingPage/utils/constants'; 

export const PurchaseBillCard = ({ bill, onClick }) => {
  const { pill = 'bg-slate-100 text-slate-700', label = bill.paymentStatus } =
    STATUS_CFG[bill.paymentStatus] || {};

  const itemCount = Array.isArray(bill.items) ? bill.items.length : 0;
  const formatCurrency = (val) => `₹${Math.round(val || 0).toLocaleString('en-IN')}`;
  
  const toIndianDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ✨ FIX: Safely extract the populated fields
  const displaySupplier = bill.supplierId?.shortCode || bill.supplierName;
  const displayCity = bill.supplierId?.city || 'Unknown City';

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] p-4 pb-1 space-y-2 relative"
    >
      <span className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 text-md font-bold px-3 py-0 rounded-full border border-slate-100 shadow-sm bg-white text-slate-700">
        {bill.billType === 'Cash' ? '💵 Cash' : '📋 Credit'}
      </span>

      <span className={`absolute -bottom-2 right-0 z-10 text-sm font-bold px-3 py-1 rounded-full border border-slate-100 shadow-sm ${pill}`}>
        {label}
      </span>

      <div className="flex items-start justify-between">
        <p className="text-slate-800 font-bold text-lg flex-1 min-w-0 mr-2 truncate">
          {displaySupplier}
        </p>
        <span className="text-slate-900 font-black text-lg shrink-0">
          {formatCurrency(bill.netAmount)}
        </span>
      </div>

      <div className="flex items-center justify-between mt-1">
        <p className="text-slate-500 text-sm">
          {displayCity} · {itemCount} items
        </p>
        <div className="text-right">
          {bill.dueAmount > 0 ? (
            <span className="text-red-600 font-semibold text-base">
              {formatCurrency(bill.dueAmount)} <span className="text-red-400 text-sm font-normal ml-1">(due)</span>
            </span>
          ) : (
            <span className="text-emerald-600 font-semibold text-base">Cleared ✓</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap text-sm mt-2">
        <span className="text-blue-600 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
          {bill.invoiceNumber}
        </span>
        <span className="text-slate-400">·</span>
        <span className="text-slate-500 font-medium">Inv Date: {toIndianDate(bill.invoiceDate)}</span>
      </div>

      <div className="flex justify-center -mt-2">
        <ChevronUp size={20} className="text-slate-400" />
      </div>
    </button>
  );
};