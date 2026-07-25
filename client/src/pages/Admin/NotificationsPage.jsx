// src/pages/Admin/NotificationsPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import {
  Bell, CheckCircle2, UserPlus, ShoppingCart, ClipboardList,
  AlertTriangle, Package, Truck, CreditCard, Shield,
  MessageSquare, Zap, Calendar, ChevronRight, Check, Loader2
} from 'lucide-react';

const typeConfig = {
  registration: { icon: UserPlus, bg: 'bg-blue-100', text: 'text-blue-600', dot: 'bg-blue-500' },
  inquiry: { icon: ClipboardList, bg: 'bg-violet-100', text: 'text-violet-600', dot: 'bg-violet-500' },
  order: { icon: ShoppingCart, bg: 'bg-emerald-100', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  alert: { icon: AlertTriangle, bg: 'bg-amber-100', text: 'text-amber-600', dot: 'bg-amber-500' },
  document: { icon: ClipboardList, bg: 'bg-orange-100', text: 'text-orange-600', dot: 'bg-orange-500' },
  default: { icon: Bell, bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' }
};

const filterTabs = ['All', 'Unread', 'Orders', 'Registration'];

const NotificationCard = ({ notif, onMarkRead }) => {
  const navigate = useNavigate();
  const cfg = typeConfig[notif.type] || typeConfig.default;
  const Icon = cfg.icon;

  const handleClick = async () => {
    if (!notif.isRead) await onMarkRead(notif._id);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all cursor-pointer hover:bg-slate-50
      ${!notif.isRead ? 'border-slate-300 shadow-sm' : 'border-slate-200'}`} onClick={handleClick}>
      <div className="px-4 py-3.5">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
            <Icon size={16} className={cfg.text} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <p className="text-slate-900 text-sm font-semibold">{notif.title}</p>
                {!notif.isRead && <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />}
              </div>
              <span className="text-slate-400 text-xs shrink-0">
                {new Date(notif.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-slate-600 text-xs mt-1 leading-relaxed">{notif.message}</p>

            {notif.link && (
              <div className={`mt-2 flex items-center gap-1 text-[11px] font-semibold ${cfg.text}`}>
                View Details <ChevronRight size={11} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationsPage = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [notifList, setNotifList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.getAdminNotifications();
      setNotifList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifList.filter(n => !n.isRead).length;

  const handleMarkAllRead = async () => {
    await api.markAllAdminNotificationsRead();
    setNotifList(list => list.map(n => ({ ...n, isRead: true })));
  };

  const handleMarkSingleRead = async (id) => {
    await api.markNotificationRead(id);
    setNotifList(list => list.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const getFiltered = () => {
    switch (activeFilter) {
      case 'Unread': return notifList.filter(n => !n.isRead);
      case 'Registration': return notifList.filter(n => n.type === 'registration');
      case 'Orders': return notifList.filter(n => ['order', 'inquiry'].includes(n.type));
      default: return notifList;
    }
  };

  const filtered = getFiltered();

  if (loading) return <div className="py-20 text-center text-slate-400"><Loader2 size={30} className="animate-spin mx-auto"/></div>;

  return (
    <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-slate-900 text-lg font-bold">Notifications</h1>
            <p className="text-slate-500 text-xs">System alerts & business events</p>
          </div>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
            <CheckCircle2 size={13} /> Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {filterTabs.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${activeFilter === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>
            {f}
            {f === 'Unread' && unreadCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Bell className="mx-auto mb-2" size={32} />
            <p className="text-sm">No notifications here</p>
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

export default NotificationsPage;