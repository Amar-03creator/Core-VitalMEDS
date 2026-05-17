const InventoryPage = () => {
  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Inventory</h1>

      <div className="rounded-2xl bg-white p-4 shadow">
        <p className="font-semibold">Low Stock Alerts</p>
        <p className="text-sm text-red-500 mt-1">
          12 products running low
        </p>
      </div>
    </div>
  );
};

export default InventoryPage;