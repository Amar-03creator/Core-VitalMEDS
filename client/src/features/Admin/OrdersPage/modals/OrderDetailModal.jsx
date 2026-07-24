// // src/features/Admin/OrdersPage/modals/OrderDetailModal.jsx
// import { useState, useEffect } from 'react';
// import { X, Truck, CheckCircle2, Loader2, Sparkles, FileText, Printer, Download, Send, Package } from 'lucide-react';
// import { toast } from 'sonner';
// import { useModalTrap, useScrollLock } from '../../../../hooks/useBackHandler';
// import { ORDER_STATUS_META, formatDateTime, productLabel, getOrderActions, formatMoney } from '../utils';
// import { api } from '../../../../services/api';
// import { OrderCancelledPrompt } from '../../../../modals/MakeInvoiceModal/components/InvoiceOverlays';

// export default function OrderDetailModal({ order, busy, onClose, onAction }) {
//   useModalTrap(true, { onBackClose: onClose, customId: `order_detail_${order._id}` });
//   useScrollLock(true);

//   const [showConfirmPrompt, setShowConfirmPrompt] = useState(false);
//   const [loadingAction, setLoadingAction] = useState(null);

//   const [cancelReason, setCancelReason] = useState('');
//   const [showCancelPrompt, setShowCancelPrompt] = useState(false);

//   useEffect(() => {
//     if (!busy) {
//       setLoadingAction(null);
//     }
//   }, [busy]);

//   useEffect(() => {
//     const interval = setInterval(async () => {
//       try {
//         const freshRes = await api.getOrderById(order._id);
//         const freshData = freshRes.data;

//         if (freshData.status === 'Cancelled' && order.status !== 'Cancelled') {
//           setCancelReason(freshData.clientCancelReason || freshData.adminCancelReason || 'No reason provided.');
//           setShowCancelPrompt(true);
//         } else if (order.status === 'Editing' && freshData.status !== 'Editing') {
//           toast.success("Client finished editing!");
//           onAction('refresh', order._id);
//         }
//       } catch (err) {
//         console.error("Polling error:", err);
//       }
//     }, 3000);
//     return () => clearInterval(interval);
//   }, [order.status, order._id, onAction]);

//   const actions = getOrderActions(order);
//   const meta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.Placed;
//   const StatusIcon = meta.icon;

//   const handleAction = (actionType, data) => {
//     setLoadingAction(actionType);
//     onAction(actionType, data);
//   };

//   const orderValue = order.finalInvoiceAmount ?? order.estimatedOrderTotal ?? 0;

//   return (
//     <>
//       <div className="fixed inset-0 z-[100] bg-black/60 flex items-end md:items-center md:justify-center">
//         <div className="w-full md:max-w-xl bg-white rounded-t-2xl md:rounded-2xl max-h-[90dvh] overflow-hidden flex flex-col">

//           <div className="bg-white px-5 pt-4 pb-3 border-b border-slate-100 flex justify-between items-start shrink-0">
//             <div>
//               <p className="font-mono text-slate-400 text-sm">{order.orderId}</p>
//               <h3 className="text-slate-900 font-black text-xl">{order.clientId?.establishmentName || 'Unknown client'}</h3>

//               <div className="flex items-center gap-2 mt-1.5">
//                 <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${meta.bg} ${meta.color}`}>
//                   {order.status === 'Editing' && <Loader2 size={12} className="animate-spin" />}
//                   <StatusIcon size={14} className={order.status === 'Editing' ? 'hidden' : ''} /> {order.status}
//                 </span>
//                 {/* ✨ NEW: Order Value right in the header */}
//                 <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-xs font-black border border-emerald-200 shadow-sm">
//                   Total: {formatMoney(orderValue)}
//                 </span>
//               </div>
//             </div>
//             <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors bg-slate-50 border border-slate-200"><X size={20} className="text-slate-500" /></button>
//           </div>

//           <div className="px-4 md:px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0 bg-slate-50/50">
//             <div>
//               <div className="flex justify-between items-center mb-3">
//                 <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">Order Items ({(order.items || []).length})</p>

