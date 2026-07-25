// client/src/layouts/ClientLayout/NotificationsDropdown.jsx
import { Link, useNavigate } from 'react-router-dom';
import { X, ChevronRight, UserPlus, ClipboardList, ShoppingCart, AlertTriangle, Bell, CreditCard } from 'lucide-react';
import { GlassDropdown } from './GlassDropdown';
import { api } from '../../services/api';

const typeConfig = {
  registration: { icon: UserPlus, bg: 'bg-blue-500', text: 'text-blue-600' },
  inquiry: { icon: ClipboardList, bg: 'bg-violet-500', text: 'text-violet-600' },
  order: { icon: ShoppingCart, bg: 'bg-emerald-500', text: 'text-emerald-600' },
  payment: { icon: CreditCard, bg: 'bg-indigo-500', text: 'text-indigo-600' },
  alert: { icon: AlertTriangle, bg: 'bg-amber-500', text: 'text-amber-600' },
  document: { icon: ClipboardList, bg: 'bg-orange-500', text: 'text-orange-600' },
  default: { icon: Bell, bg: 'bg-slate-500', text: 'text-slate-600' }
};

const timeAgo = (dateInput) => {
  const seconds = Math.floor((new Date() - new Date(dateInput)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const NotificationsDropdown = ({ onClose, notifications = [], onRefresh }) => {
  const navigate = useNavigate();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotifClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await api.markNotificationRead(notif._id);
        if (onRefresh) onRefresh(); 
      } catch (err) {
        console.error("Failed to mark read", err);
      }
    }
    
    if (notif.link) {
      navigate(notif.link);
    }
    onClose();
  };

  return (
    <GlassDropdown onClose={onClose}>
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-slate-900 font-bold text-base">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount} new</span>
          )}
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
           <div className="px-4 py-8 text-center text-slate-400 text-xs font-semibold">No recent notifications</div>
        ) : (
          notifications.slice(0, 8).map((notif) => {
            const cfg = typeConfig[notif.type] || typeConfig.default;
            const Icon = cfg.icon;
            const isUnread = !notif.isRead;

            return (
              <div 
                key={notif._id} 
                onClick={() => handleNotifClick(notif)}
                className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors ${isUnread ? 'bg-emerald-50/50' : ''}`}
              >
                <div className="relative shrink-0 mt-0.5">
                  <div className={`w-9 h-9 ${cfg.bg} rounded-xl flex items-center justify-center shadow-sm`}>
                    <Icon size={16} className="text-white" />
                  </div>
                  {isUnread && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>{notif.title}</p>
                  <p className="text-slate-500 text-[12px] mt-0.5 leading-snug line-clamp-2">{notif.message}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{timeAgo(notif.createdAt)}</p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-100">
        <Link to="/client-dashboard/notifications" onClick={onClose}
          className="flex items-center justify-center gap-1.5 w-full text-emerald-600 text-sm font-bold py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
          View All Notifications <ChevronRight size={16} />
        </Link>
      </div>
    </GlassDropdown>
  );
};