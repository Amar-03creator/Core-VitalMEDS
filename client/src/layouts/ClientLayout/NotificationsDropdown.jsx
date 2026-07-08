// src/layouts/ClientLayout/NotificationsDropdown.jsx
import { X } from 'lucide-react';
import { GlassDropdown } from './GlassDropdown';
import { demoClientNotifications } from './components/constants';

export const NotificationsDropdown = ({ onClose }) => {
  const unreadCount = demoClientNotifications.filter((n) => n.unread).length;

  return (
    <GlassDropdown onClose={onClose}>
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-slate-900 font-semibold text-base">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-emerald-500 text-white text-sm font-bold px-2 py-0.5 rounded-full">{unreadCount} new</span>
          )}
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
          <X size={18} />
        </button>
      </div>

      <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
        {demoClientNotifications.slice(0, 10).map(({ id, unread, icon: Icon, iconBg, title, text, time }) => (
          <div key={id} className={`flex items-start gap-3 px-4 py-3.5 ${unread ? 'bg-emerald-50/60' : ''}`}>
            <div className="relative shrink-0 mt-0.5">
              <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
                <Icon size={18} className="text-white" />
              </div>
              {unread && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-900 text-sm font-semibold">{title}</p>
              <p className="text-slate-600 text-sm mt-0.5 leading-snug">{text}</p>
              <p className="text-slate-400 text-sm mt-1">{time}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-slate-100">
        <button className="w-full text-emerald-600 text-sm font-semibold py-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
          Mark all as read
        </button>
      </div>
    </GlassDropdown>
  );
};