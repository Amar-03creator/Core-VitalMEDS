// src/layouts/ClientLayout/BottomNav.jsx
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, ClipboardList, RotateCcw, Zap } from 'lucide-react';

// Reorder sits in the middle when it's available (approved clients only —
// there's no order history to reorder from until then).
const buildNavItems = (isApproved) => {
  const items = [
    { to: '/client-dashboard', label: 'Home', icon: Home, exact: true },
    { to: '/client-dashboard/products', label: 'Products', icon: Package },
  ];

  if (isApproved) {
    items.push({ to: '/client-dashboard/quick-reorder', label: 'Reorder', icon: Zap });
  }

  items.push({
    to: '/client-dashboard/cart',
    label: 'Order Now',
    icon: ClipboardList,
    state: { initialTab: isApproved ? 'order' : 'inquiry' },
  });

  items.push({ to: '/client-dashboard/orders', label: 'My Orders', icon: RotateCcw });

  return items;
};

export const BottomNav = ({ user }) => {
  const location = useLocation();
  const isApproved = user?.status === 'Active';
  const items = buildNavItems(isApproved);

  const isActive = (to, exact) => (exact ? location.pathname === to : location.pathname.startsWith(to));

  return (
    <div
      data-app-bottom-nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-center justify-around py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
    >
      {items.map(({ to, label, icon: Icon, exact, state }) => {
        const active = isActive(to, exact);
        return (
          <Link
            key={to}
            to={to}
            state={state}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${active ? 'text-emerald-600' : 'text-slate-400'}`}
          >
            <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${active ? 'bg-emerald-50' : ''}`}>
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
            </div>
            <span className="text-sm font-semibold tracking-wide leading-none">{label}</span>
          </Link>
        );
      })}
    </div>
  );
};