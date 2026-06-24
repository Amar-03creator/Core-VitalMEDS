// components/Admin/Layout/MessagesDropdown.jsx
import { Link } from 'react-router-dom';
import { X, ChevronRight, MessageSquare } from 'lucide-react';
import { GlassDropdown } from './GlassDropdown';
import { demoTickets } from '../constants';

export const MessagesDropdown = ({ onClose }) => {
  const unreadCount = demoTickets.filter(t => t.unread).length;
  const statusDot = { open: 'bg-red-400', seen: 'bg-amber-400', resolved: 'bg-emerald-400' };
  return (
    <GlassDropdown onClose={onClose}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">Support Tickets</span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount} open</span>
          )}
        </div>
        <button onClick={onClose} className="text-slate-300 hover:text-white"><X size={14} /></button>
      </div>
      <div className="divide-y divide-slate-700/50 max-h-80 overflow-y-auto">
        {demoTickets.map(({ id, unread, categoryLabel, categoryColor, pharmacy, text, time, status }) => (
          <div key={id} className={`flex items-start gap-3 px-4 py-3 ${unread ? 'bg-slate-800/50' : ''}`}>
            <div className="relative shrink-0 mt-1">
              <div className="w-8 h-8 bg-slate-700 rounded-xl flex items-center justify-center">
                <MessageSquare size={13} className="text-white" />
              </div>
              <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 ${statusDot[status]} rounded-full border border-slate-900`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-white text-xs font-semibold truncate">{pharmacy}</p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${categoryColor} shrink-0`}>{categoryLabel}</span>
              </div>
              <p className="text-slate-300 text-xs leading-snug line-clamp-2">{text}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-slate-400 text-[11px]">{time}</p>
                <p className="text-slate-400 text-[11px] font-mono">{id}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-slate-700/50">
        <Link to="/admin-dashboard/support" onClick={onClose}
          className="flex items-center justify-center gap-1.5 w-full text-emerald-400 text-sm font-semibold py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
          View All Tickets <ChevronRight size={14} />
        </Link>
      </div>
    </GlassDropdown>
  );
};