// // src/features/Client/OrdersPage/components/Modals/OrderDetailsModal.jsx
// import { Truck, FileText, XCircle, CheckCircle2, Download, Edit3, Ban, Loader2, X, Printer, Eye, MessageSquare, Sparkles, ClipboardEdit } from 'lucide-react';
// import { toast } from 'sonner';
// import { ORDER_STATUS_META, formatDate, productLabel, getOrderActions, formatMoney } from '../../utils';
// import { useScrollLock, useModalTrap } from '../../../../../hooks/useBackHandler'; 

// const PROGRESS_STEPS = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];

// function OrderProgressTracker({ order }) {
//   if (order.status === 'Cancelled') {
//     let cancelTitle = 'This order was cancelled';
//     const reason = order.adminCancelReason || order.clientCancelReason;
//     if (order.adminCancelReason) cancelTitle = 'Cancelled by Admin';
//     else if (order.clientCancelReason) cancelTitle = 'Cancelled by You';

//     return (
//       <div className="flex flex-col gap-1 bg-red-50 border border-red-200 rounded-xl px-4 py-4 shadow-sm">
//         <div className="flex items-center gap-2 text-red-700 text-base md:text-lg font-bold">
//           <Ban size={20} /> {cancelTitle}
//         </div>
//         {reason && <p className="text-sm md:text-base text-red-600 pl-[28px]">{reason}</p>}
//       </div>
//     );
//   }

//   const displayStatus = order.status === 'Invoiced' ? 'Confirmed' : order.status;
//   const idx = Math.max(PROGRESS_STEPS.indexOf(displayStatus), 0);
//   const pct = (idx / (PROGRESS_STEPS.length - 1)) * 100;

//   return (
//     <div className="relative pt-2 pb-2">
//       <div className="absolute top-[20px] left-4 right-4 h-1.5 bg-slate-200 rounded-full" />
//       <div className="absolute top-[20px] left-4 h-1.5 bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `calc(${pct} * (100% - 2rem) / 100)` }} />
//       <div className="relative flex justify-between">
//         {PROGRESS_STEPS.map((step, i) => {
//           const meta = ORDER_STATUS_META[step] || ORDER_STATUS_META.Placed;
//           const done = i < idx;
//           const active = i === idx;
//           const StepIcon = meta.icon;
          
//           return (
//             <div key={step} className="flex flex-col items-center gap-1.5 w-1/5 relative z-10">
//               <div className={`w-10 h-10 rounded-full flex items-center justify-center border-[2.5px] shrink-0 transition-colors shadow-sm
//                 ${done ? 'border-emerald-500 bg-emerald-500' : active ? 'border-emerald-500 bg-white' : 'border-slate-300 bg-white'}`}>
//                 <StepIcon size={18} className={done ? 'text-white' : active ? 'text-emerald-600' : 'text-slate-400'} />
//               </div>
//               <p className={`text-sm md:text-base font-bold text-center leading-tight mt-1 ${done || active ? 'text-slate-800' : 'text-slate-400'}`}>
//                 {meta.label || step}
//               </p>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// export default function OrderDetailsModal({ order, onClose, busyId, onCancel, onConfirmDelivery, onDownloadInvoice, onPrintInvoice, onEdit }) {
//   useModalTrap(true, { onBackClose: onClose, customId: `client_order_detail_${order._id}` });
//   useScrollLock(true);
  
//   const actions = getOrderActions(order);
  
//   const isDelivering = busyId === `deliver_${order._id}`;
//   const isDownloading = busyId === `download_${order._id}`;
//   const isPrinting = busyId === `print_${order._id}`;

//   const isConvertedInquiry = !!order.inquiryId;
//   const isPastEditStage = ['Packed', 'Shipped', 'Delivered', 'Cancelled'].includes(order.status);
  
//   const hasStartedEditing = !!order.editWindowExpiresAt;
//   const isEditExpired = hasStartedEditing && new Date(order.editWindowExpiresAt).getTime() <= Date.now();
//   const isCurrentlyEditing = order.status === 'Editing';

//   const hasDetailedPricing = !!order.pricingSharedAt || ['Packed', 'Shipped', 'Delivered'].includes(order.status);

//   const handleEditClick = () => {
//     if (isConvertedInquiry) {
//       toast.error('Orders generated from negotiated quotes cannot be edited.');
//     } else if (isEditExpired) {
//       toast.error('The 2-minute editing window is over. Editing is permanently locked.');
//     } else {
//       onEdit(order);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-[110] bg-black/50 flex items-end md:items-center justify-center md:p-4" onClick={onClose}>
//       <div className="w-full md:max-w-3xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85dvh]" onClick={(e) => e.stopPropagation()}>
        
//         {/* Header */}
//         <div className="flex justify-between items-center bg-slate-50 px-6 py-5 border-b border-slate-200 shrink-0">
//           <div>
//             <h3 className="font-black text-xl md:text-2xl text-slate-900">{order.orderId}</h3>
//             <p className="text-sm md:text-base text-slate-500 font-semibold mt-1">{formatDate(order.createdAt)} · {order.inquiryId ? 'From Inquiry' : 'Direct Order'}</p>
//           </div>
//           <button onClick={onClose} className="p-2.5 rounded-full hover:bg-slate-200 transition-colors bg-white border border-slate-200 shadow-sm">
//             <X size={24} className="text-slate-600" />
//           </button>
//         </div>
        
//         <div className="p-4 md:p-6 overflow-y-auto space-y-4 md:space-y-5 bg-slate-50/50 flex-1 min-h-0">
//           <OrderProgressTracker order={order} />

//           {/* Pricing Notice */}
//           {order.pricingSharedAt && !['Cancelled', 'Delivered'].includes(order.status) && (
//             <div className="text-sm md:text-base font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3 shadow-sm">
//               <Eye size={20} className="text-amber-500 shrink-0 mt-0.5" />
//               <p>The admin has reviewed your order and unlocked the exact expiration dates, quantities, and pricing.</p>
//             </div>
//           )}

//           {/* Shipping Info */}
//           {['Shipped', 'Delivered'].includes(order.status) && order.dispatchDetails && (
//             <div className="bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3 shadow-sm">
//               <p className="text-cyan-800 text-base md:text-lg font-bold flex items-center gap-2 mb-2"><Truck size={18} /> Shipping Info</p>
//               <div className="text-cyan-900 text-sm md:text-base grid grid-cols-1 md:grid-cols-2 gap-2">
//                 {order.dispatchDetails.courierName && <span><strong className="font-bold">Courier:</strong> {order.dispatchDetails.courierName}</span>}
//                 {order.dispatchDetails.vehicleNumber && <span><strong className="font-bold">Vehicle:</strong> {order.dispatchDetails.vehicleNumber}</span>}
//                 {order.dispatchDetails.lrNumber && <span><strong className="font-bold">LR No:</strong> {order.dispatchDetails.lrNumber}</span>}
//                 {order.dispatchDetails.trackingId && <span><strong className="font-bold">Tracking ID:</strong> {order.dispatchDetails.trackingId}</span>}
//               </div>
//             </div>
//           )}

//           {['Packed', 'Shipped', 'Delivered'].includes(order.status) && order.invoiceNumber && (
//             <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 shadow-sm">
//               <div className="flex items-center gap-3 min-w-0">
//                 <FileText size={20} className="text-emerald-600 shrink-0" />
//                 <span className="text-slate-800 text-base md:text-lg font-bold font-mono truncate">INV: {order.invoiceNumber}</span>
//               </div>
//               <div className="flex gap-2">
//                 <button onClick={() => onPrintInvoice(order)} disabled={isPrinting} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50">
//                   {isPrinting ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
//                 </button>
//                 <button onClick={() => onDownloadInvoice(order)} disabled={isDownloading} className="w-10 h-10 flex items-center justify-center bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50">
//                   {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Order Items List */}
//           <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
//             <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 shrink-0 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
//               <h4 className="text-sm md:text-base font-bold text-slate-700 uppercase tracking-wide">Order Items ({(order.items || []).length})</h4>
              
