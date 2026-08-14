// src/features/Admin/OrdersPage/tabs/InquiriesTab.jsx
import { Search, Loader2, ClipboardList } from 'lucide-react';
import InquiryCard from '../components/InquiryCard';
import InquiriesTable from '../components/InquiriesTable';

export default function InquiriesTab({
  inquiryGroup, setInquiryGroup, inquirySearch, setInquirySearch,
  inquiriesLoading, visibleInquiries, openInquiry
}) {
  return (
    <div className="space-y-4">
      <div className="flex border-b border-slate-200 mb-2">
        <button onClick={() => setInquiryGroup('pending')}
          className={`px-6 py-3.5 text-base md:text-base font-bold border-b-2 transition-colors -mb-[1px] ${inquiryGroup === 'pending' ? 'text-slate-900 border-slate-900' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
          Pending
        </button>
        <button onClick={() => setInquiryGroup('completed')}
          className={`px-6 py-3.5 text-base md:text-base font-bold border-b-2 transition-colors -mb-[1px] ${inquiryGroup === 'completed' ? 'text-slate-900 border-slate-900' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
          Completed
        </button>
      </div>

      <div className="relative max-w-sm mb-7">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={inquirySearch} onChange={(e) => setInquirySearch(e.target.value)} placeholder="Search Inquiry ID or client..."
          className="w-full pl-10 pr-4 py-2 text-base md:text-base bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 shadow-sm" />
      </div>

      {inquiriesLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 size={24} className="animate-spin" /> <span className="text-base font-bold">Loading inquiries...</span>
        </div>
      ) : (
        <div className="space-y-7">
          {visibleInquiries.length === 0 && (
            <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
              <ClipboardList className="mx-auto mb-3 text-slate-300" size={40} />
              <p className="text-lg font-bold text-slate-500">No {inquiryGroup} inquiries found.</p>
            </div>
          )}
          {visibleInquiries.map((inquiry) => (
            <InquiryCard key={inquiry._id} inquiry={inquiry} onOpen={openInquiry} />
          ))}
          <InquiriesTable inquiries={visibleInquiries} onOpen={openInquiry} />
        </div>
      )}
    </div>
  );
}