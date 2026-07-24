// // src/features/Admin/OrdersPage/modals/InquiryReadOnlyModal.jsx
// import { X, ArrowRight, Sparkles, ClipboardEdit, MessageSquare } from 'lucide-react';
// import { useModalTrap, useScrollLock } from '../../../../hooks/useBackHandler';
// import { INQUIRY_STATUS_META, formatMoney, productLabel } from '../utils';

// export default function InquiryReadOnlyModal({ inquiry, onClose }) {
//   useModalTrap(true, { onBackClose: onClose, customId: `inquiry_view_${inquiry._id}` });
//   useScrollLock(true);
//   const meta = INQUIRY_STATUS_META[inquiry.status] || INQUIRY_STATUS_META.Pending;
//   const StatusIcon = meta.icon;

//   const isPreQuote = ['Pending', 'Viewed'].includes(inquiry.status);
//   const hasQuoteData = !isPreQuote;

//   return (
//     <div className="fixed inset-0 z-[100] bg-black/60 flex items-end md:items-center md:justify-center">
//       <div className="w-full md:max-w-2xl bg-white rounded-t-3xl md:rounded-3xl max-h-[90dvh] overflow-hidden flex flex-col shadow-2xl">

//         <div className="bg-white px-5 pt-4 pb-3 border-b border-slate-100 flex justify-between items-start z-10 shrink-0">
//           <div>
//             <p className="font-mono text-slate-500 text-base">{inquiry.inquiryId}</p>
//             <h3 className="text-slate-900 font-black text-xl md:text-2xl mt-0.5">{inquiry.clientId?.establishmentName || 'Unknown client'}</h3>
//             <span className={`inline-flex items-center gap-1.5 text-xs md:text-sm font-bold px-2.5 py-1 rounded-md mt-2 shadow-sm border border-slate-200/50 ${meta.bg} ${meta.color}`}>
//               <StatusIcon size={14} /> {inquiry.status}
//             </span>
//           </div>
//           <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors bg-slate-50 border border-slate-200 shadow-sm"><X size={20} className="text-slate-500" /></button>
//         </div>

//         <div className="p-4 md:p-6 overflow-y-auto space-y-4 md:space-y-5 bg-slate-50/50 flex-1 min-h-0">

//           <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
//             <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 shrink-0 flex justify-between items-center">
//               <h4 className="text-sm md:text-base font-bold text-slate-700 uppercase tracking-wide">
//                 {isPreQuote ? 'Requested Items' : 'Quoted Items'} ({(inquiry.items || []).length})
//               </h4>
//               <span className={`px-2.5 py-1 rounded-md text-xs md:text-sm font-black uppercase tracking-wider shadow-sm ${inquiry.billPreference === 'Cash' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
//                 {isPreQuote ? 'Desired: ' : 'Quoted: '} {inquiry.billPreference || 'Credit'}
//               </span>
//             </div>

//             <div className="p-3 md:p-4 space-y-3">
//               {(inquiry.items || []).map((item, i) => {
//                 const shortCode = item.productId?.companyId?.shortCode || item.productId?.company || '';

//                 let expiryText = 'N/A';
//                 if (item.offerBatchId?.expiryDate || item.offerBatchId?.expiry || item.closestExpiry) {
//                   const d = new Date(item.offerBatchId?.expiryDate || item.offerBatchId?.expiry || item.closestExpiry);
//                   if (!isNaN(d)) expiryText = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
//                 }

//                 // ✨ FIX: Bulletproof Fallbacks to guarantee MRP and PTR are never 0 if product exists!
//                 const mrp = item.offerBatchId?.mrp || item.fallbackMrp || item.mrp || item.productId?.mrp || 0;
//                 const estPTR = item.estPTR || item.productId?.defaultRate || (mrp * 0.8) || 0;

//                 const requestedQty = item.requestedQty || item.chargeableQty || 0;
//                 const providedQty = item.chargeableQty ?? 0;
//                 const freeQty = item.freeQty || 0;
//                 const providedDisplay = freeQty > 0 ? `${providedQty} + ${freeQty}` : providedQty;

//                 let lineDiscStr = null;
//                 if (item.discountType === 'percent' && item.discountValue > 0) lineDiscStr = `${item.discountValue}%`;
//                 else if (item.discountType === 'amount' && item.discountValue > 0) lineDiscStr = `₹${item.discountValue}`;

//                 return (
//                   <div key={i} className="relative border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col p-3 space-y-3">

