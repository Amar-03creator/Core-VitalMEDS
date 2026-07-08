// // src/components/ClientLayout.jsx
// import { useState } from 'react';
// import { Link, Outlet, useLocation } from 'react-router-dom';
// import {
//   Package, ClipboardList, FileText, MessageSquare, Bell, Menu, X,
//   RotateCcw, ChevronRight, CheckCircle2, Clock, Pill, LogOut,
//   Zap, LayoutDashboard, ShoppingCart, Home
// } from 'lucide-react';
// import { useAuth } from '../../context/AuthContext';

// const tierColors = {
//   Diamond: 'bg-cyan-100 text-cyan-700',
//   Platinum: 'bg-slate-200 text-slate-700',
//   Gold: 'bg-amber-100 text-amber-700',
//   Silver: 'bg-gray-100 text-gray-500',
// };

// // ── SIDEBAR (HAMBURGER MENU) NAVIGATION ──
// const getNavItems = (isApproved) => {
//   const baseItems = [
//     { to: '/client-dashboard/products', label: 'Products', icon: Package },
//     { 
//       to: '/client-dashboard/cart', 
//       label: 'Order Now', 
//       icon: ClipboardList, 
//       state: { initialTab: isApproved ? 'order' : 'inquiry' }
//     },
//     { to: '/client-dashboard/orders', label: 'My Orders', icon: RotateCcw },  // visible for all now
//   ];

//   if (isApproved) {
//     // Quick Order inserted between Order Now and My Orders
//     baseItems.splice(2, 0, { to: '/client-dashboard/quick-order', label: 'Quick Order', icon: Zap });
//     // Additional approved-only items
//     baseItems.push({ to: '/client-dashboard/billing', label: 'Billing', icon: FileText });
//     baseItems.push({ to: '/client-dashboard/quick-reorder', label: 'Reorder', icon: Zap });
//   }
//   return baseItems;
// };

// // ── BOTTOM NAVIGATION ──
// const getBottomNavItems = (isApproved) => {
//   const items = [
//     { to: '/client-dashboard', label: 'Home', icon: Home },
//     { to: '/client-dashboard/products', label: 'Products', icon: Package },
//     { 
//       to: '/client-dashboard/cart', 
//       label: 'Order Now', 
//       icon: ClipboardList,
//       state: { initialTab: isApproved ? 'order' : 'inquiry' }
//     },
//   ];

//   if (isApproved) {
//     // Quick Order right before My Orders
//     items.push({ to: '/client-dashboard/quick-order', label: 'Quick Order', icon: Zap });
//   }

//   items.push({ to: '/client-dashboard/orders', label: 'My Orders', icon: RotateCcw });
//   return items;
// };

// const ClientLayout = () => {
//   const [menuOpen, setMenuOpen] = useState(false);
//   const location = useLocation();
//   const { user, logout } = useAuth();

//   const isApproved = user?.status === 'Active';
//   const navItems = getNavItems(isApproved);
//   const bottomNavItems = getBottomNavItems(isApproved);

//   const outstanding = user?.outstanding || 0;
//   const creditLimit = user?.creditLimit || 1;
//   const usedPercent = Math.round((outstanding / creditLimit) * 100);

//   const ownerName = user?.contacts?.[0]?.name || 'Partner';
//   const establishmentName = user?.establishmentName || 'Pharmacy';
//   const tier = user?.tier || 'Silver';
//   const unreadNotifications = user?.unreadNotifications || 0;

//   const isActive = (path, exact) =>
//     exact ? location.pathname === path : location.pathname.startsWith(path);

//   return (
//     <div className="flex flex-col min-h-screen bg-slate-50">
//       {/* ── TOP NAV ── */}
//       <nav className="sticky top-0 z-50 flex flex-col bg-white shadow-sm border-b border-slate-200">
//         {/* ROW 1: Branding & Actions */}
//         <div className="flex items-center justify-between px-4 h-16">
//           <Link to="/client-dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 no-underline">
//             <div className="w-10 h-10 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
//               <Pill size={22} className="text-white" />
//             </div>
//             <p className="text-slate-900 font-extrabold text-xl tracking-tight m-0">
//               Vital<span className="text-emerald-600 font-medium">MEDS</span>
//             </p>
//           </Link>

