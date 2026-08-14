// src/pages/Admin/OrdersPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ShoppingBag, Plus, ClipboardList } from 'lucide-react';
import { api } from '../../services/api';
import { MakeInvoiceModal } from '../../modals/MakeInvoiceModal';

// Utils
import { ORDER_PENDING_STATUSES, ORDER_COMPLETED_STATUSES, INQUIRY_PENDING_STATUSES, INQUIRY_COMPLETED_STATUSES, resolveDateRange } from '../../features/Admin/OrdersPage/utils';

// Tabs
import OrdersTab from '../../features/Admin/OrdersPage/tabs/OrdersTab';
import InquiriesTab from '../../features/Admin/OrdersPage/tabs/InquiriesTab';

// Modals
import ShipModal from '../../features/Admin/OrdersPage/modals/ShipModal';
import OrderReasonModal from '../../features/Admin/OrdersPage/modals/OrderReasonModal';
import OrderDetailModal from '../../features/Admin/OrdersPage/modals/OrderDetailModal';
import InquiryReadOnlyModal from '../../features/Admin/OrdersPage/modals/InquiryReadOnlyModal';
import QuoteBuilderModal from '../../features/Admin/OrdersPage/modals/QuoteBuilderModal';

export default function OrdersPage() {
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
      const res = await api.getOrders({ search: debouncedFilters.search || undefined, sortBy: debouncedFilters.sortBy, dateFrom, dateTo });
      setOrders(res.data || []);
    } catch (err) { toast.error(err.message || 'Failed to load orders'); } 
    finally { setOrdersLoading(false); }
  }, [debouncedFilters]);

  const fetchInquiries = useCallback(async () => {
    try {
      const res = await api.getInquiries();
      setInquiries(res.data || []);
    } catch (err) { toast.error(err.message || 'Failed to load inquiries'); } 
    finally { setInquiriesLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => {
    fetchInquiries();
    api.getProductsWithBatches().then((res) => setAllProducts(res.data || [])).catch(() => { });
  }, [fetchInquiries]);

  const visibleOrders = orders.filter((o) => orderGroup === 'pending' ? ORDER_PENDING_STATUSES.includes(o.status) : ORDER_COMPLETED_STATUSES.includes(o.status));
  if (orderGroup === 'pending') visibleOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const visibleInquiries = inquiries
    .filter((i) => (inquiryGroup === 'pending' ? INQUIRY_PENDING_STATUSES.includes(i.status) : INQUIRY_COMPLETED_STATUSES.includes(i.status)))
    .filter((i) => !inquirySearch.trim() || i.inquiryId?.toLowerCase().includes(inquirySearch.trim().toLowerCase()) || i.clientId?.establishmentName?.toLowerCase().includes(inquirySearch.trim().toLowerCase()));

  if (inquiryGroup === 'pending') visibleInquiries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const pendingInquiriesCount = inquiries.filter(i => INQUIRY_PENDING_STATUSES.includes(i.status)).length;
  const pendingOrdersCount = orders.filter(o => ORDER_PENDING_STATUSES.includes(o.status)).length;

  const refreshAndSync = async (orderId) => {
    await fetchOrders();
    if (selectedOrder && orderId === selectedOrder._id) {
      try {
        const freshRes = await api.getOrderById(orderId);
        setSelectedOrder(freshRes.data);
      } catch (err) { console.error("Failed to sync", err); }
    }
  };

  const handleDownload = async (order, openForPrint = false) => {
    setBusyId(order._id);
    try {
      const blob = await api.downloadOrderInvoice(order._id);
      const url = URL.createObjectURL(blob);
      if (openForPrint) { window.open(url, '_blank'); } 
      else {
        const a = document.createElement('a');
        a.href = url; a.download = `${order.invoiceNumber || order.orderId}.pdf`;
        document.body.appendChild(a); a.click(); a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) { toast.error(err.message || 'Failed to open invoice'); } 
    finally { setBusyId(null); }
  };

  const handleAction = async (action, orderOrId) => {
    switch (action) {
      case 'refresh': return refreshAndSync(orderOrId);
      case 'confirmAndInvoice': {
        setBusyId(orderOrId._id);
        try {
          await api.confirmOrder(orderOrId._id);
          const freshRes = await api.getOrderById(orderOrId._id);
          setSelectedOrder(freshRes.data);
          fetchOrders();
        } catch (err) { toast.error(err.message || 'Could not confirm order'); } 
        finally { setBusyId(null); }
        return;
      }
      case 'invoice': return setInvoiceModalState({ order: orderOrId });
      case 'pack': {
        setBusyId(orderOrId._id);
        try {
          await api.packOrder(orderOrId._id);
          toast.success('Order marked as packed');
          await refreshAndSync(orderOrId._id);
        } catch (err) { toast.error(err.message || 'Could not mark packed'); } 
        finally { setBusyId(null); }
        return;
      }
      case 'ship': return setShipModalOrder(orderOrId);
      case 'deliver': {
        setBusyId(orderOrId._id);
        try {
          await api.confirmOrderDelivery(orderOrId._id);
          toast.success('Order marked delivered');
          await refreshAndSync(orderOrId._id);
        } catch (err) { toast.error(err.message || 'Could not mark delivered'); } 
        finally { setBusyId(null); }
        return;
      }
      case 'sharePricing': {
        setBusyId(orderOrId._id);
        try {
          await api.sharePricing(orderOrId._id);
          toast.success('Pricing shared with client');
          await refreshAndSync(orderOrId._id);
        } catch (err) { toast.error(err.message || 'Could not share pricing'); } 
        finally { setBusyId(null); }
        return;
      }
      case 'cancelOrder': return setReasonModal({ kind: 'cancelOrder', order: orderOrId });
      case 'download': return handleDownload(orderOrId, false);
      case 'print': return handleDownload(orderOrId, true);
      default: return;
    }
  };

  const handleReasonConfirm = async (reason) => {
    const { order } = reasonModal;
    setBusyId(order._id);
    try {
      await api.cancelOrder(order._id, reason, 'admin');
      toast.success('Order cancelled successfully');
      setReasonModal(null);
      setSelectedOrder(null);
      await refreshAndSync(order._id);
    } catch (err) { toast.error(err.message || 'Action failed'); } 
    finally { setBusyId(null); }
  };

  const handleShipConfirm = async (dispatchDetails) => {
    const order = shipModalOrder;
    setBusyId(order._id);
    try {
      await api.shipOrder(order._id, dispatchDetails);
      toast.success('Order marked shipped');
      setShipModalOrder(null);
      await refreshAndSync(order._id);
    } catch (err) { toast.error(err.message || 'Could not mark shipped'); } 
    finally { setBusyId(null); }
  };

  const handleRejectQuote = async (inquiryId, reason) => {
    setBusyId(inquiryId);
    try {
      await api.rejectInquiryQuote(inquiryId, reason);
      toast.success('Inquiry rejected');
      setQuoteInquiry(null);
      fetchInquiries();
    } catch (err) { toast.error(err.message || 'Failed to reject inquiry'); } 
    finally { setBusyId(null); }
  };

  const openInquiry = async (inquiry) => {
    if (inquiry.status === 'Pending') {
      try {
        await api.markInquiryViewed(inquiry._id);
        fetchInquiries();
      } catch (err) { toast.error(err.message || 'Failed to mark viewed'); }
    }
    if (['Pending', 'Viewed'].includes(inquiry.status)) setQuoteInquiry(inquiry);
    else setViewInquiry(inquiry);
  };

  const handleSendQuote = async (payload) => {
    setBusyId(quoteInquiry._id);
    try {
      await api.sendInquiryQuote(quoteInquiry._id, payload);
      toast.success('Quote sent to client');
      setQuoteInquiry(null);
      fetchInquiries();
    } catch (err) { toast.error(err.message || 'Failed to send quote'); } 
    finally { setBusyId(null); }
  };

  return (
    <div className="px-4 py-6 space-y-4 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-slate-900 text-3xl font-black tracking-tight">Orders & Inquiries</h1>
          <p className="text-slate-500 text-base font-medium">Process orders, manage invoices, and quote client inquiries.</p>
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

      {/* TABS ROW */}
      <div className="flex bg-slate-100 rounded-2xl p-1.5 gap-1.5 max-w-sm w-full">
        <button onClick={() => setActiveTab('orders')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-xl text-lg md:text-base font-bold transition-all ${activeTab === 'orders' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
          <ShoppingBag size={18} /> Orders
          {pendingOrdersCount > 0 && <span className="ml-1 bg-red-500 text-white text-sm px-2 py-0.5 rounded-full shadow-sm">{pendingOrdersCount}</span>}
        </button>
        <button onClick={() => setActiveTab('inquiries')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-xl text-lg md:text-base font-bold transition-all ${activeTab === 'inquiries' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
          <ClipboardList size={18} /> Inquiries
          {pendingInquiriesCount > 0 && <span className="ml-1 bg-red-500 text-white text-sm px-2 py-0.5 rounded-full shadow-sm">{pendingInquiriesCount}</span>}
        </button>
      </div>

      {/* TAB RENDER */}
      {activeTab === 'orders' ? (
        <OrdersTab 
          orderGroup={orderGroup} setOrderGroup={setOrderGroup}
          filters={filters} setFilters={setFilters}
          pendingOrdersCount={pendingOrdersCount} ordersLoading={ordersLoading}
          visibleOrders={visibleOrders} setSelectedOrder={setSelectedOrder}
        />
      ) : (
        <InquiriesTab 
          inquiryGroup={inquiryGroup} setInquiryGroup={setInquiryGroup}
          inquirySearch={inquirySearch} setInquirySearch={setInquirySearch}
          inquiriesLoading={inquiriesLoading} visibleInquiries={visibleInquiries}
          openInquiry={openInquiry}
        />
      )}

      {/* ALL MODALS */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} busy={busyId === selectedOrder._id} onClose={() => setSelectedOrder(null)} onAction={handleAction} />
      )}
      
      {shipModalOrder && (
        <ShipModal order={shipModalOrder} busy={busyId === shipModalOrder._id} onClose={() => setShipModalOrder(null)} onConfirm={handleShipConfirm} />
      )}
      
      {reasonModal && (
        <OrderReasonModal title={`Cancel order ${reasonModal.order.orderId}?`} message={['Invoiced', 'Packed'].includes(reasonModal.order.status) ? 'This order has an active invoice. Cancelling will automatically void the invoice and restore the stock to your inventory.' : undefined} actionLabel="Confirm Cancel" busy={busyId === reasonModal.order._id} onClose={() => setReasonModal(null)} onConfirm={handleReasonConfirm} />
      )}
      
      {invoiceModalState && (
        <MakeInvoiceModal
          prefillOrder={invoiceModalState.order || null}
          phoneIn={!!invoiceModalState.phoneIn}
          onClose={() => setInvoiceModalState(null)}
          onOpenOrder={setSelectedOrder}
          onOrderUpdated={(updatedOrder) => {
            if (updatedOrder?.status === 'Cancelled') {
              setSelectedOrder(null); refreshAndSync(null);
            } else { refreshAndSync(updatedOrder._id); }
          }}
        />
      )}

      {viewInquiry && <InquiryReadOnlyModal inquiry={viewInquiry} onClose={() => setViewInquiry(null)} />}
      
      {quoteInquiry && (
        <QuoteBuilderModal inquiry={quoteInquiry} allProducts={allProducts} busy={busyId === quoteInquiry._id} onClose={() => setQuoteInquiry(null)} onSent={handleSendQuote} onReject={handleRejectQuote} />
      )}
    </div>
  );
}