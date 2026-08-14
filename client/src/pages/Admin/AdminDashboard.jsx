import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { KpiAlerts } from '../../features/Admin/Dashboard/KpiAlerts';
import { QuickActions } from '../../features/Admin/Dashboard/QuickActions';
import { FinancialSnapshot } from '../../features/Admin/Dashboard/FinancialSnapshot';
import { TopParties } from '../../features/Admin/Dashboard/TopParties';
import { ConcernedParties } from '../../features/Admin/Dashboard/ConcernedParties';
import { TopProducts } from '../../features/Admin/Dashboard/TopProducts';
import { Spinner } from '@/components/ui/spinner';
import { Calculator, RefreshCw } from 'lucide-react'; 
import { toast } from 'sonner';

const AdminDashboard = () => {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  useEffect(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

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

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await api.runAudit();
      const payload = res?.data || res;
      const m = payload?.metrics || {}; 
      
      toast.success(
        <div>
          <p className="font-bold mb-1">Audit Complete!</p>
          <ul className="text-xs space-y-0.5">
            <li>• Expired Batches Deactivated: <b>{m.expiredBatchesDeactivated || 0}</b></li>
            <li>• Near-Expiry Alerts: <b>{m.nearExpiryAlertsUpdated || 0}</b></li>
            <li>• Inventory Desyncs Fixed: <b>{m.inventoryDesyncsFixed || 0}</b></li>
            <li>• Ledger Desyncs Fixed: <b>{m.ledgerDesyncsFixed || 0}</b></li>
            <li>• Client Profiles Updated: <b>{m.clientsProfiled || 0}</b></li>
          </ul>
        </div>, 
        { duration: 5000 }
      );
      
      await fetchStats(); 
    } catch (error) {
      console.error("Audit Backend Error:", error.response || error);
      toast.error(error.response?.data?.message || "Failed to run audit. Check console.");
    } finally {
      setIsAuditing(false);
    }
  };

  if (loading || !data) return <div className="py-20 flex justify-center text-slate-500"><Spinner /></div>;

  return (
    <div className="px-4 py-5 space-y-6 max-w-2xl mx-auto">
      <div className="pt-1 flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-base">{dateStr}</p>
          <h1 className="text-slate-900 text-2xl font-bold mt-0.5">{greeting}, Amarnath 👋</h1>
        </div>
        <button 
          onClick={handleRunAudit} 
          disabled={isAuditing}
          className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 font-semibold px-3 py-2 mt-15 rounded-xl text-sm hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
        >
          {isAuditing ? <RefreshCw size={14} className="animate-spin text-emerald-600" /> : <Calculator size={14} className="text-emerald-600" />}
          {isAuditing ? 'Calculating...' : 'Run Audit'}
        </button>
      </div>

      <div>
        <p className="text-slate-500 text-lg font-semibold uppercase tracking-widest mb-3">Daily To-Do</p>
        <KpiAlerts kpis={data.kpis} />
      </div>

      <div>
        <h2 className="text-slate-700 font-semibold text-lg mb-3">Quick Actions</h2>
        <QuickActions />
      </div>

      <FinancialSnapshot period={period} setPeriod={setPeriod} financials={data.financials} />
      <TopParties data={data.topParties} />
      <ConcernedParties parties={data.concernedParties} />
      
      {/* ✨ THE FIX: We no longer pass period or data here. It handles itself! */}
      <TopProducts />

      <div className="h-2" />
    </div>
  );
};

export default AdminDashboard;