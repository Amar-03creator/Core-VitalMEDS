import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { ORDER_STATUS_META, formatMoney, formatDateTime, getOrderAmount, getSourceInfo } from '../utils';

export default function OrdersTable({ orders, onOpen }) {
  return (
    <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase text-left">
            <th className="px-4 py-3">Order ID</th>
            <th className="px-4 py-3">Date & Time</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">City / Route</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const meta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.Placed;
            const { amount, isFinal } = getOrderAmount(order);
            const source = getSourceInfo(order);
            const StatusIcon = meta.icon;
            const SourceIcon = source.icon;
            return (
              <tr key={order._id} onClick={() => onOpen(order)} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{order.orderId}</td>
                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDateTime(order.createdAt)}</td>
                <td className="px-4 py-3 text-slate-800 font-semibold">
                  <Link to={`/admin-dashboard/customers/${order.clientId?._id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">
                    {order.clientId?.establishmentName || 'Unknown client'}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-500">{order.clientId?.city || order.clientId?.deliveryRoute || '—'}</td>
                <td className="px-4 py-3 font-bold text-slate-800">
                  {formatMoney(amount)} {!isFinal && <span className="text-slate-400 text-xs font-normal">est.</span>}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-slate-500 text-xs"><SourceIcon size={12} /> {source.label}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
                    <StatusIcon size={11} /> {order.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {orders.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Package className="mx-auto mb-2" size={28} /> No orders match these filters
        </div>
      )}
    </div>
  );
}