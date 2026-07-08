import { useState } from 'react';
import {
  ShoppingCart, FileText, Truck, CheckCircle2, XCircle,

  ChevronDown, ChevronUp, Package, Clock, Download,

  AlertTriangle, Plus, Search

} from 'lucide-react';

/* ── DEMO DATA ── */

const orders = [

  {

    id: 'ORD-2024-201', clientName: 'Sharma Medical Stores', clientId: 'CUST-1042',

    status: 'Placed', items: 5, amount: 12400, date: '07 May 2025',

    billType: 'Credit', source: 'Inquiry',

    products: [

      { name: 'Paracetamol 500mg', qty: 200, price: 1800 },

      { name: 'Amoxicillin 250mg', qty: 100, price: 3200 },

      { name: 'Omeprazole 20mg', qty: 150, price: 4200 },

    ],

  },

  {

    id: 'ORD-2024-200', clientName: 'HealthFirst Pharmacy', clientId: 'CUST-1045',

    status: 'Placed', items: 3, amount: 8750, date: '07 May 2025',

    billType: 'Cash', source: 'Direct',

    products: [

      { name: 'Pantoprazole 40mg', qty: 120, price: 3600 },

      { name: 'Atorvastatin 10mg', qty: 80, price: 2800 },

    ],

  },

  {

    id: 'ORD-2024-199', clientName: 'City Pharma', clientId: 'CUST-1043',

    status: 'Invoiced', items: 4, amount: 15200, date: '06 May 2025',

    billType: 'Credit', source: 'Inquiry', invoice: 'MIL-05-2025-042',

    products: [],

  },

  {

    id: 'ORD-2024-197', clientName: 'MedCare Stores', clientId: 'CUST-1046',

    status: 'Shipped', items: 6, amount: 22100, date: '05 May 2025',

    billType: 'Credit', source: 'Direct', invoice: 'MIL-05-2025-041',

    tracking: 'Out for delivery · Est. today',

    products: [],

  },

  {

    id: 'ORD-2024-195', clientName: 'Sharma Medical Stores', clientId: 'CUST-1042',

    status: 'Delivered', items: 8, amount: 34500, date: '03 May 2025',

    billType: 'Credit', source: 'Direct', invoice: 'MIL-05-2025-038',

    products: [],

  },

  {

    id: 'ORD-2024-193', clientName: 'Ravi Drug House', clientId: 'CUST-1044',

    status: 'Cancelled', items: 2, amount: 5200, date: '02 May 2025',

    billType: 'Credit', source: 'Direct',

    cancelReason: 'Customer cancelled – price mismatch',

    products: [],

  },

];

