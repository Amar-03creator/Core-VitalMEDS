// pages/Admin/AdminDashboard.jsx
import { useState } from 'react';
import { KpiAlerts } from '../../components/Admin/Dashboard/KpiAlerts';
import { QuickActions } from '../../components/Admin/Dashboard/QuickActions';
import { FinancialSnapshot } from '../../components/Admin/Dashboard/FinancialSnapshot';
import { TopParties } from '../../components/Admin/Dashboard/TopParties';
import { ConcernedParties } from '../../components/Admin/Dashboard/ConcernedParties';
import { TopProducts } from '../../components/Admin/Dashboard/TopProducts';

const AdminDashboard = () => {
  const [period, setPeriod] = useState('month');
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="px-4 py-5 space-y-6 max-w-2xl mx-auto">
      {/* Greeting */}
      <div className="pt-1">
        <p className="text-slate-500 text-sm">{dateStr}</p>
        <h1 className="text-slate-900 text-2xl font-bold mt-0.5">{greeting}, Amarnath 👋</h1>
      </div>

      {/* Daily To-Do (KPI Alerts) */}
      <div>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-3">Daily To-Do</p>
        <KpiAlerts />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-slate-700 font-semibold text-sm mb-3">Quick Actions</h2>
        <QuickActions />
      </div>

      {/* Financial Snapshot */}
      <FinancialSnapshot period={period} setPeriod={setPeriod} />

      {/* Top Parties */}
      <TopParties />

      {/* Concerned Parties Watchlist */}
      <ConcernedParties />

      {/* Top Selling Products */}
      <TopProducts period={period} />

      <div className="h-2" />
    </div>
  );
};

export default AdminDashboard;