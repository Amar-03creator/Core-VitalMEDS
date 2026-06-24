// components/RecentOrders.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, CheckCircle2, ReceiptText, Truck, ChevronDown, ChevronUp, Download } from 'lucide-react';

const orderStatusConfig = {
  Placed: { color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock },
  Confirmed: { color: 'text-violet-600', bg: 'bg-violet-50', icon: CheckCircle2 },
  Invoiced: { color: 'text-amber-600', bg: 'bg-amber-50', icon: ReceiptText },
  Shipped: { color: 'text-cyan-600', bg: 'bg-cyan-50', icon: Truck },
  Delivered: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
};

// Helper to format product list with quantities
const formatProductList = (products) => {
  if (!products || products.length === 0) return '—';
  return products.map(p => `${p.name}(${p.quantity})`).join(', ');
};

const RecentOrders = ({ orders }) => {
  const [expandedId, setExpandedId] = useState(null);

  // Only show if there are orders
  if (!orders || orders.length === 0) {
    return null;
  }

  // Take last 5 orders (assuming orders are in chronological order, oldest first)
  const lastFiveOrders = [...orders].slice(-5).reverse();

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDownloadBill = (order) => {
    // Implement actual bill download logic here
    console.log('Download bill for order:', order.id);
    // Example: window.open(`/api/bill/${order.id}`, '_blank');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-slate-800 font-bold text-xl">Recent Orders</h2>
        <Link to="/client-dashboard/orders" className="text-emerald-600 text-md font-semibold flex items-center gap-1">
          View all <ArrowRight size={13} />
        </Link>
      </div>

      <div className="space-y-2.5">
        {lastFiveOrders.map(order => {
          const { color, bg, icon: StatusIcon } = orderStatusConfig[order.status];
          const isExpanded = expandedId === order.id;
          const isDelivered = order.status === 'Delivered';

          return (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {/* Collapsible header (clickable) */}
              <button
                onClick={() => toggleExpand(order.id)}
                className="w-full text-left px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-400 text-sm font-mono">{order.id}</p>
                    <span className={`flex items-center gap-1.5 text-[12px] font-bold px-2 py-0.5 rounded-full ${bg} ${color}`}>
                      <StatusIcon size={11} />
                      {order.status}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm line-clamp-1">
                    {order.products.length} item{order.products.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-slate-400 text-sm">{order.date}</span>
                    <span className="text-slate-900 font-bold text-md">₹{order.amount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="ml-3 shrink-0">
                  {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/30">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-400 mb-1">Items</p>
                      <p className="text-sm text-slate-700">{formatProductList(order.products)}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase text-slate-400">Total Bill</p>
                      <p className="text-lg font-bold text-slate-900">₹{order.amount.toLocaleString()}</p>
                    </div>

                    {isDelivered && (
                      <button
                        onClick={() => handleDownloadBill(order)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                      >
                        <Download size={16} /> Download Bill
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentOrders;