import { Link } from 'react-router-dom';
import { ShoppingCart, ClipboardList, AlertTriangle, Calendar } from 'lucide-react';

export const KpiAlerts = ({ kpis }) => {
  const alerts = [
    { label: 'Pending Orders', value: kpis.pendingOrders, icon: ShoppingCart, text: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', link: '/admin-dashboard/orders' },
    { label: 'Open Inquiries', value: kpis.openInquiries, icon: ClipboardList, text: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20', link: '/admin-dashboard/orders' },
    { label: 'Low Stock Items', value: kpis.lowStock, icon: AlertTriangle, text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', link: '/admin-dashboard/inventory' },
    { label: 'Near Expiry', value: kpis.nearExpiry, icon: Calendar, text: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', link: '/admin-dashboard/inventory' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {alerts.map(({ label, value, icon: Icon, text, bg, border, link }) => (
        <Link key={label} to={link} className={`rounded-2xl p-4 border ${bg} ${border} active:scale-95 transition-transform`}>
          <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}><Icon size={18} className={text} /></div>
            {value > 0 && <span className={`text-[11px] font-bold ${text}`}>● action needed</span>}
          </div>
          <p className={`text-3xl font-black ${value > 0 ? text : 'text-slate-300'}`}>{value}</p>
          <p className="text-slate-500 text-xs font-medium mt-1 leading-tight">{label}</p>
        </Link>
      ))}
    </div>
  );
};