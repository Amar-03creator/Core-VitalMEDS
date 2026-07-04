// client/src/components/invoices/InvoiceCard.jsx

import { ChevronUp } from 'lucide-react';
import { toIndianDate, formatCurrency } from './invoiceUtils';
import { STATUS_CFG } from '../../features/Admin/BillingPage/utils/constants'; // or move STATUS_CFG to shared

export const InvoiceCard = ({ invoice, onClick, showClientName = true }) => {
  const { pill = 'bg-slate-100 text-slate-700', label = invoice.status } =
    STATUS_CFG[invoice.status] || {};

  const overdue = invoice.overdueDays ?? 0;
  const showLate = overdue > 0;

  const itemCount = Array.isArray(invoice.items) ? invoice.items.length : invoice.items;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] p-4 pb-1 space-y-2 relative"
    >
      {/* Bill type badge */}
      <span className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 text-md font-bold px-3 py-0 rounded-full border border-slate-100 shadow-sm bg-white text-slate-700">
        {invoice.billType === 'Cash' ? '💵 Cash' : '📋 Credit'}
      </span>

      {/* Status pill */}
      <span className={`absolute -bottom-2 right-0 z-10 text-sm font-bold px-3 py-1 rounded-full border border-slate-100 shadow-sm ${pill}`}>
        {label}
      </span>

      {/* Title (client name OR invoice #) & Amount */}
      <div className="flex items-start justify-between">
        <p className="text-slate-800 font-bold text-lg flex-1 min-w-0 mr-2">
          {showClientName ? invoice.client : invoice.id}
        </p>
        <span className="text-slate-900 font-bold text-lg shrink-0">
          {formatCurrency(invoice.amount)}
        </span>
      </div>

      {/* Area & items, and due amount */}
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-base">
          {invoice.area}{itemCount != null ? ` · ${itemCount} items` : ''}
        </p>
        <div className="text-right">
          {invoice.due > 0 ? (
            <div>
              <span className="text-red-600 font-semibold text-base">
                {formatCurrency(invoice.due)} <span className="text-red-400 text-sm font-normal ml-1">(due)</span>
              </span>
              {showLate && (
                <span className="text-red-500 text-sm ml-1">({overdue}d)</span>
              )}
            </div>
          ) : (
            <span className="text-emerald-600 font-semibold text-base">Cleared ✓</span>
          )}
        </div>
      </div>

      {/* Invoice number (only when title is client name), date, late badge */}
      <div className="flex items-center gap-2 flex-wrap text-md">
        {showClientName && (
          <>
            <span className="text-slate-500 font-mono font-bold">{invoice.id}</span>
            <span className="text-slate-400">·</span>
          </>
        )}
        <span className="text-slate-500">{toIndianDate(invoice.date)}</span>
        {showLate && (
          <span className="text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full">
            {overdue}d late
          </span>
        )}
      </div>

      {/* Chevron hint */}
      <div className="flex justify-center -mt-2">
        <ChevronUp size={20} className="text-slate-600" />
      </div>
    </button>
  );
};