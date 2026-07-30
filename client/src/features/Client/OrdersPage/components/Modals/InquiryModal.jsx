// src/features/Client/OrdersPage/components/Modals/InquiryModal.jsx

import { useState } from 'react';
import { X, Loader2, Check, Ban, Sparkles, MessageSquare, ClipboardEdit, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { formatMoney, productLabel } from '../../utils';
import { useScrollLock, useModalTrap } from '../../../../../hooks/useBackHandler';

export default function InquiryModal({ inquiry, onClose, busyId, onDelete, onConvert, onReject }) {
  const [activeAction, setActiveAction] = useState(null);
  const [note, setNote] = useState('');
  
  useScrollLock(true);
  useModalTrap(true, { onBackClose: onClose, customId: `inquiry_${inquiry._id}` });

  const isPreQuote = ['Pending', 'Viewed'].includes(inquiry.status);
  const isQuoted = inquiry.status === 'Quoted';
  const hasQuoteData = !isPreQuote; 

  const isDeleting = busyId === `delete_${inquiry._id}`;
  const isConverting = busyId === `convert_${inquiry._id}`;
  const isRejecting = busyId === `reject_${inquiry._id}`;
  const isBusy = isDeleting || isConverting || isRejecting;

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 flex items-end md:items-center justify-center md:p-4" onClick={onClose}>
      <div className="w-full md:max-w-3xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85dvh] animate-slideUp" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex justify-between items-center bg-slate-50 px-6 py-5 border-b border-slate-200 shrink-0">
          <div>
            <h3 className="font-black text-xl md:text-2xl text-slate-900">
              {isPreQuote ? 'Inquiry Details' : isQuoted ? 'Quote Review' : 'Quote Overview'}
            </h3>
            <p className="text-sm md:text-base text-slate-500 font-semibold mt-1">
              {inquiry.inquiryId || inquiry._id.slice(-6).toUpperCase()}
            </p>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-full hover:bg-slate-200 transition-colors bg-white border border-slate-200 shadow-sm">
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto space-y-4 md:space-y-5 bg-slate-50/50 flex-1 min-h-0">
          
          {inquiry.status === 'Viewed' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-4 shadow-sm flex items-center gap-3">
              <AlertTriangle size={20} className="text-blue-600 shrink-0" />
              <p className="text-blue-800 text-sm md:text-base font-bold">Admin is currently reviewing your inquiry. Please wait for the quote.</p>
            </div>
          )}

          {inquiry.status === 'Rejected' && (
            <div className="flex flex-col gap-1 bg-red-50 border border-red-200 rounded-xl px-4 py-4 shadow-sm">
              <div className="flex items-center gap-2 text-red-700 text-base md:text-lg font-bold">
                <Ban size={20} /> {inquiry.rejectedBy === 'admin' ? 'Rejected by Admin' : 'Rejected by You'}
              </div>
              {inquiry.rejectionReason && <p className="text-sm md:text-base text-red-600 pl-[28px]">{inquiry.rejectionReason}</p>}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 shrink-0 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              <h4 className="text-sm md:text-base font-bold text-slate-700 uppercase tracking-wide">
                {isPreQuote ? 'Requested Items' : 'Quoted Items'} ({(inquiry.items || []).length})
              </h4>
              <span className={`px-3 py-1.5 rounded-lg text-sm font-black uppercase tracking-wider shadow-sm w-max ${inquiry.billPreference === 'Cash' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                {isPreQuote ? 'Desired: ' : 'Quoted: '} {inquiry.billPreference || 'Credit'}
              </span>
            </div>
            
            <div className="p-3 md:p-4 space-y-3">
              {(inquiry.items || []).map((item, i) => {
                const shortCode = item.productId?.companyId?.shortCode || item.productId?.company || '';
                
                // ✨ ROBUST FALLBACKS FOR OLDER DATA
                let expiryText = 'N/A';
                const rawDate = item.expiryDate || item.closestExpiry || item.offerBatchId?.expiryDate;
                if (rawDate) {
                  const d = new Date(rawDate);
                  if (!isNaN(d)) expiryText = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
                }

                const mrp = item.mrp || item.fallbackMrp || item.productId?.mrp || 0;
                const ptr = hasQuoteData 
                  ? (item.adminOfferedPTR ?? item.finalPrice ?? 0) 
                  : (item.estimatedPrice ?? item.finalPrice ?? (mrp * 0.8) ?? 0);

                const requestedQty = item.requestedQty || item.qty || 0;
                const providedQty = item.chargeableQty ?? 0;
                const freeQty = item.freeQty || 0;
                const providedDisplay = freeQty > 0 ? `${providedQty} + ${freeQty}` : providedQty;

                const lineTotal = hasQuoteData 
                  ? (item.lineTotal || item.adminEstimatedLineTotal || 0) 
                  : (item.estimatedLineTotal || (ptr * requestedQty) || 0);

                const isOfferBatch = !!(item.offerDescription || item.offerBatchId || item.batchId);

                return (
                  <div key={i} className="relative border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col p-3 space-y-3">
                    
                    <div className="absolute top-0 left-0 bg-slate-800 text-white text-sm font-black px-2 py-1 rounded-br-2xl rounded-tl-xl shadow-sm z-10">
                      #{i + 1}
                    </div>

                    <div className="w-full rounded-xl p-2 bg-slate-50 border border-slate-200 shrink-0">
                      <p className="font-black text-slate-900 text-lg md:text-xl leading-tight truncate pl-2 md:pl-3">
                        {productLabel(item.productId)}
                        {shortCode && <span className="text-slate-500 font-semibold ml-1.5 text-sm md:text-base">({shortCode})</span>}
                      </p>
                    </div>

                    <div className="w-full px-1">
                      <div className="flex justify-between items-center gap-x-3 md:gap-x-5 gap-y-2 text-base md:text-lg font-medium">
                        <span className="text-slate-600">MRP: <strong className="text-slate-900">{formatMoney(mrp)}</strong></span>
                        <span className="text-slate-600">{(hasQuoteData || isOfferBatch) ? 'Exp:' : 'Est. Exp:'} <strong className="text-slate-900">{expiryText}</strong></span>
                        <span className="text-slate-600">Req: <strong className="text-slate-900">{requestedQty}</strong></span>

                        {hasQuoteData && (
                          <span className="text-slate-600">Prov: <strong className="text-slate-900">{providedDisplay}</strong></span>
                        )}
                      </div>

                      {/* Row 2 */}
                      <div className="flex justify-between items-center gap-x-3 md:gap-x-5 gap-y-2 text-sm md:text-base font-medium mt-1.5">
                        {(hasQuoteData || isOfferBatch) ? (
                          <span className="text-slate-600">PTR: <strong className="text-slate-900">{formatMoney(ptr)}</strong></span>
                        ) : (
                          <span className="text-slate-400">Est. PTR: <strong className="text-slate-600">{formatMoney(ptr)}</strong></span>
                        )}

                        {isOfferBatch && (
                          <span className="inline-flex items-center gap-1 text-orange-800 bg-orange-100 px-2 py-0.5 rounded text-sm font-bold shadow-sm border border-orange-300 max-w-[150px] md:max-w-[250px]">
                            <Sparkles size={14} className="shrink-0" /> 
                            <span className="truncate">{item.offerDescription || 'Offer Applied'}</span>
                          </span>
                        )}

                        {lineTotal > 0 && (
                          <span className="text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded font-black text-sm md:text-base shadow-sm ml-auto">
                            Total: {formatMoney(lineTotal)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {hasQuoteData && inquiry.discountReason && inquiry.discountValue > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 shadow-sm flex items-start gap-3">
              <Sparkles size={20} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-base md:text-base text-amber-700 font-black mb-0.5 uppercase tracking-wide">
                  Bill Discount Applied ({inquiry.discountType === 'percent' ? `${inquiry.discountPercent || inquiry.discountValue}%` : `₹${inquiry.discountValue}`})
                </p>
                <p className="text-amber-900 text-base md:text-base font-medium leading-snug">{inquiry.discountReason}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {(inquiry.clientRemarks || inquiry.clientNote) && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 shadow-sm flex items-start gap-3">
                <MessageSquare size={20} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-base md:text-base text-blue-700 font-black mb-0.5 uppercase tracking-wide">{inquiry.status === 'Accepted' ? 'Your Acceptance Note' : 'Your Initial Note'}</p>
                  <p className="text-blue-900 text-base md:text-base font-medium leading-snug">{inquiry.clientNote || inquiry.clientRemarks}</p>
                </div>
              </div>
            )}
            {inquiry.adminRemarks && (
              <div className="bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 shadow-sm flex items-start gap-3">
                <ClipboardEdit size={20} className="text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-base md:text-base text-slate-700 font-black mb-0.5 uppercase tracking-wide">Note from Admin</p>
                  <p className="text-slate-900 text-base md:text-base font-medium leading-snug">{inquiry.adminRemarks}</p>
                </div>
              </div>
            )}
          </div>

          {inquiry.status === 'Accepted' && inquiry.linkedOrder && (
             <div className="flex flex-col justify-center bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
               <span className="text-slate-500 text-sm md:text-base font-bold uppercase tracking-wide mb-0.5">Converted to Order</span>
               <span className="flex items-center gap-1.5 font-mono text-lg md:text-xl font-black text-slate-900">
                 {inquiry.linkedOrder.orderId} <ArrowRight size={20} className="text-emerald-500" />
               </span>
             </div>
          )}

        </div>

        <div className="bg-white border-t border-slate-200 p-4 shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] z-20">
          
          {isPreQuote && (
            <button 
              onClick={() => { onClose(); onDelete(inquiry); }} 
              disabled={isBusy} 
              className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-700 text-base md:text-lg font-black py-3.5 md:py-4 rounded-xl border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50 shadow-sm"
            >
              <XCircle size={20} /> Withdraw Inquiry
            </button>
          )}

          {hasQuoteData && (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-900 rounded-xl px-4 py-3 md:py-4 flex justify-between items-center shadow-md">
                <div>
                  <span className="text-slate-300 text-sm md:text-base font-bold uppercase tracking-wide block">Final Payable</span>
                  <span className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-wider">(Incl. of GST)</span>
                </div>
                <span className="text-emerald-400 font-black text-2xl md:text-3xl">{formatMoney(inquiry.discountedTotalPrice || inquiry.totalPrice)}</span>
              </div>

              {isQuoted && activeAction && (
                <div className="space-y-3 animate-fadeIn">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={activeAction === 'accept' ? 'Add a note for admin (optional)' : 'Reason for rejecting (required)'}
                    rows={2}
                    className="w-full text-base md:text-lg border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none shadow-sm"
                  />
                  <div className="flex flex-wrap md:flex-nowrap gap-3">
                    <button onClick={() => setActiveAction(null)} className="flex-1 md:flex-none md:w-32 py-3 md:py-3.5 rounded-xl text-base md:text-lg font-black text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-sm">
                      Back
                    </button>
                    <button
                      onClick={() => (activeAction === 'accept' ? onConvert(inquiry, note) : onReject(inquiry, note))}
                      disabled={(activeAction === 'accept' ? isConverting : isRejecting) || (activeAction === 'reject' && !note.trim())}
                      className={`flex-[2] py-3 md:py-3.5 rounded-xl text-base md:text-lg font-black text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-md ${activeAction === 'accept' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                      {isBusy ? <Loader2 size={20} className="animate-spin" /> : null}
                      {activeAction === 'accept' ? 'Confirm & Order' : 'Confirm Reject'}
                    </button>
                  </div>
                </div>
              )}

              {isQuoted && !activeAction && (
                <div className="flex flex-col md:flex-row gap-3">
                  <button onClick={() => setActiveAction('accept')} className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 md:py-4 rounded-xl text-base md:text-lg flex items-center justify-center gap-2 transition-colors shadow-md">
                    <Check size={20} /> Accept Quote & Order
                  </button>
                  <button onClick={() => setActiveAction('reject')} className="flex-1 bg-red-50 text-red-700 font-black py-3 md:py-3.5 rounded-xl text-base md:text-lg border border-red-200 hover:bg-red-100 transition-colors shadow-sm">
                    Reject Quote
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}