//                 {/* ✨ FIX: Consolidated Bill Pref / Inv Pref */}
//                 <div className="flex flex-wrap gap-1.5 items-center">
//                   <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-black uppercase tracking-wider border shadow-sm ${order.billPreference === 'Cash' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
//                     Req: {order.billPreference || 'Credit'}
//                   </span>
//                   {order.invoiceBillType && order.invoiceBillType !== order.billPreference && (
//                      <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-black uppercase tracking-wider border shadow-sm ${order.invoiceBillType === 'Cash' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
//                       Inv: {order.invoiceBillType}
//                     </span>
//                   )}
//                 </div>
//               </div>

//               <div className="space-y-3">
//                 {(order.items || []).map((item, i) => {
//   const shortCode = item.productId?.companyId?.shortCode || item.productId?.company || '—';
//   const plannedBatch = item.plannedBatches?.[0]?.batchId;
//   const isOfferBatch = plannedBatch && typeof plannedBatch === 'object' && plannedBatch.nearExpiry;

//   let expiryText = '—';
//   // ✨ FIX: Check the new item.expiryDate snapshot first, then fall back to legacy data
//   const rawDate = item.expiryDate || (plannedBatch && (plannedBatch.expiryDate || plannedBatch.expiry)) || item.closestExpiry;
//   if (rawDate) {
//     const d = new Date(rawDate);
//     if (!isNaN(d)) {
//       const mm = String(d.getMonth() + 1).padStart(2, '0');
//       const yy = String(d.getFullYear()).slice(-2);
//       expiryText = `${mm}/${yy}`;
//     }
//   }

//   // ✨ FIX: Check new snapshot mrp, legacy fallbackMrp, and finally the product/batch mrp
//   const mrp = item.mrp || item.fallbackMrp || plannedBatch?.mrp || item.productId?.mrp || 0;
//   const ptr = item.finalPrice || 0; 
//   const requestedQty = item.requestedQty || item.qty || item.finalQty || 0;
//   const providedChargeable = item.chargeableQty ?? item.finalQty ?? 0;
//   const providedFree = item.freeQty || 0;
//   const providedDisplay = providedFree > 0 ? `${providedChargeable} + ${providedFree}` : providedChargeable;
//   const lineTotal = item.lineTotal != null ? item.lineTotal : item.taxableValue || 0;

//   let lineDiscStr = null;
//   if (item.discountType === 'percent' && item.discountValue > 0) lineDiscStr = `${item.discountValue}%`;
//   else if (item.discountType === 'amount' && item.discountValue > 0) lineDiscStr = `₹${item.discountValue}`;

//   const isInvoiced = ['Invoiced', 'Packed', 'Shipped', 'Delivered'].includes(order.status);

//   return (
//     <div key={i} className="relative border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col p-3 space-y-3">

//       {/* Absolute Badge */}
//       <div className="absolute top-0 left-0 bg-slate-800 text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-br-2xl rounded-tl-xl shadow-sm z-10">
//         #{i + 1}
//       </div>

//       {/* Inner Header Box */}
//       <div className="w-full rounded-xl p-2 bg-slate-50 border border-slate-200 shrink-0">
//         <p className="font-black text-slate-900 text-lg md:text-xl leading-tight truncate">
//           {productLabel(item.productId)}
//           {shortCode && <span className="text-slate-500 font-semibold ml-1.5 text-sm md:text-base">({shortCode})</span>}
//         </p>
//       </div>

//       {/* Detailed Body Box */}
//       <div className="w-full px-1">

//         {/* Row 1 */}
//         <div className="flex justify-between items-center gap-x-3 md:gap-x-5 gap-y-2 text-base md:text-base font-medium">
//           <span className="text-slate-600">MRP: <strong className="text-slate-900">{formatMoney(mrp)}</strong></span>

//           {/* ✨ FIX: Shows "Est. Exp" before invoice, and "Exp" after invoice */}
//           <span className="text-slate-600">{isInvoiced ? 'Exp:' : 'Est. Exp:'} <strong className="text-slate-900">{expiryText}</strong></span>
//           <span className="text-slate-600">Req: <strong className="text-slate-900">{requestedQty}</strong></span>

//           {/* ✨ FIX: Prov is completely hidden until the order is invoiced/packed/shipped */}
//           {isInvoiced && (
//             <span className="text-slate-600">Prov: <strong className="text-slate-900">{providedDisplay}</strong></span>
//           )}
//         </div>

