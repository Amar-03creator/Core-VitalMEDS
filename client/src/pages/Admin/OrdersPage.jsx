const OrdersPage = () => {
  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Orders</h1>

      <div className="rounded-2xl bg-white p-4 shadow">
        <p className="font-semibold">Order #5421</p>
        <p className="text-sm text-slate-500">
          Status: Processing
        </p>
      </div>
    </div>
  );
};

export default OrdersPage;