// components/Admin/Layout/NotificationsDropdown.jsx
import { Link } from 'react-router-dom';
import { X, ExternalLink, ChevronRight } from 'lucide-react';
import { GlassDropdown } from './GlassDropdown';
import { demoNotifications } from './constants';

export const NotificationsDropdown = ({ onClose }) => {
  const unreadCount = demoNotifications.filter(n => n.unread).length;
  return (
    <GlassDropdown onClose={onClose}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount} new</span>
          )}
        </div>
        <button onClick={onClose} className="text-slate-300 hover:text-white"><X size={14} /></button>
      </div>
      <div className="divide-y divide-slate-700/50 max-h-80 overflow-y-auto">
        {demoNotifications.map(({ id, unread, icon: Icon, iconBg, title, text, time, link, actionLabel }) => (
          <div key={id} className={`flex items-start gap-3 px-4 py-3 ${unread ? 'bg-slate-800/50' : ''}`}>
            <div className="relative shrink-0 mt-0.5">
              <div className={`w-8 h-8 ${iconBg} rounded-xl flex items-center justify-center`}>
                <Icon size={14} className="text-white" />
              </div>
              {unread && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-slate-900" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold">{title}</p>
              <p className="text-slate-300 text-xs mt-0.5 leading-snug">{text}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-slate-400 text-[11px]">{time}</p>
                {actionLabel && (
                  <Link to={link} onClick={onClose} className="text-emerald-400 text-[11px] font-semibold flex items-center gap-0.5">
                    {actionLabel} <ExternalLink size={10} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-slate-700/50">
        <Link to="/admin-dashboard/notifications" onClick={onClose}
          className="flex items-center justify-center gap-1.5 w-full text-emerald-400 text-sm font-semibold py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
          View All Notifications <ChevronRight size={14} />
        </Link>
      </div>
    </GlassDropdown>
  );
};