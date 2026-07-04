// customers/detail/tabs/OrdersTab.jsx
import { ShoppingBag } from 'lucide-react';

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

export const OrdersTab = ({ orders }) => {
  if (!orders) return <Skeleton />;

  if (!orders.length) {
    return (
      <div className="text-center py-20 text-slate-400">
        <ShoppingBag size={36} className="mx-auto mb-3 opacity-40" />
        <p className="text-base font-medium">No orders yet</p>
      </div>
    );
  }

  const sorted = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="space-y-3">
      {sorted.map((order, i) => {
        const pillCls = STATUS_PILL[order.status] || STATUS_PILL.Placed;
        const amount  = order.finalInvoiceAmount || order.estimatedOrderTotal;
        return (
          <div
            key={order._id || i}
            className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-start"
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
    </div>
  );
};