//         {/* Row 2 */}
//         <div className="flex justify-between items-center gap-x-3 md:gap-x-5 gap-y-2 text-sm md:text-base font-medium mt-1.5">
//           {/* ✨ FIX: Shows "Est. PTR" (muted) before invoice, and "PTR" (bold) after invoice */}
//           {isInvoiced ? (
//              <span className="text-slate-600">PTR: <strong className="text-slate-900">{formatMoney(ptr)}</strong></span>
//           ) : (
//              <span className="text-slate-400">Est. PTR: <strong className="text-slate-600">{formatMoney(ptr)}</strong></span>
//           )}

//           {lineDiscStr && (
//             <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-sm font-bold shadow-sm border border-amber-200">
//               Disc: {lineDiscStr}
//             </span>
//           )}

//           {isOfferBatch && (
//             <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-sm font-bold shadow-sm border border-amber-200">
//               <Sparkles size={14} /> Offer Batch
//             </span>
//           )}

//           {lineTotal > 0 && (
//             <span className="text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded font-black text-sm md:text-base shadow-sm">
//               Total: {formatMoney(lineTotal)}
//             </span>
//           )}
//         </div>

//       </div>
//     </div>
//   );
// })}
//               </div>
//             </div>

//             <div className="grid grid-cols-1 gap-3">
//               {order.clientNote && (
//                 <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 shadow-sm">
//                   <p className="text-sm text-blue-700 font-black mb-0.5 uppercase tracking-wide">Client's Notes</p>
//                   <p className="text-blue-900 text-sm md:text-base font-medium">{order.clientNote}</p>
//                 </div>
//               )}
//               {order.adminNote && (
//                 <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 shadow-sm">
//                   <p className="text-sm text-amber-700 font-black mb-0.5 uppercase tracking-wide">Your Note to Client</p>
//                   <p className="text-amber-900 text-sm md:text-base font-medium">{order.adminNote}</p>
//                 </div>
//               )}
//             </div>

//             {['Shipped', 'Delivered'].includes(order.status) && order.dispatchDetails && (
//               <div className="bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3 shadow-sm">
//                 <p className="text-cyan-800 text-sm md:text-base font-bold flex items-center gap-1.5 mb-2"><Truck size={16} /> Shipping Information</p>
//                 <div className="text-cyan-900 text-sm md:text-base grid grid-cols-2 gap-2">
//                   {order.dispatchDetails.courierName && <span><strong className="font-semibold">Courier:</strong> {order.dispatchDetails.courierName}</span>}
//                   {order.dispatchDetails.vehicleNumber && <span><strong className="font-semibold">Vehicle:</strong> {order.dispatchDetails.vehicleNumber}</span>}
//                   {order.dispatchDetails.lrNumber && <span><strong className="font-semibold">LR No:</strong> {order.dispatchDetails.lrNumber}</span>}
//                   {order.dispatchDetails.trackingId && <span><strong className="font-semibold">Tracking:</strong> {order.dispatchDetails.trackingId}</span>}
//                 </div>
//               </div>
//             )}

//             {order.invoiceNumber && (
//               <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 shadow-sm gap-2">
//                 <div className="flex items-center gap-2 min-w-0">
//                   <FileText size={18} className="text-emerald-600 shrink-0" />
//                   <span className="text-slate-800 text-sm md:text-base font-mono font-bold truncate">INV: {order.invoiceNumber}</span>
//                 </div>

//                 {actions.canDownloadInvoice && (
//                   <div className="flex items-center gap-2 shrink-0">
//                     <button onClick={() => handleAction('print', order)} disabled={busy} className="p-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors disabled:opacity-50 shadow-sm">
//                       {busy && loadingAction === 'print' ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
//                     </button>
//                     <button onClick={() => handleAction('download', order)} disabled={busy} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center transition-colors disabled:opacity-50 shadow-sm">
//                       {busy && loadingAction === 'download' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}

//             {order.pricingSharedAt && (
//               <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 font-medium"><CheckCircle2 size={14} className="text-emerald-500" /> Pricing shared with client on {formatDateTime(order.pricingSharedAt)}</p>
//             )}

