// features/Client/Dashboard/RecentOrders.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, CheckCircle2, ReceiptText, Truck, ChevronDown, ChevronUp, Download, Ban, Eye, XCircle } from 'lucide-react';

// ✨ Expanded config to handle both Order and Inquiry statuses
const statusConfigMap = {
  // Order Statuses
  Placed: { color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock },
  Confirmed: { color: 'text-violet-600', bg: 'bg-violet-50', icon: CheckCircle2 },
  Invoiced: { color: 'text-amber-600', bg: 'bg-amber-50', icon: ReceiptText },
  Shipped: { color: 'text-cyan-600', bg: 'bg-cyan-50', icon: Truck },
  Delivered: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
  Cancelled: { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
  
  // Inquiry Statuses
  Pending: { color: 'text-slate-600', bg: 'bg-slate-100', icon: Clock },
  Viewed: { color: 'text-blue-600', bg: 'bg-blue-50', icon: Eye },
  Quoted: { color: 'text-amber-600', bg: 'bg-amber-50', icon: ReceiptText },
  Accepted: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
  Rejected: { color: 'text-red-600', bg: 'bg-red-50', icon: Ban },
};

const formatProductList = (products) => {
  if (!products || !Array.isArray(products) || products.length === 0) return '—';
  return products.map(p => `${p.name} (${p.quantity})`).join(', ');
};

const RecentOrders = ({ orders }) => {
  const [expandedId, setExpandedId] = useState(null);

  const safeOrders = Array.isArray(orders) ? orders : [];

  if (safeOrders.length === 0) {
    return null;
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDownloadBill = (order) => {
    console.log('Download bill for:', order.id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-slate-800 font-bold text-xl">Recent Activity</h2>
        {/* Sends them to the cart/tracking page where tabs live */}
        <Link to="/client-dashboard/cart" className="text-emerald-600 text-base font-semibold flex items-center gap-1">
          View all <ArrowRight size={13} />
        </Link>
      </div>

      <div className="space-y-2.5">
        {safeOrders.map(record => {
          const statusConfig = statusConfigMap[record.status] || statusConfigMap['Placed'];
          const { color, bg, icon: StatusIcon } = statusConfig;
          const isExpanded = expandedId === record.id;
          const isDelivered = record.status === 'Delivered';

          return (
            <div key={record.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <button
                onClick={() => toggleExpand(record.id)}
                className="w-full text-left px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {/* ✨ BADGE: Order vs Inquiry */}
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm ${
                        record.type === 'order' ? 'bg-indigo-100 text-indigo-700' : 'bg-fuchsia-100 text-fuchsia-700'
                      }`}>
                        {record.type}
                      </span>
                      <p className="text-slate-500 text-sm font-mono font-bold truncate">{record.id}</p>
                    </div>
                    
                    <span className={`flex items-center gap-1.5 text-sm font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-sm ${bg} ${color}`}>
                      <StatusIcon size={13} />
                      {record.status}
                    </span>
                  </div>
                  
                  <p className="text-slate-600 font-medium text-sm line-clamp-1 mt-1">
                    {record.products?.length || 0} item{(record.products?.length !== 1) ? 's' : ''}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2.5">
                    {/* ✨ Date was pre-formatted in ClientDashboard */}
                    <span className="text-slate-400 text-sm font-medium">{record.date}</span>
                    <span className="text-slate-900 font-black text-base">₹{(record.amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                
                <div className="ml-3 shrink-0">
                  {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/30">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-1">Items Included</p>
                      <p className="text-sm text-slate-700 font-medium leading-relaxed">{formatProductList(record.products)}</p>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 border-dashed">
                      <p className="text-sm font-semibold uppercase text-slate-400">
                        {record.type === 'order' ? 'Total Bill' : 'Est. Quote'}
                      </p>
                      <p className="text-lg font-black text-slate-900">₹{(record.amount || 0).toLocaleString('en-IN')}</p>
                    </div>
                    {isDelivered && record.type === 'order' && (
                      <button
                        onClick={() => handleDownloadBill(record)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm"
                      >
                        <Download size={16} /> Download Final Bill
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