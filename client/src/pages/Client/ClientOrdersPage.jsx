




// import { useState } from 'react';

// import {

//   ShoppingCart, ClipboardList, ChevronDown, ChevronUp,

//   Download, CheckCircle2, Truck, Clock, XCircle,

//   ReceiptText, Package, Edit2, Filter, RefreshCw,

//   AlertCircle, Eye, MessageSquare

// } from 'lucide-react';



// /* ── DEMO DATA ── */

// const myOrders = [

//   {

//     id: 'ORD-2024-201', date: '07 May 2025', status: 'Placed',

//     amount: 12400, items: 5, billType: 'Credit',

//     products: ['Paracetamol 500mg ×200', 'Amoxicillin 250mg ×100', '+3 more'],

//     canEdit: true, canCancel: true,

//   },

//   {

//     id: 'ORD-2024-199', date: '06 May 2025', status: 'Invoiced',

//     amount: 15200, items: 4, billType: 'Credit',

//     invoice: 'MIL-05-2025-042',

//     products: ['Pantoprazole 40mg ×120', 'Atorvastatin 10mg ×80', '+2 more'],

//     canEdit: false, canCancel: false,

//   },

//   {

//     id: 'ORD-2024-197', date: '05 May 2025', status: 'Shipped',

//     amount: 22100, items: 6, billType: 'Credit',

//     invoice: 'MIL-05-2025-041',

//     tracking: 'Out for delivery',

//     products: ['Metformin 500mg ×200', 'Cetirizine 10mg ×100', '+4 more'],

//     canEdit: false, canCancel: false,

//   },

//   {

//     id: 'ORD-2024-195', date: '03 May 2025', status: 'Delivered',

//     amount: 34500, items: 8, billType: 'Credit',

//     invoice: 'MIL-05-2025-038',

//     products: ['Atorvastatin 10mg ×80', 'Glimepiride 2mg ×50', '+6 more'],

//     canEdit: false, canCancel: false,

//   },

//   {

//     id: 'ORD-2024-189', date: '28 Apr 2025', status: 'Delivered',

//     amount: 18200, items: 4, billType: 'Cash',

//     invoice: 'MIL-04-2025-035',

//     products: ['Amlodipine 5mg ×100', 'Losartan 50mg ×80', '+2 more'],

//     canEdit: false, canCancel: false,

//   },

//   {

//     id: 'ORD-2024-183', date: '20 Apr 2025', status: 'Cancelled',

//     amount: 5200, items: 2, billType: 'Credit',

//     cancelReason: 'Customer request – price not matching',

//     products: ['Metformin 500mg ×200', 'Glimepiride 2mg ×50'],

//     canEdit: false, canCancel: false,

//   },

// ];



// const myInquiries = [

//   {

//     id: 'INQ-2024-089', date: '07 May 2025', status: 'Pending',

//     items: 5, estimatedTotal: 12400,

//     products: ['Paracetamol 500mg', 'Amoxicillin 250mg', '+3 more'],

//     canEdit: true, canCancel: true,

//   },

//   {

//     id: 'INQ-2024-086', date: '05 May 2025', status: 'Quoted',

//     items: 3, estimatedTotal: 8750,

//     products: ['Pantoprazole 40mg', 'Atorvastatin 10mg', '+1 more'],

//     quoteTotal: 8200,

//     quoteNote: 'Provided 5% discount on Pantoprazole. Batch PAN-07.',

//     canEdit: false, canCancel: true,

//   },

//   {

//     id: 'INQ-2024-083', date: '01 May 2025', status: 'Accepted',

//     items: 4, estimatedTotal: 18200,

//     products: ['Metformin 500mg', 'Cetirizine 10mg', '+2 more'],

//     canEdit: false, canCancel: false,

//   },

//   {

//     id: 'INQ-2024-079', date: '25 Apr 2025', status: 'Rejected',

//     items: 2, estimatedTotal: 3200,

//     rejectReason: 'Items out of stock. Please try again next week.',

//     products: ['Omeprazole 20mg', 'Pantoprazole 40mg'],

//     canEdit: false, canCancel: false,

//   },

// ];



// const orderStatus = {

//   Placed: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500', icon: Clock, step: 1 },

//   Confirmed: { color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-500', icon: CheckCircle2, step: 2 },

//   Invoiced: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', icon: ReceiptText, step: 3 },

//   Shipped: { color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', dot: 'bg-cyan-500', icon: Truck, step: 4 },

//   Delivered: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2, step: 5 },

//   Cancelled: { color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400', icon: XCircle, step: 0 },

// };



// const inquiryStatus = {

//   Pending: { color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' },

//   Quoted: { color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500' },

//   'Changes Requested': { color: 'text-orange-600', bg: 'bg-orange-50', dot: 'bg-orange-500' },

//   Accepted: { color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },

//   Rejected: { color: 'text-slate-500', bg: 'bg-slate-100', dot: 'bg-slate-400' },

// };



// /* ── ORDER PROGRESS ── */

// const OrderProgress = ({ status }) => {

//   const steps = [

//     { label: 'Placed', icon: ShoppingCart },

//     { label: 'Invoiced', icon: ReceiptText },

//     { label: 'Shipped', icon: Truck },

//     { label: 'Delivered', icon: CheckCircle2 },

//   ];

//   const currentStep = orderStatus[status]?.step || 0;



//   if (status === 'Cancelled') return null;



//   return (

//     <div className="flex items-center justify-between px-1 py-2">

//       {steps.map((s, i) => {

//         const done = currentStep > i;

//         const active = currentStep === i + 1;

//         return (

//           <div key={s.label} className="flex-1 flex flex-col items-center">

//             <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all

//               ${done ? 'bg-emerald-500 border-emerald-500' :

//                 active ? 'bg-white border-emerald-500' : 'bg-slate-100 border-slate-200'}`}

//             >

//               <s.icon size={14} className={done ? 'text-white' : active ? 'text-emerald-500' : 'text-slate-400'} />

//             </div>

//             <p className={`text-[9px] font-semibold mt-1 text-center ${done || active ? 'text-slate-700' : 'text-slate-400'}`}>

//               {s.label}

//             </p>

//             {i < steps.length - 1 && (

//               <div className={`absolute h-0.5 w-full translate-y-4 -z-10 ${done ? 'bg-emerald-500' : 'bg-slate-200'}`} />

//             )}

//           </div>

//         );

//       })}

//     </div>

//   );

// };



// /* ── ORDER CARD ── */

// const OrderCard = ({ order }) => {

//   const [expanded, setExpanded] = useState(false);

//   const { color, bg, border, dot, icon: StatusIcon } = orderStatus[order.status];



//   return (

//     <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

//       <button onClick={() => setExpanded(e => !e)} className="w-full text-left px-4 py-4">

//         <div className="flex items-start justify-between gap-2">

//           <div className="flex-1 min-w-0">

//             <div className="flex items-center gap-2 flex-wrap">

//               <span className="text-slate-400 text-xs font-mono">{order.id}</span>

//               <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${bg} ${color}`}>

//                 <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />

//                 {order.status}

//               </span>

//             </div>

//             <p className="text-slate-500 text-xs mt-1 line-clamp-1">{order.products.join(' · ')}</p>

//             <div className="flex items-center gap-2 mt-2">

//               <span className="text-slate-900 font-bold">₹{order.amount.toLocaleString()}</span>

//               <span className="text-slate-400 text-xs">·</span>

//               <span className="text-slate-500 text-xs">{order.items} items</span>

//               <span className="text-slate-400 text-xs">·</span>

//               <span className={`text-xs font-semibold ${order.billType === 'Cash' ? 'text-emerald-600' : 'text-blue-600'}`}>

//                 {order.billType}

//               </span>

//             </div>

//             <p className="text-slate-400 text-xs mt-1">{order.date}</p>

//           </div>

//           {expanded ? <ChevronUp size={18} className="text-slate-400 shrink-0 mt-1" /> : <ChevronDown size={18} className="text-slate-400 shrink-0 mt-1" />}

//         </div>

//       </button>



//       {expanded && (

//         <div className="border-t border-slate-100 px-4 py-4 space-y-3">

//           {/* Progress */}

//           <OrderProgress status={order.status} />



//           {/* Shipping */}

//           {order.tracking && (

//             <div className="bg-cyan-50 border border-cyan-200 rounded-xl px-3 py-2.5 flex items-center gap-2">

//               <Truck size={14} className="text-cyan-600" />

//               <p className="text-cyan-700 text-sm font-medium">{order.tracking}</p>

//             </div>

//           )}



//           {/* Invoice */}

//           {order.invoice && (

//             <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5">

//               <div className="flex items-center gap-2">

//                 <ReceiptText size={14} className="text-slate-500" />

//                 <span className="text-slate-700 text-sm font-mono">{order.invoice}</span>

//               </div>

//               <button className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">

//                 <Download size={12} /> PDF

//               </button>

//             </div>

//           )}



//           {/* Cancel reason */}

//           {order.cancelReason && (

//             <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">

//               <p className="text-slate-500 text-xs font-semibold mb-1">Cancellation Reason</p>

//               <p className="text-slate-700 text-sm">{order.cancelReason}</p>

//             </div>

//           )}



//           {/* Actions */}

//           <div className="flex gap-2">

//             {order.canEdit && (

//               <button className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 font-semibold text-xs py-2.5 rounded-xl">

//                 <Edit2 size={13} /> Edit

//               </button>

//             )}

//             {(order.status === 'Shipped') && (

//               <button className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 text-white font-semibold text-xs py-2.5 rounded-xl">

//                 <CheckCircle2 size={13} /> Confirm Delivery

//               </button>

//             )}

//             {order.invoice && (

//               <button className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 font-semibold text-xs py-2.5 rounded-xl">

//                 <Download size={13} /> Invoice

//               </button>

//             )}

//             {order.canCancel && (

//               <button className="w-10 h-9 flex items-center justify-center bg-red-50 text-red-500 rounded-xl border border-red-100">

//                 <XCircle size={14} />

//               </button>

//             )}

//           </div>

//         </div>

//       )}

//     </div>

//   );

// };



// /* ── INQUIRY CARD ── */

// const InquiryCard = ({ inq }) => {

