// import { useState, useEffect } from 'react';
// import { X, Loader2, Send, CheckCircle2, AlertCircle, AlertTriangle, MessageSquare } from 'lucide-react';
// import { toast } from 'sonner';
// import { useModalTrap, useScrollLock } from '../../../../hooks/useBackHandler';
// import { formatMoney, productLabel } from '../utils';

// import QuoteEditRowModal, { calcQuoteLine, formatExp } from './QuoteEditRowModal';

// export default function QuoteBuilderModal({ inquiry, allProducts, onClose, onSent, onReject, busy }) {
//   useModalTrap(true, { onBackClose: onClose, customId: `quote_builder_${inquiry._id}` });
//   useScrollLock(true);

//   const STORAGE_KEY = `quote_builder_${inquiry._id}`;
//   const loadSavedState = () => {
//     try {
//       const saved = sessionStorage.getItem(STORAGE_KEY);
//       if (saved) return JSON.parse(saved);
//     } catch (e) { }
//     return null;
//   };

//   const savedState = loadSavedState();

//   const [rows, setRows] = useState(() => {
//     if (savedState?.rows) return savedState.rows;
//     return (inquiry.items || []).map((item) => {
      
//       // ✨ FIX 1: Bulletproof ID matching for MongoDB ObjectIds
//       const pidStr = String(item.productId?._id || item.productId);
//       const catalogProduct = allProducts.find((p) => 
//          String(p.productId) === pidStr || String(p.id) === pidStr || String(p._id) === pidStr
//       );
//       const fallbackProd = typeof item.productId === 'object' ? item.productId : {};

//       // ✨ FIX 2: Safely extract batches
//       const batches = catalogProduct?.batches || fallbackProd.batches || [];
      
//       // Check if client requested a specific offer batch
//       const reqBatchId = String(item.offerBatchId?._id || item.offerBatchId || '');
//       let selectedBatch = batches.find(b => String(b._id) === reqBatchId);
//       if (!selectedBatch) selectedBatch = batches[0] || {};

//       // ✨ FIX 3: Bulletproof Math & Snapshot Fallbacks
//       const itemMrp = item.fallbackMrp || item.mrp || selectedBatch.mrp || catalogProduct?.mrp || fallbackProd.mrp || 0;
      
//       const defaultPtr = item.estPTR || catalogProduct?.defaultRate || fallbackProd.defaultRate || (itemMrp * 0.8) || 0;

//       // ✨ FIX 4: Aggressive MongoDB Date parsing for Expiry
//       let safeExp = '';
//       const rawDate = item.expiryDate || item.closestExpiry || item.offerBatchId?.expiryDate || selectedBatch.expiryDate || selectedBatch.expiry;
//       if (rawDate) {
//         try {
//           const d = new Date(typeof rawDate === 'object' && rawDate.$date ? rawDate.$date : rawDate);
//           if (!isNaN(d.getTime())) safeExp = d.toISOString();
//         } catch(e) {}
//       }

//       return {
//         productId: pidStr, // Keep as string for safe mapping
//         productName: productLabel(item.productId) || catalogProduct?.name || 'Unknown Product',
//         shortCode: fallbackProd.companyId?.shortCode || fallbackProd.company || catalogProduct?.companyShortCode || '',
//         packing: fallbackProd.packing || catalogProduct?.packing || '',
//         gstRate: catalogProduct?.gstRate || fallbackProd.gstRate || 0,
//         requestedQty: item.requestedQty || item.qty || 0,
//         batches,
//         batchNo: selectedBatch.no || selectedBatch.batchNumber || '',
//         expiryDate: safeExp,
//         adminOfferedPTR: defaultPtr,
//         chargeableQty: item.requestedQty || item.qty || 0,
//         freeQty: 0,
//         discountType: 'percent',
//         discountValue: 0,
//         offerBatchId: reqBatchId && reqBatchId !== 'undefined' ? reqBatchId : undefined,
//         mrp: itemMrp,
//         isEdited: false,
//       };
//     });
//   });

//   const [globalDiscountType, setGlobalDiscountType] = useState(savedState?.globalDiscountType || 'percent');
//   const [globalDiscountValue, setGlobalDiscountValue] = useState(savedState?.globalDiscountValue || 0);
//   const [discountReason, setDiscountReason] = useState(savedState?.discountReason || '');
//   const [adminRemarks, setAdminRemarks] = useState(savedState?.adminRemarks || '');
//   const [billType, setBillType] = useState(savedState?.billType || inquiry.billPreference || 'Credit');

//   const [editingIndex, setEditingIndex] = useState(null);
//   const [showRejectPrompt, setShowRejectPrompt] = useState(false);
//   const [rejectReason, setRejectReason] = useState('');