//                     <div className="absolute top-0 left-0 bg-slate-800 text-white text-xs md:text-sm font-semibold px-2 py-1 rounded-br-2xl rounded-tl-xl shadow-sm z-10">
//                       #{i + 1}
//                     </div>

//                     <div className="w-full rounded-xl p-2 bg-slate-50 border border-slate-200 shrink-0">
//                       <p className="font-black text-slate-900 text-lg md:text-xl leading-tight truncate">
//                         {productLabel(item.productId)}
//                         {shortCode && <span className="text-slate-500 font-semibold ml-1.5 text-sm md:text-base">({shortCode})</span>}
//                       </p>
//                     </div>

//                     <div className="w-full px-1">

//                       <div className="flex justify-between items-center gap-x-3 md:gap-x-5 gap-y-2 text-base md:text-lg font-medium">
//                         <span className="text-slate-600">MRP: <strong className="text-slate-900">{formatMoney(mrp)}</strong></span>
//                         <span className="text-slate-600">{isPreQuote ? 'Est. Exp:' : 'Exp:'} <strong className="text-slate-900">{expiryText}</strong></span>
//                         <span className="text-slate-600">Req: <strong className="text-slate-900">{requestedQty}</strong></span>

//                         {hasQuoteData && item.adminOfferedPTR != null && (
//                           <span className="text-slate-600">Prov: <strong className="text-slate-900">{providedDisplay}</strong></span>
//                         )}
//                       </div>

//                       <div className="flex justify-between items-center gap-x-3 md:gap-x-5 gap-y-2 text-base md:text-lg font-medium mt-1.5">
//                         {hasQuoteData && item.adminOfferedPTR != null ? (
//                           <span className="text-slate-600">PTR: <strong className="text-slate-900">{formatMoney(item.adminOfferedPTR)}</strong></span>
//                         ) : (
//                           <span className="text-slate-400">Est. PTR: <strong className="text-slate-600">{formatMoney(estPTR)}</strong></span>
//                         )}

//                         {hasQuoteData && lineDiscStr && (
//                           <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-sm font-bold shadow-sm border border-amber-200">
//                             Disc: {lineDiscStr}
//                           </span>
//                         )}

//                         {hasQuoteData && item.offerReason && (
//                           <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-sm font-bold shadow-sm border border-amber-200">
//                             <Sparkles size={14} /> Offer: {item.offerReason}
//                           </span>
//                         )}

//                         {hasQuoteData && item.estimatedLineTotal > 0 && (
//                           <span className="text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded font-black text-sm md:text-base shadow-sm">
//                             Total: {formatMoney(item.estimatedLineTotal)}
//                           </span>
//                         )}
//                       </div>

//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//           {/* ✨ FIX: Perfectly formatted Notes & Discounts Grid */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-2">
//             {inquiry.discountValue > 0 && (
//               <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 shadow-sm md:col-span-2 flex items-start gap-3">
//                 <Sparkles size={20} className="text-amber-500 shrink-0 mt-0.5" />
//                 <div>
//                   <p className="text-sm md:text-base text-amber-700 font-black mb-0.5 uppercase tracking-wide">
//                     Bill Discount ({inquiry.discountType === 'percent' ? `${inquiry.discountPercent}%` : `₹${inquiry.discountValue}`})
//                   </p>
//                   <p className="text-amber-900 text-sm md:text-base font-medium leading-snug">{inquiry.discountReason}</p>
//                 </div>
//               </div>
//             )}

//             {inquiry.clientRemarks && (
//               <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 shadow-sm flex items-start gap-3">
//                 <MessageSquare size={20} className="text-blue-500 shrink-0 mt-0.5" />
//                 <div>
//                   <p className="text-sm md:text-base text-blue-700 font-black mb-0.5 uppercase tracking-wide">Client's Initial Note</p>
//                   <p className="text-blue-900 text-sm md:text-base font-medium leading-snug">{inquiry.clientRemarks}</p>
//                 </div>
//               </div>
//             )}