//   const [expanded, setExpanded] = useState(false);

//   const [showQuoteDetail, setShowQuoteDetail] = useState(false);

//   const { color, bg, dot } = inquiryStatus[inq.status];



//   return (

//     <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

//       {inq.status === 'Quoted' && !expanded && (

//         <div className="bg-blue-600 px-4 py-2 flex items-center gap-2">

//           <AlertCircle size={14} className="text-blue-200" />

//           <p className="text-white text-xs font-semibold">Quote received! Tap to view details.</p>

//         </div>

//       )}



//       <button onClick={() => setExpanded(e => !e)} className="w-full text-left px-4 py-4">

//         <div className="flex items-start justify-between gap-2">

//           <div className="flex-1 min-w-0">

//             <div className="flex items-center gap-2 flex-wrap">

//               <span className="text-slate-400 text-xs font-mono">{inq.id}</span>

//               <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${bg} ${color}`}>

//                 <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />

//                 {inq.status}

//               </span>

//             </div>

//             <p className="text-slate-500 text-xs mt-1 line-clamp-1">{inq.products.join(' · ')}</p>

//             <div className="flex items-center gap-2 mt-2">

//               <span className="text-slate-900 font-bold">₹{inq.estimatedTotal.toLocaleString()}</span>

//               <span className="text-slate-400 text-xs">est.</span>

//               <span className="text-slate-400 text-xs">·</span>

//               <span className="text-slate-500 text-xs">{inq.items} items</span>

//             </div>

//             <p className="text-slate-400 text-xs mt-1">{inq.date}</p>

//           </div>

//           {expanded ? <ChevronUp size={18} className="text-slate-400 shrink-0 mt-1" /> : <ChevronDown size={18} className="text-slate-400 shrink-0 mt-1" />}

//         </div>

//       </button>



//       {expanded && (

//         <div className="border-t border-slate-100 px-4 py-4 space-y-3">

//           {/* Quote details */}

//           {inq.status === 'Quoted' && (

//             <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">

//               <p className="text-blue-700 text-xs font-bold uppercase">Quote Received</p>

//               <div className="flex justify-between text-sm">

//                 <span className="text-slate-600">Quoted Price</span>

//                 <span className="text-slate-900 font-bold">₹{inq.quoteTotal?.toLocaleString()}</span>

//               </div>

//               {inq.quoteNote && (

//                 <p className="text-blue-700 text-xs italic">"{inq.quoteNote}"</p>

//               )}

//             </div>

//           )}



//           {/* Reject reason */}

//           {inq.status === 'Rejected' && inq.rejectReason && (

//             <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">

//               <p className="text-slate-500 text-xs font-semibold mb-1">Distributor Note</p>

//               <p className="text-slate-700 text-sm">{inq.rejectReason}</p>

//             </div>

//           )}



//           {/* Accepted note */}

//           {inq.status === 'Accepted' && (

//             <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 flex items-center gap-2">

//               <CheckCircle2 size={14} className="text-emerald-500" />

//               <p className="text-emerald-700 text-sm font-medium">Quote accepted. Order being prepared.</p>

//             </div>

//           )}



//           {/* Pending note */}

//           {inq.status === 'Pending' && (

//             <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-center gap-2">

//               <Clock size={14} className="text-amber-500" />

//               <p className="text-amber-700 text-sm">Waiting for distributor to prepare your quote.</p>

//             </div>

//           )}



//           {/* Actions */}

//           <div className="flex gap-2">

//             {inq.status === 'Quoted' && (

//               <>

//                 <button className="flex-1 bg-emerald-500 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5">

//                   <CheckCircle2 size={13} /> Accept Quote

//                 </button>

//                 <button className="flex-1 bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5">

//                   <MessageSquare size={13} /> Request Changes

//                 </button>

//               </>

//             )}

//             {inq.canEdit && (

//               <button className="flex-1 bg-slate-100 text-slate-700 font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5">

//                 <Edit2 size={13} /> Edit Inquiry

//               </button>

//             )}

//             {inq.canCancel && (

//               <button className="w-10 h-9 flex items-center justify-center bg-red-50 text-red-400 rounded-xl border border-red-100">

//                 <XCircle size={14} />

//               </button>

//             )}

//             {inq.status === 'Rejected' && (

//               <button className="flex-1 bg-slate-900 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5">

//                 <RefreshCw size={13} /> Reorder

//               </button>

//             )}

//           </div>

//         </div>

//       )}

//     </div>

//   );

// };



// /* ── PAGE ── */

// const ClientOrdersPage = () => {

//   const [view, setView] = useState('orders'); // 'orders' | 'inquiries'

//   const [statusFilter, setStatusFilter] = useState('All');



//   const orderStatuses = ['All', 'Placed', 'Shipped', 'Delivered', 'Cancelled'];

//   const inquiryStatuses = ['All', 'Pending', 'Quoted', 'Accepted', 'Rejected'];



//   const filteredOrders = statusFilter === 'All' ? myOrders : myOrders.filter(o => o.status === statusFilter);

//   const filteredInquiries = statusFilter === 'All' ? myInquiries : myInquiries.filter(i => i.status === statusFilter);



//   const quotedCount = myInquiries.filter(i => i.status === 'Quoted').length;



//   return (

//     <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">

//       {/* Header */}

//       <div>

//         <h1 className="text-slate-900 text-lg font-bold">My Orders</h1>

//         <p className="text-slate-500 text-xs">{myOrders.length} orders · {myInquiries.length} inquiries</p>

//       </div>



//       {/* Quote notification */}

//       {quotedCount > 0 && view === 'inquiries' && (

//         <div className="bg-blue-600 rounded-2xl px-4 py-3 flex items-center justify-between">

//           <div className="flex items-center gap-2">

//             <AlertCircle size={16} className="text-blue-200" />

//             <p className="text-white text-sm font-semibold">{quotedCount} quote{quotedCount > 1 ? 's' : ''} waiting for your response</p>

//           </div>

//           <span className="bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded-lg">{quotedCount}</span>

//         </div>

//       )}



//       {/* Toggle */}

//       <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">

//         <button

//           onClick={() => { setView('orders'); setStatusFilter('All'); }}

//           className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all

//             ${view === 'orders' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}

//         >

//           <ShoppingCart size={16} /> Orders

//         </button>

//         <button

//           onClick={() => { setView('inquiries'); setStatusFilter('All'); }}

//           className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all

//             ${view === 'inquiries' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}

//         >

//           <ClipboardList size={16} /> Inquiries

//           {quotedCount > 0 && (

//             <span className="bg-blue-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">

//               {quotedCount}

//             </span>

//           )}

//         </button>

//       </div>



//       {/* Status filters */}

//       <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">

//         {(view === 'orders' ? orderStatuses : inquiryStatuses).map(s => (

//           <button

//             key={s}

//             onClick={() => setStatusFilter(s)}

//             className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all

//               ${statusFilter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}

//           >

//             {s}

//           </button>

//         ))}

//       </div>



//       {/* List */}

//       <div className="space-y-3">

//         {view === 'orders' ? (

//           filteredOrders.length > 0

//             ? filteredOrders.map(o => <OrderCard key={o.id} order={o} />)

//             : <div className="text-center py-12 text-slate-400"><ShoppingCart className="mx-auto mb-2" size={32} /><p>No orders here</p></div>

//         ) : (

//           filteredInquiries.length > 0

//             ? filteredInquiries.map(i => <InquiryCard key={i.id} inq={i} />)

//             : <div className="text-center py-12 text-slate-400"><ClipboardList className="mx-auto mb-2" size={32} /><p>No inquiries here</p></div>

//         )}

//       </div>

//     </div>

//   );

// };



// export default ClientOrdersPage;