const statusConfig = {

  Placed: { color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', icon: Clock },

  Confirmed: { color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500', icon: CheckCircle2 },

  Invoiced: { color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', icon: FileText },

  Shipped: { color: 'bg-cyan-100 text-cyan-700', dot: 'bg-cyan-500', icon: Truck },

  Delivered: { color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle2 },

  Cancelled: { color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', icon: XCircle },

};

const tabs = [

  { key: 'Pending', label: 'Pending', statuses: ['Placed', 'Confirmed'] },

  { key: 'Invoiced', label: 'Invoiced', statuses: ['Invoiced'] },

  { key: 'Shipped', label: 'Shipped', statuses: ['Shipped'] },

  { key: 'Delivered', label: 'Delivered', statuses: ['Delivered'] },

  { key: 'Cancelled', label: 'Cancelled', statuses: ['Cancelled'] },

  { key: 'All', label: 'All', statuses: Object.keys(statusConfig) },

];

/* ── INVOICE MODAL ── */

const InvoiceModal = ({ order, onClose }) => {

  const [invoiceNumber] = useState(`MIL-05-2025-${Math.floor(Math.random() * 10 + 43)}`);

  const [confirmed, setConfirmed] = useState(false);

  return (

    <div className="fixed inset-0 z-50 bg-black/50 flex items-end">

      <div className="w-full bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto">

        <div className="sticky top-0 bg-white px-4 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">

          <div>

            <h3 className="text-slate-900 font-bold text-base">Generate Invoice</h3>

            <p className="text-slate-500 text-xs">{order.id} · {order.clientName}</p>

          </div>

          <button onClick={onClose}><XCircle size={22} className="text-slate-400" /></button>

        </div>

        <div className="px-4 py-4 space-y-4">

          <div className="bg-slate-50 rounded-xl p-3 space-y-2">

            <div className="flex justify-between text-sm">

              <span className="text-slate-500">Invoice No.</span>

              <span className="text-slate-900 font-bold">{invoiceNumber}</span>

            </div>

            <div className="flex justify-between text-sm">

              <span className="text-slate-500">Bill Type</span>

              <span className={`font-semibold ${order.billType === 'Cash' ? 'text-emerald-600' : 'text-blue-600'}`}>{order.billType}</span>

            </div>

            <div className="flex justify-between text-sm">

              <span className="text-slate-500">Items</span>

              <span className="text-slate-800 font-medium">{order.items}</span>

            </div>

            <div className="flex justify-between text-sm font-bold">

              <span className="text-slate-800">Net Amount</span>

              <span className="text-slate-900">₹{order.amount.toLocaleString()}</span>

            </div>

          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex gap-2">

            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />

            <p className="text-amber-700 text-xs">Confirming this will deduct stock via FIFO logic and notify the client.</p>

          </div>

          {confirmed ? (

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-4 text-center">

              <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />

              <p className="text-emerald-800 font-bold">Invoice Generated!</p>

              <p className="text-emerald-600 text-sm">{invoiceNumber}</p>

            </div>

          ) : (

            <button

              onClick={() => setConfirmed(true)}

              className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"

            >

              <FileText size={16} /> Confirm & Generate Invoice

            </button>

          )}

        </div>

      </div>

    </div>

  );

};

/* ── ORDER CARD ── */

const OrderCard = ({ order }) => {

  const [expanded, setExpanded] = useState(false);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const { color: statusColor, icon: StatusIcon } = statusConfig[order.status];

  return (

    <>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

        <button onClick={() => setExpanded(e => !e)} className="w-full text-left px-4 py-3.5">

          <div className="flex items-start justify-between gap-2">

            <div className="flex-1 min-w-0">

              <div className="flex items-center gap-2">

                <span className="text-slate-400 text-xs font-mono">{order.id}</span>

                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>

                  {order.status}

                </span>

              </div>

              <p className="text-slate-900 font-semibold text-sm mt-0.5">{order.clientName}</p>

              <div className="flex items-center gap-3 mt-1">

                <span className="text-slate-500 text-xs">{order.items} items</span>

                <span className="text-slate-700 text-sm font-bold">₹{order.amount.toLocaleString()}</span>

                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${order.billType === 'Cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'

                  }`}>{order.billType}</span>

              </div>

              <p className="text-slate-400 text-xs mt-1">{order.date}</p>

            </div>

            {expanded ? <ChevronUp size={18} className="text-slate-400 shrink-0 mt-1" /> : <ChevronDown size={18} className="text-slate-400 shrink-0 mt-1" />}

          </div>

        </button>

        {expanded && (

          <div className="border-t border-slate-100 px-4 py-4 space-y-3">

            {/* Details */}

            <div className="grid grid-cols-2 gap-2">

              <div className="bg-slate-50 rounded-xl p-2.5">

                <p className="text-slate-400 text-[10px] uppercase font-semibold">Source</p>

                <p className="text-slate-800 text-sm font-medium">{order.source} Order</p>

              </div>

              <div className="bg-slate-50 rounded-xl p-2.5">

                <p className="text-slate-400 text-[10px] uppercase font-semibold">Date</p>

                <p className="text-slate-800 text-sm font-medium">{order.date}</p>

              </div>

              {order.invoice && (

                <div className="bg-slate-50 rounded-xl p-2.5 col-span-2">

                  <p className="text-slate-400 text-[10px] uppercase font-semibold">Invoice</p>

                  <p className="text-slate-800 text-sm font-medium font-mono">{order.invoice}</p>

                </div>

              )}

            </div>

            {/* Shipping info */}

            {order.tracking && (

              <div className="bg-cyan-50 border border-cyan-200 rounded-xl px-3 py-2.5 flex items-center gap-2">

                <Truck size={14} className="text-cyan-600" />

                <p className="text-cyan-700 text-sm">{order.tracking}</p>

              </div>

            )}

            {/* Cancel reason */}

            {order.cancelReason && (

              <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">

                <p className="text-xs text-slate-500 font-semibold mb-1">Cancellation Reason</p>

                <p className="text-slate-700 text-sm">{order.cancelReason}</p>

              </div>

            )}

            {/* Actions */}

            <div className="flex gap-2">

              {(order.status === 'Placed' || order.status === 'Confirmed') && (

                <button

                  onClick={() => setShowInvoiceModal(true)}

                  className="flex-1 bg-emerald-500 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5"

                >

                  <FileText size={13} /> Generate Invoice

                </button>

              )}

              {(order.status === 'Invoiced' || order.status === 'Shipped') && (

                <button className="flex-1 bg-cyan-600 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5">

                  <Truck size={13} /> Mark Shipped

                </button>

              )}

              {order.status === 'Shipped' && (

                <button className="flex-1 bg-emerald-500 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5">

                  <CheckCircle2 size={13} /> Confirm Delivery

                </button>

              )}

              {(order.status === 'Invoiced' || order.status === 'Delivered') && (

                <button className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl">

                  <Download size={14} />

                </button>

              )}

              {(order.status === 'Placed' || order.status === 'Confirmed') && (

                <button className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl">

                  <XCircle size={14} />

                </button>

              )}

            </div>

          </div>

        )}

      </div>

      {showInvoiceModal && <InvoiceModal order={order} onClose={() => setShowInvoiceModal(false)} />}

    </>

  );

};

/* ── PAGE ── */

const OrdersPage = () => {

  const [activeTab, setActiveTab] = useState('Pending');

  const [search, setSearch] = useState('');

  const currentStatuses = tabs.find(t => t.key === activeTab)?.statuses || [];

  const filtered = orders.filter(o => {

    const matchTab = currentStatuses.includes(o.status);

    const matchSearch = o.clientName.toLowerCase().includes(search.toLowerCase()) ||

      o.id.toLowerCase().includes(search.toLowerCase());

    return matchTab && matchSearch;

  });

  const getCounts = (tab) => {

    const statuses = tabs.find(t => t.key === tab)?.statuses || [];

    return orders.filter(o => statuses.includes(o.status)).length;

  };

  return (

    <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-slate-900 text-lg font-bold">Orders</h1>

          <p className="text-slate-500 text-xs">{orders.length} total orders</p>

        </div>

        <button className="flex items-center gap-1.5 bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-xl">

          <Plus size={14} /> Phone-in

        </button>

      </div>

      {/* Search */}

      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5">

        <Search size={15} className="text-slate-400 shrink-0" />

        <input

          value={search}

          onChange={e => setSearch(e.target.value)}

          placeholder="Search orders..."

          className="flex-1 text-sm text-slate-700 placeholder-slate-400 bg-transparent outline-none"

        />

      </div>

      {/* Tabs */}

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">

        {tabs.map(({ key, label }) => {

          const count = getCounts(key);

          return (

            <button

              key={key}

              onClick={() => setActiveTab(key)}

              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all

${activeTab === key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}

            >

              {label}

              {count > 0 && (

                <span className={`text-[10px] font-bold px-1 rounded-full ${activeTab === key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>

                  {count}

                </span>

              )}

            </button>

          );

        })}

      </div>

      {/* Orders list */}

      <div className="space-y-3">

        {filtered.length === 0 ? (

          <div className="text-center py-12 text-slate-400">

            <ShoppingCart className="mx-auto mb-2" size={32} />

            <p className="text-sm">No orders here</p>

          </div>

        ) : (

          filtered.map(o => <OrderCard key={o.id} order={o} />)

        )}

      </div>

    </div>

  );

};

export default OrdersPage;