//               <div className="flex flex-wrap gap-1.5 items-center">
//                 <span className={`px-2.5 py-1 rounded-md text-xs md:text-sm font-black uppercase tracking-wider shadow-sm ${order.billPreference === 'Cash' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
//                   Req: {order.billPreference || 'Credit'}
//                 </span>
//                 {order.invoiceBillType && order.invoiceBillType !== order.billPreference && (
//                    <span className={`px-2.5 py-1 rounded-md text-xs md:text-sm font-black uppercase tracking-wider shadow-sm ${order.invoiceBillType === 'Cash' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
//                     Inv: {order.invoiceBillType}
//                   </span>
//                 )}
//               </div>
//             </div>
            
//             <div className="p-3 md:p-4 space-y-3">
//               {(order.items || []).map((item, i) => {
//                 const compName = item.productId?.companyId?.companyName || item.productId?.company || '';
//                 const sCode = item.productId?.companyId?.shortCode || '';
//                 const companyDisplay = (compName && sCode && compName !== sCode) ? sCode : (compName || sCode || '—');
//                 const plannedBatch = item.plannedBatches?.[0]?.batchId;
                
//                 let expiryLabel = hasDetailedPricing ? 'Exp:' : 'Est. Exp:'; 
//                 let expiryDateText = 'Standard';
                
//                 const rawDate = (plannedBatch && (plannedBatch.expiryDate || plannedBatch.expiry)) || item.closestExpiry;
//                 if (rawDate) {
//                   const d = new Date(rawDate);
//                   if (!isNaN(d)) {
//                     const mm = String(d.getMonth() + 1).padStart(2, '0');
//                     const yy = String(d.getFullYear()).slice(-2);
//                     expiryDateText = `${mm}/${yy}`;
//                   }
//                 }
//                 const expiry = `${expiryLabel} ${expiryDateText}`;
                
//                 const providedChargeable = item.chargeableQty ?? item.finalQty ?? 0;
//                 const providedFree = item.freeQty || 0;
//                 const providedTotal = providedChargeable + providedFree;
//                 const providedDisplay = providedFree > 0 ? `${providedChargeable} + ${providedFree}` : providedChargeable;
//                 const requestedQty = item.requestedQty || item.qty || providedTotal || 0;
//                 const ptr = item.finalPrice || item.adminOfferedPTR || item.estimatedPrice || 0;
//                 const actualPriceWithoutTax = item.taxableValue != null ? item.taxableValue : (ptr * providedChargeable);
                
//                 const showPrice = hasDetailedPricing && ptr > 0;

//                 return (
//                   // ✨ FIX: pt-8 makes safe room for the top-left badge. pb-10 makes room for the bottom-right badge if price exists.
//                   <div key={i} className={`relative border border-slate-200 rounded-xl p-3 md:p-4 pt-8 md:pt-9 ${showPrice ? 'pb-10 md:pb-12' : ''} bg-slate-50 shadow-sm flex flex-col gap-2`}>
                    
//                     {/* ✨ NEW: Top-Left Semi-Circle Serial Badge */}
//                     <div className="absolute top-0 left-0 bg-slate-800 text-white text-sm md:text-base font-black px-3 py-1 rounded-br-2xl rounded-tl-xl shadow-sm z-10">
//                       #{i + 1}
//                     </div>

//                     {/* ✨ NEW: Bottom-Right Inverse Badge for Price */}
//                     {showPrice && (
//                       <div className="absolute bottom-0 right-0 bg-emerald-50 border-t border-l border-emerald-200 text-emerald-700 text-base md:text-lg font-black px-4 py-1.5 rounded-tl-2xl rounded-br-xl shadow-sm z-10">
//                         {formatMoney(actualPriceWithoutTax)}
//                       </div>
//                     )}

