// src/features/Client/OrdersPage/utils.js
import { Clock, CheckCircle2, Package, Truck, XCircle, Edit3, FileText, CheckCheck } from 'lucide-react';

/* ── STATUS CONFIGURATIONS ── */
export const ORDER_STATUS_META = {
  Placed: { label: 'Ordered', color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500', icon: Clock },
  Editing: { label: 'Modifying', color: 'text-amber-700', bg: 'bg-amber-100', dot: 'bg-amber-500', icon: Edit3 },
  Confirmed: { label: 'Confirmed', color: 'text-violet-700', bg: 'bg-violet-50', dot: 'bg-violet-500', icon: CheckCircle2 },
  
  // ✨ ALIAS: The backend knows it's Invoiced, but the Client sees it as "Confirmed"
  Invoiced: { label: 'Confirmed', color: 'text-violet-700', bg: 'bg-violet-50', dot: 'bg-violet-500', icon: CheckCircle2 },
  
  Packed: { label: 'Packed', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500', icon: Package },
  Shipped: { label: 'Shipped', color: 'text-cyan-700', bg: 'bg-cyan-50', dot: 'bg-cyan-500', icon: Truck },
  Delivered: { label: 'Delivered', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500', icon: CheckCheck },
  Cancelled: { label: 'Cancelled', color: 'text-slate-500', bg: 'bg-slate-100', dot: 'bg-slate-400', icon: XCircle },
};

// 'Invoiced' stays here so the order doesn't vanish from the pending tab
export const ORDER_PENDING_STATUSES = ['Placed', 'Editing', 'Confirmed', 'Invoiced', 'Packed', 'Shipped'];
export const ORDER_COMPLETED_STATUSES = ['Delivered', 'Cancelled'];

// ✨ REMOVED 'Invoiced' from the visual progress bar steps
export const PROGRESS_STEPS = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];

export const INQUIRY_STATUS_META = {
  Pending: { label: 'Sent', color: 'text-amber-700', bg: 'bg-amber-50' },
  Viewed: { label: 'Viewed by Admin', color: 'text-blue-700', bg: 'bg-blue-50' },
  Quoted: { label: 'Quote Ready', color: 'text-violet-700', bg: 'bg-violet-50' },
  Accepted: { label: 'Converted to Order', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  Rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50' },
};

export const INQUIRY_PENDING_STATUSES = ['Pending', 'Viewed', 'Quoted'];
export const INQUIRY_COMPLETED_STATUSES = ['Accepted', 'Rejected'];

/* ── FORMATTING HELPERS ── */
export const formatMoney = (n) => `\u20b9${Number(n || 0).toLocaleString('en-IN')}`;
export const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '\u2014');
export const productLabel = (p) => (p && p.name) || 'Product unavailable';
export const toISODate = (d) => d.toISOString().slice(0, 10);

/* ── BUSINESS LOGIC HELPERS ── */
export const getOrderAmount = (order) => {
  const isFinal = ['Invoiced', 'Packed', 'Shipped', 'Delivered'].includes(order.status) && order.finalInvoiceAmount != null;
  return { amount: isFinal ? order.finalInvoiceAmount : (order.estimatedOrderTotal || 0), isFinal };
};

export const getOrderActions = (order) => ({
  canEdit: ['Placed', 'Editing', 'Confirmed'].includes(order.status), 
  canCancel: order.isCancellable !== false && ['Placed', 'Editing', 'Confirmed', 'Invoiced', 'Packed'].includes(order.status),
  canConfirmDelivery: order.status === 'Shipped',
  canDownloadInvoice: ['Packed', 'Shipped', 'Delivered'].includes(order.status) && !!order.invoiceNumber,
});

export const getInquiryActions = (inquiry) => ({
  canDelete: inquiry.status === 'Pending',
  canSeeQuote: inquiry.status === 'Quoted',
  canSeeReadOnlyQuote: inquiry.status === 'Accepted' && (inquiry.discountedTotalPrice || inquiry.totalPrice),
});

export const resolveDateRange = (dr) => {
  const now = new Date();
  if (dr.preset === '30d') {
    const from = new Date(now); from.setDate(from.getDate() - 30);
    return { dateFrom: toISODate(from), dateTo: toISODate(now) };
  }
  if (dr.preset === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { dateFrom: toISODate(from), dateTo: toISODate(now) };
  }
  if (dr.preset === 'custom') return { dateFrom: dr.from || undefined, dateTo: dr.to || undefined };
  return {};
};

export const EMPTY_ORDER_FILTERS = { billType: 'All', search: '', dateRange: { preset: 'all' } };
export const EMPTY_INQUIRY_FILTERS = { search: '', dateRange: { preset: 'all' } };