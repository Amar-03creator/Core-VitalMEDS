import { useState } from 'react';
import { ChevronDown, ChevronUp, Download, Printer, Pencil, Trash2, Lock } from 'lucide-react';
import { MODE_EMOJI } from '../../features/Admin/BillingPage/utils/constants';
import { toIndianDate, formatCurrency } from './paymentUtils';

export const PaymentCard = ({
  receipt,
  variant = 'billing',           // 'billing' | 'customer'
  expanded: forcedExpanded,      // optional external control
  onToggle,
  onDownload,
  onPrint,
  onEdit,
  onDelete,
  editable = true,
  showActions = true,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = forcedExpanded !== undefined ? forcedExpanded : internalExpanded;

  const toggle = () => {
    if (onToggle) {
      onToggle(receipt._id);
    } else {
      setInternalExpanded(prev => !prev);
    }
  };

  const hasAllocations = receipt.allocatedInvoices?.length > 0;

  return (
    <div>
      {/* ── Header row (exact billing style) ── */}
      <div className="w-full flex items-center gap-3 px-2 py-2">
        <button
          onClick={toggle}
          className="flex items-center gap-3 flex-1 min-w-0 text-left active:opacity-70"
        >
          <span className="text-2xl shrink-0">
            {MODE_EMOJI[receipt.paymentMode] || '💰'}
          </span>
          <div className="flex-1 min-w-0">
            {/* Title */}
            {variant === 'customer' ? (
              <p className="text-slate-900 font-semibold text-md truncate font-mono">
                {receipt.receiptNumber}
              </p>
            ) : (
              <p className="text-slate-900 font-semibold text-md truncate">
                {receipt.clientObjectId?.establishmentName || receipt.clientName || 'Client'}
              </p>
            )}
            {/* Secondary line – only for billing */}
            {variant === 'billing' && (
              <p className="text-slate-500 text-base">
                {receipt.paymentMode}
                {receipt.referenceNumber && ` · ${receipt.referenceNumber}`}
              </p>
            )}
            {/* Customer variant intentionally has no secondary line */}
          </div>
        </button>

        {/* Amount + Date */}
        <div className="text-right shrink-0">
          <p className="text-emerald-600 font-bold text-lg">
            +₹{receipt.totalAmountPaid?.toLocaleString('en-IN')}
          </p>
          <p className="text-slate-500 text-md">
            {receipt.paymentDate?.slice(0, 10) || ''}
          </p>
        </div>

        {/* Chevron */}
        <button onClick={toggle} className="shrink-0">
          <ChevronDown
            size={20}
            className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* ── Expanded section ── */}
      {isExpanded && (
        <div className="px-2 pb-3 bg-slate-50 border-t border-slate-100">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-1 mt-2">
            Applied to invoices
          </p>

          {!hasAllocations ? (
            <div className="flex items-center justify-between py-2">
              <span className="text-lg text-slate-500">Recorded as advance</span>
              <span className="text-xl font-semibold text-slate-800">
                ₹{receipt.totalAmountPaid?.toLocaleString('en-IN')}
              </span>
            </div>
          ) : (
            <>
              {receipt.allocatedInvoices.map((a) => (
                <div key={a.invoiceId} className="flex items-center justify-between py-2">
                  <span className="font-mono text-md text-slate-600">{a.invoiceNumber}</span>
                  <span className="text-lg font-semibold text-slate-800">
                    ₹{a.amountCleared?.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              {receipt.unallocatedAmount > 0 && (
                <div className="flex items-center justify-between py-1 mt-1 border-t border-slate-200">
                  <span className="text-md text-slate-500 italic">Added to advance</span>
                  <span className="text-lg font-semibold text-slate-800 italic">
                    ₹{receipt.unallocatedAmount?.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Receipt number + Download/Print */}
          {/* Receipt number (billing only) + Download/Print (both variants) */}
          {(variant === 'billing' || (showActions && (onDownload || onPrint))) && (
            <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-200">
              {variant === 'billing' && (
                <p className="text-base text-slate-400 font-mono">{receipt.receiptNumber}</p>
              )}
              {showActions && (onDownload || onPrint) && (
                <div className="flex items-center gap-2 ml-auto">
                  {onDownload && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDownload(receipt); }}
                      className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-base font-semibold px-3 py-2 rounded-xl hover:bg-slate-50"
                    >
                      <Download size={18} /> Download
                    </button>
                  )}
                  {onPrint && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onPrint(receipt); }}
                      className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-base font-semibold px-3 py-2 rounded-xl hover:bg-slate-50"
                    >
                      <Printer size={18} /> Print
                    </button>
                  )}
                </div>
              )}
            </div>
          )}


          {/* Edit / Delete / Locked row — available on ANY page if the callbacks exist */}
          {showActions && (onEdit || onDelete || editable === false) && (
            <div className="flex items-center gap-2 mt-3">
              {editable ? (
                <>
                  {onEdit && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(receipt); }}
                      className="flex-1 flex items-center justify-center gap-2 bg-amber-50 text-amber-700 text-base font-semibold px-3 py-2.5 rounded-xl hover:bg-amber-100"
                    >
                      <Pencil size={18} /> Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(receipt); }}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-700 text-base font-semibold px-3 py-2.5 rounded-xl hover:bg-red-100"
                    >
                      <Trash2 size={18} /> Delete
                    </button>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-500 text-base font-medium px-3 py-2.5 rounded-xl">
                  <Lock size={16} /> Locked after 30 days
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};