//                     <div className="flex-1 min-w-0">
//                       <p className="font-black text-slate-900 text-lg md:text-xl truncate">
//                         {productLabel(item.productId)}
//                         <span className="text-sm md:text-base font-semibold text-slate-500 ml-2">({companyDisplay})</span>
//                       </p>
//                     </div>
                      
//                     <div className="flex flex-wrap items-center gap-2 mt-1 relative z-20">
//                       <span className="text-slate-700 bg-slate-200 border border-slate-300 px-2.5 py-1 rounded-md font-bold text-sm md:text-base shadow-sm">
//                         {expiry}
//                       </span>
//                       <span className="text-slate-700 bg-slate-200 border border-slate-300 px-2.5 py-1 rounded-md font-bold text-sm md:text-base shadow-sm">
//                         Ord: {requestedQty}
//                       </span>
                      
//                       {hasDetailedPricing && (
//                         <span className="text-slate-900 bg-slate-300 border border-slate-400 px-2.5 py-1 rounded-md font-black text-sm md:text-base shadow-sm">
//                           Prov: {providedDisplay}
//                         </span>
//                       )}
                      
//                       {plannedBatch && typeof plannedBatch === 'object' && plannedBatch.nearExpiry && (
//                         <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-300 px-2.5 py-1 rounded-md font-bold text-sm md:text-base shadow-sm">
//                           <Sparkles size={14} /> Offer Batch
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Notes Section */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
//             {order.clientNote && (
//               <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 shadow-sm flex items-start gap-3">
//                 <MessageSquare size={20} className="text-blue-500 shrink-0 mt-0.5" />
//                 <div>
//                   <p className="text-sm md:text-base text-blue-700 font-black mb-0.5 uppercase tracking-wide">Your Note</p>
//                   <p className="text-blue-900 text-sm md:text-base font-medium leading-snug">{order.clientNote}</p>
//                 </div>
//               </div>
//             )}
//             {order.adminNote && (
//               <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 shadow-sm flex items-start gap-3">
//                 <ClipboardEdit size={20} className="text-amber-500 shrink-0 mt-0.5" />
//                 <div>
//                   <p className="text-sm md:text-base text-amber-700 font-black mb-0.5 uppercase tracking-wide">Note from Admin</p>
//                   <p className="text-amber-900 text-sm md:text-base font-medium leading-snug">{order.adminNote}</p>
//                 </div>
//               </div>
//             )}
//           </div>

//         </div>

//         {/* Footer Actions */}
//         <div className="p-4 md:p-5 bg-white border-t border-slate-200 shrink-0 flex flex-wrap md:flex-nowrap gap-3 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
//           {!isPastEditStage && actions.canEdit && (
//             <button 
//               onClick={handleEditClick} 
//               className={`flex-[2] flex items-center justify-center gap-2 py-3 md:py-3.5 rounded-xl border-2 text-base md:text-lg font-black shadow-sm transition-colors ${
//                 (isEditExpired || isConvertedInquiry) 
//                   ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
//                   : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
//               }`}
//             >
//               <Edit3 size={18} /> 
//               {isConvertedInquiry ? 'Edit Locked (Quote)' : (isEditExpired ? 'Editing Expired' : (isCurrentlyEditing ? 'Resume Edit' : 'Edit Order'))}
//             </button>
//           )}
//           {actions.canConfirmDelivery && (
//             <button onClick={() => onConfirmDelivery(order)} disabled={isDelivering} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white text-base md:text-lg font-black py-3 md:py-3.5 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-md">
//               {isDelivering ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} Confirm Delivery
//             </button>
//           )}
//           {actions.canCancel && (
//             <button onClick={() => onCancel(order)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-50 text-red-700 text-base md:text-lg font-black py-3 md:py-3.5 px-6 md:px-8 rounded-xl border border-red-200 hover:bg-red-100 transition-colors shadow-sm">
//               <XCircle size={18} /> Cancel
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