// src/pages/Client/ClientOrdersPage.jsx
import { Fragment, useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShoppingBag, ClipboardList, ChevronDown, ChevronUp, Search, IndianRupee,
  Package, Truck, FileText, XCircle, CheckCircle2, Clock, Download, Eye,
  Edit3, MessageSquare, X, Check, AlertTriangle, Ban, ArrowRight,
  Loader2, Plus, Minus, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../services/api';

// ★ ADJUST THIS IMPORT PATH to where your PDF generator lives
import { downloadInvoicePDF } from '../../features/Admin/BillingPage/pdf/invoice/generateInvoicePdf'; 

const ORDER_STATUS_META = {
  Placed:    { label: 'Ordered',   color: 'text-blue-700',    bg: 'bg-blue-50',    dot: 'bg-blue-500',    icon: Clock },
  Confirmed: { label: 'Confirmed', color: 'text-violet-700',  bg: 'bg-violet-50',  dot: 'bg-violet-500',  icon: CheckCircle2 },
  Invoiced:  { label: 'Packed',    color: 'text-amber-700',   bg: 'bg-amber-50',   dot: 'bg-amber-500',   icon: Package },
  Shipped:   { label: 'Shipped',   color: 'text-cyan-700',    bg: 'bg-cyan-50',    dot: 'bg-cyan-500',    icon: Truck },
  Delivered: { label: 'Delivered', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500', icon: CheckCircle2 },
  Cancelled: { label: 'Cancelled', color: 'text-slate-500',   bg: 'bg-slate-100',  dot: 'bg-slate-400',   icon: XCircle },
};
const PROGRESS_STEPS = ['Placed', 'Confirmed', 'Invoiced', 'Shipped', 'Delivered'];
const ORDER_STATUS_FILTERS = ['Placed', 'Confirmed', 'Invoiced', 'Shipped', 'Delivered', 'Cancelled'];

const INQUIRY_STATUS_META = {
  Pending:              { label: 'Sent',              color: 'text-amber-700',  bg: 'bg-amber-50' },
  Seen:                 { label: 'Seen',               color: 'text-blue-700',   bg: 'bg-blue-50' },
  Quoted:                { label: 'Quote Prepared',    color: 'text-violet-700', bg: 'bg-violet-50' },
  'Changes Requested':  { label: 'Changes Requested',  color: 'text-orange-700', bg: 'bg-orange-50' },
  'Final Quote':         { label: 'Revised Quote Ready', color: 'text-indigo-700', bg: 'bg-indigo-50' },
  Accepted:              { label: 'Converted to Order', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  Rejected:              { label: 'Rejected',          color: 'text-red-700',    bg: 'bg-red-50' },
  Cancelled:             { label: 'Cancelled',         color: 'text-slate-500',  bg: 'bg-slate-100' },
};
const INQUIRY_STATUS_FILTERS = ['Pending', 'Seen', 'Quoted', 'Changes Requested', 'Final Quote', 'Accepted', 'Rejected', 'Cancelled'];

const formatMoney = (n) => `\u20b9${Number(n || 0).toLocaleString('en-IN')}`;
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '\u2014');
const productLabel = (p) => (p && p.name) || 'Product unavailable';
const toISODate = (d) => d.toISOString().slice(0, 10);

const getOrderAmount = (order) => {
  const isFinal = ['Invoiced', 'Shipped', 'Delivered'].includes(order.status) && order.finalInvoiceAmount != null;
  return { amount: isFinal ? order.finalInvoiceAmount : (order.estimatedOrderTotal || 0), isFinal };
};

const getOrderActions = (order) => ({
  canEdit: ['Placed', 'Confirmed'].includes(order.status),
  canCancel: order.isCancellable !== false && ['Placed', 'Confirmed', 'Invoiced'].includes(order.status),
  canConfirmDelivery: order.status === 'Shipped',
  canDownloadInvoice: ['Shipped', 'Delivered'].includes(order.status) && !!order.invoiceNumber,
});

const getInquiryActions = (inquiry) => ({
  canEdit: inquiry.status === 'Pending' && !inquiry.isLockedForEditing,
  canCancel: inquiry.status === 'Pending',
  canSeeQuote: ['Quoted', 'Final Quote'].includes(inquiry.status),
  canSeeReadOnlyQuote: inquiry.status === 'Accepted' && (inquiry.discountedTotalPrice || inquiry.totalPrice),
  canRequestChanges: inquiry.status === 'Quoted', 
});

const resolveDateRange = (dr) => {
  const now = new Date();
  if (dr.preset === '30d') {
    const from = new Date(now); from.setDate(from.getDate() - 30);
    return { dateFrom: toISODate(from), dateTo: toISODate(now) };
  }
  if (dr.preset === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { dateFrom: toISODate(from), dateTo: toISODate(now) };
  }
  if (dr.preset === 'custom') return { dateFrom: dr.from || undefined, dateTo: dr.to || undefined };
  return {};
};

const EMPTY_ORDER_FILTERS = { status: 'All', billType: 'All', search: '', minAmount: '', maxAmount: '', dateRange: { preset: 'all' } };
const EMPTY_INQUIRY_FILTERS = { status: 'All' };

function NoticeBanner({ notice, onDismiss }) {
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [notice]);

  if (!notice) return null;
  const isError = notice.type === 'error';
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-base sm:text-lg font-bold
      ${isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
      <span>{notice.message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100"><X size={18} /></button>
    </div>
  );
}

function ReasonModal({ title, actionLabel, danger, onClose, onConfirm, busy }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 space-y-5">
        <div className="flex items-start justify-between">
          <h3 className="text-slate-900 font-bold text-xl">{title}</h3>
          <button onClick={onClose}><X size={22} className="text-slate-400" /></button>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          rows={3}
          className="w-full text-base sm:text-lg border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-xl text-base sm:text-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            Nevermind
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={busy}
            className={`flex-1 py-3.5 rounded-xl text-base sm:text-lg font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60
              ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'} transition-colors`}
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : null}
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderEditStubModal({ order, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 space-y-4 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 flex items-center justify-center">
          <Edit3 size={24} className="text-amber-500" />
        </div>
        <h3 className="text-slate-900 font-bold text-xl">Editing is almost here</h3>
        <p className="text-slate-500 text-base leading-relaxed">
          Editing order <span className="font-mono font-bold text-slate-700">{order.orderId}</span> will reuse the same
          product picker as your Cart, including live batch-availability checks. That piece is still being built —
          for now, please cancel and re-place the order, or contact us directly for changes.
        </p>
        <button onClick={onClose} className="w-full py-3.5 mt-2 rounded-xl text-base sm:text-lg font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors">
          Got it
        </button>
      </div>
    </div>
  );
}

function OrderProgressTracker({ status }) {
  if (status === 'Cancelled') {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-base font-bold bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5">
        <Ban size={18} /> This order was cancelled
      </div>
    );
  }
  const idx = Math.max(PROGRESS_STEPS.indexOf(status), 0);
  const pct = (idx / (PROGRESS_STEPS.length - 1)) * 100;

  return (
    <div className="relative pt-2 pb-2">
      <div className="absolute top-[17px] left-5 right-5 h-1 bg-slate-200 rounded-full" />
      <div className="absolute top-[17px] left-5 h-1 bg-emerald-500 rounded-full transition-all" style={{ width: `calc(${pct} * (100% - 2.5rem) / 100)` }} />
      <div className="relative flex justify-between">
        {PROGRESS_STEPS.map((step, i) => {
          const meta = ORDER_STATUS_META[step];
          const done = i < idx;
          const active = i === idx;
          const StepIcon = meta.icon;
          return (
            <div key={step} className="flex flex-col items-center gap-1.5 w-1/5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-[3px] bg-white shrink-0 z-10
                ${done ? 'border-emerald-500 bg-emerald-500' : active ? 'border-emerald-500' : 'border-slate-200'}`}>
                <StepIcon size={16} className={done ? 'text-white' : active ? 'text-emerald-500' : 'text-slate-300'} />
              </div>
              <p className={`text-xs sm:text-sm font-bold text-center leading-tight mt-1 ${done || active ? 'text-slate-800' : 'text-slate-400'}`}>
                {meta.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderDetailContent({ order, busyId, onCancel, onConfirmDelivery, onDownloadInvoice, onEdit }) {
  const actions = getOrderActions(order);
  const busy = busyId === order._id;

  return (
    <div className="space-y-4 pt-2">
      <OrderProgressTracker status={order.status} />

      <div className="pt-2">
        <p className="text-sm sm:text-base font-bold text-slate-500 uppercase tracking-wider mb-3">Items Ordered</p>
        <div className="space-y-2.5">
          {(order.items || []).map((item, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 gap-3">
              <div className="min-w-0">
                <p className="text-slate-900 text-base sm:text-lg font-bold truncate">{productLabel(item.productId)}</p>
                <p className="text-slate-500 text-sm sm:text-base font-medium truncate mt-0.5">
                  {(item.productId?.compositions || []).join(', ') || '\u2014'} · {item.productId?.packing || '\u2014'}
                  {/* ★ GST Rate prominently displayed here */}
                  {item.productId?.gstRate != null && <span className="text-slate-700 font-bold ml-1">· GST {item.productId.gstRate}%</span>}
                </p>
              </div>
              <p className="text-slate-700 text-base sm:text-lg font-black shrink-0 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                Qty: {item.finalQty ?? 0}
              </p>
            </div>
          ))}
        </div>
      </div>

      {['Shipped', 'Delivered'].includes(order.status) && order.dispatchDetails && (
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-4 space-y-2">
          <p className="text-cyan-800 text-base font-bold flex items-center gap-2 mb-2"><Truck size={18} /> Shipping Information</p>
          <div className="text-cyan-900 text-sm sm:text-base grid grid-cols-2 gap-y-2 gap-x-4">
            {order.dispatchDetails.courierName && <span><span className="font-semibold text-cyan-700">Courier:</span> {order.dispatchDetails.courierName}</span>}
            {order.dispatchDetails.vehicleNumber && <span><span className="font-semibold text-cyan-700">Vehicle:</span> {order.dispatchDetails.vehicleNumber}</span>}
            {order.dispatchDetails.lrNumber && <span><span className="font-semibold text-cyan-700">LR No:</span> {order.dispatchDetails.lrNumber}</span>}
            {order.dispatchDetails.trackingId && <span><span className="font-semibold text-cyan-700">Tracking ID:</span> {order.dispatchDetails.trackingId}</span>}
          </div>
          {order.dispatchDetails.trackingUrl && (
            <a href={order.dispatchDetails.trackingUrl} target="_blank" rel="noreferrer"
              className="inline-block mt-2 text-cyan-700 text-base font-black underline hover:text-cyan-900">
              Track shipment
            </a>
          )}
        </div>
      )}

      {order.invoiceNumber && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
              <FileText size={20} className="text-slate-600 shrink-0" />
            </div>
            <div>
              <p className="text-slate-500 text-xs sm:text-sm font-bold uppercase tracking-wider">Invoice Generated</p>
              <span className="text-slate-900 text-lg font-black font-mono truncate">{order.invoiceNumber}</span>
            </div>
          </div>
          {actions.canDownloadInvoice && (
            <button 
              onClick={() => onDownloadInvoice(order)} 
              disabled={busy}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-base font-bold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              <Download size={18} /> Download PDF
            </button>
          )}
        </div>
      )}

      {order.status === 'Cancelled' && (order.clientCancelReason || order.adminCancelReason) && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-4">
          <p className="text-base text-slate-500 font-bold mb-1">Cancellation Reason</p>
          <p className="text-slate-800 text-base sm:text-lg font-medium">{order.clientCancelReason || order.adminCancelReason}</p>
        </div>
      )}

      {(actions.canEdit || actions.canCancel || actions.canConfirmDelivery) && (
        <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100">
          {actions.canEdit && (
            <button onClick={() => onEdit(order)}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 text-base font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors">
              <Edit3 size={18} /> Edit Order
            </button>
          )}
          {actions.canConfirmDelivery && (
            <button onClick={() => onConfirmDelivery(order)} disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white text-base font-bold py-3.5 rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50">
              {busy ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} Confirm Delivery
            </button>
          )}
          {actions.canCancel && (
            <button onClick={() => onCancel(order)} disabled={busy}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-50 text-red-600 text-base font-bold py-3.5 px-6 rounded-xl border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50">
              <XCircle size={18} /> Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function getOrderCollapsedInfo({ order }) {
  const meta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.Placed;
  const { amount, isFinal } = getOrderAmount(order);
  const names = (order.items || []).map((i) => productLabel(i.productId));
  const summary = names.slice(0, 2).join(' \u00b7 ') + (names.length > 2 ? ` +${names.length - 2} more` : '');
  return { meta, amount, isFinal, summary, itemCount: (order.items || []).length };
}

function OrderCard({ order, expanded, onToggle, ...handlers }) {
  const { meta, amount, isFinal, summary, itemCount } = getOrderCollapsedInfo({ order });
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden md:hidden shadow-sm">
      <button onClick={onToggle} className="w-full text-left px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-slate-500 text-sm font-black font-mono">{order.orderId}</span>
              <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md ${meta.bg} ${meta.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} /> {meta.label}
              </span>
            </div>
            <p className="text-slate-600 text-base font-medium mt-2 truncate">{summary}</p>
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className="text-slate-900 font-black text-xl">{formatMoney(amount)}</span>
              {!isFinal && <span className="text-slate-400 text-sm font-bold">est.</span>}
              <span className="text-slate-300">|</span>
              <span className="text-slate-600 text-sm font-bold">{itemCount} items</span>
              <span className={`text-xs font-black px-2 py-1 rounded-md ml-1 ${order.billPreference === 'Cash' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                {order.billPreference}
              </span>
            </div>
            <p className="text-slate-400 text-sm font-semibold mt-2 flex items-center gap-1.5">
              <Clock size={12}/> {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="bg-slate-50 p-2 rounded-full border border-slate-100 mt-1">
            {expanded ? <ChevronUp size={20} className="text-slate-500 shrink-0" /> : <ChevronDown size={20} className="text-slate-500 shrink-0" />}
          </div>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-5 bg-white">
          <OrderDetailContent order={order} {...handlers} />
        </div>
      )}
    </div>
  );
}

function OrdersTable({ orders, expandedId, onToggle, ...handlers }) {
  return (
    <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-base">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-sm font-bold uppercase text-left border-b border-slate-200">
            <th className="px-5 py-4">Order ID</th>
            <th className="px-5 py-4">Date</th>
            <th className="px-5 py-4">Products</th>
            <th className="px-5 py-4">Items</th>
            <th className="px-5 py-4">Amount</th>
            <th className="px-5 py-4">Bill Type</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => {
            const { meta, amount, isFinal, summary, itemCount } = getOrderCollapsedInfo({ order });
            const isOpen = expandedId === order._id;
            return (
              <Fragment key={order._id}>
                <tr onClick={() => onToggle(order._id)} className="hover:bg-slate-50/80 cursor-pointer transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-sm text-slate-600">{order.orderId}</td>
                  <td className="px-5 py-4 text-slate-500 text-sm font-medium whitespace-nowrap">{formatDate(order.createdAt)}</td>
                  <td className="px-5 py-4 text-slate-800 font-medium max-w-xs truncate">{summary}</td>
                  <td className="px-5 py-4 text-slate-600 font-bold">{itemCount}</td>
                  <td className="px-5 py-4 font-black text-slate-900 text-lg">
                    {formatMoney(amount)} {!isFinal && <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Est.</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-md ${order.billPreference === 'Cash' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                      {order.billPreference}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md ${meta.bg} ${meta.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} /> {meta.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-400">
                    <div className="bg-white p-1.5 rounded-full border border-slate-200 shadow-sm">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="bg-slate-50/50 shadow-inner">
                    <td colSpan={8} className="px-6 py-6 border-b border-slate-200">
                      <OrderDetailContent order={order} {...handlers} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      {orders.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Package className="mx-auto mb-3 text-slate-300" size={40} /> 
          <p className="text-lg font-bold text-slate-500">No orders match these filters</p>
        </div>
      )}
    </div>
  );
}

function OrderFilterBar({ filters, setFilters }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search Order ID or Invoice ID"
            className="w-full pl-11 pr-4 py-3 text-base font-bold text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200">
          {['All', 'Cash', 'Credit'].map((b) => (
            <button key={b} type="button" onClick={() => setFilters((f) => ({ ...f, billType: b }))}
              className={`px-4 py-2 rounded-lg text-sm sm:text-base font-bold transition-all ${filters.billType === b ? 'bg-white text-slate-900 shadow border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[{ key: 'all', label: 'All time' }, { key: '30d', label: 'Last 30 Days' }, { key: 'month', label: 'This Month' }, { key: 'custom', label: 'Custom' }].map((p) => (
          <button key={p.key} type="button"
            onClick={() => setFilters((f) => ({ ...f, dateRange: { ...f.dateRange, preset: p.key } }))}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all
              ${filters.dateRange.preset === p.key ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
            {p.label}
          </button>
        ))}
        {filters.dateRange.preset === 'custom' && (
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <input type="date" value={filters.dateRange.from || ''}
              onChange={(e) => setFilters((f) => ({ ...f, dateRange: { ...f.dateRange, from: e.target.value } }))}
              className="text-sm font-bold bg-transparent outline-none text-slate-700" />
            <span className="text-slate-400 font-black">→</span>
            <input type="date" value={filters.dateRange.to || ''}
              onChange={(e) => setFilters((f) => ({ ...f, dateRange: { ...f.dateRange, to: e.target.value } }))}
              className="text-sm font-bold bg-transparent outline-none text-slate-700" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
        <button type="button" onClick={() => setFilters((f) => ({ ...f, status: 'All' }))}
          className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${filters.status === 'All' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
          All
        </button>
        {ORDER_STATUS_FILTERS.map((s) => (
          <button key={s} type="button" onClick={() => setFilters((f) => ({ ...f, status: s }))}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${filters.status === s ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
            {ORDER_STATUS_META[s].label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// INQUIRY COMPONENTS (Scaled typography applied similarly)
// ============================================================================

function InquiryDetailContent({ inquiry, busyId, onCancel, onEdit, onSeeQuote, onGoToOrder }) {
  const actions = getInquiryActions(inquiry);
  const busy = busyId === inquiry._id;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm sm:text-base font-bold text-slate-500 uppercase tracking-wider mb-3">Requested Items</p>
        <div className="space-y-2.5">
          {(inquiry.items || []).map((item, i) => {
            const shortCode = item.productId?.companyId?.shortCode || item.productId?.company || '\u2014';
            return (
              <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-slate-900 text-base sm:text-lg font-bold truncate">{productLabel(item.productId)}</p>
                  <p className="text-slate-500 text-sm sm:text-base font-medium truncate mt-0.5">
                    {shortCode} · {item.productId?.packing || '\u2014'}
                    {item.productId?.gstRate != null && <span className="text-slate-700 font-bold ml-1">· GST {item.productId.gstRate}%</span>}
                  </p>
                </div>
                <p className="text-slate-700 text-base sm:text-lg font-black shrink-0 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                  Qty: {item.requestedQty ?? 0}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {inquiry.clientRemarks && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-4">
          <p className="text-sm text-slate-500 font-bold mb-1">Your Note</p>
          <p className="text-slate-800 text-base sm:text-lg font-medium">{inquiry.clientRemarks}</p>
        </div>
      )}

      {inquiry.status === 'Seen' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-blue-500 shrink-0" />
          <p className="text-blue-800 text-base font-medium">Admin is currently reviewing this inquiry. Please contact admin for any changes.</p>
        </div>
      )}

      {inquiry.status === 'Changes Requested' && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-4 flex items-center gap-3">
          <MessageSquare size={20} className="text-orange-500 shrink-0" />
          <p className="text-orange-800 text-base font-medium">Your requested changes were sent to admin. Waiting on a revised quote.</p>
        </div>
      )}

      {(inquiry.status === 'Rejected' || inquiry.status === 'Cancelled') && (
        <div className={`border rounded-xl px-4 py-4 ${inquiry.status === 'Cancelled' ? 'bg-slate-50 border-slate-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-base font-bold mb-1 ${inquiry.status === 'Cancelled' ? 'text-slate-500' : 'text-red-600'}`}>
            {inquiry.status === 'Cancelled' ? 'Cancelled by you' : 'Quote Rejected'}
          </p>
          <p className={`text-lg font-medium ${inquiry.status === 'Cancelled' ? 'text-slate-700' : 'text-red-800'}`}>
            {inquiry.clientRemarks || (inquiry.status === 'Cancelled' ? 'This inquiry was withdrawn before review.' : 'This quote was declined.')}
          </p>
        </div>
      )}

      {inquiry.status === 'Accepted' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-emerald-800 text-base font-bold">Converted to order successfully</p>
          {inquiry.linkedOrder && (
            <button onClick={() => onGoToOrder(inquiry.linkedOrder)} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 font-mono text-base font-bold shadow-sm hover:bg-emerald-100 transition-colors">
              {inquiry.linkedOrder.orderId} <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}

      {(actions.canEdit || actions.canCancel || actions.canSeeQuote || actions.canSeeReadOnlyQuote) && (
        <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100">
          {actions.canEdit && (
            <button onClick={() => onEdit(inquiry)}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 text-base font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors">
              <Edit3 size={18} /> Edit Inquiry
            </button>
          )}
          {(actions.canSeeQuote || actions.canSeeReadOnlyQuote) && (
            <button onClick={() => onSeeQuote(inquiry)}
              className="flex-1 flex items-center justify-center gap-2 bg-violet-500 text-white text-base font-bold py-3.5 rounded-xl hover:bg-violet-600 transition-colors shadow-md shadow-violet-200">
              <Eye size={18} /> See Quote
            </button>
          )}
          {actions.canCancel && (
            <button onClick={() => onCancel(inquiry)} disabled={busy}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-50 text-red-600 text-base font-bold py-3.5 px-6 rounded-xl border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50">
              <XCircle size={18} /> Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function getInquiryCollapsedInfo({ inquiry }) {
  const meta = INQUIRY_STATUS_META[inquiry.status] || INQUIRY_STATUS_META.Pending;
  const names = (inquiry.items || []).map((i) => productLabel(i.productId));
  const summary = names.slice(0, 2).join(' \u00b7 ') + (names.length > 2 ? ` +${names.length - 2} more` : '');
  const amount = inquiry.discountedTotalPrice || inquiry.totalPrice || 0;
  return { meta, summary, amount, itemCount: (inquiry.items || []).length };
}

function InquiryCard({ inquiry, expanded, onToggle, ...handlers }) {
  const { meta, summary, amount, itemCount } = getInquiryCollapsedInfo({ inquiry });
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden md:hidden shadow-sm">
      <button onClick={onToggle} className="w-full text-left px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-slate-500 text-sm font-black font-mono">{inquiry.inquiryId || inquiry._id.slice(-6).toUpperCase()}</span>
              <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md ${meta.bg} ${meta.color}`}>
                {meta.label}
              </span>
            </div>
            <p className="text-slate-600 text-base font-medium mt-2 truncate">{summary}</p>
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className="text-slate-900 font-black text-xl">{formatMoney(amount)}</span>
              <span className="text-slate-400 text-sm font-bold">est.</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600 text-sm font-bold">{itemCount} items</span>
            </div>
            <p className="text-slate-400 text-sm font-semibold mt-2 flex items-center gap-1.5">
               <Clock size={12}/> {formatDate(inquiry.createdAt)}
            </p>
          </div>
          <div className="bg-slate-50 p-2 rounded-full border border-slate-100 mt-1">
            {expanded ? <ChevronUp size={20} className="text-slate-500 shrink-0" /> : <ChevronDown size={20} className="text-slate-500 shrink-0" />}
          </div>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-5 bg-white">
          <InquiryDetailContent inquiry={inquiry} {...handlers} />
        </div>
      )}
    </div>
  );
}

function InquiriesTable({ inquiries, expandedId, onToggle, ...handlers }) {
  return (
    <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-base">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-sm font-bold uppercase text-left border-b border-slate-200">
            <th className="px-5 py-4">Inquiry ID</th>
            <th className="px-5 py-4">Date</th>
            <th className="px-5 py-4">Products</th>
            <th className="px-5 py-4">Items</th>
            <th className="px-5 py-4">Est. Amount</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {inquiries.map((inquiry) => {
            const { meta, summary, amount, itemCount } = getInquiryCollapsedInfo({ inquiry });
            const isOpen = expandedId === inquiry._id;
            return (
              <Fragment key={inquiry._id}>
                <tr onClick={() => onToggle(inquiry._id)} className="hover:bg-slate-50/80 cursor-pointer transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-sm text-slate-600">{inquiry.inquiryId || inquiry._id.slice(-6).toUpperCase()}</td>
                  <td className="px-5 py-4 text-slate-500 text-sm font-medium whitespace-nowrap">{formatDate(inquiry.createdAt)}</td>
                  <td className="px-5 py-4 text-slate-800 font-medium max-w-xs truncate">{summary}</td>
                  <td className="px-5 py-4 text-slate-600 font-bold">{itemCount}</td>
                  <td className="px-5 py-4 font-black text-slate-900 text-lg">{formatMoney(amount)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center text-xs font-black px-2.5 py-1 rounded-md ${meta.bg} ${meta.color}`}>{meta.label}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-400">
                    <div className="bg-white p-1.5 rounded-full border border-slate-200 shadow-sm">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="bg-slate-50/50 shadow-inner">
                    <td colSpan={7} className="px-6 py-6 border-b border-slate-200">
                      <InquiryDetailContent inquiry={inquiry} {...handlers} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      {inquiries.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <ClipboardList className="mx-auto mb-3 text-slate-300" size={40} /> 
          <p className="text-lg font-bold text-slate-500">No inquiries match this filter</p>
        </div>
      )}
    </div>
  );
}

function QuoteModal({ inquiry, onClose, onConvert, onRequestChanges, onReject, busy }) {
  const [activeAction, setActiveAction] = useState(null);
  const [note, setNote] = useState('');
  const readOnly = inquiry.status === 'Accepted';
  const canRequestChanges = inquiry.status === 'Quoted';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm">
      <div className="w-full md:max-w-xl bg-white rounded-t-3xl md:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="shrink-0 bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-slate-900 text-xl font-bold">{readOnly ? 'Final Quote' : 'Quote Review'}</h3>
            <p className="text-slate-500 text-sm font-mono mt-0.5">{inquiry.inquiryId}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {inquiry.adminRemarks && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
              <p className="text-sm text-blue-700 font-black mb-1 uppercase tracking-wider">Admin Remarks</p>
              <p className="text-blue-900 text-lg font-medium">{inquiry.adminRemarks}</p>
            </div>
          )}

          <div className="space-y-3">
            {(inquiry.items || []).map((item, i) => {
              const shortCode = item.productId?.companyId?.shortCode || item.productId?.company || '';
              const breakdown = item.quoteBreakdown || [];
              const chargeable = breakdown.reduce((s, b) => s + (b.chargeableQty || 0), 0);
              const free = breakdown.reduce((s, b) => s + (b.freeQty || 0), 0);
              const firstBatch = breakdown[0];
              return (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4">
                  <div className="flex justify-between items-start gap-3">
                    <p className="text-slate-900 font-bold text-lg leading-tight">{productLabel(item.productId)} {shortCode && <span className="text-slate-500 font-medium ml-1">({shortCode})</span>}</p>
                    <p className="font-black text-slate-800 text-xl shrink-0">{formatMoney(item.estimatedLineTotal)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                    <span className="bg-white border border-slate-200 text-slate-700 text-sm font-bold px-2.5 py-1 rounded-md">Qty: {chargeable}{free > 0 ? ` + ${free} free` : ''}</span>
                    {firstBatch?.adminOfferedPTR != null && <span className="text-slate-600 text-base font-medium">PTR: {formatMoney(firstBatch.adminOfferedPTR)}</span>}
                    {firstBatch?.batchId?.expiryDate && <span className="text-slate-600 text-base font-medium">Exp: {formatDate(firstBatch.batchId.expiryDate)}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {inquiry.discountPercent > 0 && (
            <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              <span className="text-emerald-700 font-bold text-base">Discount ({inquiry.discountPercent}%)</span>
              <span className="text-emerald-800 font-black text-lg">Applied</span>
            </div>
          )}
        </div>

        <div className="shrink-0 bg-white border-t border-slate-100 px-6 py-5 space-y-4 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-sm">Final Payable</span>
            <span className="text-slate-900 font-black text-3xl">{formatMoney(inquiry.discountedTotalPrice || inquiry.totalPrice)}</span>
          </div>

          {!readOnly && activeAction && (
            <div className="space-y-3 pt-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={activeAction === 'changes' ? 'What would you like changed?' : 'Reason for rejecting (optional)'}
                rows={3}
                className="w-full text-lg border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
              <div className="flex gap-3">
                <button onClick={() => setActiveAction(null)} className="flex-1 py-3.5 rounded-xl text-base font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                  Back
                </button>
                <button
                  onClick={() => (activeAction === 'changes' ? onRequestChanges(inquiry, note) : onReject(inquiry, note))}
                  disabled={busy}
                  className={`flex-1 py-3.5 rounded-xl text-base font-bold text-white disabled:opacity-60 transition-colors ${activeAction === 'changes' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {activeAction === 'changes' ? 'Send Request' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          )}

          {!readOnly && !activeAction && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => onConvert(inquiry)} disabled={busy}
                  className="flex-1 bg-emerald-500 text-white font-bold py-4 rounded-xl text-lg disabled:opacity-60 flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-200">
                  {busy ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />} Convert to Order
                </button>
                {canRequestChanges && (
                  <button onClick={() => setActiveAction('changes')} className="flex-1 bg-slate-100 text-slate-700 font-bold py-4 rounded-xl text-lg hover:bg-slate-200 transition-colors">
                    Ask for Changes
                  </button>
                )}
              </div>
              <button onClick={() => setActiveAction('reject')} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3.5 rounded-xl text-lg border border-red-100 transition-colors">
                Reject Quote
              </button>
            </div>
          )}

          {readOnly && (
            <p className="text-center font-bold text-slate-400 text-base pt-2">This quote has already been accepted — no further action needed.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function EditInquiryModal({ inquiry, onClose, onSave, busy }) {
  const [items, setItems] = useState(() =>
    (inquiry.items || []).map((i) => ({
      productId: i.productId?._id || i.productId,
      name: productLabel(i.productId),
      qty: i.requestedQty || 1,
      rate: i.requestedQty ? (i.estimatedLineTotal || 0) / i.requestedQty : 0,
    }))
  );
  const [remarks, setRemarks] = useState(inquiry.clientRemarks || '');
  const [billPreference, setBillPreference] = useState(inquiry.billPreference || 'Credit');

  const total = useMemo(() => items.reduce((s, i) => s + i.qty * i.rate, 0), [items]);

  const updateQty = (idx, delta) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, qty: Math.max(1, it.qty + delta) } : it)));
  };
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = () => {
    if (items.length === 0) return;
    onSave(inquiry._id, {
      items: items.map((i) => ({ productId: i.productId, requestedQty: i.qty, estimatedLineTotal: i.qty * i.rate })),
      clientRemarks: remarks,
      billPreference,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm">
      <div className="w-full md:max-w-xl bg-white rounded-t-3xl md:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="shrink-0 bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-slate-900 text-xl font-bold">Edit Inquiry</h3>
            <p className="text-slate-500 text-sm font-mono mt-0.5">{inquiry.inquiryId}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <p className="text-base text-slate-500 font-medium">Adjust quantities or remove items. To request a different product, cancel this inquiry and submit a new one.</p>

          {items.length === 0 && (
            <p className="text-center text-slate-400 text-lg font-bold py-8">No items left — add at least one to save.</p>
          )}

          <div className="space-y-2.5">
            {items.map((item, idx) => (
              <div key={item.productId || idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 gap-4">
                <p className="text-slate-900 text-lg font-bold truncate flex-1">{item.name}</p>
                <div className="flex items-center gap-2 shrink-0 bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
                  <button onClick={() => updateQty(idx, -1)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold transition-colors">
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center text-lg font-black text-slate-900">{item.qty}</span>
                  <button onClick={() => updateQty(idx, 1)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold transition-colors">
                    <Plus size={16} />
                  </button>
                  <div className="w-px h-8 bg-slate-200 mx-1"></div>
                  <button onClick={() => removeItem(idx)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2.5">Bill Preference</p>
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1.5 w-fit border border-slate-200">
              {['Cash', 'Credit'].map((b) => (
                <button key={b} onClick={() => setBillPreference(b)}
                  className={`px-5 py-2.5 rounded-lg text-base font-bold transition-all ${billPreference === b ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2.5">Notes for Admin</p>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Any special requests? (optional)"
              rows={3}
              className="w-full text-lg border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-shadow"
            />
          </div>
        </div>

        <div className="shrink-0 bg-white border-t border-slate-100 px-6 py-5 space-y-4 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-sm">New Est. Total</span>
            <span className="text-slate-900 font-black text-3xl">{formatMoney(total)}</span>
          </div>

          <button onClick={handleSave} disabled={busy || items.length === 0}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl text-lg disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
            {busy ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />} Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientOrdersPage({ clientId: clientIdProp }) {
  const clientId = clientIdProp || (typeof window !== 'undefined' ? window.localStorage.getItem('clientId') : null);

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'inquiries'
  const [orders, setOrders] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [orderFilters, setOrderFilters] = useState(EMPTY_ORDER_FILTERS);
  const [inquiryFilters, setInquiryFilters] = useState(EMPTY_INQUIRY_FILTERS);
  const [debouncedOrderFilters, setDebouncedOrderFilters] = useState(EMPTY_ORDER_FILTERS);

  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [expandedInquiryId, setExpandedInquiryId] = useState(null);

  const [reasonModal, setReasonModal] = useState(null);
  const [editStubOrder, setEditStubOrder] = useState(null);
  const [editInquiryTarget, setEditInquiryTarget] = useState(null);
  const [quoteInquiry, setQuoteInquiry] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedOrderFilters(orderFilters), 400);
    return () => clearTimeout(t);
  }, [orderFilters]);

  const fetchOrders = useCallback(async () => {
    if (!clientId) return;
    try {
      const { dateFrom, dateTo } = resolveDateRange(debouncedOrderFilters.dateRange);
      const params = {
        clientId,
        status: debouncedOrderFilters.status !== 'All' ? debouncedOrderFilters.status : undefined,
        billType: debouncedOrderFilters.billType !== 'All' ? debouncedOrderFilters.billType : undefined,
        search: debouncedOrderFilters.search || undefined,
        minAmount: debouncedOrderFilters.minAmount || undefined,
        maxAmount: debouncedOrderFilters.maxAmount || undefined,
        dateFrom, dateTo,
      };
      const res = await api.getOrders(params);
      setOrders(res.data || []);
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to load orders.' });
    }
  }, [clientId, debouncedOrderFilters]);

  const fetchInquiries = useCallback(async () => {
    if (!clientId) return;
    try {
      const params = { clientId, status: inquiryFilters.status !== 'All' ? inquiryFilters.status : undefined };
      const res = await api.getInquiries(params);
      setInquiries(res.data || []);
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to load inquiries.' });
    }
  }, [clientId, inquiryFilters]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchOrders(), fetchInquiries()]).finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  const handleCancelOrder = async (reason) => {
    const order = reasonModal.target;
    setBusyId(order._id);
    try {
      await api.cancelOrder(order._id, reason, 'client');
      setNotice({ type: 'success', message: `Order ${order.orderId} cancelled.` });
      setReasonModal(null);
      fetchOrders();
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Could not cancel order.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDelivery = async (order) => {
    setBusyId(order._id);
    try {
      await api.confirmOrderDelivery(order._id);
      setNotice({ type: 'success', message: `Delivery confirmed for ${order.orderId}.` });
      fetchOrders();
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Could not confirm delivery.' });
    } finally {
      setBusyId(null);
    }
  };

  // ★ DIRECT BROWSER PDF GENERATION (Instant & Safe)
  const handleDownloadInvoice = async (order) => {
    setBusyId(order._id);
    try {
      // 1. Fetch the raw invoice data
      const res = await api.getSalesInvoiceById(order.invoiceDocumentId);
      const invoice = res.data;

      // 2. Map items strictly for what pdfHelpers / generateInvoicePdfDoc expects
      const allItems = invoice.items.map(item => ({
        companyShortCode: item.companyShortCode,
        productName: item.productName,
        packing: item.packing,
        hsn: item.hsn,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        mrp: item.mrp,
        rate: item.rate,
        chargeableQty: item.chargeableQty,
        freeQty: item.freeQty,
        discountAmount: item.discountAmount,
        discountPercent: item.discountPercent,
        discountValue: item.discountPercent > 0 ? item.discountPercent : item.discountAmount,
        discountType: item.discountPercent > 0 ? 'percent' : 'amount',
        taxableValue: item.taxableValue,
        cgst: item.cgst,
        sgst: item.sgst,
        igst: item.igst,
        lineTotal: item.lineTotal,
        // Approximate the product GST rate for the PDF display column
        gstRate: item.taxableValue > 0 ? Math.round(((item.cgst + item.sgst + item.igst) / item.taxableValue) * 100) : 0
      }));

      // 3. Format Header Info
      const invoiceData = {
        id: invoice.invoiceNumber,
        date: invoice.invoiceDate,
        client: invoice.clientName,
        gstin: invoice.clientGSTIN,
        drugLicense: invoice.clientDrugLicense,
        city: invoice.clientBillingAddress, 
        billType: invoice.billType,
        previousBalance: invoice.previousOutstanding || 0,
        previousBalanceDate: invoice.previousOutstandingDate || null,
      };

      const isInterstate = (invoice.totalIGST || 0) > 0;

      // 4. Trigger download immediately in the browser
      downloadInvoicePDF(
        invoiceData,
        allItems,
        invoice.totalTaxable,
        invoice.totalCGST,
        invoice.totalSGST,
        invoice.netAmount,
        invoice.globalDiscountPercent,
        invoice.globalDiscountAmount,
        isInterstate ? 'interstate' : 'intrastate'
      );

      toast.success('Invoice downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to download invoice. Ensure an invoice exists.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancelInquiry = async (reason) => {
    const inquiry = reasonModal.target;
    setBusyId(inquiry._id);
    try {
      await api.cancelInquiry(inquiry._id, reason);
      setNotice({ type: 'success', message: `Inquiry ${inquiry.inquiryId} cancelled.` });
      setReasonModal(null);
      fetchInquiries();
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Could not cancel inquiry.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveInquiryEdit = async (id, payload) => {
    setBusyId(id);
    try {
      await api.updateInquiry(id, payload);
      setNotice({ type: 'success', message: 'Inquiry updated.' });
      setEditInquiryTarget(null);
      fetchInquiries();
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Could not update inquiry.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleConvert = async (inquiry) => {
    setBusyId(inquiry._id);
    try {
      const res = await api.convertInquiryToOrder(inquiry._id);
      setNotice({ type: 'success', message: `Converted to order ${res.data?.orderId || ''}.` });
      setQuoteInquiry(null);
      fetchInquiries();
      fetchOrders();
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Could not convert this inquiry.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleRequestChanges = async (inquiry, note) => {
    setBusyId(inquiry._id);
    try {
      await api.requestInquiryChanges(inquiry._id, note);
      setNotice({ type: 'success', message: 'Change request sent to admin.' });
      setQuoteInquiry(null);
      fetchInquiries();
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Could not send change request.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleRejectQuote = async (inquiry, note) => {
    setBusyId(inquiry._id);
    try {
      await api.rejectInquiryQuote(inquiry._id, note);
      setNotice({ type: 'success', message: 'Quote rejected.' });
      setQuoteInquiry(null);
      fetchInquiries();
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Could not reject quote.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleGoToOrder = (linkedOrder) => {
    setActiveTab('orders');
    setOrderFilters((f) => ({ ...f, search: linkedOrder.orderId, status: 'All' }));
  };

  const orderHandlers = {
    busyId,
    onCancel: (order) => setReasonModal({ kind: 'order', target: order }),
    onConfirmDelivery: handleConfirmDelivery,
    onDownloadInvoice: handleDownloadInvoice,
    onEdit: (order) => setEditStubOrder(order),
  };

  const inquiryHandlers = {
    busyId,
    onCancel: (inquiry) => setReasonModal({ kind: 'inquiry', target: inquiry }),
    onEdit: (inquiry) => setEditInquiryTarget(inquiry),
    onSeeQuote: (inquiry) => setQuoteInquiry(inquiry),
    onGoToOrder: handleGoToOrder,
  };

  if (!clientId) {
    return (
      <div className="px-6 py-16 text-center text-slate-400 max-w-2xl mx-auto">
        <AlertTriangle className="mx-auto mb-4" size={40} />
        <p className="text-xl font-bold text-slate-500">No client is signed in.</p>
        <p className="text-base mt-2">Pass a clientId prop or set one in localStorage to load this page.</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-slate-900 text-3xl font-black tracking-tight">My Orders & Inquiries</h1>
        <p className="text-slate-500 text-base font-medium mt-1">Track everything you've ordered or requested a quote for</p>
      </div>

      <NoticeBanner notice={notice} onDismiss={() => setNotice(null)} />

      <div className="flex bg-slate-100/80 rounded-2xl p-1.5 gap-1.5 max-w-md border border-slate-200">
        <button onClick={() => setActiveTab('orders')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-lg font-bold transition-all ${activeTab === 'orders' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
          <ShoppingBag size={18} /> My Orders
        </button>
        <button onClick={() => setActiveTab('inquiries')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-lg font-bold transition-all ${activeTab === 'inquiries' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
          <ClipboardList size={18} /> My Inquiries
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400 gap-3">
          <Loader2 size={24} className="animate-spin text-slate-300" /> <span className="text-lg font-bold">Loading...</span>
        </div>
      ) : activeTab === 'orders' ? (
        <div className="space-y-5">
          <OrderFilterBar filters={orderFilters} setFilters={setOrderFilters} />
          <div className="space-y-4">
            {orders.length === 0 && (
              <div className="md:hidden text-center py-16 text-slate-400">
                <Package className="mx-auto mb-3 text-slate-300" size={40} /> 
                <p className="text-lg font-bold text-slate-500">No orders match these filters</p>
              </div>
            )}
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} expanded={expandedOrderId === order._id}
                onToggle={() => setExpandedOrderId((id) => (id === order._id ? null : order._id))}
                {...orderHandlers} />
            ))}
            <OrdersTable orders={orders} expandedId={expandedOrderId}
              onToggle={(id) => setExpandedOrderId((cur) => (cur === id ? null : id))}
              {...orderHandlers} />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <button type="button" onClick={() => setInquiryFilters({ status: 'All' })}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${inquiryFilters.status === 'All' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
              All
            </button>
            {INQUIRY_STATUS_FILTERS.map((s) => (
              <button key={s} type="button" onClick={() => setInquiryFilters({ status: s })}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${inquiryFilters.status === s ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                {INQUIRY_STATUS_META[s].label}
              </button>
            ))}
          </div>
          <div className="space-y-4">
            {inquiries.length === 0 && (
              <div className="md:hidden text-center py-16 text-slate-400">
                <ClipboardList className="mx-auto mb-3 text-slate-300" size={40} /> 
                <p className="text-lg font-bold text-slate-500">No inquiries match this filter</p>
              </div>
            )}
            {inquiries.map((inquiry) => (
              <InquiryCard key={inquiry._id} inquiry={inquiry} expanded={expandedInquiryId === inquiry._id}
                onToggle={() => setExpandedInquiryId((id) => (id === inquiry._id ? null : inquiry._id))}
                {...inquiryHandlers} />
            ))}
            <InquiriesTable inquiries={inquiries} expandedId={expandedInquiryId}
              onToggle={(id) => setExpandedInquiryId((cur) => (cur === id ? null : id))}
              {...inquiryHandlers} />
          </div>
        </div>
      )}

      {reasonModal && (
        <ReasonModal
          title={reasonModal.kind === 'order' ? `Cancel order ${reasonModal.target.orderId}?` : `Cancel inquiry ${reasonModal.target.inquiryId}?`}
          actionLabel="Confirm Cancel"
          danger
          busy={busyId === reasonModal.target._id}
          onClose={() => setReasonModal(null)}
          onConfirm={reasonModal.kind === 'order' ? handleCancelOrder : handleCancelInquiry}
        />
      )}

      {editStubOrder && <OrderEditStubModal order={editStubOrder} onClose={() => setEditStubOrder(null)} />}

      {editInquiryTarget && (
        <EditInquiryModal inquiry={editInquiryTarget} busy={busyId === editInquiryTarget._id}
          onClose={() => setEditInquiryTarget(null)} onSave={handleSaveInquiryEdit} />
      )}

      {quoteInquiry && (
        <QuoteModal inquiry={quoteInquiry} busy={busyId === quoteInquiry._id}
          onClose={() => setQuoteInquiry(null)}
          onConvert={handleConvert}
          onRequestChanges={handleRequestChanges}
          onReject={handleRejectQuote}
        />
      )}
    </div>
  );
}






// import { useState } from 'react';

// import {

//   ShoppingBag, ClipboardList, Clock, CheckCircle2, Truck,

//   FileText, XCircle, ChevronDown, ChevronUp, Download,

//   Eye, Edit, AlertTriangle, IndianRupee, Send, Check

// } from 'lucide-react';



// /* ── DEMO DATA ── */

// const orders = [

//   {

//     id: 'ORD-2024-201', date: '07 May 2025', items: 5, amount: 12400,

//     status: 'Placed', billType: 'Credit', source: 'Direct',

//     products: [

//       { name: 'Paracetamol 500mg', qty: 200, price: 1800 },

//       { name: 'Amoxicillin 250mg', qty: 100, price: 3200 },

//       { name: 'Omeprazole 20mg', qty: 150, price: 4200 },

//     ],

//     estimatedTotal: 12400, finalAmount: null,

//   },

//   {

//     id: 'ORD-2024-199', date: '06 May 2025', items: 4, amount: 15200,

//     status: 'Invoiced', billType: 'Credit', source: 'Inquiry', invoice: 'MIL-05-2025-042',

//     products: [],

//     estimatedTotal: 15200, finalAmount: 15200,

//   },

//   {

//     id: 'ORD-2024-197', date: '05 May 2025', items: 6, amount: 22100,

//     status: 'Shipped', billType: 'Credit', source: 'Direct', invoice: 'MIL-05-2025-041',

//     tracking: 'Out for delivery · Est. today',

//     products: [],

//     estimatedTotal: 22100, finalAmount: 22100,

//   },

//   {

//     id: 'ORD-2024-195', date: '03 May 2025', items: 8, amount: 34500,

//     status: 'Delivered', billType: 'Credit', source: 'Direct', invoice: 'MIL-05-2025-038',

//     products: [],

//     estimatedTotal: 34500, finalAmount: 34500,

//   },

//   {

//     id: 'ORD-2024-193', date: '02 May 2025', items: 2, amount: 5200,

//     status: 'Cancelled', billType: 'Credit', source: 'Direct',

//     cancelReason: 'Price mismatch — found better rate',

//     products: [],

//     estimatedTotal: 5200, finalAmount: null,

//   },

// ];



// const inquiries = [

//   {

//     id: 'INQ-2024-089', date: '07 May', items: 5, estimatedTotal: 12400, status: 'Pending',

//     products: [

//       { name: 'Paracetamol 500mg', qty: 200 },

//       { name: 'Amoxicillin 250mg', qty: 100 },

//     ],

//   },

//   {

//     id: 'INQ-2024-088', date: '05 May', items: 3, estimatedTotal: 8750, status: 'Quote Prepared',

//     quoteTotal: 8400,

//     quoteItems: [

//       { name: 'Pantoprazole 40mg', qty: 120, ptr: 30, freeQty: 0, lineTotal: 3600 },

//       { name: 'Atorvastatin 10mg', qty: 80, ptr: 35, freeQty: 4, lineTotal: 2800 },

//     ],

//     adminNote: 'Special rate applied. Valid for 24 hours.',

//     products: [],

//   },

//   {

//     id: 'INQ-2024-087', date: '03 May', items: 2, estimatedTotal: 5200, status: 'Changes Requested',

//     products: [{ name: 'Metformin 500mg', qty: 200 }],

//     clientNote: 'Price too high — can you offer ₹22/strip for Metformin?',

//   },

//   {

//     id: 'INQ-2024-085', date: '01 May', items: 4, estimatedTotal: 18200, status: 'Converted',

//     orderId: 'ORD-2024-195',

//     products: [],

//   },

//   {

//     id: 'INQ-2024-083', date: '28 Apr', items: 2, estimatedTotal: 3200, status: 'Rejected',

//     products: [],

//   },

// ];



// const orderStatusConfig = {

//   Placed: { color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock },

//   Confirmed: { color: 'text-violet-600', bg: 'bg-violet-50', icon: CheckCircle2 },

//   Invoiced: { color: 'text-amber-600', bg: 'bg-amber-50', icon: FileText },

//   Shipped: { color: 'text-cyan-600', bg: 'bg-cyan-50', icon: Truck },

//   Delivered: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },

//   Cancelled: { color: 'text-slate-500', bg: 'bg-slate-100', icon: XCircle },

// };



// const inquiryStatusConfig = {

//   'Pending': { color: 'text-amber-700', bg: 'bg-amber-100', dot: 'bg-amber-500' },

//   'Seen': { color: 'text-blue-700', bg: 'bg-blue-100', dot: 'bg-blue-500' },

//   'Quote Prepared': { color: 'text-violet-700', bg: 'bg-violet-100', dot: 'bg-violet-500' },

//   'Changes Requested': { color: 'text-orange-700', bg: 'bg-orange-100', dot: 'bg-orange-500' },

//   'Converted': { color: 'text-emerald-700', bg: 'bg-emerald-100', dot: 'bg-emerald-500' },

//   'Rejected': { color: 'text-slate-600', bg: 'bg-slate-100', dot: 'bg-slate-400' },

// };



// /* ── ORDER CARD ── */

// const OrderCard = ({ order }) => {

//   const [expanded, setExpanded] = useState(false);

//   const [confirmed, setConfirmed] = useState(false);

//   const cfg = orderStatusConfig[order.status];

//   const StatusIcon = cfg.icon;



//   return (

//     <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

//       <button onClick={() => setExpanded(e => !e)} className="w-full text-left px-4 py-3.5">

//         <div className="flex items-start justify-between gap-2">

//           <div className="flex-1 min-w-0">

//             <div className="flex items-center gap-2">

//               <span className="text-slate-400 text-xs font-mono">{order.id}</span>

//               <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>

//                 <StatusIcon size={10} /> {order.status}

//               </span>

//             </div>

//             <div className="flex items-center gap-3 mt-1.5">

//               <span className="text-slate-700 font-bold text-sm">₹{order.amount.toLocaleString()}</span>

//               <span className="text-slate-400 text-xs">{order.items} items</span>

//               <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${order.billType === 'Cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'

//                 }`}>{order.billType}</span>

//             </div>

//             <p className="text-slate-400 text-xs mt-1">{order.date}</p>

//           </div>

//           {expanded ? <ChevronUp size={17} className="text-slate-400 shrink-0 mt-1" /> : <ChevronDown size={17} className="text-slate-400 shrink-0 mt-1" />}

//         </div>

//       </button>



//       {expanded && (

//         <div className="border-t border-slate-100 px-4 py-4 space-y-3">

//           {order.products.length > 0 && (

//             <div className="space-y-2">

//               <p className="text-xs text-slate-500 font-semibold uppercase">Items</p>

//               {order.products.map((p, i) => (

//                 <div key={i} className="flex justify-between items-center bg-slate-50 rounded-xl px-3 py-2">

//                   <div>

//                     <p className="text-slate-800 text-sm font-medium">{p.name}</p>

//                     <p className="text-slate-400 text-xs">Qty: {p.qty}</p>

//                   </div>

//                   <p className="text-slate-700 font-semibold text-sm">₹{p.price.toLocaleString()}</p>

//                 </div>

//               ))}

//             </div>

//           )}



//           {order.invoice && (

//             <div className="bg-slate-50 rounded-xl px-3 py-2.5 flex justify-between items-center">

//               <span className="text-slate-500 text-xs">Invoice</span>

//               <span className="text-slate-800 font-mono text-xs font-semibold">{order.invoice}</span>

//             </div>

//           )}



//           {order.tracking && (

//             <div className="bg-cyan-50 border border-cyan-200 rounded-xl px-3 py-2.5 flex items-center gap-2">

//               <Truck size={14} className="text-cyan-600 shrink-0" />

//               <p className="text-cyan-700 text-sm">{order.tracking}</p>

//             </div>

//           )}



//           {order.cancelReason && (

//             <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">

//               <p className="text-xs text-slate-500 font-semibold mb-0.5">Cancellation Reason</p>

//               <p className="text-slate-700 text-sm">{order.cancelReason}</p>

//             </div>

//           )}



//           <div className="flex gap-2">

//             {order.status === 'Placed' && (

//               <>

//                 <button className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 text-slate-600 text-xs font-semibold py-2.5 rounded-xl">

//                   <Edit size={13} /> Edit

//                 </button>

//                 <button className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-600 text-xs font-semibold py-2.5 rounded-xl border border-red-100">

//                   <XCircle size={13} /> Cancel

//                 </button>

//               </>

//             )}

//             {order.status === 'Shipped' && (

//               confirmed ? (

//                 <div className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold py-2.5 rounded-xl">

//                   <Check size={13} /> Delivery Confirmed!

//                 </div>

//               ) : (

//                 <button onClick={() => setConfirmed(true)} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded-xl">

//                   <CheckCircle2 size={13} /> Confirm Delivery

//                 </button>

//               )

//             )}

//             {(order.status === 'Invoiced' || order.status === 'Delivered' || order.status === 'Shipped') && (

//               <button className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-500 rounded-xl">

//                 <Download size={14} />

//               </button>

//             )}

//           </div>

//         </div>

//       )}

//     </div>

//   );

// };



// /* ── INQUIRY CARD ── */

// const InquiryCard = ({ inquiry }) => {

//   const [expanded, setExpanded] = useState(false);

//   const [showQuote, setShowQuote] = useState(false);

//   const cfg = inquiryStatusConfig[inquiry.status] || inquiryStatusConfig['Pending'];



//   return (

//     <>

//       <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

//         <button onClick={() => setExpanded(e => !e)} className="w-full text-left px-4 py-3.5">

//           <div className="flex items-start justify-between gap-2">

//             <div className="flex-1 min-w-0">

//               <div className="flex items-center gap-2 flex-wrap">

//                 <span className="text-slate-400 text-xs font-mono">{inquiry.id}</span>

//                 <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>

//                   <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />

//                   {inquiry.status}

//                 </span>

//               </div>

//               <div className="flex items-center gap-3 mt-1.5">

//                 <span className="text-slate-700 font-bold text-sm">₹{inquiry.estimatedTotal.toLocaleString()}</span>

//                 <span className="text-slate-400 text-xs">{inquiry.items} items</span>

//               </div>

//               <p className="text-slate-400 text-xs mt-1">{inquiry.date}</p>

//             </div>

//             {expanded ? <ChevronUp size={17} className="text-slate-400 shrink-0 mt-1" /> : <ChevronDown size={17} className="text-slate-400 shrink-0 mt-1" />}

//           </div>

//         </button>



//         {expanded && (

//           <div className="border-t border-slate-100 px-4 py-4 space-y-3">

//             {inquiry.products.length > 0 && (

//               <div className="space-y-2">

//                 <p className="text-xs text-slate-500 font-semibold uppercase">Requested Items</p>

//                 {inquiry.products.map((p, i) => (

//                   <div key={i} className="flex justify-between items-center bg-slate-50 rounded-xl px-3 py-2">

//                     <p className="text-slate-800 text-sm font-medium">{p.name}</p>

//                     <p className="text-slate-500 text-xs">Qty: {p.qty}</p>

//                   </div>

//                 ))}

//               </div>

//             )}



//             {inquiry.clientNote && (

//               <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5">

//                 <p className="text-xs text-orange-600 font-semibold mb-0.5">Your Note</p>

//                 <p className="text-orange-800 text-sm">{inquiry.clientNote}</p>

//               </div>

//             )}



//             {inquiry.status === 'Converted' && inquiry.orderId && (

//               <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 flex justify-between items-center">

//                 <p className="text-emerald-700 text-xs font-semibold">Converted to Order</p>

//                 <span className="text-emerald-800 font-mono text-xs">{inquiry.orderId}</span>

//               </div>

//             )}



//             {inquiry.status === 'Seen' && (

//               <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 flex items-center gap-2">

//                 <AlertTriangle size={13} className="text-blue-500 shrink-0" />

//                 <p className="text-blue-700 text-xs">Admin is reviewing your inquiry. Call to make changes.</p>

//               </div>

//             )}



//             <div className="flex gap-2">

//               {inquiry.status === 'Pending' && (

//                 <>

//                   <button className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 text-slate-600 text-xs font-semibold py-2.5 rounded-xl">

//                     <Edit size={13} /> Edit

//                   </button>

//                   <button className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-600 text-xs font-semibold py-2.5 rounded-xl border border-red-100">

//                     <XCircle size={13} /> Cancel

//                   </button>

//                 </>

//               )}

//               {inquiry.status === 'Quote Prepared' && (

//                 <button onClick={() => setShowQuote(true)} className="flex-1 flex items-center justify-center gap-1.5 bg-violet-500 text-white text-xs font-semibold py-2.5 rounded-xl">

//                   <Eye size={13} /> See Quote

//                 </button>

//               )}

//             </div>

//           </div>

//         )}

//       </div>



//       {/* Quote Modal */}

//       {showQuote && inquiry.quoteItems && (

//         <div className="fixed inset-0 z-50 bg-black/50 flex items-end">

//           <div className="w-full bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto">

//             <div className="sticky top-0 bg-white px-4 pt-4 pb-3 border-b border-slate-100 flex justify-between items-center">

//               <div>

//                 <h3 className="text-slate-900 font-bold">Quote from Distributor</h3>

//                 <p className="text-slate-500 text-xs">{inquiry.id}</p>

//               </div>

//               <button onClick={() => setShowQuote(false)}><XCircle size={20} className="text-slate-400" /></button>

//             </div>

//             <div className="px-4 py-4 space-y-3">

//               {inquiry.adminNote && (

//                 <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">

//                   <p className="text-xs text-blue-600 font-semibold mb-0.5">Admin Note</p>

//                   <p className="text-blue-800 text-sm">{inquiry.adminNote}</p>

//                 </div>

//               )}

//               {inquiry.quoteItems.map((item, i) => (

//                 <div key={i} className="bg-slate-50 rounded-xl px-3 py-3">

//                   <p className="text-slate-900 font-semibold text-sm">{item.name}</p>

//                   <div className="flex justify-between mt-1.5 text-xs text-slate-500">

//                     <span>Qty: {item.qty}{item.freeQty > 0 ? ` + ${item.freeQty} free` : ''}</span>

//                     <span>PTR: ₹{item.ptr}</span>

//                     <span className="font-bold text-slate-700">₹{item.lineTotal.toLocaleString()}</span>

//                   </div>

//                 </div>

//               ))}

//               <div className="bg-slate-900 rounded-xl px-4 py-3 flex justify-between">

//                 <span className="text-slate-400 text-sm">Quote Total</span>

//                 <span className="text-white font-bold text-lg">₹{inquiry.quoteTotal?.toLocaleString()}</span>

//               </div>

//               <div className="flex gap-2">

//                 <button className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-xl text-sm">

//                   ✓ Convert to Order

//                 </button>

//                 <button className="flex-1 bg-slate-100 text-slate-600 font-semibold py-3 rounded-xl text-sm">

//                   Ask for Changes

//                 </button>

//               </div>

//               <button className="w-full bg-red-50 text-red-600 font-semibold py-2.5 rounded-xl text-sm border border-red-100">

//                 Reject Quote

//               </button>

//             </div>

//           </div>

//         </div>

//       )}

//     </>

//   );

// };



// /* ── PAGE ── */

// const ClientOrdersPage = () => {

//   const [activeTab, setActiveTab] = useState('orders');

//   const [orderFilter, setOrderFilter] = useState('All');

//   const [inquiryFilter, setInquiryFilter] = useState('All');



//   const orderStatuses = ['All', 'Placed', 'Invoiced', 'Shipped', 'Delivered', 'Cancelled'];

//   const inquiryStatuses = ['All', 'Pending', 'Seen', 'Quote Prepared', 'Changes Requested', 'Converted', 'Rejected'];



//   const filteredOrders = orderFilter === 'All' ? orders : orders.filter(o => o.status === orderFilter);

//   const filteredInquiries = inquiryFilter === 'All' ? inquiries : inquiries.filter(i => i.status === inquiryFilter);



//   return (

//     <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">

//       <div>

//         <h1 className="text-slate-900 text-lg font-bold">My Orders & Inquiries</h1>

//         <p className="text-slate-500 text-xs">Track orders and manage quotes</p>

//       </div>



//       {/* Main toggle */}

//       <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">

//         <button onClick={() => setActiveTab('orders')}

//           className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'orders' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>

//           <ShoppingBag size={15} /> Orders

//         </button>

//         <button onClick={() => setActiveTab('inquiries')}

//           className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'inquiries' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>

//           <ClipboardList size={15} /> Inquiries

//         </button>

//       </div>



//       {activeTab === 'orders' && (

//         <>

//           <div className="flex gap-2 overflow-x-auto scrollbar-none">

//             {orderStatuses.map(s => (

//               <button key={s} onClick={() => setOrderFilter(s)}

//                 className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${orderFilter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>

//                 {s}

//               </button>

//             ))}

//           </div>

//           <div className="space-y-3">

//             {filteredOrders.map(o => <OrderCard key={o.id} order={o} />)}

//           </div>

//         </>

//       )}



//       {activeTab === 'inquiries' && (

//         <>

//           <div className="flex gap-2 overflow-x-auto scrollbar-none">

//             {inquiryStatuses.map(s => (

//               <button key={s} onClick={() => setInquiryFilter(s)}

//                 className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${inquiryFilter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>

//                 {s}

//               </button>

//             ))}

//           </div>

//           <div className="space-y-3">

//             {filteredInquiries.map(i => <InquiryCard key={i.id} inquiry={i} />)}

//           </div>

//         </>

//       )}

//     </div>

//   );

// };



// export default ClientOrdersPage;