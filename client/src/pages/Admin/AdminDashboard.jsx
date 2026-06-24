import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { KpiAlerts } from '../../features/Admin/Dashboard/KpiAlerts';
import { QuickActions } from '../../features/Admin/Dashboard/QuickActions';
import { FinancialSnapshot } from '../../features/Admin/Dashboard/FinancialSnapshot';
import { TopParties } from '../../features/Admin/Dashboard/TopParties';
import { ConcernedParties } from '../../features/Admin/Dashboard/ConcernedParties';
import { TopProducts } from '../../features/Admin/Dashboard/TopProducts';
import { Spinner } from '@/components/ui/spinner';
// ★ Added Calculator and RefreshCw icons for the new button
import { Calculator, RefreshCw } from 'lucide-react'; 
import { toast } from 'sonner';

const AdminDashboard = () => {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false); // ★ New state for the audit button

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  // Extracted fetch into its own function so we can call it after the audit finishes
  const fetchStats = async () => {
    try {
      const res = await api.getDashboardStats();
      setData(res.data);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // ★ New function to trigger the audit and instantly refresh the UI
  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      await api.runAudit();
      toast.success("Audit complete! Scores and Tiers updated.");
      await fetchStats(); // Instantly pull the fresh data
    } catch (error) {
      toast.error("Failed to run audit");
    } finally {
      setIsAuditing(false);
    }
  };

  if (loading || !data) return <div className="py-20 flex justify-center text-slate-500"><Spinner /></div>;

  return (
    <div className="px-4 py-5 space-y-6 max-w-2xl mx-auto">
      {/* Greeting & Audit Button Header */}
      <div className="pt-1 flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm">{dateStr}</p>
          <h1 className="text-slate-900 text-2xl font-bold mt-0.5">{greeting}, Amarnath 👋</h1>
        </div>
        <button 
          onClick={handleRunAudit} 
          disabled={isAuditing}
          className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-xl text-xs hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
        >
          {isAuditing ? <RefreshCw size={14} className="animate-spin text-emerald-600" /> : <Calculator size={14} className="text-emerald-600" />}
          {isAuditing ? 'Calculating...' : 'Run Audit'}
        </button>
      </div>

      <div>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-3">Daily To-Do</p>
        <KpiAlerts kpis={data.kpis} />
      </div>

      <div>
        <h2 className="text-slate-700 font-semibold text-sm mb-3">Quick Actions</h2>
        <QuickActions />
      </div>

      <FinancialSnapshot period={period} setPeriod={setPeriod} financials={data.financials} />
      <TopParties data={data.topParties} />
      <ConcernedParties parties={data.concernedParties} />
      <TopProducts period={period} data={data.topProducts} />

      <div className="h-2" />
    </div>
  );
};

export default AdminDashboard;