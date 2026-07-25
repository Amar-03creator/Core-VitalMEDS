// src/pages/Admin/OrdersPage.jsx

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ShoppingBag, Search, Loader2, Plus, ClipboardList, Package } from 'lucide-react';
import { api } from '../../services/api';
import { MakeInvoiceModal } from '../../modals/MakeInvoiceModal';

// Utils
import { ORDER_PENDING_STATUSES, ORDER_COMPLETED_STATUSES, INQUIRY_PENDING_STATUSES, INQUIRY_COMPLETED_STATUSES, resolveDateRange } from '../../features/Admin/OrdersPage/utils';

// Components
import OrderFilterBar from '../../features/Admin/OrdersPage/components/OrderFilterBar';
import OrderCard from '../../features/Admin/OrdersPage/components/OrderCard';
import OrdersTable from '../../features/Admin/OrdersPage/components/OrdersTable';
import InquiryCard from '../../features/Admin/OrdersPage/components/InquiryCard';
import InquiriesTable from '../../features/Admin/OrdersPage/components/InquiriesTable';

// Modals
import ShipModal from '../../features/Admin/OrdersPage/modals/ShipModal';
import OrderReasonModal from '../../features/Admin/OrdersPage/modals/OrderReasonModal';
import OrderDetailModal from '../../features/Admin/OrdersPage/modals/OrderDetailModal';
import InquiryReadOnlyModal from '../../features/Admin/OrdersPage/modals/InquiryReadOnlyModal';
import QuoteBuilderModal from '../../features/Admin/OrdersPage/modals/QuoteBuilderModal';