//   useEffect(() => {
//     sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
//       rows, globalDiscountType, globalDiscountValue, discountReason, adminRemarks, billType
//     }));
//   }, [rows, globalDiscountType, globalDiscountValue, discountReason, adminRemarks, billType, STORAGE_KEY]);

//   const subtotal = rows.reduce((s, r) => s + calcQuoteLine(r).finalTotal, 0);
//   const finalGlobalDiscountAmount = globalDiscountType === 'percent'
//     ? subtotal * (globalDiscountValue / 100)
//     : (globalDiscountValue || 0);
//   const exactFinalTotal = subtotal - finalGlobalDiscountAmount;
//   const roundedFinalTotal = Math.round(exactFinalTotal);
//   const roundOffAmount = roundedFinalTotal - exactFinalTotal;

//   const unreviewedCount = rows.filter(r => !r.isEdited).length;

//   const handleSend = async () => {
//     if (globalDiscountValue > 0 && !discountReason.trim()) {
//       toast.error('A discount reason is required whenever a bill discount is applied.');
//       return;
//     }

//     const payload = {
//       items: rows.map((r) => ({
//         productId: r.productId,
//         adminOfferedPTR: r.adminOfferedPTR,
//         chargeableQty: r.chargeableQty,
//         freeQty: r.freeQty,
//         offerBatchId: r.offerBatchId,
//         discountType: r.discountType,
//         discountValue: r.discountValue,
//         discountAmount: calcQuoteLine(r).disc,
//         estimatedLineTotal: calcQuoteLine(r).finalTotal,
//       })),
//       discountType: globalDiscountType,
//       discountPercent: globalDiscountType === 'percent' ? globalDiscountValue : 0,
//       discountValue: globalDiscountValue,
//       discountReason,
//       adminRemarks,
//       billPreference: billType,
//     };

//     await onSent(payload);
//     sessionStorage.removeItem(STORAGE_KEY);
//   };

//   const handleReject = async () => {
//     if (!rejectReason.trim()) {
//       toast.error("Please provide a reason for rejecting this inquiry.");
//       return;
//     }
//     await onReject(inquiry._id, rejectReason);
//     sessionStorage.removeItem(STORAGE_KEY);
//   };

//   return (
//     <>
//       <div className="fixed inset-0 z-[100] bg-black/60 flex items-end md:items-center md:justify-center p-0 md:p-4">
//         <div className="w-full md:max-w-2xl bg-slate-50 rounded-t-xl md:rounded-2xl h-[92dvh] md:h-auto md:max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden animate-slideUp">

//           <div className="bg-white px-4 pt-3 pb-2 border-b border-slate-200 flex justify-between items-start z-10 shrink-0">
//             <div>
//               <p className="font-mono text-slate-500 text-base">{inquiry.inquiryId}</p>
//               <h3 className="text-slate-900 font-bold text-lg md:text-xl leading-tight">{inquiry.clientId?.establishmentName}</h3>
//             </div>
//             <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
//               <X size={22} className="text-slate-500" />
//             </button>
//           </div>

//           <div className="p-3 md:p-5 space-y-4 flex-1 overflow-y-auto">

//             <div className="space-y-1">
//               <h2 className="text-slate-900 font-black text-xl md:text-2xl">Quote Builder</h2>
//               <p className="text-base md:text-base text-slate-500 font-medium">Review and edit the quote before sending it to the client.</p>
//             </div>

//             <div className="space-y-4 py-4">
//               <p className="text-lg md:text-base font-black text-slate-500 uppercase tracking-wider mb-4">Requested Items</p>
//               {rows.map((row, idx) => (
//                 <div key={row.productId}>
//                   <button
//                     onClick={() => setEditingIndex(idx)}
//                     className={`relative w-full text-left bg-white border rounded-xl flex flex-col p-3 space-y-3 transition-all hover:shadow-sm active:scale-[0.99]
//         ${row.isEdited ? 'border-emerald-200 shadow-sm' : 'border-amber-200 shadow-sm shadow-amber-100'}`}
//                   >

//                     <div className={`absolute top-0 left-0 text-white text-xs md:text-sm font-bold px-2 py-1 rounded-br-2xl rounded-tl-xl shadow-sm z-10 ${row.isEdited ? 'bg-slate-800' : 'bg-amber-600'}`}>
//                       #{idx + 1}
//                     </div>

