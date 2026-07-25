import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext'; 
import {
  Bell, CheckCircle2, UserPlus, ShoppingCart, ClipboardList,
  AlertTriangle, CreditCard, ChevronRight, Loader2
} from 'lucide-react';

const typeConfig = {
  registration: { icon: UserPlus, bg: 'bg-blue-100', text: 'text-blue-600', dot: 'bg-blue-500' },
  inquiry: { icon: ClipboardList, bg: 'bg-violet-100', text: 'text-violet-600', dot: 'bg-violet-500' },
  order: { icon: ShoppingCart, bg: 'bg-emerald-100', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  payment: { icon: CreditCard, bg: 'bg-indigo-100', text: 'text-indigo-600', dot: 'bg-indigo-500' },
  alert: { icon: AlertTriangle, bg: 'bg-amber-100', text: 'text-amber-600', dot: 'bg-amber-500' },
  document: { icon: ClipboardList, bg: 'bg-orange-100', text: 'text-orange-600', dot: 'bg-orange-500' },
  default: { icon: Bell, bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' }
};

const filterTabs = ['All', 'Unread', 'Orders', 'Payments', 'Alerts'];

const NotificationCard = ({ notif, onMarkRead }) => {
  const navigate = useNavigate();
  const cfg = typeConfig[notif.type] || typeConfig.default;
  const Icon = cfg.icon;

  const handleClick = async () => {
    if (!notif.isRead) await onMarkRead(notif._id);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all cursor-pointer hover:border-slate-300
      ${!notif.isRead ? 'border-emerald-200 shadow-sm shadow-emerald-500/5' : 'border-slate-200'}`} onClick={handleClick}>
      <div className="px-4 py-4">
        <div className="flex items-start gap-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
            <Icon size={18} className={cfg.text} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <p className="text-slate-900 text-sm font-bold truncate">{notif.title}</p>
                {!notif.isRead && <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />}
              </div>
              <span className="text-slate-400 text-xs font-semibold shrink-0">
                {new Date(notif.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <p className="text-slate-600 text-sm mt-1 leading-relaxed">{notif.message}</p>

            {notif.link && (
              <div className={`mt-2.5 flex items-center gap-1 text-[12px] font-bold ${cfg.text}`}>
                View Details <ChevronRight size={12} strokeWidth={3} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ClientNotificationsPage = () => {
  const { user } = useAuth(); // ✨ FIXED: Uses 'user' matching your AuthContext
  const [activeFilter, setActiveFilter] = useState('All');
  const [notifList, setNotifList] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✨ Safely extract ID now that 'user' is correctly imported
  const userId = user?._id || user?.id;

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await api.getClientNotifications(userId);
      setNotifList(res.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    } else {
      const timeout = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [userId, fetchNotifications]);

  const unreadCount = notifList.filter(n => !n.isRead).length;

  const handleMarkAllRead = async () => {
    await api.markAllClientNotificationsRead();
    setNotifList(list => list.map(n => ({ ...n, isRead: true })));
  };

  const handleMarkSingleRead = async (id) => {
    await api.markNotificationRead(id);
    setNotifList(list => list.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const getFiltered = () => {
    switch (activeFilter) {
      case 'Unread': return notifList.filter(n => !n.isRead);
      case 'Orders': return notifList.filter(n => ['order', 'inquiry'].includes(n.type));
      case 'Payments': return notifList.filter(n => n.type === 'payment');
      case 'Alerts': return notifList.filter(n => ['alert', 'document', 'registration'].includes(n.type));
      default: return notifList;
    }
  };

  const filtered = getFiltered();

  if (loading) return <div className="py-24 text-center text-emerald-500"><Loader2 size={36} className="animate-spin mx-auto"/></div>;

  return (
    <div className="px-4 py-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-slate-900 text-xl font-black">Notifications</h1>
            <p className="text-slate-500 text-sm font-semibold mt-0.5">Your updates from Mila Agencies</p>
          </div>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full ml-1">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl hover:bg-emerald-100 transition-colors active:scale-95">
            <CheckCircle2 size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {filterTabs.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)} className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-all ${activeFilter === f ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
            {f}
            {f === 'Unread' && unreadCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <Bell className="mx-auto mb-3 text-slate-300" size={40} />
            <p className="text-base font-bold text-slate-500">You're all caught up!</p>
            <p className="text-sm font-medium text-slate-400 mt-1">No notifications match this filter.</p>
          </div>
        ) : (
          filtered.map(n => (
            <NotificationCard key={n._id} notif={n} onMarkRead={handleMarkSingleRead} />
          ))
        )}
      </div>
    </div>
  );
};

export default ClientNotificationsPage;