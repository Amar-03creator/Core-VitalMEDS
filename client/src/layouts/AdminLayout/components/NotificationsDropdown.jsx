// components/Admin/Layout/NotificationsDropdown.jsx
import { Link, useNavigate } from 'react-router-dom';
import { X, ExternalLink, ChevronRight, UserPlus, ClipboardList, ShoppingCart, AlertTriangle, Bell } from 'lucide-react';
import { GlassDropdown } from './GlassDropdown';
import { api } from '../../../services/api';

const typeConfig = {
  registration: { icon: UserPlus, bg: 'bg-blue-500', text: 'text-blue-600' },
  inquiry: { icon: ClipboardList, bg: 'bg-violet-500', text: 'text-violet-600' },
  order: { icon: ShoppingCart, bg: 'bg-emerald-500', text: 'text-emerald-600' },
  alert: { icon: AlertTriangle, bg: 'bg-amber-500', text: 'text-amber-600' },
  document: { icon: ClipboardList, bg: 'bg-orange-500', text: 'text-orange-600' },
  default: { icon: Bell, bg: 'bg-slate-500', text: 'text-slate-600' }
};

// Helper to calculate "2m ago", "1h ago", etc.
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

export const NotificationsDropdown = ({ onClose, notifications, onRefresh }) => {
  const navigate = useNavigate();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotifClick = async (notif) => {
    // Mark as read in the database if it isn't already
    if (!notif.isRead) {
      try {
        await api.markNotificationRead(notif._id);
        if (onRefresh) onRefresh(); // Trigger TopNav to update the red badge
      } catch (err) {
        console.error("Failed to mark read", err);
      }
    }
    
    // Navigate to the linked page
    if (notif.link) {
      navigate(notif.link);
    }
    onClose();
  };

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
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-700/30 transition-colors ${isUnread ? 'bg-slate-800/50' : ''}`}
              >
                <div className="relative shrink-0 mt-0.5">
                  <div className={`w-8 h-8 ${cfg.bg} rounded-xl flex items-center justify-center`}>
                    <Icon size={14} className="text-white" />
                  </div>
                  {isUnread && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-slate-900" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${isUnread ? 'text-white' : 'text-slate-300'}`}>{notif.title}</p>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-snug line-clamp-2">{notif.message}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-slate-500 text-[10px] font-medium">{timeAgo(notif.createdAt)}</p>
                  </div>
                </div>
              </div>
            )
          })
        )}
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