// src/features/Client/OrdersPage/components/Modals/OrderDetailsModal.jsx
import { Truck, FileText, XCircle, CheckCircle2, Download, Edit3, Ban, Loader2, X, Printer, Eye, MessageSquare, Sparkles, ClipboardEdit } from 'lucide-react';
import { toast } from 'sonner';
import { ORDER_STATUS_META, formatDate, productLabel, getOrderActions, formatMoney } from '../../utils';
import { useScrollLock, useModalTrap } from '../../../../../hooks/useBackHandler'; 

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

export default function OrderDetailsModal({ order, onClose, busyId, onCancel, onConfirmDelivery, onDownloadInvoice, onPrintInvoice, onEdit }) {
  useModalTrap(true, { onBackClose: onClose, customId: `client_order_detail_${order._id}` });
  useScrollLock(true);
  
  const actions = getOrderActions(order);
  
  const isDelivering = busyId === `deliver_${order._id}`;
  const isDownloading = busyId === `download_${order._id}`;
  const isPrinting = busyId === `print_${order._id}`;

  const isConvertedInquiry = !!order.inquiryId;
  const isPastEditStage = ['Packed', 'Shipped', 'Delivered', 'Cancelled'].includes(order.status);
  
  const hasStartedEditing = !!order.editWindowExpiresAt;
  const isEditExpired = hasStartedEditing && new Date(order.editWindowExpiresAt).getTime() <= Date.now();
  const isCurrentlyEditing = order.status === 'Editing';

  const hasDetailedPricing = !!order.pricingSharedAt || ['Packed', 'Shipped', 'Delivered'].includes(order.status);

  const handleEditClick = () => {
    if (isConvertedInquiry) {
      toast.error('Orders generated from negotiated quotes cannot be edited.');
    } else if (isEditExpired) {
      toast.error('The 2-minute editing window is over. Editing is permanently locked.');
    } else {
      onEdit(order);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/50 flex items-end md:items-center justify-center md:p-4" onClick={onClose}>
      <div className="w-full md:max-w-3xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85dvh]" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-50 px-6 py-5 border-b border-slate-200 shrink-0">
          <div>
            <h3 className="font-black text-xl md:text-2xl text-slate-900">{order.orderId}</h3>
            <p className="text-sm md:text-base text-slate-500 font-semibold mt-1">{formatDate(order.createdAt)} · {order.inquiryId ? 'From Inquiry' : 'Direct Order'}</p>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-full hover:bg-slate-200 transition-colors bg-white border border-slate-200 shadow-sm">
            <X size={24} className="text-slate-600" />
          </button>
        </div>
        
        <div className="p-4 md:p-6 overflow-y-auto space-y-4 md:space-y-5 bg-slate-50/50 flex-1 min-h-0">
          <OrderProgressTracker order={order} />

          {/* Pricing Notice */}
          {order.pricingSharedAt && !['Cancelled', 'Delivered'].includes(order.status) && (
            <div className="text-sm md:text-base font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3 shadow-sm">
              <Eye size={20} className="text-amber-500 shrink-0 mt-0.5" />
              <p>The admin has reviewed your order and unlocked the exact expiration dates, quantities, and pricing.</p>
            </div>
          )}

          {/* Shipping Info */}
          {['Shipped', 'Delivered'].includes(order.status) && order.dispatchDetails && (
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3 shadow-sm">
              <p className="text-cyan-800 text-base md:text-lg font-bold flex items-center gap-2 mb-2"><Truck size={18} /> Shipping Info</p>
              <div className="text-cyan-900 text-sm md:text-base grid grid-cols-1 md:grid-cols-2 gap-2">
                {order.dispatchDetails.courierName && <span><strong className="font-bold">Courier:</strong> {order.dispatchDetails.courierName}</span>}
                {order.dispatchDetails.vehicleNumber && <span><strong className="font-bold">Vehicle:</strong> {order.dispatchDetails.vehicleNumber}</span>}
                {order.dispatchDetails.lrNumber && <span><strong className="font-bold">LR No:</strong> {order.dispatchDetails.lrNumber}</span>}
                {order.dispatchDetails.trackingId && <span><strong className="font-bold">Tracking ID:</strong> {order.dispatchDetails.trackingId}</span>}
              </div>
            </div>
          )}

          {['Packed', 'Shipped', 'Delivered'].includes(order.status) && order.invoiceNumber && (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={20} className="text-emerald-600 shrink-0" />
                <span className="text-slate-800 text-base md:text-lg font-bold font-mono truncate">INV: {order.invoiceNumber}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onPrintInvoice(order)} disabled={isPrinting} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50">
                  {isPrinting ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
                </button>
                <button onClick={() => onDownloadInvoice(order)} disabled={isDownloading} className="w-10 h-10 flex items-center justify-center bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50">
                  {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Order Items List */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 shrink-0 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
              <h4 className="text-sm md:text-base font-bold text-slate-700 uppercase tracking-wide">Order Items ({(order.items || []).length})</h4>
              
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className={`px-2.5 py-1 rounded-md text-xs md:text-sm font-black uppercase tracking-wider shadow-sm ${order.billPreference === 'Cash' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                  Req: {order.billPreference || 'Credit'}
                </span>
                {order.invoiceBillType && order.invoiceBillType !== order.billPreference && (
                   <span className={`px-2.5 py-1 rounded-md text-xs md:text-sm font-black uppercase tracking-wider shadow-sm ${order.invoiceBillType === 'Cash' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                    Inv: {order.invoiceBillType}
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-3 md:p-4 space-y-3">
              {(order.items || []).map((item, i) => {
                const compName = item.productId?.companyId?.companyName || item.productId?.company || '';
                const sCode = item.productId?.companyId?.shortCode || '';
                const companyDisplay = (compName && sCode && compName !== sCode) ? sCode : (compName || sCode || '—');
                
                const plannedBatch = item.plannedBatches?.[0]?.batchId;
                const isOfferBatch = !!item.offerDescription;
                
                let expiryLabel = (hasDetailedPricing || isOfferBatch) ? 'Exp:' : 'Est. Exp:'; 
                let expiryDateText = 'Standard';
                
                const exactBatchExpiry = plannedBatch && typeof plannedBatch === 'object' ? (plannedBatch.expiryDate || plannedBatch.expiry) : null;
                const rawDate = exactBatchExpiry || item.expiryDate || item.closestExpiry;
                
                // ✨ FIX: Format to MM/YY to match Admin side perfectly
                if (rawDate) {
                  const d = new Date(rawDate);
                  if (!isNaN(d)) {
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const yy = String(d.getFullYear()).slice(-2);
                    expiryDateText = `${mm}/${yy}`;
                  }
                }
                
                const providedChargeable = item.chargeableQty ?? item.finalQty ?? 0;
                const providedFree = item.freeQty || 0;
                const providedTotal = providedChargeable + providedFree;
                const providedDisplay = providedFree > 0 ? `${providedChargeable} + ${providedFree}` : providedChargeable;
                const requestedQty = item.requestedQty || item.qty || providedTotal || 0;
                
                const rowPrice = item.lineTotal != null ? item.lineTotal : (item.taxableValue || 0);
                const showPrice = hasDetailedPricing && rowPrice > 0;

                return (
                  <div key={i} className="relative border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col p-3 space-y-3">
                    
                    {/* Badge */}
                    <div className="absolute top-0 left-0 bg-slate-800 text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-br-2xl rounded-tl-xl shadow-sm z-10">
                      #{i + 1}
                    </div>

                    {/* Title Box */}
                    <div className="w-full rounded-xl p-2 bg-slate-50 border border-slate-200 shrink-0">
                      <p className="font-black text-slate-900 text-lg md:text-xl leading-tight truncate">
                        {productLabel(item.productId)}
                        {companyDisplay && <span className="text-slate-500 font-semibold ml-1.5 text-sm md:text-base">({companyDisplay})</span>}
                      </p>
                    </div>

                    <div className="w-full px-1">
                      
                      {/* Row 1: Expiry, Req, Prov */}
                      <div className="flex justify-between items-center gap-x-3 md:gap-x-5 gap-y-2 text-base md:text-base font-medium">
                        <span className="text-slate-600">{expiryLabel} <strong className="text-slate-900">{expiryDateText}</strong></span>
                        <span className="text-slate-600">Req: <strong className="text-slate-900">{requestedQty}</strong></span>
                        
                        {hasDetailedPricing && (
                          <span className="text-slate-600">Prov: <strong className="text-slate-900">{providedDisplay}</strong></span>
                        )}
                      </div>

                      {/* Row 2: Offer Pill & Total Price */}
                      <div className="flex justify-between items-center gap-x-3 md:gap-x-5 gap-y-2 text-sm md:text-base font-medium mt-1.5">
                        {isOfferBatch ? (
                          <span className="inline-flex items-center gap-1 text-orange-800 bg-orange-100 px-2 py-0.5 rounded text-sm font-bold shadow-sm border border-orange-300 max-w-[150px] md:max-w-[250px]">
                            <Sparkles size={14} className="shrink-0" /> 
                            <span className="truncate">'Offer Applied'</span>
                          </span>
                        ) : (
                          <span /> /* Empty span keeps the price aligned to the right if there is no offer pill */
                        )}

                        {showPrice && (
                          <span className="text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded font-black text-sm md:text-base shadow-sm">
                            Total: {formatMoney(rowPrice)}
                          </span>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {order.clientNote && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 shadow-sm flex items-start gap-3">
                <MessageSquare size={20} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm md:text-base text-blue-700 font-black mb-0.5 uppercase tracking-wide">Your Note</p>
                  <p className="text-blue-900 text-sm md:text-base font-medium leading-snug">{order.clientNote}</p>
                </div>
              </div>
            )}
            {order.adminNote && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 shadow-sm flex items-start gap-3">
                <ClipboardEdit size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm md:text-base text-amber-700 font-black mb-0.5 uppercase tracking-wide">Note from Admin</p>
                  <p className="text-amber-900 text-sm md:text-base font-medium leading-snug">{order.adminNote}</p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-5 bg-white border-t border-slate-200 shrink-0 flex flex-wrap md:flex-nowrap gap-3 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
          {!isPastEditStage && actions.canEdit && (
            <button 
              onClick={handleEditClick} 
              className={`flex-[2] flex items-center justify-center gap-2 py-3 md:py-3.5 rounded-xl border-2 text-base md:text-lg font-black shadow-sm transition-colors ${
                (isEditExpired || isConvertedInquiry) 
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
              }`}
            >
              <Edit3 size={18} /> 
              {isConvertedInquiry ? 'Edit Locked (Quote)' : (isEditExpired ? 'Editing Expired' : (isCurrentlyEditing ? 'Resume Edit' : 'Edit Order'))}
            </button>
          )}
          {actions.canConfirmDelivery && (
            <button onClick={() => onConfirmDelivery(order)} disabled={isDelivering} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white text-base md:text-lg font-black py-3 md:py-3.5 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-md">
              {isDelivering ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} Confirm Delivery
            </button>
          )}
          {actions.canCancel && (
            <button onClick={() => onCancel(order)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-50 text-red-700 text-base md:text-lg font-black py-3 md:py-3.5 px-6 md:px-8 rounded-xl border border-red-200 hover:bg-red-100 transition-colors shadow-sm">
              <XCircle size={18} /> Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}