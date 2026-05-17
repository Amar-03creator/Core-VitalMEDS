import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Package, ClipboardList, FileText, MessageSquare, Bell, Menu, X,
  RotateCcw, ChevronRight, CheckCircle2, Clock, Pill, LogOut,
  Zap, LayoutDashboard, ShoppingCart, Home // ADDED ShoppingCart and Home icons
} from 'lucide-react';

/* Client identity - MOCK DATA */
const CLIENT = {
  establishmentName: 'Sharma Medical Stores',
  owner: 'Rajesh Sharma',
  tier: 'Diamond',
  status: 'Active',
  creditScore: 88,
  outstanding: 45000,
  creditLimit: 150000,
  unreadNotifications: 3,
};

const tierColors = {
  Diamond: 'bg-cyan-100 text-cyan-700',
  Platinum: 'bg-slate-200 text-slate-700',
  Gold: 'bg-amber-100 text-amber-700',
  Silver: 'bg-gray-100 text-gray-500',
};

// DYNAMIC NAVIGATION BUILDER (now includes Home only for the bottom nav, not menu)
const getNavItems = (isApproved) => {
  const items = [
    { to: '/client-dashboard/products', label: 'Products', icon: Package },
    { to: '/client-dashboard/inquiry', label: 'Order Now', icon: ClipboardList },
    { to: '/client-dashboard/orders', label: 'My Orders', icon: RotateCcw },
    { to: '/client-dashboard/billing', label: 'Billing', icon: FileText },
  ];
  if (isApproved) {
    items.splice(2, 0, { to: '/client-dashboard/quick-reorder', label: 'Reorder', icon: Zap });
  }
  return items;
};

// Bottom navigation items (Home is first, then the rest)
const getBottomNavItems = (isApproved) => {
  const mainItems = getNavItems(isApproved);
  return [
    { to: '/client-dashboard', label: 'Home', icon: Home }, // ADDED Home
    ...mainItems
  ];
};

const ClientLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const isApproved = CLIENT.status === 'Active';
  const navItems = getNavItems(isApproved);
  const bottomNavItems = getBottomNavItems(isApproved); // ADDED for bottom bar
  const usedPercent = Math.round((CLIENT.outstanding / CLIENT.creditLimit) * 100);

  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">

      {/* ── TOP NAV ── */}
      <nav className="sticky top-0 z-50 flex flex-col bg-white shadow-sm border-b border-slate-200">

        {/* ROW 1: Branding & Actions */}
        <div className="flex items-center justify-between px-4 h-16">

          {/* Logo acts as the Home Button now */}
          <Link to="/client-dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 no-underline">
            <div className="w-10 h-10 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
              <Pill size={22} className="text-white" />
            </div>
            <p className="text-slate-900 font-extrabold text-xl tracking-tight m-0">
              CoreVital<span className="text-emerald-600 font-medium">MEDS</span>
            </p>
          </Link>

          {/* Action Icons */}
          <div className="flex items-center gap-1">
            {/* ADDED Cart icon */}
            <Link to="/client-dashboard/cart" className="p-2 text-slate-400 hover:text-slate-700 transition-colors relative">
              <ShoppingCart size={24} />
              {/* Optional cart badge – you can add later */}
            </Link>

            <Link to="/client-dashboard/support" className="p-2 text-slate-400 hover:text-slate-700 transition-colors">
              <MessageSquare size={24} />
            </Link>

            <Link to="/client-dashboard/notifications" className="relative p-2 text-slate-400 hover:text-slate-700 transition-colors">
              <Bell size={24} />
              {CLIENT.unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {CLIENT.unreadNotifications}
                </span>
              )}
            </Link>

            <button onClick={() => setMenuOpen(o => !o)} className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors">
              {menuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* ROW 2: Store Context Ribbon (unchanged) */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-2 overflow-hidden">
            {isApproved ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> : <Clock size={16} className="text-amber-500 shrink-0" />}
            <p className="text-slate-600 text-sm font-semibold truncate m-0">
              {CLIENT.establishmentName || CLIENT.owner}
            </p>
          </div>
          <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {CLIENT.status}
          </span>
        </div>

        {/* Pending banner (unchanged) */}
        {!isApproved && (
          <div className="bg-amber-50 border-t border-amber-200 px-5 py-3 flex items-center gap-2.5">
            <Clock size={16} className="text-amber-600 shrink-0" />
            <p className="text-amber-700 text-sm font-medium">
              Your account is under review. You can browse products but cannot order until approved.
            </p>
          </div>
        )}

        {/* Slide menu (unchanged except we keep Home Dashboard as first item) */}
        {menuOpen && (
          <div className="border-t border-slate-200 bg-white pb-5">
            {/* Profile card – unchanged */}
            <div className="mx-4 my-4 bg-slate-50 rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                {CLIENT.owner[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-900 font-semibold text-base">{CLIENT.owner}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-slate-400 text-sm truncate">{CLIENT.name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${tierColors[CLIENT.tier]}`}>
                    {CLIENT.tier}
                  </span>
                </div>
              </div>
            </div>

            {/* Credit bar – unchanged */}
            {isApproved && (
              <div className="mx-4 mb-4">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-500 font-medium">Credit used</span>
                  <span className={`font-semibold ${usedPercent > 80 ? 'text-red-600' : 'text-slate-700'}`}>
                    ₹{(CLIENT.outstanding / 1000).toFixed(0)}K / ₹{(CLIENT.creditLimit / 1000).toFixed(0)}K
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${usedPercent > 80 ? 'bg-red-500' : usedPercent > 50 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(usedPercent, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Nav links – include Home Dashboard explicitly */}
            {[
              { to: '/client-dashboard', label: 'Home Dashboard', icon: LayoutDashboard },
              ...navItems,
              { to: '/client-dashboard/support', label: 'Support', icon: MessageSquare },
            ].map(({ to, label, icon: Icon }) => {
              const active = isActive(to, true);
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3.5 px-5 py-3.5 text-base font-medium transition-colors
                    ${active ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Icon size={22} />
                  <span>{label}</span>
                  {active && <ChevronRight size={16} className="ml-auto text-emerald-500" />}
                </Link>
              );
            })}

            <div className="mx-4 mt-4 pt-4 border-t border-slate-200">
              <button className="flex items-center gap-2.5 text-red-500 text-base font-medium px-1">
                <LogOut size={20} /> Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── CONTENT ── */}
      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      {/* ── BOTTOM NAV (now includes Home) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-center justify-around py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {bottomNavItems.map(({ to, label, icon: Icon }) => {
          // Home uses exact match, others use startsWith
          const active = to === '/client-dashboard'
            ? location.pathname === '/client-dashboard'
            : location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${active ? 'text-emerald-600' : 'text-slate-400'}`}
            >
              <div className={`relative w-9 h-9 flex items-center justify-center rounded-xl transition-all ${active ? 'bg-emerald-50' : ''}`}>
                <Icon size={24} strokeWidth={active ? 2.2 : 1.8} />
              </div>
              <span className="text-[11px] font-semibold tracking-wide leading-none">{label}</span>
            </Link>
          );
        })}
      </div>

    </div>
  );
};

export default ClientLayout;