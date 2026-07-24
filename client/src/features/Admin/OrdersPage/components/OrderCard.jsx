// import { ChevronDown, MapPin } from 'lucide-react';
// import { ORDER_STATUS_META, formatMoney, formatDateTime, getOrderAmount, getSourceInfo } from '../utils';

// export default function OrderCard({ order, onOpen }) {
//   const meta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.Placed;
//   const { amount, isFinal } = getOrderAmount(order);
//   const source = getSourceInfo(order);
//   const StatusIcon = meta.icon;
//   const SourceIcon = source.icon;

//   return (
//     <button onClick={() => onOpen(order)} className="w-full text-left bg-white rounded-2xl border border-slate-200 p-4 md:hidden">
//       <div className="flex items-start justify-between gap-2">
//         <div className="min-w-0 flex-1">
//           <div className="flex items-center gap-2 flex-wrap">
//             <span className="text-slate-400 text-xs font-mono">{order.orderId}</span>
//             <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
//               <StatusIcon size={11} /> {order.status}
//             </span>
//           </div>
//           <p className="text-slate-900 font-bold text-base mt-1 truncate">{order.clientId?.establishmentName || 'Unknown client'}</p>
//           <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-0.5">
//             <MapPin size={12} /> {order.clientId?.city || order.clientId?.deliveryRoute || '—'}
//           </div>
//           <div className="flex items-center gap-2 mt-1.5 flex-wrap">
//             <span className="text-slate-900 font-bold text-base">{formatMoney(amount)}</span>
//             {!isFinal && <span className="text-slate-400 text-xs">est.</span>}
//             <span className="flex items-center gap-1 text-slate-400 text-xs"><SourceIcon size={11} /> {source.label}</span>
//           </div>
//           <p className="text-slate-400 text-xs mt-1">{formatDateTime(order.createdAt)}</p>
//         </div>
//         <ChevronDown size={17} className="text-slate-300 shrink-0 mt-1 -rotate-90" />
//       </div>
//     </button>
//   );
// }

import { MapPin } from 'lucide-react';
import { ORDER_STATUS_META, formatMoney, formatDateTime, getOrderAmount, getSourceInfo } from '../utils';

export default function OrderCard({ order, onOpen }) {
  const meta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.Placed;
  const { amount, isFinal } = getOrderAmount(order);
  const source = getSourceInfo(order);
  const StatusIcon = meta.icon;
  const SourceIcon = source.icon;

  return (
    <button onClick={() => onOpen(order)} className="w-full text-left bg-white rounded-2xl border border-slate-200 p-4 md:hidden hover:shadow-sm transition-all active:scale-[0.98]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <span className="text-slate-400 text-sm font-mono font-bold">{order.orderId}</span>
            <span className={`flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
              <StatusIcon size={11} /> {order.status}
            </span>
            <span className="text-slate-400 text-sm ml-1 font-bold">{formatDateTime(order.createdAt)}</span>
          </div>
          
          <p className="text-slate-900 font-bold text-lg truncate py-1">{order.clientId?.establishmentName || 'Unknown client'}</p>
          
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl mt-1.5 text-sm">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <MapPin size={12} className="text-slate-400"/> {order.clientId?.city || order.clientId?.deliveryRoute || '—'}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-900 font-bold">
              {formatMoney(amount)} {!isFinal && <span className="text-slate-400 text-sm font-normal">est.</span>}
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 text-slate-500 text-sm font-medium">
              <SourceIcon size={12} /> {source.label}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}