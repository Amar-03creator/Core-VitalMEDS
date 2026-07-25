import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Pill, MessageSquare, Bell, ShoppingCart, CheckCircle2, Clock } from 'lucide-react';
import { HamburgerButton } from './components/HamburgerButton';
import { NotificationsDropdown } from './NotificationsDropdown';
import { api } from '../../services/api'; // ✨ Imported real API

export const TopNav = ({ menuOpen, setMenuOpen, notifOpen, setNotifOpen, user }) => {
  const [notifications, setNotifications] = useState([]);
  
  // Safe ID extraction
  const userId = user?._id || user?.id;

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await api.getClientNotifications(userId);
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications for navbar", err);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ✨ Calculate real unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const isApproved = user?.status === 'Active';
  const establishmentName = user?.establishmentName || 'Pharmacy';

  return (
    // ✨ FIX: Removed conflicting sticky classes here since the parent div in ClientLayout handles it now
    <nav data-app-top-nav className="bg-white border-b border-slate-200">
      <div className="flex items-center justify-between px-4 h-16">
        <Link to="/client-dashboard" className="flex items-center gap-3 no-underline">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <Pill size={22} className="text-white" />
          </div>
          <p className="text-slate-900 font-extrabold text-xl tracking-tight m-0">
            Vital<span className="text-emerald-600 font-medium">MEDS</span>
          </p>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            to="/client-dashboard/cart"
            className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <ShoppingCart size={22} />
          </Link>

          <Link
            to="/client-dashboard/support"
            className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <MessageSquare size={22} />
          </Link>

          {/* Notifications — dropdown modal */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen((o) => !o); setMenuOpen(false); }}
              className={`relative p-2.5 rounded-xl transition-colors ${notifOpen ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-50'}`}
            >
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-sm font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <NotificationsDropdown 
                notifications={notifications} 
                onRefresh={fetchNotifications} 
                onClose={() => setNotifOpen(false)} 
              />
            )}
          </div>

          <HamburgerButton open={menuOpen} onClick={() => { setMenuOpen((o) => !o); setNotifOpen(false); }} />
        </div>
      </div>

      {/* Store context ribbon */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-100">
        <div className="flex items-center gap-2 overflow-hidden">
          {isApproved ? (
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          ) : (
            <Clock size={16} className="text-amber-500 shrink-0" />
          )}
          <p className="text-slate-600 text-sm font-semibold truncate m-0">{establishmentName}</p>
        </div>
        <span
          className={`shrink-0 text-sm font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-md ${isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
        >
          {user?.status || 'Pending'}
        </span>
      </div>
    </nav>
  );
};