//             {inquiry.adminRemarks && (
//               <div className="bg-slate-100 border border-slate-300 rounded-xl px-4 py-3 shadow-sm flex items-start gap-3">
//                 <ClipboardEdit size={20} className="text-slate-500 shrink-0 mt-0.5" />
//                 <div>
//                   <p className="text-sm md:text-base text-slate-700 font-black mb-0.5 uppercase tracking-wide">Admin Remarks</p>
//                   <p className="text-slate-900 text-sm md:text-base font-medium leading-snug">{inquiry.adminRemarks}</p>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Conversion Details */}
//           {inquiry.status === 'Accepted' && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
//               {inquiry.clientNote && (
//                 <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 shadow-sm">
//                   <p className="text-sm md:text-base text-emerald-700 font-black mb-0.5 uppercase tracking-wide">Client's Acceptance Note</p>
//                   <p className="text-emerald-900 text-sm md:text-base font-medium">{inquiry.clientNote}</p>
//                 </div>
//               )}
//               {inquiry.linkedOrder && (
//                 <div className="flex flex-col justify-center bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
//                   <span className="text-slate-500 text-sm md:text-base font-bold uppercase tracking-wide mb-0.5">Converted to Order</span>
//                   <span className="flex items-center gap-1.5 font-mono text-lg font-black text-slate-900">
//                     {inquiry.linkedOrder.orderId} <ArrowRight size={18} className="text-emerald-500" />
//                   </span>
//                 </div>
//               )}
//             </div>
//           )}

//           {inquiry.status === 'Rejected' && inquiry.rejectionReason && (
//             <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 shadow-sm">
//               <p className="text-sm md:text-base text-red-700 font-black mb-0.5 uppercase tracking-wide">Rejection Reason</p>
//               <p className="text-red-900 text-sm md:text-base font-medium">{inquiry.rejectionReason}</p>
//             </div>
//           )}
//         </div>

//         {hasQuoteData && (
//           <div className="bg-white border-t border-slate-200 p-4 shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] z-20">
//             <div className="bg-slate-900 rounded-xl px-4 py-3 md:py-4 flex justify-between items-center shadow-md">
//               <div>
//                 <span className="text-slate-300 text-sm md:text-base font-bold uppercase tracking-wide block">Final Payable</span>
//                 <span className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-wider">(Incl. of GST)</span>
//               </div>
//               <span className="text-emerald-400 font-black text-2xl md:text-3xl">{formatMoney(inquiry.discountedTotalPrice || inquiry.totalPrice)}</span>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }







// src/features/Admin/OrdersPage/modals/InquiryReadOnlyModal.jsx
/**
 * ============================================================================
 * 🛡️ INQUIRY READ-ONLY MODAL (ADMIN SIDE)
 * ============================================================================
 * This modal allows the Admin to view an inquiry without editing it.
 * 
 * 1. Data Fallback Architecture:
 *    Because inquiries can be months old, we never trust that every field exists.
 *    - MRP: Tries specific batch -> snapshot -> master product -> 0.
 *    - PTR: Tries admin quote -> snapshot -> master product default -> (MRP * 0.8) -> 0.
 *    - Expiry: Tries specific batch -> snapshot -> closest safe expiry -> 'N/A'.
 * 
 * 2. Visual Grouping:
 *    - Items are displayed in a robust 2-row grid exactly like the client side.
 *    - Notes and Discounts are grouped beautifully at the bottom.
 * ============================================================================
 */
import { X, ArrowRight, Sparkles, ClipboardEdit, MessageSquare } from 'lucide-react';
import { useModalTrap, useScrollLock } from '../../../../hooks/useBackHandler';
import { INQUIRY_STATUS_META, formatMoney, productLabel } from '../utils';

