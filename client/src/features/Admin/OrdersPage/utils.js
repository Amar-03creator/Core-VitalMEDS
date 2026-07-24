import { CheckCircle2, Clock, FileText, Truck, XCircle, ArrowRight, ClipboardEdit, ShoppingBag, Eye, Package } from 'lucide-react';

export const ORDER_STATUS_META = {
  Placed:    { color: 'text-blue-700',    bg: 'bg-blue-50',    dot: 'bg-blue-500',    icon: Clock },
  Confirmed: { color: 'text-violet-700',  bg: 'bg-violet-50',  dot: 'bg-violet-500',  icon: CheckCircle2 },
  Invoiced:  { color: 'text-amber-700',   bg: 'bg-amber-50',   dot: 'bg-amber-500',   icon: FileText },
  Packed:    { color: 'text-orange-700',  bg: 'bg-orange-50',  dot: 'bg-orange-500',  icon: Package },
  Shipped:   { color: 'text-cyan-700',    bg: 'bg-cyan-50',    dot: 'bg-cyan-500',    icon: Truck },
  Delivered: { color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500', icon: CheckCircle2 },
  Cancelled: { color: 'text-slate-500',   bg: 'bg-slate-100',  dot: 'bg-slate-400',   icon: XCircle },
};

export const ORDER_PENDING_STATUSES = ['Placed', 'Confirmed', 'Invoiced', 'Packed', 'Shipped'];
export const ORDER_COMPLETED_STATUSES = ['Delivered', 'Cancelled'];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highest', label: 'Highest Amount' },
  { value: 'lowest', label: 'Lowest Amount' },
  { value: 'status', label: 'By Status' },
];

export const INQUIRY_STATUS_META = {
  Pending:  { color: 'text-amber-700',  bg: 'bg-amber-50',  icon: Clock },
  Viewed:   { color: 'text-blue-700',   bg: 'bg-blue-50',   icon: Eye },
  Quoted:   { color: 'text-violet-700', bg: 'bg-violet-50', icon: FileText },
  Accepted: { color: 'text-emerald-700',bg: 'bg-emerald-50',icon: CheckCircle2 },
  Rejected: { color: 'text-red-700',    bg: 'bg-red-50',    icon: XCircle },
};

export const INQUIRY_PENDING_STATUSES = ['Pending', 'Viewed', 'Quoted'];
export const INQUIRY_COMPLETED_STATUSES = ['Accepted', 'Rejected'];

/* ── Helpers ── */
export const formatMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const formatDate = (d) => 
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
export const productLabel = (p) => (p && p.name) || 'Product unavailable';

export const getOrderAmount = (order) => {
  const isFinal = ['Invoiced', 'Shipped', 'Delivered'].includes(order.status) && order.finalInvoiceAmount != null;
  return { amount: isFinal ? order.finalInvoiceAmount : (order.estimatedOrderTotal || 0), isFinal };
};

export const getSourceInfo = (order) => {
  if (order.inquiryId) return { label: 'Converted Inquiry', icon: ArrowRight };
  if (order.createdBy) return { label: 'Admin-created', icon: ClipboardEdit };
  return { label: 'Direct Order', icon: ShoppingBag };
};

export const getOrderActions = (order) => ({
  canCancelOrder: ['Placed', 'Confirmed', 'Invoiced'].includes(order.status) && order.isCancellable !== false,
  canConfirmAndInvoice: order.status === 'Placed',
  canEditOrGenerateInvoice: order.status === 'Confirmed',
  canCancelInvoice: order.status === 'Invoiced',
  canMarkShipped: order.status === 'Invoiced',
  canMarkDelivered: order.status === 'Shipped',
  canDownloadInvoice: ['Invoiced', 'Shipped', 'Delivered'].includes(order.status) && !!order.invoiceNumber,
  canSharePricing: ['Invoiced', 'Shipped', 'Delivered'].includes(order.status) && !order.pricingSharedAt,
});

export const resolveDateRange = (dr) => {
  const now = new Date();
  if (dr.preset === '30d') {
    const from = new Date(now); from.setDate(from.getDate() - 30);
    return { dateFrom: from.toISOString().slice(0, 10), dateTo: now.toISOString().slice(0, 10) };
  }
  if (dr.preset === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { dateFrom: from.toISOString().slice(0, 10), dateTo: now.toISOString().slice(0, 10) };
  }
  if (dr.preset === 'custom') return { dateFrom: dr.from || undefined, dateTo: dr.to || undefined };
  return {};
};