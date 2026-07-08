// src/layouts/ClientLayout/SideDrawer.jsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserCircle2, FileText, BookOpen, MessageSquare, LogOut, ChevronRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBackHandler } from '../../hooks/useBackHandler';

const tierColors = {
  Diamond: 'bg-cyan-100 text-cyan-700',
  Platinum: 'bg-slate-200 text-slate-700',
  Gold: 'bg-amber-100 text-amber-700',
  Silver: 'bg-slate-100 text-slate-500',
};

// Intentionally excludes Home / Products / Order Now / Reorder / My Orders —
// those already live on the bottom nav.
const navGroups = [
  {
    group: 'Account',
    items: [
      { to: '/client-dashboard/profile', label: 'My Account', icon: UserCircle2 },
      { to: '/client-dashboard/billing', label: 'Billing Hub', icon: FileText },
    ],
  },
  {
    group: 'Help',
    items: [
      { to: '/client-dashboard/how-it-works', label: 'How Ordering Works', icon: BookOpen },
      { to: '/client-dashboard/support', label: 'Help & Support', icon: MessageSquare },
    ],
  },
];

export const SideDrawer = ({ open, onClose, currentPath, user, topOffset = 104 }) => {
  useBackHandler(open, onClose);
  const { logout } = useAuth();
  const isActive = (path) => currentPath.startsWith(path);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const isApproved = user?.status === 'Active';
  const outstanding = user?.outstanding || 0;
  const creditLimit = user?.creditLimit || 1;
  const usedPercent = Math.round((outstanding / creditLimit) * 100);
  const ownerName = user?.contacts?.[0]?.name || 'Partner';
  const establishmentName = user?.establishmentName || 'Pharmacy';
  const tier = user?.tier || 'Silver';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[60] transition-all duration-300
          ${open ? 'opacity-100 backdrop-blur-sm bg-slate-950/40 pointer-events-auto' : 'opacity-0 backdrop-blur-none bg-transparent pointer-events-none'}`}
        style={{ top: `${topOffset}px`, height: `calc(100% - ${topOffset}px)` }}
      />

      {/* Drawer panel */}
      <div
        className={`fixed right-0 z-[70] w-[86vw] max-w-sm
          transition-all duration-500 ease-[cubic-bezier(0.34,1.2,0.64,1)]
          ${open ? 'translate-x-0 translate-y-0 scale-100' : 'translate-x-full -translate-y-8 scale-95 opacity-0'}`}
        style={{ top: `${topOffset}px`, height: `calc(100% - ${topOffset}px)` }}
      >
        <div className="h-full flex flex-col bg-white border-l border-slate-200 rounded-l-2xl shadow-2xl">
          {/* Profile card */}
          <div className="mx-4 mt-5 mb-4 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-500/30 shrink-0">
                {ownerName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-900 font-bold text-base">{ownerName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-slate-500 text-sm truncate">{establishmentName}</p>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${tierColors[tier] || tierColors.Silver}`}>
                    {tier}
                  </span>
                </div>
              </div>
              <TrendingUp size={18} className="text-emerald-500/60 shrink-0" />
            </div>

            {isApproved && (
              <div className="px-4 pb-4">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-500 font-medium">Credit used</span>
                  <span className={`font-semibold ${usedPercent > 80 ? 'text-red-600' : 'text-slate-700'}`}>
                    ₹{(outstanding / 1000).toFixed(0)}K / ₹{(creditLimit / 1000).toFixed(0)}K
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
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
            {navGroups.map(({ group, items }) => (
              <div key={group} className="mb-2">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest px-3 py-2">{group}</p>
                <div className="space-y-0.5">
                  {items.map(({ to, label, icon: Icon }) => {
                    const active = isActive(to);
                    return (
                      <Link
                        key={to}
                        to={to}
                        className={`group flex items-center gap-3.5 px-3 py-3.5 rounded-xl transition-all duration-150 relative overflow-hidden
                          ${active ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                      >
                        {active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-emerald-500 rounded-full" />
                        )}
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${active ? 'bg-emerald-100' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                          <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                        </div>
                        <span className={`text-base flex-1 ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
                        {active && <ChevronRight size={16} className="text-emerald-500/70 shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 pb-8 pt-3 border-t border-slate-100">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut size={18} />
              <span className="text-base font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};