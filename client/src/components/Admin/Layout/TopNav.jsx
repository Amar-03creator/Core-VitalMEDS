// components/Admin/Layout/TopNav.jsx
import { Pill, MessageSquare, Bell } from 'lucide-react';
import { HamburgerButton } from './HamburgerButton';
import { NotificationsDropdown } from './NotificationsDropdown';
import { MessagesDropdown } from './MessagesDropdown';
import { demoNotifications, demoTickets } from './constants';

export const TopNav = ({ menuOpen, setMenuOpen, notifOpen, setNotifOpen, messagesOpen, setMessagesOpen }) => {
  const totalUnreadNotif = demoNotifications.filter(n => n.unread).length;
  const totalUnreadTickets = demoTickets.filter(t => t.unread).length;

  return (
    <nav className="sticky top-0 z-[70] bg-slate-900 shadow-md">
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
              onClick={() => { setNotifOpen(o => !o); setMessagesOpen(false); setMenuOpen(false); }}
              className={`relative p-2.5 rounded-xl transition-colors ${notifOpen ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Bell size={20} />
              {totalUnreadNotif > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-emerald-400 text-slate-900 text-[9px] font-black rounded-full flex items-center justify-center px-0.5">
                  {totalUnreadNotif}
                </span>
              )}
            </button>
            {notifOpen && <NotificationsDropdown onClose={() => setNotifOpen(false)} />}
          </div>

          {/* Menu button */}
          <HamburgerButton open={menuOpen} onClick={() => setMenuOpen(o => !o)} />
        </div>
      </div>
    </nav>
  );
};