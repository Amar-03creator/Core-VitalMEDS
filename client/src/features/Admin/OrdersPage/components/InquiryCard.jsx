import { Package } from 'lucide-react';
import { INQUIRY_STATUS_META, formatMoney, formatDateTime } from '../utils';

export default function InquiryCard({ inquiry, onOpen }) {
  const meta = INQUIRY_STATUS_META[inquiry.status] || INQUIRY_STATUS_META.Pending;
  const StatusIcon = meta.icon;
  const amount = inquiry.discountedTotalPrice || inquiry.totalPrice || 0;
  
  // ✨ Dynamic Rejection Label 
  let displayStatus = inquiry.status;
  if (inquiry.status === 'Rejected') {
    if (inquiry.rejectedBy === 'admin') displayStatus = 'Rejected by You';
    else if (inquiry.rejectedBy === 'client') displayStatus = 'Rejected by Client';
  }
  
  return (
    <button onClick={() => onOpen(inquiry)} className="relative w-full text-left bg-slate-100 rounded-2xl border border-slate-200 p-4 md:hidden hover:shadow-sm transition-all active:scale-[0.98]">
      
     
      <span className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded-full shadow-sm border border-white ${meta.bg} ${meta.color}`}>
        <StatusIcon size={11} /> {displayStatus}
      </span>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <span className="text-slate-400 text-sm font-mono font-black">{inquiry.inquiryId}</span>
            <span className="text-slate-400 text-sm font-semibold ml-1">{formatDateTime(inquiry.createdAt)}</span>
          </div>
          
          <p className="text-slate-900 font-bold text-lg truncate">{inquiry.clientId?.establishmentName || 'Unknown client'}</p>
          
          <div className="flex justify-between items-center gap-3 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl mt-2 text-base">
            <span className="text-slate-900 font-bold">
              {formatMoney(amount)} <span className="text-slate-400 text-sm font-normal">est.</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 text-slate-500 font-medium">
              <Package size={12} /> {(inquiry.items || []).length} items
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 text-base font-medium">{inquiry.status === 'Rejected' ? 'Rejected' : inquiry.status === 'Pending' ? 'Awaiting action' : 'In progress'}</span>
          </div>
        </div>
      </div>
    </button>
  );
}