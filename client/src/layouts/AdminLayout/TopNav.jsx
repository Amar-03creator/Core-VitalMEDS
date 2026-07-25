// src/layouts/AdminLayout/TopNav.jsx
import { useState, useEffect, useCallback } from 'react';
import { Pill, MessageSquare, Bell } from 'lucide-react';
import { HamburgerButton } from './components/HamburgerButton';
import { NotificationsDropdown } from './components/NotificationsDropdown';
import { MessagesDropdown } from './components/MessagesDropdown';
import { demoTickets } from './constants'; // Keep tickets demo for now
import { api } from '../../services/api';

export const TopNav = ({ menuOpen, setMenuOpen, notifOpen, setNotifOpen, messagesOpen, setMessagesOpen }) => {
  const [notifications, setNotifications] = useState([]);
  
  // Real Notification Fetching
  const fetchNotifs = useCallback(async () => {
    try {
      // By default, this gets the latest 50-100 notifications for the admin
      const res = await api.getAdminNotifications();
      if (res.data) setNotifications(res.data);
    } catch (err) {
      console.error("Failed to load topnav notifications", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
    
    // ✨ Smart Polling: Automatically check for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifs();
    }, 30000); 

    return () => clearInterval(interval);
  }, [fetchNotifs]);

  const totalUnreadNotif = notifications.filter(n => !n.isRead).length;
  const totalUnreadTickets = demoTickets.filter(t => t.unread).length;

  return (
    <nav data-app-top-nav className="sticky top-0 z-[70] bg-slate-900 shadow-md">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Pill size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-none tracking-tight">VitalMEDS</p>
            <p className="text-emerald-400 text-[10px] font-semibold tracking-widest uppercase mt-0.5">Admin Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Messages button */}
          <div className="relative">
            <button
              onClick={() => { setMessagesOpen(o => !o); setNotifOpen(false); setMenuOpen(false); }}
              className={`relative p-2.5 rounded-xl transition-colors ${messagesOpen ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <MessageSquare size={20} />
              {totalUnreadTickets > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {totalUnreadTickets}
                </span>
              )}
            </button>
            {messagesOpen && <MessagesDropdown onClose={() => setMessagesOpen(false)} />}
          </div>

          {/* Notifications button */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(o => !o); setMessagesOpen(false); setMenuOpen(false); fetchNotifs(); }}
              className={`relative p-2.5 rounded-xl transition-colors ${notifOpen ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Bell size={20} />
              {totalUnreadNotif > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-emerald-400 text-slate-900 text-[9px] font-black rounded-full flex items-center justify-center px-0.5">
                  {totalUnreadNotif}
                </span>
              )}
            </button>
            {notifOpen && (
              <NotificationsDropdown 
                notifications={notifications} 
                onRefresh={fetchNotifs} // Allows dropdown to tell TopNav to update the red badge
                onClose={() => setNotifOpen(false)} 
              />
            )}
          </div>

          {/* Menu button */}
          <HamburgerButton open={menuOpen} onClick={() => setMenuOpen(o => !o)} />
        </div>
      </div>
    </nav>
  );
};