//           <div className="flex items-center gap-1">
//             <Link to="/client-dashboard/cart" className="p-2 text-slate-400 hover:text-slate-700 transition-colors relative">
//               <ShoppingCart size={24} />
//             </Link>
//             <Link to="/client-dashboard/support" className="p-2 text-slate-400 hover:text-slate-700 transition-colors">
//               <MessageSquare size={24} />
//             </Link>
//             <Link to="/client-dashboard/notifications" className="relative p-2 text-slate-400 hover:text-slate-700 transition-colors">
//               <Bell size={24} />
//               {unreadNotifications > 0 && (
//                 <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
//                   {unreadNotifications}
//                 </span>
//               )}
//             </Link>
//             <button onClick={() => setMenuOpen(o => !o)} className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors">
//               {menuOpen ? <X size={26} /> : <Menu size={26} />}
//             </button>
//           </div>
//         </div>

//         {/* ROW 2: Store Context Ribbon */}
//         <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-100">
//           <div className="flex items-center gap-2 overflow-hidden">
//             {isApproved ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> : <Clock size={16} className="text-amber-500 shrink-0" />}
//             <p className="text-slate-600 text-sm font-semibold truncate m-0">{establishmentName}</p>
//           </div>
//           <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
//             {user?.status || 'Pending'}
//           </span>
//         </div>

//         {/* ── SIDEBAR (HAMBURGER) ── */}
//         {menuOpen && (
//           <div className="border-t border-slate-200 bg-white pb-5">
//             <div className="mx-4 my-4 bg-slate-50 rounded-2xl p-4 flex items-center gap-3.5">
//               <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-lg">
//                 {ownerName[0]}
//               </div>
//               <div className="flex-1 min-w-0">
//                 <p className="text-slate-900 font-semibold text-base">{ownerName}</p>
//                 <div className="flex items-center gap-2 mt-0.5">
//                   <p className="text-slate-400 text-sm truncate">{establishmentName}</p>
//                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${tierColors[tier] || tierColors.Silver}`}>
//                     {tier}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {isApproved && (
//               <div className="mx-4 mb-4">
//                 <div className="flex justify-between text-sm mb-1.5">
//                   <span className="text-slate-500 font-medium">Credit used</span>
//                   <span className={`font-semibold ${usedPercent > 80 ? 'text-red-600' : 'text-slate-700'}`}>
//                     ₹{(outstanding / 1000).toFixed(0)}K / ₹{(creditLimit / 1000).toFixed(0)}K
//                   </span>
//                 </div>
//                 <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
//                   <div
//                     className={`h-full rounded-full ${usedPercent > 80 ? 'bg-red-500' : usedPercent > 50 ? 'bg-amber-400' : 'bg-emerald-500'}`}
//                     style={{ width: `${Math.min(usedPercent, 100)}%` }}
//                   />
//                 </div>
//               </div>
//             )}

//             {[
//               { to: '/client-dashboard', label: 'Home Dashboard', icon: LayoutDashboard },
//               ...navItems,
//               { to: '/client-dashboard/support', label: 'Support', icon: MessageSquare },
//             ].map(({ to, label, icon: Icon, state }) => {
//               const active = isActive(to, true);
//               return (
//                 <Link
//                   key={to}
//                   to={to}
//                   onClick={() => setMenuOpen(false)}
//                   state={state} 
//                   className={`flex items-center gap-3.5 px-5 py-3.5 text-base font-medium transition-colors ${active ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:bg-slate-50'}`}
//                 >
//                   <Icon size={22} />
//                   <span>{label}</span>
//                   {active && <ChevronRight size={16} className="ml-auto text-emerald-500" />}
//                 </Link>
//               );
//             })}

//             <div className="mx-4 mt-4 pt-4 border-t border-slate-200">
//               <button onClick={logout} className="flex items-center gap-2.5 text-red-500 text-base font-medium px-1">
//                 <LogOut size={20} /> Sign Out
//               </button>
//             </div>
//           </div>
//         )}
//       </nav>

//       <main className="flex-1 pb-24">
//         <Outlet />
//       </main>

//       {/* ── BOTTOM NAV ── */}
//       <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-center justify-around py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
//         {bottomNavItems.map(({ to, label, icon: Icon, state }) => {
//           const active = to === '/client-dashboard' ? location.pathname === '/client-dashboard' : location.pathname.startsWith(to);
//           return (
//             <Link
//               key={to}
//               to={to}
//               state={state}
//               className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${active ? 'text-emerald-600' : 'text-slate-400'}`}
//             >
//               <div className={`relative w-9 h-9 flex items-center justify-center rounded-xl transition-all ${active ? 'bg-emerald-50' : ''}`}>
//                 <Icon size={24} strokeWidth={active ? 2.2 : 1.8} />
//               </div>
//               <span className="text-[11px] font-semibold tracking-wide leading-none">{label}</span>
//             </Link>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default ClientLayout;

// client/src/layouts/ClientLayout/ClientLayout.jsx
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
      <div ref={navRef}>
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