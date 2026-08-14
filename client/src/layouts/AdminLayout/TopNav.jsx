// src/layouts/AdminLayout/TopNav.jsx
import { useState, useEffect, useCallback } from 'react';
import { Pill, Bell } from 'lucide-react';
import { HamburgerButton } from './components/HamburgerButton';
import { NotificationsDropdown } from './components/NotificationsDropdown';
import { api } from '../../services/api';

export const TopNav = ({ menuOpen, setMenuOpen, notifOpen, setNotifOpen }) => {
  const [notifications, setNotifications] = useState([]);
  
  // ✨ NEW: State to hold the dynamic portal name
  const [portalName, setPortalName] = useState('Admin Portal');

  // ✨ Fetch Initial Data (Notifications + Profile Role)
  const fetchInitialData = useCallback(async () => {
    try {
      // 1. Fetch Notifications
      const notifRes = await api.getAdminNotifications();
      if (notifRes.data) setNotifications(notifRes.data);

      // 2. Fetch Profile to determine who is logged in
      const profileRes = await api.getAdminProfile();
      if (profileRes.data?.sessionRole) {
        const role = profileRes.data.sessionRole;
        if (role === 'COMPETENT_PERSON') setPortalName('CP Portal');
        else if (role === 'PROPRIETOR') setPortalName('Proprietor Portal');
        else if (role === 'DUAL_OWNER') setPortalName('Owner Portal');
        else setPortalName('System Admin');
      }
    } catch (err) {
      console.error("Failed to load topnav data", err);
    }
  }, []);

  useEffect(() => {
    // Run the initial fetch for both profile and notifications
    fetchInitialData();
    
    // ✨ Smart Polling: Only poll notifications every 30s (we don't need to poll the profile!)
    const interval = setInterval(async () => {
      try {
        const res = await api.getAdminNotifications();
        if (res.data) setNotifications(res.data);
      } catch (err) {
        console.error("Polling failed", err);
      }
    }, 30000); 

    return () => clearInterval(interval);
  }, [fetchInitialData]);

  const totalUnreadNotif = notifications.filter(n => !n.isRead).length;
  return (
    <nav data-app-top-nav className="sticky top-0 z-[70] bg-slate-900 shadow-md">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Pill size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-none tracking-tight">CoreVital MEDS</p>
            {/* ✨ Dynamically render the portal name based on sessionRole */}
            <p className="text-emerald-400 text-xs font-semibold tracking-widest uppercase mt-0.5">
              {portalName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">          

          {/* Notifications button */}
          <div className="relative">
            <button
              onClick={() => { 
                setNotifOpen(o => !o); 
                setMenuOpen(false); 
                // Fetch fresh notifications when opened
                api.getAdminNotifications().then(res => setNotifications(res.data)).catch(console.error); 
              }}
              className={`relative p-2.5 rounded-xl transition-colors ${notifOpen ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Bell size={24} />
              {totalUnreadNotif > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-emerald-400 text-slate-900 text-[11px] font-black rounded-full flex items-center justify-center px-0.5">
                  {totalUnreadNotif}
                </span>
              )}
            </button>
            {notifOpen && (
              <NotificationsDropdown 
                notifications={notifications} 
                onRefresh={async () => {
                  const res = await api.getAdminNotifications();
                  if (res.data) setNotifications(res.data);
                }}
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