//                     <div className={`w-full rounded-xl p-2 flex items-start justify-between gap-3 shrink-0 ${row.isEdited ? 'bg-slate-50 border border-slate-200' : 'bg-amber-50 border border-amber-200'}`}>
//                       <div className="flex-1 min-w-0">
//                         <p className="font-black text-slate-900 text-lg md:text-xl leading-tight truncate pl-10 md:pl-12">
//                           {row.productName}
//                           {row.shortCode && <span className="text-slate-500 font-semibold ml-1.5 text-sm md:text-base">({row.shortCode})</span>}
//                         </p>
//                       </div>
//                       {row.isEdited && (
//                         <CheckCircle2 size={24} className="text-emerald-500 shrink-0 mt-0.5" />
//                       )}
//                     </div>

//                     <div className="w-full px-1">

//                       {/* Row 1 */}
//                       <div className="flex justify-between items-center gap-x-5 gap-y-2 text-base md:text-base font-medium">
//                         <span className="text-slate-600">MRP: <strong className="text-slate-900">{formatMoney(row.mrp)}</strong></span>
//                         <span className="text-slate-600">{row.isEdited ? 'Exp:' : 'Est. Exp:'} <strong className="text-slate-900">{formatExp(row.expiryDate)}</strong></span>
//                         <span className="text-slate-600">Req: <strong className="text-slate-900">{row.requestedQty}</strong></span>

//                         {row.isEdited && (
//                           <span className="text-slate-600">Prov: <strong className="text-slate-900">{row.chargeableQty}{row.freeQty > 0 ? `+${row.freeQty}` : ''}</strong></span>
//                         )}
//                       </div>

//                       {/* Row 2 */}
//                       <div className="flex justify-between items-center gap-x-5 gap-y-2 text-base font-medium mt-1.5">
//                         {row.isEdited ? (
//                           <span className="text-slate-600">PTR: <strong className="text-slate-900">₹{row.adminOfferedPTR}</strong></span>
//                         ) : (
//                           <span className="text-slate-400">Est. PTR: <strong className="text-slate-600">₹{row.adminOfferedPTR}</strong></span>
//                         )}

//                         {row.discountValue > 0 && (
//                           <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-sm font-bold shadow-sm border border-amber-200">
//                             Disc: {row.discountType === 'percent' ? `${row.discountValue}%` : `₹${row.discountValue}`}
//                           </span>
//                         )}

//                         {row.isEdited && (
//                           <span className="text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded font-black text-sm md:text-base shadow-sm">
//                             Total: {formatMoney(calcQuoteLine(row).finalTotal)}
//                           </span>
//                         )}
//                       </div>

//                     </div>

//                   </button>
//                 </div>
//               ))}

//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
//               {/* Bill Discount Card */}
//               <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-3 flex flex-col shadow-sm">
//                 <div className="flex items-center justify-between gap-3 mb-2">
//                   <span className="font-black text-amber-900 uppercase tracking-wide text-base">Bill Discount</span>

//                   <div className="flex items-center h-10 rounded-lg shadow-sm">
//                     <input
//                       type="number"
//                       value={globalDiscountValue}
//                       onChange={(e) => setGlobalDiscountValue(e.target.value)}
//                       onFocus={() => {
//                         if (globalDiscountValue === 0 || globalDiscountValue === '0') {
//                           setGlobalDiscountValue('');
//                         }
//                       }}
//                       onBlur={(e) => {
//                         const parsed = parseFloat(e.target.value);
//                         setGlobalDiscountValue(isNaN(parsed) || parsed < 0 ? 0 : parsed);
//                       }}
//                       className="w-20 md:w-24 h-full border border-amber-300 border-r-0 bg-white rounded-l-lg text-center font-black focus:outline-none focus:bg-amber-100/50 text-base md:text-lg text-amber-900 transition-colors"
//                     />

//                     <button
//                       onClick={() => setGlobalDiscountType(t => t === 'percent' ? 'amount' : 'percent')}
//                       className="h-full bg-white border border-amber-300 rounded-r-lg px-3 sm:px-4 flex items-center text-amber-800 font-black hover:bg-amber-100 transition-colors text-base md:text-lg shrink-0"
//                     >
//                       {globalDiscountType === 'percent' ? '%' : '₹'}
//                     </button>
//                   </div>
//                 </div>

//                 <input
//                   value={discountReason}
//                   onChange={(e) => setDiscountReason(e.target.value)}
//                   placeholder="Reason (e.g. Festival)"
//                   className="w-full text-base font-medium border border-amber-300 bg-white rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 shadow-inner"
//                 />

//                 {finalGlobalDiscountAmount > 0 && (
//                   <span className="text-amber-700 font-black text-sm md:text-base text-right mt-2 animate-fadeIn">
//                     Saved {formatMoney(finalGlobalDiscountAmount)}
//                   </span>
//                 )}
//               </div>


