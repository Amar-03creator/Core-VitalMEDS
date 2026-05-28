// components/Admin/Dashboard/KpiAlerts.jsx
import { Link } from 'react-router-dom';
import { kpiAlerts } from './constants';

export const KpiAlerts = () => (
  <div className="grid grid-cols-2 gap-3">
    {kpiAlerts.map(({ label, value, icon: Icon, text, bg, border, link }) => (
      <Link
        key={label}
        to={link}
        className={`rounded-2xl p-4 border ${bg} ${border} active:scale-95 transition-transform`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
            <Icon size={18} className={text} />
          </div>
          {value > 0 && (
            <span className={`text-[11px] font-bold ${text}`}>● action needed</span>
          )}
        </div>
        <p className={`text-3xl font-black ${value > 0 ? text : 'text-slate-300'}`}>
          {value}
        </p>
        <p className="text-slate-500 text-xs font-medium mt-1 leading-tight">{label}</p>
      </Link>
    ))}
  </div>
);