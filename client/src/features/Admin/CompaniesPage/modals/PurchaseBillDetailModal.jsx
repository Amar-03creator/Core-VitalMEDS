// import { useState } from 'react';
// import { X, Download, Printer, Ban } from 'lucide-react';
// import { PURCHASE_BILL_STATUS_CFG } from '../utils/constants';
// import { useModalBackHandler, useScrollLock } from '../../BillingPage/utils/useModalBackHandler';
// import { api } from '../../../../services/api';
// import { toast } from 'sonner';

// /**
//  * PurchaseBillDetailModal
//  * Mirrors InvoiceDetailModal's layout/logic 1:1, but reads PurchaseBill
//  * fields (already fully computed server-side: taxableValue, cgst, sgst,
//  * lineTotal, netAmount, dueAmount — no client-side recompute needed).
//  */
// export const PurchaseBillDetailModal = ({ bill, onClose, onCancelled }) => {
//   const [cancelling, setCancelling] = useState(false);
//   const [showCancelForm, setShowCancelForm] = useState(false);
//   const [cancelReason, setCancelReason] = useState('');

//   if (!bill) return null;
//   useModalBackHandler(true, onClose);
//   useScrollLock(true);

//   const { pill, label } = PURCHASE_BILL_STATUS_CFG[bill.paymentStatus] || { pill: 'bg-slate-100', label: bill.paymentStatus };

//   const toIndianDate = (dateInput) => {
//     if (!dateInput) return '';
//     const d = new Date(dateInput);
//     if (isNaN(d.getTime())) return '';
//     return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
//   };

//   const handleCancelBill = async () => {
//     if (!cancelReason.trim()) {
//       toast.error('Please provide a reason for cancellation.');
//       return;
//     }
//     setCancelling(true);
//     try {
//       await api.cancelPurchaseBill(bill._id, cancelReason.trim());
//       toast.success('Purchase bill cancelled and stock reversed.');
//       onCancelled?.();
//       onClose();
//     } catch (err) {
//       toast.error(err.message);
//     } finally {
//       setCancelling(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
//       <div className="w-full bg-white rounded-t-2xl flex flex-col overflow-hidden" style={{ height: '85dvh' }}>
//         <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-3 border-b border-slate-100 z-10">
//           <div>
//             <p className="font-bold text-slate-900 font-mono text-lg">{bill.invoiceNumber}</p>
//             <p className="text-slate-500 text-base">{bill.supplierName}</p>
//           </div>
//           <button onClick={onClose}><X size={24} className="text-slate-400" /></button>
//         </div>

//         <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
//           <div className="flex flex-wrap items-center gap-2">
//             <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${pill}`}>{label}</span>
//             <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${bill.billType === 'Cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
//               {bill.billType} Bill
//             </span>
//             <span className="text-base text-slate-500">📅 {toIndianDate(bill.invoiceDate)}</span>
//             <span className="text-base text-slate-500">📦 Received: {toIndianDate(bill.receivedDate)}</span>
//           </div>

//           {bill.isCancelled && (
//             <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
//               <p className="text-red-700 font-semibold text-sm">This bill has been cancelled.</p>
//               {bill.cancelReason && <p className="text-red-500 text-sm mt-0.5">Reason: {bill.cancelReason}</p>}
//             </div>
//           )}

//           <h3 className="font-bold text-slate-800 text-xl pt-2 border-t border-slate-100">Items</h3>

//           <div className="space-y-3">
//             {bill.items.map((item, idx) => (
//               <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
//                 <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b border-slate-100">
//                   <div>
//                     <p className="text-slate-900 font-semibold text-xl">{item.productName}</p>
//                     <p className="text-slate-600 text-md font-mono font-bold">{item.batchNumber}</p>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-slate-900 font-bold text-xl">₹{Math.round(item.lineTotal)}</p>
//                     <p className="text-slate-400 text-sm">
//                       {(item.cgstPercent || 0) + (item.sgstPercent || 0) + (item.igstPercent || 0)}% GST
//                     </p>
//                   </div>
//                 </div>
//                 <div className="p-2 space-y-1.5">
//                   <div className="flex flex-wrap items-center justify-between gap-2 text-base text-slate-600">
//                     <span>Qty: <strong className="text-slate-800">{item.billedQty}</strong>
//                       {item.freeQty > 0 && <span className="text-emerald-600 font-bold"> +{item.freeQty} free</span>}
//                     </span>
//                     <span>Rate: <strong className="text-slate-800">₹{item.purchaseRate}</strong></span>
//                     <span>MRP: <strong className="text-slate-800">₹{item.mrp}</strong></span>
//                   </div>
//                   {item.discountAmount > 0 && (
//                     <p className="text-amber-600 text-base">Discount: ₹{item.discountAmount.toFixed(2)}</p>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>