//               {/* Bill Type Card */}
//               <div className="bg-white border border-slate-200 rounded-xl px-4 py-4 shadow-sm flex flex-col justify-between">
//                 <div className="mb-3">
//                   <label className="text-base md:text-base font-black text-slate-700 flex items-center gap-2 uppercase tracking-wide mb-1">
//                     Quoted Bill Type
//                     {inquiry?.billPreference && (
//                       <span className="text-sm sm:text-sm bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-bold tracking-wide normal-case shadow-sm">
//                         Pref: {inquiry.billPreference}
//                       </span>
//                     )}
//                   </label>
//                 </div>

//                 <select
//                   value={billType}
//                   onChange={(e) => setBillType(e.target.value)}
//                   className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-base md:text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all shadow-sm cursor-pointer"
//                 >
//                   <option value="Credit">Credit Bill</option>
//                   <option value="Cash">Cash Bill</option>
//                 </select>
//               </div>
//             </div>


//             {/* Client Notes & Admin Remarks Section */}
//             <div className="space-y-3 mt-3">
//               {inquiry.clientRemarks && (
//                 <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 shadow-sm flex items-start gap-3">
//                   <MessageSquare size={20} className="text-blue-500 shrink-0 mt-0.5" />
//                   <div>
//                     <p className="text-sm md:text-base text-blue-700 font-black mb-0.5 uppercase tracking-wide">Client's Initial Note</p>
//                     <p className="text-blue-900 text-base md:text-lg font-medium leading-snug">{inquiry.clientRemarks}</p>
//                   </div>
//                 </div>
//               )}

//               <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
//                 <label className="text-base font-black text-slate-700 block uppercase tracking-wide mb-2">Remarks to Client</label>
//                 <textarea
//                   value={adminRemarks}
//                   onChange={(e) => setAdminRemarks(e.target.value)}
//                   rows={2} placeholder="e.g. Prices valid for 48 hours."
//                   className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-base md:text-base focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 shadow-sm resize-none"
//                 />
//               </div>
//             </div>
//           </div>

//           <div className="bg-white border-t border-slate-200 px-4 pt-3 pb-4 md:p-5 shrink-0 z-20 shadow-[0_-4px_15px_rgba(0,0,0,0.03)]">

//             {unreviewedCount === 0 && (
//               <div className="flex justify-between items-start mb-4 bg-slate-900 rounded-xl px-4 py-3 md:py-4 shadow-md animate-fadeIn">
//                 <div>
//                   <span className="text-slate-300 text-sm md:text-base font-bold uppercase tracking-wide block">Final Payable</span>
//                   <span className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-wider">(Incl. of GST)</span>
//                 </div>

//                 <div className="flex flex-col items-end mt-0.5">
//                   <span className="text-emerald-400 font-black text-2xl md:text-3xl leading-none">
//                     ₹{roundedFinalTotal.toLocaleString('en-IN')}
//                   </span>

//                   {roundOffAmount !== 0 && (
//                     <span className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-wider mt-1.5">
//                       R/Off:
//                       <strong className="text-white ml-1">
//                         {roundOffAmount > 0 ? '+' : '-'}₹{Math.abs(roundOffAmount).toFixed(2)}
//                       </strong>
//                     </span>
//                   )}
//                 </div>
//               </div>
//             )}

//             <div className="flex gap-3">
//               <button
//                 onClick={() => setShowRejectPrompt(true)}
//                 className="w-1/3 bg-red-50 text-red-600 border border-red-100 font-bold py-3.5 rounded-xl hover:bg-red-100 transition-colors active:scale-95 shadow-sm">
//                 Reject
//               </button>
//               <button
//                 onClick={handleSend}
//                 disabled={unreviewedCount > 0 || busy}
//                 className="w-2/3 bg-violet-600 text-white font-bold py-3.5 rounded-xl disabled:bg-slate-300 disabled:text-slate-500 flex items-center justify-center gap-2 transition-colors active:scale-[0.98] shadow-md">
//                 {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
//                 {unreviewedCount > 0 ? `${unreviewedCount} Item(s) Left to Review` : 'Send Quote'}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {editingIndex !== null && (
//         <QuoteEditRowModal
//           initialRow={rows[editingIndex]}
//           onClose={() => setEditingIndex(null)}
//           onSave={(updatedRow) => {
//             setRows(prev => prev.map((r, i) => i === editingIndex ? { ...updatedRow, isEdited: true } : r));
//             setEditingIndex(null);
//           }}
//         />
//       )}