export default function InquiryReadOnlyModal({ inquiry, onClose }) {
  useModalTrap(true, { onBackClose: onClose, customId: `inquiry_view_${inquiry._id}` });
  useScrollLock(true);
  
  const meta = INQUIRY_STATUS_META[inquiry.status] || INQUIRY_STATUS_META.Pending;
  const StatusIcon = meta.icon;

  const isPreQuote = ['Pending', 'Viewed'].includes(inquiry.status);
  const hasQuoteData = !isPreQuote;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-end md:items-center md:justify-center">
      <div className="w-full md:max-w-2xl bg-white rounded-t-3xl md:rounded-3xl max-h-[90dvh] overflow-hidden flex flex-col shadow-2xl animate-slideUp md:animate-none">

        <div className="bg-white px-5 pt-4 pb-3 border-b border-slate-100 flex justify-between items-start z-10 shrink-0">
          <div>
            <p className="font-mono text-slate-500 text-base">{inquiry.inquiryId}</p>
            <h3 className="text-slate-900 font-black text-xl md:text-2xl mt-0.5">{inquiry.clientId?.establishmentName || 'Unknown client'}</h3>
            <span className={`inline-flex items-center gap-1.5 text-xs md:text-sm font-bold px-2.5 py-1 rounded-md mt-2 shadow-sm border border-slate-200/50 ${meta.bg} ${meta.color}`}>
              <StatusIcon size={14} /> {inquiry.status}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors bg-slate-50 border border-slate-200 shadow-sm"><X size={20} className="text-slate-500" /></button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto space-y-4 md:space-y-5 bg-slate-50/50 flex-1 min-h-0">

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 shrink-0 flex justify-between items-center">
              <h4 className="text-sm md:text-base font-bold text-slate-700 uppercase tracking-wide">
                {isPreQuote ? 'Requested Items' : 'Quoted Items'} ({(inquiry.items || []).length})
              </h4>
              <span className={`px-2.5 py-1 rounded-md text-xs md:text-sm font-black uppercase tracking-wider shadow-sm ${inquiry.billPreference === 'Cash' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                {isPreQuote ? 'Desired: ' : 'Quoted: '} {inquiry.billPreference || 'Credit'}
              </span>
            </div>

            <div className="p-3 md:p-4 space-y-3">
              {(inquiry.items || []).map((item, i) => {
                const shortCode = item.productId?.companyId?.shortCode || item.productId?.company || '';

                // ✨ FIX 1: Bulletproof Expiry Check (Using d.getTime())
                // ✨ FIX 1: Aggressively resilient MongoDB Date parser
                let expiryText = 'N/A';
                const rawDate = item.expiryDate || item.closestExpiry || item.offerBatchId?.expiryDate || item.offerBatchId?.expiry;
                
                if (rawDate) {
                  try {
                    // Force it into a proper date string/number if Mongoose sent a weird object
                    const parsedDate = new Date(typeof rawDate === 'object' && rawDate.$date ? rawDate.$date : rawDate);
                    
                    if (!isNaN(parsedDate.getTime())) {
                      const m = String(parsedDate.getMonth() + 1).padStart(2, '0');
                      const y = String(parsedDate.getFullYear()).slice(-2);
                      expiryText = `${m}/${y}`;
                    }
                  } catch (e) {
                     console.error("Failed to parse date:", rawDate);
                  }
                }

                // ✨ FIX 2: Resolved ESLint Parenthesis / Mixing error by splitting logic
                const mrp = item.offerBatchId?.mrp || item.fallbackMrp || item.mrp || item.productId?.mrp || 0;
                
                const fallbackPtr = item.estimatedPrice ?? item.finalPrice ?? item.estPTR ?? item.productId?.defaultRate ?? (mrp * 0.8);
                const ptr = hasQuoteData 
                  ? (item.adminOfferedPTR ?? item.finalPrice ?? 0) 
                  : (fallbackPtr || 0);

                const requestedQty = item.requestedQty || item.qty || 0;
                const providedQty = item.chargeableQty ?? 0;
                const freeQty = item.freeQty || 0;
                const providedDisplay = freeQty > 0 ? `${providedQty} + ${freeQty}` : providedQty;

                const lineTotal = hasQuoteData 
                  ? (item.lineTotal || item.adminEstimatedLineTotal || 0) 
                  : (item.estimatedLineTotal || (ptr * requestedQty) || 0);

                const isOfferBatch = !!(item.offerDescription || item.offerBatchId || item.batchId);

                let lineDiscStr = null;
                if (item.discountType === 'percent' && item.discountValue > 0) lineDiscStr = `${item.discountValue}%`;
                else if (item.discountType === 'amount' && item.discountValue > 0) lineDiscStr = `₹${item.discountValue}`;

                return (
                  <div key={i} className="relative border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col p-3 space-y-3">

                    <div className="absolute top-0 left-0 bg-slate-800 text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-br-2xl rounded-tl-xl shadow-sm z-10">
                      #{i + 1}
                    </div>

                    <div className="w-full rounded-xl p-2 bg-slate-50 border border-slate-200 shrink-0">
                      <p className="font-black text-slate-900 text-lg md:text-xl leading-tight truncate pl-10 md:pl-12">
                        {productLabel(item.productId)}
                        {shortCode && <span className="text-slate-500 font-semibold ml-1.5 text-sm md:text-base">({shortCode})</span>}
                      </p>
                    </div>

                    <div className="w-full px-1">

                      <div className="flex justify-between items-center gap-x-3 md:gap-x-5 gap-y-2 text-sm md:text-base font-medium">
                        <span className="text-slate-600">MRP: <strong className="text-slate-900">{formatMoney(mrp)}</strong></span>
                        <span className="text-slate-600">{(hasQuoteData || isOfferBatch) ? 'Exp:' : 'Est. Exp:'} <strong className="text-slate-900">{expiryText}</strong></span>
                        <span className="text-slate-600">Req: <strong className="text-slate-900">{requestedQty}</strong></span>

                        {hasQuoteData && item.adminOfferedPTR != null && (
                          <span className="text-slate-600">Prov: <strong className="text-slate-900">{providedDisplay}</strong></span>
                        )}
                      </div>

                      <div className="flex justify-between items-center gap-x-3 md:gap-x-5 gap-y-2 text-sm md:text-base font-medium mt-1.5">
                        {(hasQuoteData || isOfferBatch) ? (
                          <span className="text-slate-600">PTR: <strong className="text-slate-900">{formatMoney(ptr)}</strong></span>
                        ) : (
                          <span className="text-slate-400">Est. PTR: <strong className="text-slate-600">{formatMoney(ptr)}</strong></span>
                        )}

                        {hasQuoteData && lineDiscStr && (
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-sm font-bold shadow-sm border border-amber-200">
                            Disc: {lineDiscStr}
                          </span>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-2">
            {inquiry.discountValue > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 shadow-sm md:col-span-2 flex items-start gap-3">
                <Sparkles size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm md:text-base text-amber-700 font-black mb-0.5 uppercase tracking-wide">
                    Bill Discount ({inquiry.discountType === 'percent' ? `${inquiry.discountPercent}%` : `₹${inquiry.discountValue}`})
                  </p>
                  <p className="text-amber-900 text-sm md:text-base font-medium leading-snug">{inquiry.discountReason}</p>
                </div>
              </div>
            )}

            {inquiry.clientRemarks && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 shadow-sm flex items-start gap-3">
                <MessageSquare size={20} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm md:text-base text-blue-700 font-black mb-0.5 uppercase tracking-wide">Client's Initial Note</p>
                  <p className="text-blue-900 text-sm md:text-base font-medium leading-snug">{inquiry.clientRemarks}</p>
                </div>
              </div>
            )}

            {inquiry.adminRemarks && (
              <div className="bg-slate-100 border border-slate-300 rounded-xl px-4 py-3 shadow-sm flex items-start gap-3">
                <ClipboardEdit size={20} className="text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm md:text-base text-slate-700 font-black mb-0.5 uppercase tracking-wide">Admin Remarks</p>
                  <p className="text-slate-900 text-sm md:text-base font-medium leading-snug">{inquiry.adminRemarks}</p>
                </div>
              </div>
            )}
          </div>

          {/* Conversion Details */}
          {inquiry.status === 'Accepted' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {inquiry.clientNote && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 shadow-sm">
                  <p className="text-sm md:text-base text-emerald-700 font-black mb-0.5 uppercase tracking-wide">Client's Acceptance Note</p>
                  <p className="text-emerald-900 text-sm md:text-base font-medium">{inquiry.clientNote}</p>
                </div>
              )}
              {inquiry.linkedOrder && (
                <div className="flex flex-col justify-center bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                  <span className="text-slate-500 text-sm md:text-base font-bold uppercase tracking-wide mb-0.5">Converted to Order</span>
                  <span className="flex items-center gap-1.5 font-mono text-lg font-black text-slate-900">
                    {inquiry.linkedOrder.orderId} <ArrowRight size={18} className="text-emerald-500" />
                  </span>
                </div>
              )}
            </div>
          )}

          {inquiry.status === 'Rejected' && inquiry.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 shadow-sm">
              <p className="text-sm md:text-base text-red-700 font-black mb-0.5 uppercase tracking-wide">Rejection Reason</p>
              <p className="text-red-900 text-sm md:text-base font-medium">{inquiry.rejectionReason}</p>
            </div>
          )}
        </div>

        {hasQuoteData && (
          <div className="bg-white border-t border-slate-200 p-4 shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] z-20">
            <div className="bg-slate-900 rounded-xl px-4 py-3 md:py-4 flex justify-between items-center shadow-md">
              <div>
                <span className="text-slate-300 text-sm md:text-base font-bold uppercase tracking-wide block">Final Payable</span>
                <span className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-wider">(Incl. of GST)</span>
              </div>
              <span className="text-emerald-400 font-black text-2xl md:text-3xl">{formatMoney(inquiry.discountedTotalPrice || inquiry.totalPrice)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}