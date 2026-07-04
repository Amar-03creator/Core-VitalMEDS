/**
 * CompanyStatsBar
 * Three summary cards above the Companies list.
 * `companies` is the normalized list already fetched from the API.
 */
export const CompanyStatsBar = ({ companies }) => {
  const activeCount = companies.filter(c => c.status === 'Active').length;
  const totalPendingRefunds = companies.reduce((sum, c) => sum + (c.pendingRefunds || 0), 0);
  const totalOutstanding = companies.reduce((sum, c) => sum + (c.outstandingToSupplier || 0), 0);

  const formatCurrency = (val) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
        <p className="text-2xl font-bold text-slate-800">{activeCount}</p>
        <p className="text-slate-500 text-sm font-medium">Active Suppliers</p>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
        <p className="text-2xl font-bold text-amber-700">{formatCurrency(totalPendingRefunds)}</p>
        <p className="text-amber-600 text-sm font-medium">Pending Refunds</p>
      </div>
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 text-center">
        <p className="text-2xl font-bold text-orange-700">{formatCurrency(totalOutstanding)}</p>
        <p className="text-orange-600 text-sm font-medium">We Owe Suppliers</p>
      </div>
    </div>
  );
};