//           <div className="bg-slate-50 rounded-2xl divide-y divide-slate-200 overflow-hidden border border-slate-200">
//             <div className="flex justify-between px-4 py-3 text-base">
//               <span className="text-slate-600">Gross Amount</span>
//               <span className="text-slate-800 font-medium">₹{bill.grossAmount.toFixed(2)}</span>
//             </div>
//             {bill.billDiscountAmount > 0 && (
//               <div className="flex justify-between px-4 py-3 text-base text-amber-700">
//                 <span>Bill Discount</span>
//                 <span className="font-semibold">- ₹{bill.billDiscountAmount.toFixed(2)}</span>
//               </div>
//             )}
//             <div className="flex justify-between px-4 py-3 text-base">
//               <span className="text-slate-600">Total GST</span>
//               <span className="text-slate-800 font-medium">₹{bill.totalGST.toFixed(2)}</span>
//             </div>
//             <div className="flex justify-between px-4 py-4 bg-slate-900">
//               <span className="text-white font-bold text-lg">Net Amount</span>
//               <span className="text-emerald-400 font-black text-xl">₹{Math.round(bill.netAmount).toLocaleString('en-IN')}</span>
//             </div>
//             {bill.dueAmount > 0 && (
//               <div className="flex justify-between px-4 py-3 bg-red-50 text-base">
//                 <span className="text-red-700 font-semibold">Due to Supplier</span>
//                 <span className="text-red-700 font-black">₹{Math.round(bill.dueAmount).toLocaleString('en-IN')}</span>
//               </div>
//             )}
//           </div>

//           {!bill.isCancelled && (
//             <>
//               {!showCancelForm ? (
//                 <button
//                   onClick={() => setShowCancelForm(true)}
//                   className="w-full flex items-center justify-center gap-2 text-red-600 font-semibold text-sm py-2.5 border border-dashed border-red-200 rounded-xl"
//                 >
//                   <Ban size={15} /> Cancel This Bill
//                 </button>
//               ) : (
//                 <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
//                   <textarea
//                     value={cancelReason}
//                     onChange={(e) => setCancelReason(e.target.value)}
//                     placeholder="Reason for cancelling this bill..."
//                     rows={2}
//                     className="w-full bg-white border border-red-200 rounded-lg px-3 py-2 text-sm outline-none resize-none"
//                   />
//                   <div className="flex gap-2">
//                     <button onClick={() => setShowCancelForm(false)} className="flex-1 bg-white border border-slate-200 text-slate-600 font-semibold py-2 rounded-lg text-sm">
//                       Back
//                     </button>
//                     <button
//                       onClick={handleCancelBill}
//                       disabled={cancelling}
//                       className="flex-1 bg-red-600 text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-60"
//                     >
//                       {cancelling ? 'Cancelling…' : 'Confirm Cancel'}
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </>
//           )}
//         </div>

//         <div className="sticky bottom-0 bg-white border-t border-slate-100 px-5 py-3 z-10 flex gap-3">
//           <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-xl text-base hover:bg-blue-700 transition-colors">
//             <Printer size={18} /> Print
//           </button>
//           <button className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold py-3 rounded-xl text-base hover:bg-slate-800 transition-colors">
//             <Download size={18} /> Download
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

import { useState } from 'react';
import { X, Download, Printer, Ban } from 'lucide-react';
import { downloadPurchaseBillPDF, printPurchaseBillPDF } from '../pdf/generatePurchaseBillPdf';
import { PURCHASE_BILL_STATUS_CFG } from '../utils/constants';
import { useModalBackHandler, useScrollLock } from '../../BillingPage/utils/useModalBackHandler';
import { api } from '../../../../services/api';
import { toast } from 'sonner';

/**
 * PurchaseBillDetailModal
 * Mirrors InvoiceDetailModal's layout/logic 1:1, but reads PurchaseBill
 * fields (already fully computed server-side: taxableValue, cgst, sgst,
 * lineTotal, netAmount, dueAmount — no client-side recompute needed).
 */