//             {order.status === 'Cancelled' && (order.clientCancelReason || order.adminCancelReason) && (
//               <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 shadow-sm">
//                 <p className="text-sm text-red-700 font-bold mb-0.5">Cancellation Reason</p>
//                 <p className="text-red-900 text-sm md:text-base font-medium">{order.clientCancelReason || order.adminCancelReason}</p>
//               </div>
//             )}
//           </div>

//           <div className="bg-white p-4 border-t border-slate-100 shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] z-20 space-y-2">
//             {showConfirmPrompt ? (
//               <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 mb-2 animate-fadeIn">
//                 <p className="font-bold text-emerald-800 text-base mb-1">Ready to confirm this order?</p>
//                 <p className="text-sm text-emerald-600 mb-3">Please ensure all requested stock is physically available in the warehouse before proceeding.</p>
//                 <div className="flex gap-2">
//                   <button onClick={() => setShowConfirmPrompt(false)} className="flex-1 bg-white text-emerald-700 py-3 rounded-xl font-bold border border-emerald-200 text-sm shadow-sm">
//                     Let me check
//                   </button>
//                   <button onClick={() => { setShowConfirmPrompt(false); handleAction('confirmAndInvoice', order); }} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm shadow-sm">
//                     Yes, Confirm Order
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               <>
//                 {actions.canConfirmAndInvoice && (
//                   <button onClick={() => setShowConfirmPrompt(true)} disabled={busy}
//                     className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 md:py-3.5 rounded-xl text-base disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm transition-colors">
//                     {busy && loadingAction === 'confirmAndInvoice' ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} Confirm Order
//                   </button>
//                 )}

//                 {order.status === 'Confirmed' && (
//                   <button onClick={() => handleAction('invoice', order)} disabled={busy}
//                     className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 md:py-3.5 rounded-xl text-base disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm transition-colors">
//                     {busy && loadingAction === 'invoice' ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />} Continue Invoicing
//                   </button>
//                 )}

//                 {order.status === 'Invoiced' && (
//                   <div className="flex gap-2 w-full">
//                     <button onClick={() => handleAction('invoice', order)} disabled={busy}
//                       className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 md:py-3.5 rounded-xl text-sm sm:text-base disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm transition-colors">
//                       {busy && loadingAction === 'invoice' ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />} Edit Invoice
//                     </button>
//                     <button onClick={() => handleAction('pack', order)} disabled={busy} className="flex-[3] bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 md:py-3.5 rounded-xl text-sm sm:text-base flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50">
//                       {busy && loadingAction === 'pack' ? <Loader2 size={18} className="animate-spin" /> : <Package size={18} />} Mark Packed
//                     </button>
//                   </div>
//                 )}

//                 {order.status === 'Packed' && (
//                   <button onClick={() => handleAction('ship', order)} disabled={busy} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 md:py-3.5 rounded-xl text-base flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50">
//                     {busy && loadingAction === 'ship' ? <Loader2 size={18} className="animate-spin" /> : <Truck size={18} />} Mark Shipped
//                   </button>
//                 )}

//                 {actions.canMarkDelivered && (
//                   <button onClick={() => handleAction('deliver', order)} disabled={busy}
//                     className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 md:py-3.5 rounded-xl text-base disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm transition-colors">
//                     {busy && loadingAction === 'deliver' ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} Mark Delivered
//                   </button>
//                 )}

//                 {actions.canSharePricing && (
//                   <button onClick={() => handleAction('sharePricing', order)} disabled={busy}
//                     className="w-full bg-violet-500 hover:bg-violet-600 text-white font-bold py-3 md:py-3.5 rounded-xl text-base disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm transition-colors">
//                     {busy && loadingAction === 'sharePricing' ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Send Pricing to Client
//                   </button>
//                 )}

//                 {actions.canCancelOrder && (
//                   <div className="flex pt-1">
//                     <button onClick={() => handleAction('cancelOrder', order)} disabled={busy}
//                       className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl text-sm sm:text-base border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50">
//                       {busy && loadingAction === 'cancelOrder' ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Cancel Order'}
//                     </button>
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
//         </div>
//       </div>

//       <OrderCancelledPrompt
//         isOpen={showCancelPrompt}
//         reason={cancelReason}
//         onGoToOrders={() => {
//           setShowCancelPrompt(false);
//           onAction('refresh', null);
//           onClose();
//         }}
//       />
//     </>
//   );
// }




