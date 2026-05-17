const AdminNotificationsPage = () => {
  return (
    <div className="p-5 space-y-3">
      <h1 className="text-2xl font-bold">Notifications</h1>

      <div className="rounded-2xl bg-white p-4 shadow">
        <p className="font-semibold">System Update</p>
        <p className="text-sm text-slate-500">
          Inventory synced successfully
        </p>
      </div>
    </div>
  );
};

export default AdminNotificationsPage;