export default function OrdersPage() {
  // ✨ FIX: Initialize states from sessionStorage to survive reloads
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('adminOrdersActiveTab') || 'orders');
  const [busyId, setBusyId] = useState(null);

  /* ── Orders tab state ─────────────────────────────────────────────── */
  const [orderGroup, setOrderGroup] = useState(() => sessionStorage.getItem('adminOrderGroup') || 'pending');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', sortBy: 'newest', dateRange: { preset: 'all' } });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shipModalOrder, setShipModalOrder] = useState(null);
  const [reasonModal, setReasonModal] = useState(null);
  const [invoiceModalState, setInvoiceModalState] = useState(null);

  /* ── Inquiries tab state ──────────────────────────────────────────── */
  const [inquiryGroup, setInquiryGroup] = useState(() => sessionStorage.getItem('adminInquiryGroup') || 'pending');
  const [inquiries, setInquiries] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const [inquirySearch, setInquirySearch] = useState('');
  const [viewInquiry, setViewInquiry] = useState(null);
  const [quoteInquiry, setQuoteInquiry] = useState(null);

  // ✨ FIX: Continuously sync tabs to sessionStorage whenever they change
  useEffect(() => { sessionStorage.setItem('adminOrdersActiveTab', activeTab); }, [activeTab]);
  useEffect(() => { sessionStorage.setItem('adminOrderGroup', orderGroup); }, [orderGroup]);
  useEffect(() => { sessionStorage.setItem('adminInquiryGroup', inquiryGroup); }, [inquiryGroup]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilters(filters), 400);
    return () => clearTimeout(t);
  }, [filters]);

  const fetchOrders = useCallback(async () => {
    try {
      const { dateFrom, dateTo } = resolveDateRange(debouncedFilters.dateRange);
      const res = await api.getOrders({
        search: debouncedFilters.search || undefined,
        sortBy: debouncedFilters.sortBy,
        dateFrom, dateTo,
      });
      setOrders(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  }, [debouncedFilters]);

  const fetchInquiries = useCallback(async () => {
    try {
      const res = await api.getInquiries();
      setInquiries(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load inquiries');
    } finally {
      setInquiriesLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => {
    fetchInquiries();
    api.getProductsWithBatches().then((res) => setAllProducts(res.data || [])).catch(() => { });
  }, [fetchInquiries]);

  const visibleOrders = orders.filter((o) =>
    orderGroup === 'pending' ? ORDER_PENDING_STATUSES.includes(o.status) : ORDER_COMPLETED_STATUSES.includes(o.status)
  );
  if (orderGroup === 'pending') {
    visibleOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  const visibleInquiries = inquiries
    .filter((i) => (inquiryGroup === 'pending' ? INQUIRY_PENDING_STATUSES.includes(i.status) : INQUIRY_COMPLETED_STATUSES.includes(i.status)))
    .filter((i) => !inquirySearch.trim() || i.inquiryId?.toLowerCase().includes(inquirySearch.trim().toLowerCase()) || i.clientId?.establishmentName?.toLowerCase().includes(inquirySearch.trim().toLowerCase()));

  if (inquiryGroup === 'pending') {
    visibleInquiries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  const pendingInquiriesCount = inquiries.filter(i => INQUIRY_PENDING_STATUSES.includes(i.status)).length;
  const pendingOrdersCount = orders.filter(o => ORDER_PENDING_STATUSES.includes(o.status)).length;

  /* ── Orders tab handlers ──────────────────────────────────────────── */

  const refreshAndSync = async (orderId) => {
    await fetchOrders();
    if (selectedOrder && orderId === selectedOrder._id) {
      try {
        const freshRes = await api.getOrderById(orderId);
        setSelectedOrder(freshRes.data);
      } catch (err) {
        console.error("Failed to sync populated order data", err);
      }
    }
  };

  const handleDownload = async (order, openForPrint = false) => {
    setBusyId(order._id);
    try {
      const blob = await api.downloadOrderInvoice(order._id);
      const url = URL.createObjectURL(blob);
      if (openForPrint) {
        window.open(url, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = url; a.download = `${order.invoiceNumber || order.orderId}.pdf`;
        document.body.appendChild(a); a.click(); a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) {
      toast.error(err.message || 'Failed to open invoice');
    } finally {
      setBusyId(null);
    }
  };

  const handleAction = async (action, orderOrId) => {
    switch (action) {
      case 'refresh': {
        await refreshAndSync(orderOrId);
        return;
      }
      case 'confirmAndInvoice': {
        setBusyId(orderOrId._id);
        try {
          await api.confirmOrder(orderOrId._id);
          const freshRes = await api.getOrderById(orderOrId._id);
          setSelectedOrder(freshRes.data);
          fetchOrders();
        } catch (err) {
          toast.error(err.message || 'Could not confirm order');
        } finally {
          setBusyId(null);
        }
        return;
      }
      case 'invoice':
        setInvoiceModalState({ order: orderOrId });
        return;

      case 'pack': {
        setBusyId(orderOrId._id);
        try {
          await api.packOrder(orderOrId._id);
          toast.success('Order marked as packed');
          await refreshAndSync(orderOrId._id);
        } catch (err) {
          toast.error(err.message || 'Could not mark packed');
        } finally {
          setBusyId(null);
        }
        return;
      }

      case 'ship':
        setShipModalOrder(orderOrId);
        return;

      case 'deliver': {
        setBusyId(orderOrId._id);
        try {
          await api.confirmOrderDelivery(orderOrId._id);
          toast.success('Order marked delivered');
          await refreshAndSync(orderOrId._id);
        } catch (err) {
          toast.error(err.message || 'Could not mark delivered');
        } finally {
          setBusyId(null);
        }
        return;
      }

      case 'sharePricing': {
        setBusyId(orderOrId._id);
        try {
          await api.sharePricing(orderOrId._id);
          toast.success('Pricing shared with client');
          await refreshAndSync(orderOrId._id);
        } catch (err) {
          toast.error(err.message || 'Could not share pricing');
        } finally {
          setBusyId(null);
        }
        return;
      }

      case 'cancelOrder':
        setReasonModal({ kind: 'cancelOrder', order: orderOrId });
        return;

      case 'download':
        return handleDownload(orderOrId, false);
      case 'print':
        return handleDownload(orderOrId, true);
      default:
        return;
    }
  };

  const handleReasonConfirm = async (reason) => {
    const { order } = reasonModal;
    setBusyId(order._id);
    try {
      await api.cancelOrder(order._id, reason, 'admin');
      toast.success('Order cancelled successfully');
      setReasonModal(null);
      setSelectedOrder(null); // ✨ FIX 1: Closes the Order Details modal instantly!
      await refreshAndSync(order._id);
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleShipConfirm = async (dispatchDetails) => {
    const order = shipModalOrder;
    setBusyId(order._id);
    try {
      await api.shipOrder(order._id, dispatchDetails);
      toast.success('Order marked shipped');
      setShipModalOrder(null);
      await refreshAndSync(order._id);
    } catch (err) {
      toast.error(err.message || 'Could not mark shipped');
    } finally {
      setBusyId(null);
    }
  };

  const handleRejectQuote = async (inquiryId, reason) => {
    setBusyId(inquiryId);
    try {
      await api.rejectInquiryQuote(inquiryId, reason);
      toast.success('Inquiry rejected');
      setQuoteInquiry(null);
      fetchInquiries();
    } catch (err) {
      toast.error(err.message || 'Failed to reject inquiry');
    } finally {
      setBusyId(null);
    }
  };

  /* ── Inquiries tab handlers ───────────────────────────────────────── */
  const openInquiry = async (inquiry) => {
    if (inquiry.status === 'Pending') {
      try {
        await api.markInquiryViewed(inquiry._id);
        fetchInquiries();
      } catch (err) {
        toast.error(err.message || 'Failed to mark inquiry as viewed');
      }
    }
    if (['Pending', 'Viewed'].includes(inquiry.status)) {
      setQuoteInquiry(inquiry);
    } else {
      setViewInquiry(inquiry);
    }
  };

  const handleSendQuote = async (payload) => {
    setBusyId(quoteInquiry._id);
    try {
      await api.sendInquiryQuote(quoteInquiry._id, payload);
      toast.success('Quote sent to client');
      setQuoteInquiry(null);
      fetchInquiries();
    } catch (err) {
      toast.error(err.message || 'Failed to send quote');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="px-4 py-6 space-y-4 max-w-6xl mx-auto">

      {/* 1. TOP HEADER ROW */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-slate-900 text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-none mt-1">Orders & Inquiries</h1>
          <p className="text-slate-500 text-sm sm:text-base md:text-lg font-medium mt-1.5">Process orders, manage invoices, and quote client inquiries.</p>
        </div>

        <button
          onClick={() => setInvoiceModalState({ phoneIn: true })}
          className="shrink-0 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm md:text-base px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 rounded-xl shadow-md transition-colors"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Create Order</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* 2. THE TABS ROW */}
      <div className="flex bg-slate-100 rounded-2xl p-1.5 gap-1.5 max-w-sm w-full">
        <button onClick={() => setActiveTab('orders')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-xl text-lg md:text-base font-bold transition-all ${activeTab === 'orders' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
          <ShoppingBag size={18} /> Orders
          {pendingOrdersCount > 0 && (
            <span className="ml-1 bg-red-500 text-white text-sm px-2 py-0.5 rounded-full shadow-sm">
              {pendingOrdersCount}
            </span>
          )}
        </button>
        <button onClick={() => setActiveTab('inquiries')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-xl text-lg md:text-base font-bold transition-all ${activeTab === 'inquiries' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
          <ClipboardList size={18} /> Inquiries
          {pendingInquiriesCount > 0 && (
            <span className="ml-1 bg-red-500 text-white text-sm px-2 py-0.5 rounded-full shadow-sm">
              {pendingInquiriesCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'orders' ? (
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
      ) : (
        <div className="space-y-4">
          <div className="flex border-b border-slate-200 mb-2">
            <button onClick={() => setInquiryGroup('pending')}
              className={`px-6 py-3.5 text-base md:text-base font-bold border-b-2 transition-colors -mb-[1px] ${inquiryGroup === 'pending' ? 'text-slate-900 border-slate-900' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
              Pending
            </button>
            <button onClick={() => setInquiryGroup('completed')}
              className={`px-6 py-3.5 text-base md:text-base font-bold border-b-2 transition-colors -mb-[1px] ${inquiryGroup === 'completed' ? 'text-slate-900 border-slate-900' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
              Completed
            </button>
          </div>

          <div className="relative max-w-sm mb-7">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={inquirySearch} onChange={(e) => setInquirySearch(e.target.value)} placeholder="Search Inquiry ID or client..."
              className="w-full pl-10 pr-4 py-2 text-base md:text-base bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 shadow-sm" />
          </div>

          {inquiriesLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <Loader2 size={24} className="animate-spin" /> <span className="text-base font-bold">Loading inquiries...</span>
            </div>
          ) : (
            <div className="space-y-7">
              {visibleInquiries.length === 0 && (
                <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
                  <ClipboardList className="mx-auto mb-3 text-slate-300" size={40} />
                  <p className="text-lg font-bold text-slate-500">No {inquiryGroup} inquiries found.</p>
                </div>
              )}
              {visibleInquiries.map((inquiry) => (
                <InquiryCard key={inquiry._id} inquiry={inquiry} onOpen={openInquiry} />
              ))}
              <InquiriesTable inquiries={visibleInquiries} onOpen={openInquiry} />
            </div>
          )}
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          busy={busyId === selectedOrder._id}
          onClose={() => setSelectedOrder(null)}
          onAction={handleAction}
        />
      )}
      {shipModalOrder && (
        <ShipModal order={shipModalOrder} busy={busyId === shipModalOrder._id}
          onClose={() => setShipModalOrder(null)} onConfirm={handleShipConfirm} />
      )}
      {reasonModal && (
        <OrderReasonModal
          title={`Cancel order ${reasonModal.order.orderId}?`}
          message={
            ['Invoiced', 'Packed'].includes(reasonModal.order.status)
              ? 'This order has an active invoice. Cancelling will automatically void the invoice and restore the stock to your inventory.'
              : undefined
          }
          actionLabel="Confirm Cancel"
          busy={busyId === reasonModal.order._id}
          onClose={() => setReasonModal(null)}
          onConfirm={handleReasonConfirm}
        />
      )}
      {invoiceModalState && (
        <MakeInvoiceModal
          prefillOrder={invoiceModalState.order || null}
          phoneIn={!!invoiceModalState.phoneIn}
          onClose={() => setInvoiceModalState(null)}
          onOrderUpdated={(updatedOrder) => {
            if (updatedOrder?.status === 'Cancelled') {
              setSelectedOrder(null);
              refreshAndSync(null);
            } else {
              refreshAndSync(updatedOrder._id);
            }
          }}
        />
      )}

      {viewInquiry && <InquiryReadOnlyModal inquiry={viewInquiry} onClose={() => setViewInquiry(null)} />}
      {quoteInquiry && (
        <QuoteBuilderModal
          inquiry={quoteInquiry}
          allProducts={allProducts}
          busy={busyId === quoteInquiry._id}
          onClose={() => setQuoteInquiry(null)}
          onSent={handleSendQuote}
          onReject={handleRejectQuote}
        />
      )}
    </div>
  );
}