// src/features/Admin/OrdersPage/tabs/OrdersTab.jsx
import { Loader2, Package } from 'lucide-react';
import OrderFilterBar from '../components/OrderFilterBar';
import OrderCard from '../components/OrderCard';
import OrdersTable from '../components/OrdersTable';

export default function OrdersTab({
  orderGroup, setOrderGroup, filters, setFilters, pendingOrdersCount,
  ordersLoading, visibleOrders, setSelectedOrder
}) {
  return (
    <div className="space-y-4">
      <OrderFilterBar
        group={orderGroup}
        setGroup={setOrderGroup}
        filters={filters}
        setFilters={setFilters}
        pendingOrdersCount={pendingOrdersCount}
      />

      {ordersLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 size={24} className="animate-spin" /> <span className="text-base font-bold">Loading orders...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleOrders.length === 0 && (
            <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
              <Package className="mx-auto mb-3 text-slate-300" size={40} />
              <p className="text-lg font-bold text-slate-500">No {orderGroup} orders found.</p>
            </div>
          )}
          {visibleOrders.map((order) => (
            <OrderCard key={order._id} order={order} onOpen={setSelectedOrder} />
          ))}
          <OrdersTable orders={visibleOrders} onOpen={setSelectedOrder} />
        </div>
      )}
    </div>
  );
}