const AnalyticsPage = () => {
  return (
    <div className="p-5 space-y-4">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-slate-500">Total Sales</p>
          <h2 className="text-2xl font-bold">₹12.4L</h2>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-slate-500">Orders</p>
          <h2 className="text-2xl font-bold">1,284</h2>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;