// pages/Admin/AdminLayout.jsx
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import { SideDrawer } from './SideDrawer';

const AdminLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setNotifOpen(false);
    setMessagesOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <TopNav
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        notifOpen={notifOpen}
        setNotifOpen={setNotifOpen}
        messagesOpen={messagesOpen}
        setMessagesOpen={setMessagesOpen}
      />
      <SideDrawer open={menuOpen} onClose={() => setMenuOpen(false)} currentPath={location.pathname} />
      <main className="flex-1 pb-24 text-base">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AdminLayout;