//       {showRejectPrompt && (
//         <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4">
//           <div className="w-full max-w-sm bg-white rounded-2xl p-5 space-y-4 shadow-2xl animate-slideUp">
//             <div className="flex items-start gap-3">
//               <div className="bg-red-100 p-2.5 rounded-full shrink-0">
//                 <AlertTriangle size={24} className="text-red-600" />
//               </div>
//               <div>
//                 <h3 className="text-slate-900 font-black text-lg md:text-xl leading-tight">Reject Inquiry</h3>
//                 <p className="text-slate-500 text-sm md:text-base font-medium mt-1">Please provide a reason. The client will see this message.</p>
//               </div>
//             </div>

//             <textarea
//               value={rejectReason}
//               onChange={(e) => setRejectReason(e.target.value)}
//               rows={3}
//               placeholder="e.g. Stock unavailable, unable to fulfill minimum request..."
//               className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm md:text-base focus:outline-none focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-500/20 mt-2 shadow-sm resize-none"
//             />

//             <div className="flex gap-2 pt-2">
//               <button onClick={() => setShowRejectPrompt(false)} className="flex-1 py-3 md:py-3.5 rounded-xl text-sm md:text-base font-black text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors shadow-sm">
//                 Cancel
//               </button>
//               <button onClick={handleReject} disabled={busy || !rejectReason.trim()} className="flex-[2] py-3 md:py-3.5 rounded-xl text-sm md:text-base font-black text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors shadow-md">
//                 {busy ? 'Rejecting...' : 'Confirm Reject'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <style>{`
//         @keyframes slideUp {
//           from { transform: translateY(10px); opacity: 0; }
//           to { transform: translateY(0); opacity: 1; }
//         }
//         .animate-slideUp { animation: slideUp 0.2s ease-out; }
//       `}</style>
//     </>
//   );
// }



// src/features/Admin/OrdersPage/modals/QuoteBuilderModal.jsx
import { useState } from 'react';
import { X, Loader2, Send, CheckCircle2, AlertTriangle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useModalTrap, useScrollLock } from '../../../../hooks/useBackHandler';
import { formatMoney, productLabel } from '../utils';

// We removed formatExp from here because we bypass it entirely now.
import QuoteEditRowModal, { calcQuoteLine } from './QuoteEditRowModal';

