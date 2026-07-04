// src/layouts/AdminLayout/BottomNav.jsx
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ShoppingCart, Package, Layers } from 'lucide-react';

const bottomNavItems = [
  { to: '/admin-dashboard', label: 'Home', icon: LayoutDashboard, exact: true },
  { to: '/admin-dashboard/customers', label: 'Customers', icon: Users },
  { to: '/admin-dashboard/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin-dashboard/inventory', label: 'Inventory', icon: Package },
  { to: '/admin-dashboard/products', label: 'Products', icon: Layers },
];

export const BottomNav = () => {
  const location = useLocation();
  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div data-app-bottom-nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-700/50 flex items-center justify-around py-2">
      {bottomNavItems.map(({ to, label, icon: Icon, exact }) => {
        const active = isActive(to, exact);
        return (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${active ? 'text-emerald-400' : 'text-slate-500'}`}
          >
            <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${active ? 'bg-slate-800' : ''}`}>
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
            </div>
            <span className="text-[11px] font-semibold tracking-wide">{label}</span>
          </Link>
        );
      })}
    </div>
  );
};