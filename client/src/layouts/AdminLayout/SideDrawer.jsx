// components/Admin/Layout/SideDrawer.jsx
import { Link } from 'react-router-dom';
import { Settings, LogOut, ChevronRight, TrendingUp, LayoutDashboard, Users, ShoppingCart, Package, Layers, FileText, Building2, Bell, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBackHandler } from '../../hooks/useBackHandler';
import { useEffect } from 'react';

// ✨ FIX: Flattened list, removed Analytics & Support, logically ordered by daily workflow
const navItems = [
  { to: '/admin-dashboard', label: 'Command Center', icon: LayoutDashboard, exact: true },
  { to: '/admin-dashboard/orders', label: 'Orders & Inquiries', icon: ShoppingCart },
  { to: '/admin-dashboard/billing', label: 'Billing Hub', icon: FileText },
  { to: '/admin-dashboard/customers', label: 'Customers', icon: Users },
  { to: '/admin-dashboard/inventory', label: 'Inventory', icon: Package },
  { to: '/admin-dashboard/products', label: 'Products', icon: Layers },
  { to: '/admin-dashboard/companies', label: 'Companies', icon: Building2 },
  { to: '/admin-dashboard/expiry-offers', label: 'Offers & Expiry', icon: Tag },
  { to: '/admin-dashboard/notifications', label: 'Notifications', icon: Bell },
];

export const SideDrawer = ({ open, onClose, currentPath }) => {
  useBackHandler(open, onClose);
  const { logout } = useAuth();
  const isActive = (path, exact) => exact ? currentPath === path : currentPath.startsWith(path);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[60] transition-all duration-300
          ${open ? 'opacity-100 backdrop-blur-sm bg-slate-950/50 pointer-events-auto' : 'opacity-0 backdrop-blur-none bg-transparent pointer-events-none'}`}
        style={{ top: '64px', height: 'calc(100% - 64px)' }}
      />
      {/* Drawer panel */}
      <div
        className={`fixed right-0 z-[70] w-[82vw] max-w-sm
          transition-all duration-500 ease-[cubic-bezier(0.34,1.2,0.64,1)]
          ${open ? 'translate-x-0 translate-y-0 scale-100' : 'translate-x-full -translate-y-8 scale-95 opacity-0'}`}
        style={{ top: '64px', height: 'calc(100% - 64px)' }}
      >
        <div className="h-full flex flex-col bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-l border-white/10 rounded-l-2xl shadow-2xl">
          {/* Profile card */}
          <div className="mx-4 mt-5 mb-4 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-base shadow-lg shadow-emerald-500/30 shrink-0">A</div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">Amarnath Nayak</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded-md">ADMIN</span>
                  <span className="text-slate-400 text-[10px]">VitalMEDS</span>
                </div>
              </div>
              <div className="text-slate-500"><TrendingUp size={16} className="text-emerald-400/60" /></div>
            </div>
          </div>

          {/* Navigation - Flat List Loop */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {navItems.map(({ to, label, icon: Icon, exact }) => {
              const active = isActive(to, exact);
              return (
                <Link
                  key={to}
                  to={to}
                  // onClick={onClose} // Optional: close drawer on click
                  className={`group flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all duration-150 relative overflow-hidden
                    ${active ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                >
                  {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-emerald-400 rounded-full" />}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${active ? 'bg-emerald-500/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                    <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                  </div>
                  <span className={`text-sm font-medium flex-1 ${active ? 'font-semibold' : ''}`}>{label}</span>
                  {active && <ChevronRight size={14} className="text-emerald-400/70 shrink-0" />}
                </Link>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 pb-8 pt-3 border-t border-white/10 space-y-2">
            <Link 
            to="/admin-dashboard/settings" 
            // onClick={onClose} 
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all">
              <Settings size={16} />
              <span className="text-sm font-medium">Settings</span>
            </Link>
            <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut size={16} />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};