import { useState } from 'react';
import {
  MessageSquare, Eye, CheckCircle2, Trash2, XCircle,
  ChevronDown, ChevronUp, ShoppingCart, FileText, HelpCircle,
  Clock, AlertCircle, Send
} from 'lucide-react';

/* ── DEMO DATA ── */
const tickets = [
  {
    id: 'TKT-2025-041', clientName: 'Sharma Medical Stores', clientId: 'CUST-1042',
    type: 'order_issue', status: 'open', time: '4h ago',
    message: 'Received 2 broken strips of Amoxicillin in order ORD-2024-197. Please check and replace.',
    refId: 'ORD-2024-197', adminResponse: null,
  },
  {
    id: 'TKT-2025-040', clientName: 'City Pharma', clientId: 'CUST-1043',
    type: 'billing_issue', status: 'seen', time: '1d ago',
    message: 'Invoice MIL-05-2025-042 shows wrong GST rate. I think it should be 5% not 12% for Pantoprazole.',
    refId: 'MIL-05-2025-042', adminResponse: null,
  },
  {
    id: 'TKT-2025-038', clientName: 'MedCare Stores', clientId: 'CUST-1046',
    type: 'general', status: 'open', time: '2d ago',
    message: 'When will the new Dolo 650 stock arrive? We are running out and have regular demand.',
    refId: null, adminResponse: null,
  },
  {
    id: 'TKT-2025-036', clientName: 'HealthFirst Pharmacy', clientId: 'CUST-1045',
    type: 'billing_issue', status: 'resolved', time: '3d ago',
    message: 'I made a UPI payment of ₹18,200 on 5th May but it is not reflected in my ledger.',
    refId: 'MIL-05-2025-039', adminResponse: 'Payment has been recorded against invoice MIL-05-2025-039. Please refresh your billing page.',
  },
  {
    id: 'TKT-2025-034', clientName: 'Ravi Drug House', clientId: 'CUST-1044',
    type: 'order_issue', status: 'discarded', time: '4d ago',
    message: 'Order ORD-2024-193 was cancelled but I want to reorder same items.',
    refId: 'ORD-2024-193', adminResponse: null,
  },
];

const typeConfig = {
  order_issue:   { label: 'Order Issue',   icon: ShoppingCart, bg: 'bg-blue-100',   text: 'text-blue-700' },
  billing_issue: { label: 'Billing Issue', icon: FileText,     bg: 'bg-amber-100',  text: 'text-amber-700' },
  general:       { label: 'General',       icon: HelpCircle,   bg: 'bg-slate-100',  text: 'text-slate-600' },
};

const statusConfig = {
  open:      { color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', label: 'Open' },
  seen:      { color: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500',    label: 'Seen' },
  resolved:  { color: 'bg-slate-100 text-slate-600',     dot: 'bg-slate-400',   label: 'Resolved' },
  discarded: { color: 'bg-red-100 text-red-400',         dot: 'bg-red-300',     label: 'Discarded' },
};

const filterTabs = ['All', 'Open', 'Seen', 'Resolved'];

/* ── TICKET CARD ── */
const TicketCard = ({ ticket }) => {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);

  const { color: statusColor, dot, label: statusLabel } = statusConfig[ticket.status];
  const { label: typeLabel, icon: TypeIcon, bg: typeBg, text: typeText } = typeConfig[ticket.type];

  const isActive = ticket.status === 'open' || ticket.status === 'seen';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button onClick={() => setExpanded(e => !e)} className="w-full text-left px-4 py-3.5">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${typeBg}`}>
            <TypeIcon size={16} className={typeText} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 text-xs font-mono">{ticket.id}</span>
              <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                {statusLabel}
              </span>
            </div>
            <p className="text-slate-900 font-semibold text-sm mt-0.5">{ticket.clientName}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${typeBg} ${typeText}`}>{typeLabel}</span>
              <span className="text-slate-400 text-xs">{ticket.time}</span>
            </div>
            <p className="text-slate-500 text-xs mt-1.5 line-clamp-1">{ticket.message}</p>
          </div>
          {expanded ? <ChevronUp size={16} className="text-slate-400 shrink-0 mt-1" /> : <ChevronDown size={16} className="text-slate-400 shrink-0 mt-1" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-3">
          {/* Message */}
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 font-semibold mb-1.5">Customer Message</p>
            <p className="text-slate-700 text-sm leading-relaxed">"{ticket.message}"</p>
          </div>

          {/* Reference */}
          {ticket.refId && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
              <FileText size={13} className="text-blue-500 shrink-0" />
              <p className="text-blue-700 text-xs font-medium">Ref: <span className="font-mono">{ticket.refId}</span></p>
            </div>
          )}

          {/* Admin response */}
          {ticket.adminResponse && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <p className="text-xs text-emerald-600 font-semibold mb-1.5">Your Response</p>
              <p className="text-emerald-800 text-sm">{ticket.adminResponse}</p>
            </div>
          )}

          {/* Reply box */}
          {showReply && (
            <div className="space-y-2">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Type your message to the client…"
                rows={3}
                className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 resize-none"
              />
              <div className="flex gap-2">
                <button className="flex-1 bg-emerald-500 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                  <Send size={13} /> Send Reply
                </button>
                <button onClick={() => setShowReply(false)} className="w-10 h-9 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center">
                  <XCircle size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          {isActive && !showReply && (
            <div className="flex gap-2">
              {ticket.status === 'open' && (
                <button className="flex-1 bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                  <Eye size={13} /> Mark Seen
                </button>
              )}
              <button
                onClick={() => setShowReply(true)}
                className="flex-1 bg-slate-100 text-slate-700 font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5"
              >
                <MessageSquare size={13} /> Reply
              </button>
              <button className="w-10 h-9 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl flex items-center justify-center">
                <CheckCircle2 size={14} />
              </button>
              <button className="w-10 h-9 bg-red-50 text-red-400 border border-red-100 rounded-xl flex items-center justify-center">
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── PAGE ── */
const SupportPage = () => {
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = tickets.filter(t =>
    activeFilter === 'All' ? true : t.status === activeFilter.toLowerCase()
  );

  const openCount = tickets.filter(t => t.status === 'open').length;

  return (
    <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-slate-900 text-lg font-bold">Support</h1>
          {openCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {openCount} open
            </span>
          )}
        </div>
        <p className="text-slate-500 text-xs">Customer tickets & communications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {['open', 'seen', 'resolved', 'discarded'].map(s => {
          const count = tickets.filter(t => t.status === s).length;
          const { color } = statusConfig[s];
          return (
            <div key={s} className="bg-white border border-slate-200 rounded-2xl p-2.5 text-center">
              <p className="text-lg font-bold text-slate-800">{count}</p>
              <p className={`text-[10px] font-semibold capitalize ${
                s === 'open' ? 'text-emerald-600' :
                s === 'seen' ? 'text-blue-600' :
                s === 'resolved' ? 'text-slate-500' : 'text-red-400'
              }`}>{s}</p>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {filterTabs.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
              ${activeFilter === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Tickets */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <MessageSquare className="mx-auto mb-2" size={32} />
            <p className="text-sm">No tickets here</p>
          </div>
        ) : (
          filtered.map(t => <TicketCard key={t.id} ticket={t} />)
        )}
      </div>
    </div>
  );
};

export default SupportPage;