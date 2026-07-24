import { Package } from 'lucide-react';
import { INQUIRY_STATUS_META, formatMoney, formatDateTime } from '../utils';

export default function InquiriesTable({ inquiries, onOpen }) {
  return (
    <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-base font-bold uppercase text-left">
            <th className="px-4 py-3">Inquiry ID</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Client</th>
            <th className="px-4 py-3">Items</th>
            <th className="px-4 py-3">Est. Amount</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {inquiries.map((inquiry) => {
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
              <tr key={inquiry._id} onClick={() => onOpen(inquiry)} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-3 font-mono text-base text-slate-500">{inquiry.inquiryId}</td>
                <td className="px-4 py-3 text-slate-500 text-base whitespace-nowrap">{formatDateTime(inquiry.createdAt)}</td>
                <td className="px-4 py-3 text-base text-slate-800 font-semibold">{inquiry.clientId?.establishmentName || 'Unknown client'}</td>
                <td className="px-4 py-3 text-slate-500 text-base">{(inquiry.items || []).length}</td>
                <td className="px-4 py-3 font-bold text-slate-800 text-base">{formatMoney(amount)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
                    <StatusIcon size={11} /> {displayStatus}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {inquiries.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Package className="mx-auto mb-2 opacity-50" size={32} />
          No inquiries found
        </div>
      )}
    </div>
  );
}