export const PurchaseBillDetailModal = ({ bill, onClose, onCancelled }) => {
  const [cancelling, setCancelling] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (!bill) return null;
  useModalBackHandler(true, onClose);
  useScrollLock(true);

  const { pill, label } = PURCHASE_BILL_STATUS_CFG[bill.paymentStatus] || { pill: 'bg-slate-100', label: bill.paymentStatus };

  const toIndianDate = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const handleCancelBill = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation.');
      return;
    }
    setCancelling(true);
    try {
      await api.cancelPurchaseBill(bill._id, cancelReason.trim());
      toast.success('Purchase bill cancelled and stock reversed.');
      onCancelled?.();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
      <div className="w-full bg-white rounded-t-2xl flex flex-col overflow-hidden" style={{ height: '85dvh' }}>
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-3 border-b border-slate-100 z-10">
          <div>
            <p className="font-bold text-slate-900 font-mono text-lg">{bill.invoiceNumber}</p>
            <p className="text-slate-500 text-base">{bill.supplierName}</p>
          </div>
          <button onClick={onClose}><X size={24} className="text-slate-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-lg font-bold px-2.5 py-1 rounded-full ${pill}`}>{label}</span>
            <span className={`text-lg font-semibold px-2 py-0.5 rounded-full ${bill.billType === 'Cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
              {bill.billType} Bill
            </span>
            <span className="text-base text-slate-500">📅 {toIndianDate(bill.invoiceDate)}</span>
            <span className="text-base text-slate-500">📦 Received: {toIndianDate(bill.receivedDate)}</span>
          </div>

          {bill.isCancelled && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <p className="text-red-700 font-semibold text-lg">This bill has been cancelled.</p>
              {bill.cancelReason && <p className="text-red-500 text-lg mt-0.5">Reason: {bill.cancelReason}</p>}
            </div>
          )}

          <h3 className="font-bold text-slate-800 text-xl pt-2 border-t border-slate-100">Items</h3>

          <div className="space-y-3">
            {bill.items.map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b border-slate-100">
                  <div>
                    <p className="text-slate-900 font-semibold text-xl">{item.productName}</p>
                    <p className="text-slate-600 text-md font-mono font-bold">{item.batchNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-900 font-bold text-xl">₹{Math.round(item.lineTotal)}</p>
                    <p className="text-slate-400 text-lg">
                      {(item.cgstPercent || 0) + (item.sgstPercent || 0) + (item.igstPercent || 0)}% GST
                    </p>
                  </div>
                </div>
                <div className="p-2 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-base text-slate-600">
                    <span>Qty: <strong className="text-slate-800">{item.billedQty}</strong>
                      {item.freeQty > 0 && <span className="text-emerald-600 font-bold"> +{item.freeQty} free</span>}
                    </span>
                    <span>Rate: <strong className="text-slate-800">₹{item.purchaseRate}</strong></span>
                    <span>MRP: <strong className="text-slate-800">₹{item.mrp}</strong></span>
                  </div>
                  {item.discountAmount > 0 && (
                    <p className="text-amber-600 text-base">Discount: ₹{item.discountAmount.toFixed(2)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 rounded-2xl divide-y divide-slate-200 overflow-hidden border border-slate-200">
            <div className="flex justify-between px-4 py-3 text-base">
              <span className="text-slate-600">Gross Amount</span>
              <span className="text-slate-800 font-medium">₹{bill.grossAmount.toFixed(2)}</span>
            </div>
            {bill.billDiscountAmount > 0 && (
              <div className="flex justify-between px-4 py-3 text-base text-amber-700">
                <span>Bill Discount</span>
                <span className="font-semibold">- ₹{bill.billDiscountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between px-4 py-3 text-base">
              <span className="text-slate-600">Total GST</span>
              <span className="text-slate-800 font-medium">₹{bill.totalGST.toFixed(2)}</span>
            </div>
            <div className="flex justify-between px-4 py-4 bg-slate-900">
              <span className="text-white font-bold text-lg">Net Amount</span>
              <span className="text-emerald-400 font-black text-xl">₹{Math.round(bill.netAmount).toLocaleString('en-IN')}</span>
            </div>
            {bill.dueAmount > 0 && (
              <div className="flex justify-between px-4 py-3 bg-red-50 text-base">
                <span className="text-red-700 font-semibold">Due to Supplier</span>
                <span className="text-red-700 font-black">₹{Math.round(bill.dueAmount).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          {!bill.isCancelled && (
            <>
              {!showCancelForm ? (
                <button
                  onClick={() => setShowCancelForm(true)}
                  className="w-full flex items-center justify-center gap-2 text-red-600 font-semibold text-lg py-2.5 border border-dashed border-red-200 rounded-xl"
                >
                  <Ban size={15} /> Cancel This Bill
                </button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Reason for cancelling this bill..."
                    rows={2}
                    className="w-full bg-white border border-red-200 rounded-lg px-3 py-2 text-lg outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowCancelForm(false)} className="flex-1 bg-white border border-slate-200 text-slate-600 font-semibold py-2 rounded-lg text-lg">
                      Back
                    </button>
                    <button
                      onClick={handleCancelBill}
                      disabled={cancelling}
                      className="flex-1 bg-red-600 text-white font-semibold py-2 rounded-lg text-lg disabled:opacity-60"
                    >
                      {cancelling ? 'Cancelling…' : 'Confirm Cancel'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-5 py-3 z-10 flex gap-3">
          <button
            onClick={() => printPurchaseBillPDF(bill)}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-xl text-base hover:bg-blue-700 transition-colors"
          >
            <Printer size={18} /> Print
          </button>
          <button
            onClick={() => downloadPurchaseBillPDF(bill)}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold py-3 rounded-xl text-base hover:bg-slate-800 transition-colors"
          >
            <Download size={18} /> Download
          </button>
        </div>
      </div>
    </div>
  );
};