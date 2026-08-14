// customers/detail/tabs/OrdersTab.jsx
import { useState } from 'react';
import { ShoppingBag, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

import OrderDetailModal from '../../../../../features/Admin/OrdersPage/modals/OrderDetailModal'; 

const STATUS_PILL = {
  Placed:    'bg-amber-100 text-amber-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  Invoiced:  'bg-purple-100 text-purple-700',
  Shipped:   'bg-sky-100 text-sky-700',
  Delivered: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-slate-100 text-slate-500',
};

const toDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return '—';
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
};

const Skeleton = () => (
  <div className="animate-pulse space-y-3 mt-2">
    {[1,2,3].map(i => (
      <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between">
        <div className="space-y-2.5">
          <div className="h-4 bg-slate-100 rounded w-32" />
          <div className="h-3.5 bg-slate-100 rounded w-24" />
        </div>
        <div className="space-y-2.5 text-right">
          <div className="h-4 bg-slate-100 rounded w-20" />
          <div className="h-6 bg-slate-100 rounded w-20 ml-auto" />
        </div>
      </div>
    ))}
  </div>
);

export const OrdersTab = ({ orders, onRefreshOrders }) => {
  const [visibleCount, setVisibleCount] = useState(15);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isActionBusy, setIsActionBusy] = useState(false);

  if (!orders) return <Skeleton />;

  if (!orders.length) {
    return (
      <div className="text-center py-20 text-slate-400">
        <ShoppingBag size={36} className="mx-auto mb-3 opacity-40" />
        <p className="text-base font-medium">No orders yet</p>
      </div>
    );
  }

  const handleModalAction = async (actionType, data) => {
    if (actionType === 'refresh') {
      if (onRefreshOrders) await onRefreshOrders();
      setSelectedOrder(null);
      return;
    }
    toast.info(`To ${actionType} this order, please process it from the main Orders Dashboard.`);
  };

  const sorted = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const visibleOrders = sorted.slice(0, visibleCount);

  return (
    <div className="space-y-3 pb-6">
      {visibleOrders.map((order, i) => {
        const pillCls = STATUS_PILL[order.status] || STATUS_PILL.Placed;
        const amount  = order.finalInvoiceAmount || order.estimatedOrderTotal;
        
        // ✨ NEW LOGIC: Only allow clicks if the order lifecycle is completely finished
        const isComplete = order.status === 'Delivered' || order.status === 'Cancelled';
        
        return (
          <div
            key={order._id || i}
            onClick={() => isComplete && setSelectedOrder(order)}
            className={`bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-start transition-all 
              ${isComplete ? 'cursor-pointer hover:border-emerald-300 hover:shadow-md active:scale-[0.99]' : ''}`}
          >
            <div>
              <p className="text-base font-bold font-mono text-slate-900">{order.orderId}</p>
              <p className="text-sm text-slate-500 mt-0.5">
                {toDate(order.createdAt)}
                {order.items?.length ? ` · ${order.items.length} items` : ''}
              </p>
              {order.billPreference && (
                <p className="text-sm text-slate-400 mt-0.5">{order.billPreference} bill</p>
              )}
            </div>
            <div className="text-right shrink-0 ml-3">
              {amount > 0 && (
                <p className="text-base font-bold text-slate-900">
                  ₹{Math.round(amount).toLocaleString('en-IN')}
                </p>
              )}
              <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1 ${pillCls}`}>
                {order.status}
              </span>
            </div>
          </div>
        );
      })}

      {visibleCount < sorted.length && (
        <button
          onClick={() => setVisibleCount(prev => prev + 15)}
          className="w-full mt-4 py-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold rounded-xl flex justify-center items-center gap-2 transition-colors shadow-sm"
        >
          Load next 15 orders <ChevronDown size={18} />
        </button>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          busy={isActionBusy}
          onClose={() => setSelectedOrder(null)}
          onAction={handleModalAction}
          hideClientName={true} 
        />
      )}
    </div>
  );
};