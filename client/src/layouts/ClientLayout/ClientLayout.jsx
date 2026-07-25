import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import { SideDrawer } from './SideDrawer';
import { Footer } from './Footer';
import { useAuth } from '../../context/AuthContext';
import { useEnsureDashboardFallback } from '../../hooks/useEnsureDashboardFallback';

const ClientLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [navHeight, setNavHeight] = useState(104);
  const navRef = useRef(null);
  const location = useLocation();
  const { user } = useAuth();

  useEnsureDashboardFallback('/client-dashboard');

  useEffect(() => {
    setNotifOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // Measure the actual nav height instead of hardcoding a magic number —
  // the ribbon row can wrap on narrow screens or long establishment names.
  useEffect(() => {
    if (!navRef.current) return;
    const observer = new ResizeObserver(([entry]) => setNavHeight(entry.contentRect.height));
    observer.observe(navRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* ✨ FIX: Made the wrapper sticky so it doesn't scroll out of view */}
      <div ref={navRef} className="sticky top-0 z-[70] w-full shadow-sm">
        <TopNav
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          notifOpen={notifOpen}
          setNotifOpen={setNotifOpen}
          user={user}
        />
      </div>

      <SideDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        currentPath={location.pathname}
        user={user}
        topOffset={navHeight}
      />

      <div className="flex-1 pb-24">
        <main className="text-base">
          <Outlet />
        </main>
        <Footer />
      </div>

      <BottomNav user={user} />
    </div>
  );
};

export default ClientLayout;