export default function QuoteBuilderModal({ inquiry, allProducts, onClose, onSent, onReject, busy }) {
  useModalTrap(true, { onBackClose: onClose, customId: `quote_builder_${inquiry._id}` });
  useScrollLock(true);

  // ✨ FIX 1: If products haven't loaded yet, show a loader instead of crashing the math!
  if (!allProducts || allProducts.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl flex items-center gap-4 shadow-2xl">
          <Loader2 className="animate-spin text-slate-900" size={28} />
          <span className="font-black text-slate-900 text-lg">Loading catalog data...</span>
        </div>
      </div>
    );
  }

  // ✨ FIX 2: SESSION STORAGE IS COMPLETELY NUKED. Fresh data ONLY.
  const [rows, setRows] = useState(() => {
    return (inquiry.items || []).map((item) => {
      
      const pidStr = String(item.productId?._id || item.productId);
      const fallbackProd = typeof item.productId === 'object' ? item.productId : {};
      
      const catalogProduct = allProducts?.find((p) => 
         String(p.productId) === pidStr || String(p.id) === pidStr || String(p._id) === pidStr
      ) || {};

      let batches = catalogProduct.batches || fallbackProd.batches || [];
      
      // ✨ FIX 3: SNAPSHOT FAILSAFE. If no batches exist, QuoteEditRowModal crashes to 0. 
      // This forces a dummy batch so the dropdown is never empty!
      if (!batches || batches.length === 0) {
        batches = [{
          _id: item.offerBatchId?._id || item.offerBatchId || 'snapshot_batch',
          no: 'Snapshot Data',
          mrp: item.fallbackMrp || item.mrp || fallbackProd.mrp || 0,
          expiry: item.expiryDate || item.closestExpiry || '',
          stock: 0
        }];
      }

      const reqBatchId = String(item.offerBatchId?._id || item.offerBatchId || '');
      let selectedBatch = batches.find(b => String(b._id) === reqBatchId);
      if (!selectedBatch) selectedBatch = batches[0];

      const itemMrp = item.fallbackMrp || item.mrp || selectedBatch.mrp || catalogProduct.mrp || fallbackProd.mrp || 0;
      const defaultPtr = item.estPTR || catalogProduct.defaultRate || fallbackProd.defaultRate || (itemMrp * 0.8) || 0;

      // ✨ FIX 4: Aggressive Date Parsing mapped directly to the UI
      let safeExp = '';
      let expiryText = '—';
      const rawDate = item.expiryDate || item.closestExpiry || item.offerBatchId?.expiryDate || selectedBatch.expiryDate || selectedBatch.expiry;
      
      if (rawDate) {
        try {
          const d = new Date(typeof rawDate === 'object' && rawDate.$date ? rawDate.$date : rawDate);
          if (!isNaN(d.getTime())) {
            safeExp = d.toISOString();
            expiryText = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
          }
        } catch(e) {}
      }

      return {
        productId: pidStr,
        productName: productLabel(item.productId) || catalogProduct.name || 'Unknown Product',
        shortCode: fallbackProd.companyId?.shortCode || fallbackProd.company || catalogProduct.companyShortCode || '',
        packing: fallbackProd.packing || catalogProduct.packing || '',
        gstRate: catalogProduct.gstRate || fallbackProd.gstRate || 0,
        requestedQty: item.requestedQty || item.qty || 0,
        batches, // Guaranteed to have at least 1 batch now!
        batchNo: selectedBatch.no || selectedBatch.batchNumber || 'Snapshot Data',
        expiryDate: safeExp,
        expiryText: expiryText, // Passed directly to bypass formatExp!
        adminOfferedPTR: defaultPtr,
        chargeableQty: item.requestedQty || item.qty || 0,
        freeQty: 0,
        discountType: 'percent',
        discountValue: 0,
        offerBatchId: reqBatchId && reqBatchId !== 'undefined' ? reqBatchId : undefined,
        mrp: itemMrp,
        isEdited: false,
      };
    });
  });

  const [globalDiscountType, setGlobalDiscountType] = useState('percent');
  const [globalDiscountValue, setGlobalDiscountValue] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [billType, setBillType] = useState(inquiry.billPreference || 'Credit');

  const [editingIndex, setEditingIndex] = useState(null);
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const subtotal = rows.reduce((s, r) => s + calcQuoteLine(r).finalTotal, 0);
  const finalGlobalDiscountAmount = globalDiscountType === 'percent'
    ? subtotal * (globalDiscountValue / 100)
    : (globalDiscountValue || 0);
  const exactFinalTotal = subtotal - finalGlobalDiscountAmount;
  const roundedFinalTotal = Math.round(exactFinalTotal);
  const roundOffAmount = roundedFinalTotal - exactFinalTotal;

  const unreviewedCount = rows.filter(r => !r.isEdited).length;

  const handleSend = async () => {
    if (globalDiscountValue > 0 && !discountReason.trim()) {
      toast.error('A discount reason is required whenever a bill discount is applied.');
      return;
    }

    const payload = {
      items: rows.map((r) => ({
        productId: r.productId,
        adminOfferedPTR: r.adminOfferedPTR,
        chargeableQty: r.chargeableQty,
        freeQty: r.freeQty,
        offerBatchId: r.offerBatchId,
        discountType: r.discountType,
        discountValue: r.discountValue,
        discountAmount: calcQuoteLine(r).disc,
        estimatedLineTotal: calcQuoteLine(r).finalTotal,
      })),
      discountType: globalDiscountType,
      discountPercent: globalDiscountType === 'percent' ? globalDiscountValue : 0,
      discountValue: globalDiscountValue,
      discountReason,
      adminRemarks,
      billPreference: billType,
    };

    await onSent(payload);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejecting this inquiry.");
      return;
    }
    await onReject(inquiry._id, rejectReason);
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/60 flex items-end md:items-center md:justify-center p-0 md:p-4">
        <div className="w-full md:max-w-2xl bg-slate-50 rounded-t-xl md:rounded-2xl h-[92dvh] md:h-auto md:max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden animate-slideUp">

          <div className="bg-white px-4 pt-3 pb-2 border-b border-slate-200 flex justify-between items-start z-10 shrink-0">
            <div>
              <p className="font-mono text-slate-500 text-base">{inquiry.inquiryId}</p>
              <h3 className="text-slate-900 font-bold text-lg md:text-xl leading-tight">{inquiry.clientId?.establishmentName}</h3>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
              <X size={22} className="text-slate-500" />
            </button>
          </div>

          <div className="p-3 md:p-5 space-y-4 flex-1 overflow-y-auto">

            <div className="space-y-1">
              <h2 className="text-slate-900 font-black text-xl md:text-2xl">Quote Builder</h2>
              <p className="text-base md:text-base text-slate-500 font-medium">Review and edit the quote before sending it to the client.</p>
            </div>

            <div className="space-y-4 py-4">
              <p className="text-lg md:text-base font-black text-slate-500 uppercase tracking-wider mb-4">Requested Items</p>
              {rows.map((row, idx) => (
                <div key={row.productId}>
                  <button
                    onClick={() => setEditingIndex(idx)}
                    className={`relative w-full text-left bg-white border rounded-xl flex flex-col p-3 space-y-3 transition-all hover:shadow-sm active:scale-[0.99]
        ${row.isEdited ? 'border-emerald-200 shadow-sm' : 'border-amber-200 shadow-sm shadow-amber-100'}`}
                  >

                    <div className={`absolute top-0 left-0 text-white text-xs md:text-sm font-bold px-2 py-1 rounded-br-2xl rounded-tl-xl shadow-sm z-10 ${row.isEdited ? 'bg-slate-800' : 'bg-amber-600'}`}>
                      #{idx + 1}
                    </div>

                    <div className={`w-full rounded-xl p-2 flex items-start justify-between gap-3 shrink-0 ${row.isEdited ? 'bg-slate-50 border border-slate-200' : 'bg-amber-50 border border-amber-200'}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900 text-lg md:text-xl leading-tight truncate pl-10 md:pl-12">
                          {row.productName}
                          {row.shortCode && <span className="text-slate-500 font-semibold ml-1.5 text-sm md:text-base">({row.shortCode})</span>}
                        </p>
                      </div>
                      {row.isEdited && (
                        <CheckCircle2 size={24} className="text-emerald-500 shrink-0 mt-0.5" />
                      )}
                    </div>

                    <div className="w-full px-1">
                      <div className="flex justify-between items-center gap-x-5 gap-y-2 text-base md:text-base font-medium">
                        <span className="text-slate-600">MRP: <strong className="text-slate-900">{formatMoney(row.mrp)}</strong></span>
                        {/* ✨ FIX 5: Uses row.expiryText directly. Bye bye formatting errors! */}
                        <span className="text-slate-600">{row.isEdited ? 'Exp:' : 'Est. Exp:'} <strong className="text-slate-900">{row.expiryText}</strong></span>
                        <span className="text-slate-600">Req: <strong className="text-slate-900">{row.requestedQty}</strong></span>

                        {row.isEdited && (
                          <span className="text-slate-600">Prov: <strong className="text-slate-900">{row.chargeableQty}{row.freeQty > 0 ? `+${row.freeQty}` : ''}</strong></span>
                        )}
                      </div>

                      <div className="flex justify-between items-center gap-x-5 gap-y-2 text-base font-medium mt-1.5">
                        {row.isEdited ? (
                          <span className="text-slate-600">PTR: <strong className="text-slate-900">₹{row.adminOfferedPTR}</strong></span>
                        ) : (
                          <span className="text-slate-400">Est. PTR: <strong className="text-slate-600">₹{row.adminOfferedPTR}</strong></span>
                        )}

                        {row.discountValue > 0 && (
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-sm font-bold shadow-sm border border-amber-200">
                            Disc: {row.discountType === 'percent' ? `${row.discountValue}%` : `₹${row.discountValue}`}
                          </span>
                        )}

                        {row.isEdited && (
                          <span className="text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded font-black text-sm md:text-base shadow-sm">
                            Total: {formatMoney(calcQuoteLine(row).finalTotal)}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-3 flex flex-col shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="font-black text-amber-900 uppercase tracking-wide text-base">Bill Discount</span>
                  <div className="flex items-center h-10 rounded-lg shadow-sm">
                    <input
                      type="number"
                      value={globalDiscountValue}
                      onChange={(e) => setGlobalDiscountValue(e.target.value)}
                      onFocus={() => { if (globalDiscountValue === 0 || globalDiscountValue === '0') setGlobalDiscountValue(''); }}
                      onBlur={(e) => {
                        const parsed = parseFloat(e.target.value);
                        setGlobalDiscountValue(isNaN(parsed) || parsed < 0 ? 0 : parsed);
                      }}
                      className="w-20 md:w-24 h-full border border-amber-300 border-r-0 bg-white rounded-l-lg text-center font-black focus:outline-none focus:bg-amber-100/50 text-base md:text-lg text-amber-900 transition-colors"
                    />
                    <button
                      onClick={() => setGlobalDiscountType(t => t === 'percent' ? 'amount' : 'percent')}
                      className="h-full bg-white border border-amber-300 rounded-r-lg px-3 sm:px-4 flex items-center text-amber-800 font-black hover:bg-amber-100 transition-colors text-base md:text-lg shrink-0"
                    >
                      {globalDiscountType === 'percent' ? '%' : '₹'}
                    </button>
                  </div>
                </div>
                <input
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="Reason (e.g. Festival)"
                  className="w-full text-base font-medium border border-amber-300 bg-white rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 shadow-inner"
                />
                {finalGlobalDiscountAmount > 0 && (
                  <span className="text-amber-700 font-black text-sm md:text-base text-right mt-2 animate-fadeIn">
                    Saved {formatMoney(finalGlobalDiscountAmount)}
                  </span>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl px-4 py-4 shadow-sm flex flex-col justify-between">
                <div className="mb-3">
                  <label className="text-base md:text-base font-black text-slate-700 flex items-center gap-2 uppercase tracking-wide mb-1">
                    Quoted Bill Type
                    {inquiry?.billPreference && (
                      <span className="text-sm sm:text-sm bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-bold tracking-wide normal-case shadow-sm">
                        Pref: {inquiry.billPreference}
                      </span>
                    )}
                  </label>
                </div>
                <select
                  value={billType}
                  onChange={(e) => setBillType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-base md:text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all shadow-sm cursor-pointer"
                >
                  <option value="Credit">Credit Bill</option>
                  <option value="Cash">Cash Bill</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 mt-3">
              {inquiry.clientRemarks && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 shadow-sm flex items-start gap-3">
                  <MessageSquare size={20} className="text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm md:text-base text-blue-700 font-black mb-0.5 uppercase tracking-wide">Client's Initial Note</p>
                    <p className="text-blue-900 text-base md:text-lg font-medium leading-snug">{inquiry.clientRemarks}</p>
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <label className="text-base font-black text-slate-700 block uppercase tracking-wide mb-2">Remarks to Client</label>
                <textarea
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  rows={2} placeholder="e.g. Prices valid for 48 hours."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-base md:text-base focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 shadow-sm resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border-t border-slate-200 px-4 pt-3 pb-4 md:p-5 shrink-0 z-20 shadow-[0_-4px_15px_rgba(0,0,0,0.03)]">
            {unreviewedCount === 0 && (
              <div className="flex justify-between items-start mb-4 bg-slate-900 rounded-xl px-4 py-3 md:py-4 shadow-md animate-fadeIn">
                <div>
                  <span className="text-slate-300 text-sm md:text-base font-bold uppercase tracking-wide block">Final Payable</span>
                  <span className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-wider">(Incl. of GST)</span>
                </div>
                <div className="flex flex-col items-end mt-0.5">
                  <span className="text-emerald-400 font-black text-2xl md:text-3xl leading-none">
                    ₹{roundedFinalTotal.toLocaleString('en-IN')}
                  </span>
                  {roundOffAmount !== 0 && (
                    <span className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-wider mt-1.5">
                      R/Off: <strong className="text-white ml-1">{roundOffAmount > 0 ? '+' : '-'}₹{Math.abs(roundOffAmount).toFixed(2)}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowRejectPrompt(true)} className="w-1/3 bg-red-50 text-red-600 border border-red-100 font-bold py-3.5 rounded-xl hover:bg-red-100 transition-colors active:scale-95 shadow-sm">
                Reject
              </button>
              <button onClick={handleSend} disabled={unreviewedCount > 0 || busy} className="w-2/3 bg-violet-600 text-white font-bold py-3.5 rounded-xl disabled:bg-slate-300 disabled:text-slate-500 flex items-center justify-center gap-2 transition-colors active:scale-[0.98] shadow-md">
                {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {unreviewedCount > 0 ? `${unreviewedCount} Item(s) Left to Review` : 'Send Quote'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {editingIndex !== null && (
        <QuoteEditRowModal
          initialRow={rows[editingIndex]}
          onClose={() => setEditingIndex(null)}
          onSave={(updatedRow) => {
            setRows(prev => prev.map((r, i) => i === editingIndex ? { ...updatedRow, isEdited: true } : r));
            setEditingIndex(null);
          }}
        />
      )}

      {showRejectPrompt && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 space-y-4 shadow-2xl animate-slideUp">
            <div className="flex items-start gap-3">
              <div className="bg-red-100 p-2.5 rounded-full shrink-0">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-slate-900 font-black text-lg md:text-xl leading-tight">Reject Inquiry</h3>
                <p className="text-slate-500 text-sm md:text-base font-medium mt-1">Please provide a reason. The client will see this message.</p>
              </div>
            </div>
            <textarea
              value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
              placeholder="e.g. Stock unavailable..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm md:text-base focus:outline-none focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-500/20 mt-2 shadow-sm resize-none"
            />
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowRejectPrompt(false)} className="flex-1 py-3 md:py-3.5 rounded-xl text-sm md:text-base font-black text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors shadow-sm">Cancel</button>
              <button onClick={handleReject} disabled={busy || !rejectReason.trim()} className="flex-[2] py-3 md:py-3.5 rounded-xl text-sm md:text-base font-black text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors shadow-md">{busy ? 'Rejecting...' : 'Confirm Reject'}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slideUp { animation: slideUp 0.2s ease-out; }
      `}</style>
    </>
  );
}