// src/features/Admin/OrdersPage/modals/OrderDetailModal.jsx
import { useState, useEffect } from 'react';
import { X, Truck, CheckCircle2, Loader2, Sparkles, FileText, Printer, Download, Send, Package, Ban, Eye, MessageSquare, ClipboardEdit } from 'lucide-react';
import { toast } from 'sonner';
import { useModalTrap, useScrollLock } from '../../../../hooks/useBackHandler';
import { ORDER_STATUS_META, formatDateTime, formatDate, productLabel, getOrderActions, formatMoney } from '../utils';
import { api } from '../../../../services/api';
import { OrderCancelledPrompt } from '../../../../modals/MakeInvoiceModal/components/InvoiceOverlays';

const PROGRESS_STEPS = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];

function OrderProgressTracker({ order }) {
  if (order.status === 'Cancelled') {
    let cancelTitle = 'This order was cancelled';
    const reason = order.adminCancelReason || order.clientCancelReason;
    if (order.adminCancelReason) cancelTitle = 'Cancelled by Admin';
    else if (order.clientCancelReason) cancelTitle = 'Cancelled by You';

    return (
      <div className="flex flex-col gap-1 bg-red-50 border border-red-200 rounded-xl px-4 py-4 shadow-sm">
        <div className="flex items-center gap-2 text-red-700 text-base md:text-lg font-bold">
          <Ban size={20} /> {cancelTitle}
        </div>
        {reason && <p className="text-sm md:text-base text-red-600 pl-[28px]">{reason}</p>}
      </div>
    );
  }

  const displayStatus = order.status === 'Invoiced' ? 'Confirmed' : order.status;
  const idx = Math.max(PROGRESS_STEPS.indexOf(displayStatus), 0);
  const pct = (idx / (PROGRESS_STEPS.length - 1)) * 100;

  return (
    <div className="relative pt-2 pb-2">
      <div className="absolute top-[20px] left-4 right-4 h-1.5 bg-slate-200 rounded-full" />
      <div className="absolute top-[20px] left-4 h-1.5 bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `calc(${pct} * (100% - 2rem) / 100)` }} />
      <div className="relative flex justify-between">
        {PROGRESS_STEPS.map((step, i) => {
          const meta = ORDER_STATUS_META[step] || ORDER_STATUS_META.Placed;
          const done = i < idx;
          const active = i === idx;
          const StepIcon = meta.icon;

          return (
            <div key={step} className="flex flex-col items-center gap-1.5 w-1/5 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-[2.5px] shrink-0 transition-colors shadow-sm
                ${done ? 'border-emerald-500 bg-emerald-500' : active ? 'border-emerald-500 bg-white' : 'border-slate-300 bg-white'}`}>
                <StepIcon size={18} className={done ? 'text-white' : active ? 'text-emerald-600' : 'text-slate-400'} />
              </div>
              <p className={`text-sm md:text-base font-bold text-center leading-tight mt-1 ${done || active ? 'text-slate-800' : 'text-slate-400'}`}>
                {meta.label || step}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrderDetailModal({ order, busy, onClose, onAction }) {
  useModalTrap(true, { onBackClose: onClose, customId: `order_detail_${order._id}` });
  useScrollLock(true);

  const [showConfirmPrompt, setShowConfirmPrompt] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);

  const [cancelReason, setCancelReason] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  useEffect(() => {
    if (!busy) {
      setLoadingAction(null);
    }
  }, [busy]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const freshRes = await api.getOrderById(order._id);
        const freshData = freshRes.data;

        if (freshData.status === 'Cancelled' && order.status !== 'Cancelled') {
          setCancelReason(freshData.clientCancelReason || freshData.adminCancelReason || 'No reason provided.');
          setShowCancelPrompt(true);
        } else if (order.status === 'Editing' && freshData.status !== 'Editing') {
          toast.success("Client finished editing!");
          onAction('refresh', order._id);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [order.status, order._id, onAction]);

  const actions = getOrderActions(order);
  const meta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.Placed;
  const StatusIcon = meta.icon;

  const handleAction = (actionType, data) => {
    setLoadingAction(actionType);
    onAction(actionType, data);
  };

  const orderValue = order.finalInvoiceAmount ?? order.estimatedOrderTotal ?? 0;

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/60 flex items-end md:items-center md:justify-center">
        <div className="w-full md:max-w-xl bg-white rounded-t-2xl md:rounded-2xl max-h-[90dvh] overflow-hidden flex flex-col">

          <div className="bg-white px-5 pt-4 pb-3 border-b border-slate-100 flex justify-between items-start shrink-0">
            <div>
              <p className="font-mono text-slate-400 text-sm">{order.orderId}</p>
              <h3 className="text-slate-900 font-black text-xl">{order.clientId?.establishmentName || 'Unknown client'}</h3>

              <div className="flex items-center gap-2 mt-1.5">
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${meta.bg} ${meta.color}`}>
                  {order.status === 'Editing' && <Loader2 size={12} className="animate-spin" />}
                  <StatusIcon size={14} className={order.status === 'Editing' ? 'hidden' : ''} /> {order.status}
                </span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-xs font-black border border-emerald-200 shadow-sm">
                  Total: {formatMoney(orderValue)}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors bg-slate-50 border border-slate-200"><X size={20} className="text-slate-500" /></button>
          </div>

          <div className="px-4 md:px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0 bg-slate-50/50">
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">Order Items ({(order.items || []).length})</p>

                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-black uppercase tracking-wider border shadow-sm ${order.billPreference === 'Cash' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                    Req: {order.billPreference || 'Credit'}
                  </span>
                  {order.invoiceBillType && order.invoiceBillType !== order.billPreference && (
                    <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-black uppercase tracking-wider border shadow-sm ${order.invoiceBillType === 'Cash' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      Inv: {order.invoiceBillType}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {(order.items || []).map((item, i) => {
                  const shortCode = item.productId?.companyId?.shortCode || item.productId?.company || '—';
                  const plannedBatch = item.plannedBatches?.[0]?.batchId;

                  // ✨ FIX: True offer batch check
                  const isOfferBatch = !!item.offerDescription;
                  let expiryText = '—';

                  // ✨ FIX: Exact batch expiry overrides the generic snapshot for offers
                  const exactBatchExpiry = plannedBatch && typeof plannedBatch === 'object' ? (plannedBatch.expiryDate || plannedBatch.expiry) : null;
                  const rawDate = exactBatchExpiry || item.expiryDate || item.closestExpiry;

                  if (rawDate) {
                    const d = new Date(rawDate);
                    if (!isNaN(d)) {
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const yy = String(d.getFullYear()).slice(-2);
                      expiryText = `${mm}/${yy}`;
                    }
                  }

                  const mrp = item.mrp || item.fallbackMrp || plannedBatch?.mrp || item.productId?.mrp || 0;
                  const ptr = item.finalPrice || 0;
                  const requestedQty = item.requestedQty || item.qty || item.finalQty || 0;
                  const providedChargeable = item.chargeableQty ?? item.finalQty ?? 0;
                  const providedFree = item.freeQty || 0;
                  const providedDisplay = providedFree > 0 ? `${providedChargeable} + ${providedFree}` : providedChargeable;
                  const lineTotal = item.lineTotal != null ? item.lineTotal : item.taxableValue || 0;

                  let lineDiscStr = null;
                  if (item.discountType === 'percent' && item.discountValue > 0) lineDiscStr = `${item.discountValue}%`;
                  else if (item.discountType === 'amount' && item.discountValue > 0) lineDiscStr = `₹${item.discountValue}`;

                  const isInvoiced = ['Invoiced', 'Packed', 'Shipped', 'Delivered'].includes(order.status);

                  return (
                    <div key={i} className="relative border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col p-3 space-y-3">

                      <div className="absolute top-0 left-0 bg-slate-800 text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-br-2xl rounded-tl-xl shadow-sm z-10">
                        #{i + 1}
                      </div>

                      <div className="w-full rounded-xl p-2 bg-slate-50 border border-slate-200 shrink-0">
                        <p className="font-black text-slate-900 text-lg md:text-xl leading-tight truncate">
                          {productLabel(item.productId)}
                          {shortCode && <span className="text-slate-500 font-semibold ml-1.5 text-sm md:text-base">({shortCode})</span>}
                        </p>
                      </div>

                      <div className="w-full px-1">

                        <div className="flex justify-between items-center gap-x-3 md:gap-x-5 gap-y-2 text-base md:text-base font-medium">
                          <span className="text-slate-600">MRP: <strong className="text-slate-900">{formatMoney(mrp)}</strong></span>

                          {/* ✨ FIX: Will always show "Exp:" instead of "Est. Exp:" if it's an offer batch! */}
                          <span className="text-slate-600">{(isInvoiced || isOfferBatch) ? 'Exp:' : 'Est. Exp:'} <strong className="text-slate-900">{expiryText}</strong></span>
                          <span className="text-slate-600">Req: <strong className="text-slate-900">{requestedQty}</strong></span>

                          {isInvoiced && (
                            <span className="text-slate-600">Prov: <strong className="text-slate-900">{providedDisplay}</strong></span>
                          )}
                        </div>

                        {/* Row 2 */}
                        <div className="flex justify-between items-center gap-x-3 md:gap-x-5 gap-y-2 text-sm md:text-base font-medium mt-1.5">
                          {(isInvoiced || isOfferBatch) ? (
                            <span className="text-slate-600">PTR: <strong className="text-slate-900">{formatMoney(ptr)}</strong></span>
                          ) : (
                            <span className="text-slate-400">Est. PTR: <strong className="text-slate-600">{formatMoney(ptr)}</strong></span>
                          )}

                          {/* ✨ FIX 2: Discount pill rendering completely removed from here */}

                          {isOfferBatch && (
                            <span className="inline-flex items-center gap-1 text-orange-800 bg-orange-100 px-2 py-0.5 rounded text-sm font-bold shadow-sm border border-orange-300 max-w-[150px] md:max-w-[250px]">
                              <Sparkles size={14} className="shrink-0" /> 
                              <span className="truncate">'Offer Applied'</span>
                            </span>
                          )}

                          {lineTotal > 0 && (
                            <span className="text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded font-black text-sm md:text-base shadow-sm">
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

            <div className="grid grid-cols-1 gap-3">
              {order.clientNote && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 shadow-sm">
                  <p className="text-sm text-blue-700 font-black mb-0.5 uppercase tracking-wide">Client's Notes</p>
                  <p className="text-blue-900 text-sm md:text-base font-medium">{order.clientNote}</p>
                </div>
              )}
              {order.adminNote && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 shadow-sm">
                  <p className="text-sm text-amber-700 font-black mb-0.5 uppercase tracking-wide">Your Note to Client</p>
                  <p className="text-amber-900 text-sm md:text-base font-medium">{order.adminNote}</p>
                </div>
              )}
            </div>

            {['Shipped', 'Delivered'].includes(order.status) && order.dispatchDetails && (
              <div className="bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3 shadow-sm">
                <p className="text-cyan-800 text-sm md:text-base font-bold flex items-center gap-1.5 mb-2"><Truck size={16} /> Shipping Information</p>
                <div className="text-cyan-900 text-sm md:text-base grid grid-cols-2 gap-2">
                  {order.dispatchDetails.courierName && <span><strong className="font-semibold">Courier:</strong> {order.dispatchDetails.courierName}</span>}
                  {order.dispatchDetails.vehicleNumber && <span><strong className="font-semibold">Vehicle:</strong> {order.dispatchDetails.vehicleNumber}</span>}
                  {order.dispatchDetails.lrNumber && <span><strong className="font-semibold">LR No:</strong> {order.dispatchDetails.lrNumber}</span>}
                  {order.dispatchDetails.trackingId && <span><strong className="font-semibold">Tracking:</strong> {order.dispatchDetails.trackingId}</span>}
                </div>
              </div>
            )}

            {order.invoiceNumber && (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 shadow-sm gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={18} className="text-emerald-600 shrink-0" />
                  <span className="text-slate-800 text-sm md:text-base font-mono font-bold truncate">INV: {order.invoiceNumber}</span>
                </div>

                {actions.canDownloadInvoice && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleAction('print', order)} disabled={busy} className="p-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors disabled:opacity-50 shadow-sm">
                      {busy && loadingAction === 'print' ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                    </button>
                    <button onClick={() => handleAction('download', order)} disabled={busy} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center transition-colors disabled:opacity-50 shadow-sm">
                      {busy && loadingAction === 'download' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    </button>
                  </div>
                )}
              </div>
            )}

            {order.pricingSharedAt && (
              <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 font-medium"><CheckCircle2 size={14} className="text-emerald-500" /> Pricing shared with client on {formatDateTime(order.pricingSharedAt)}</p>
            )}

            {order.status === 'Cancelled' && (order.clientCancelReason || order.adminCancelReason) && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 shadow-sm">
                <p className="text-sm text-red-700 font-bold mb-0.5">Cancellation Reason</p>
                <p className="text-red-900 text-sm md:text-base font-medium">{order.clientCancelReason || order.adminCancelReason}</p>
              </div>
            )}
          </div>

          <div className="bg-white p-4 border-t border-slate-100 shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] z-20 space-y-2">
            {showConfirmPrompt ? (
              <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 mb-2 animate-fadeIn">
                <p className="font-bold text-emerald-800 text-base mb-1">Ready to confirm this order?</p>
                <p className="text-sm text-emerald-600 mb-3">Please ensure all requested stock is physically available in the warehouse before proceeding.</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowConfirmPrompt(false)} className="flex-1 bg-white text-emerald-700 py-3 rounded-xl font-bold border border-emerald-200 text-sm shadow-sm">
                    Let me check
                  </button>
                  <button onClick={() => { setShowConfirmPrompt(false); handleAction('confirmAndInvoice', order); }} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm shadow-sm">
                    Yes, Confirm Order
                  </button>
                </div>
              </div>
            ) : (
              <>
                {actions.canConfirmAndInvoice && (
                  <button onClick={() => setShowConfirmPrompt(true)} disabled={busy}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 md:py-3.5 rounded-xl text-base disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm transition-colors">
                    {busy && loadingAction === 'confirmAndInvoice' ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} Confirm Order
                  </button>
                )}

                {order.status === 'Confirmed' && (
                  <button onClick={() => handleAction('invoice', order)} disabled={busy}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 md:py-3.5 rounded-xl text-base disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm transition-colors">
                    {busy && loadingAction === 'invoice' ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />} Continue Invoicing
                  </button>
                )}

                {order.status === 'Invoiced' && (
                  <div className="flex gap-2 w-full">
                    <button onClick={() => handleAction('invoice', order)} disabled={busy}
                      className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 md:py-3.5 rounded-xl text-sm sm:text-base disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm transition-colors">
                      {busy && loadingAction === 'invoice' ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />} Edit Invoice
                    </button>
                    <button onClick={() => handleAction('pack', order)} disabled={busy} className="flex-[3] bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 md:py-3.5 rounded-xl text-sm sm:text-base flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50">
                      {busy && loadingAction === 'pack' ? <Loader2 size={18} className="animate-spin" /> : <Package size={18} />} Mark Packed
                    </button>
                  </div>
                )}

                {order.status === 'Packed' && (
                  <button onClick={() => handleAction('ship', order)} disabled={busy} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 md:py-3.5 rounded-xl text-base flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50">
                    {busy && loadingAction === 'ship' ? <Loader2 size={18} className="animate-spin" /> : <Truck size={18} />} Mark Shipped
                  </button>
                )}

                {actions.canMarkDelivered && (
                  <button onClick={() => handleAction('deliver', order)} disabled={busy}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 md:py-3.5 rounded-xl text-base disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm transition-colors">
                    {busy && loadingAction === 'deliver' ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} Mark Delivered
                  </button>
                )}

                {actions.canSharePricing && (
                  <button onClick={() => handleAction('sharePricing', order)} disabled={busy}
                    className="w-full bg-violet-500 hover:bg-violet-600 text-white font-bold py-3 md:py-3.5 rounded-xl text-base disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm transition-colors">
                    {busy && loadingAction === 'sharePricing' ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Send Pricing to Client
                  </button>
                )}

                {actions.canCancelOrder && (
                  <div className="flex pt-1">
                    <button onClick={() => handleAction('cancelOrder', order)} disabled={busy}
                      className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl text-sm sm:text-base border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50">
                      {busy && loadingAction === 'cancelOrder' ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Cancel Order'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <OrderCancelledPrompt
        isOpen={showCancelPrompt}
        reason={cancelReason}
        onGoToOrders={() => {
          setShowCancelPrompt(false);
          onAction('refresh', null);
          onClose();
        }}
      />
    </>
  );
}