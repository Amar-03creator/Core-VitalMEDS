// src/pages/Client/ClientOrdersPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { ShoppingBag, ClipboardList, Package, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../services/api';
import { useCurrentClient } from '../../hooks/useCurrentClient';

import {
  ORDER_PENDING_STATUSES, ORDER_COMPLETED_STATUSES,
  INQUIRY_PENDING_STATUSES, INQUIRY_COMPLETED_STATUSES,
  EMPTY_ORDER_FILTERS, EMPTY_INQUIRY_FILTERS, resolveDateRange,
  getOrderAmount, ORDER_STATUS_META, getInquiryActions, INQUIRY_STATUS_META, productLabel
} from '../../features/Client/OrdersPage/utils';

import NoticeBanner from '../../features/Client/OrdersPage/components/UI/NoticeBanner';
import FilterBar from '../../features/Client/OrdersPage/components/UI/FilterBar';
import TrackingCard from '../../features/Client/OrdersPage/components/Lists/TrackingCard';
import TrackingTable from '../../features/Client/OrdersPage/components/Lists/TrackingTable';
import ReasonModal from '../../features/Client/OrdersPage/components/Modals/ReasonModal';
import OrderDetailsModal from '../../features/Client/OrdersPage/components/Modals/OrderDetailsModal';

// ✨ SINGLE SMART MODAL IMPORT
import InquiryModal from '../../features/Client/OrdersPage/components/Modals/InquiryModal';

import EditOrderModal from '../../features/Client/OrdersPage/components/Modals/EditOrderModal';
import ConfirmEditModal from '../../features/Client/OrdersPage/components/Modals/ConfirmEditModal';

export default function ClientOrdersPage() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  const { isApproved, clientId } = useCurrentClient();

  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('ordersActiveTab') || location.state?.initialTab || 'inquiries');
  const [orderSubTab, setOrderSubTab] = useState(() => sessionStorage.getItem('ordersSubTab') || 'pending');
  const [inquirySubTab, setInquirySubTab] = useState(() => sessionStorage.getItem('inquiriesSubTab') || 'pending');

  const [detailOrder, setDetailOrder] = useState(null);

  // ✨ SINGLE INQUIRY STATE
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  const [orders, setOrders] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  const [busyId, setBusyId] = useState(null);

  const [orderFilters, setOrderFilters] = useState(EMPTY_ORDER_FILTERS);
  const [inquiryFilters, setInquiryFilters] = useState(EMPTY_INQUIRY_FILTERS);
  const [debouncedOrderFilters, setDebouncedOrderFilters] = useState(EMPTY_ORDER_FILTERS);

  const [reasonModal, setReasonModal] = useState(null);

  const [editOrder, setEditOrder] = useState(null);
  const [confirmEditOrder, setConfirmEditOrder] = useState(null);

  useEffect(() => { sessionStorage.setItem('ordersActiveTab', activeTab); }, [activeTab]);
  useEffect(() => { sessionStorage.setItem('ordersSubTab', orderSubTab); }, [orderSubTab]);
  useEffect(() => { sessionStorage.setItem('inquiriesSubTab', inquirySubTab); }, [inquirySubTab]);

  useEffect(() => {
    if (location.state?.initialTab) {
      setActiveTab(location.state.initialTab);
      sessionStorage.setItem('ordersActiveTab', location.state.initialTab);
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.initialTab]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedOrderFilters(orderFilters), 400);
    return () => clearTimeout(t);
  }, [orderFilters]);

  const fetchOrders = useCallback(async () => {
    if (!clientId) return;
    try {
      const { dateFrom, dateTo } = resolveDateRange(debouncedOrderFilters.dateRange);
      const params = {
        clientId,
        billType: debouncedOrderFilters.billType !== 'All' ? debouncedOrderFilters.billType : undefined,
        search: debouncedOrderFilters.search || undefined,
        dateFrom, dateTo,
      };
      const res = await api.getOrders(params);
      setOrders(res.data || []);
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to load orders.' });
    }
  }, [clientId, debouncedOrderFilters]);

  const fetchInquiries = useCallback(async () => {
    if (!clientId) return;
    try {
      const { dateFrom, dateTo } = resolveDateRange(inquiryFilters.dateRange);
      const params = {
        clientId,
        search: inquiryFilters.search || undefined,
        dateFrom, dateTo
      };
      const res = await api.getInquiries(params);
      setInquiries(res.data || []);
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to load inquiries.' });
    }
  }, [clientId, inquiryFilters]);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    Promise.all([fetchOrders(), fetchInquiries()]).finally(() => setLoading(false));
  }, [clientId, fetchOrders, fetchInquiries]);

  const displayedOrders = orders
    .filter(order => orderSubTab === 'pending' ? ORDER_PENDING_STATUSES.includes(order.status) : ORDER_COMPLETED_STATUSES.includes(order.status))
    .map(o => {
      const meta = ORDER_STATUS_META[o.status] || ORDER_STATUS_META.Placed;
      const { amount, isFinal } = getOrderAmount(o);
      return {
        _id: o._id,
        recordId: o.orderId,
        date: o.createdAt,
        subtitle: o.inquiryId ? 'Made from inquiry' : 'Direct Order',
        itemCount: (o.items || []).length,
        amount,
        isEst: !isFinal,
        billPreference: o.billPreference,
        meta,
        showEyeIcon: false,
        raw: o
      };
    });

  const displayedInquiries = inquiries
    .filter(inquiry => inquirySubTab === 'pending' ? INQUIRY_PENDING_STATUSES.includes(inquiry.status) : INQUIRY_COMPLETED_STATUSES.includes(inquiry.status))
    .map(i => {
      const meta = INQUIRY_STATUS_META[i.status] || INQUIRY_STATUS_META.Pending;
      const actions = getInquiryActions(i);
      const amount = i.discountedTotalPrice || i.totalPrice || 0;

      return {
        _id: i._id,
        recordId: i.inquiryId || i._id.slice(-6).toUpperCase(),
        date: i.createdAt,
        subtitle: null,
        itemCount: (i.items || []).length,
        amount,
        isEst: true,
        billPreference: i.billPreference,
        meta,
        showEyeIcon: actions.canSeeQuote || actions.canSeeReadOnlyQuote,
        raw: i
      };
    });

  const pendingOrdersCount = orders.filter(o => ORDER_PENDING_STATUSES.includes(o.status)).length;
  const pendingInquiriesCount = inquiries.filter(i => INQUIRY_PENDING_STATUSES.includes(i.status)).length;

  /* ── Actions ────────────────────────────────────────────────── */
  const handleCancelOrder = async (reason) => {
    const order = reasonModal.target;
    setBusyId(`cancel_${order._id}`);
    try {
      await api.cancelOrder(order._id, reason, 'client');
      toast.success(`Order ${order.orderId} cancelled.`);
      setReasonModal(null);
      setDetailOrder(null);
      fetchOrders();
    } catch (err) { toast.error(err.message || 'Could not cancel order.'); } finally { setBusyId(null); }
  };

  const handleConfirmDelivery = async (order) => {
    setBusyId(`deliver_${order._id}`);
    try {
      await api.confirmOrderDelivery(order._id);
      toast.success(`Delivery confirmed for ${order.orderId}.`);
      setDetailOrder(null);
      fetchOrders();
    } catch (err) { toast.error(err.message || 'Could not confirm delivery.'); } finally { setBusyId(null); }
  };

  const handleDownloadInvoice = async (order) => {
    setBusyId(`download_${order._id}`);
    try {
      const blob = await api.downloadOrderInvoice(order._id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${order.invoiceNumber || order.orderId}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (err) { toast.error('Failed to download invoice.'); } finally { setBusyId(null); }
  };

  const handlePrintInvoice = async (order) => {
    setBusyId(`print_${order._id}`);
    try {
      const blob = await api.downloadOrderInvoice(order._id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) { toast.error('Failed to view invoice.'); } finally { setBusyId(null); }
  };

  const handleDeleteInquiry = async () => {
    const inquiry = reasonModal.target;
    setBusyId(`delete_${inquiry._id}`);
    try {
      await api.deleteInquiry(inquiry._id);
      toast.success(`Inquiry ${inquiry.inquiryId} withdrawn.`);
      setReasonModal(null);
      setSelectedInquiry(null); // ✨ UPDATED
      fetchInquiries();
    } catch (err) { toast.error(err.message || 'Could not withdraw inquiry.'); } finally { setBusyId(null); }
  };

  const handleConvert = async (inquiry, note) => {
    setBusyId(`convert_${inquiry._id}`);
    try {
      const res = await api.convertInquiryToOrder(inquiry._id, note);
      toast.success(`Converted to order ${res.data?.orderId || ''}.`);
      setSelectedInquiry(null); // ✨ UPDATED
      fetchInquiries();
      fetchOrders();
    } catch (err) { toast.error(err.message || 'Could not convert this inquiry.'); } finally { setBusyId(null); }
  };

  const handleRejectQuote = async (inquiry, reason) => {
    setBusyId(`reject_${inquiry._id}`);
    try {
      await api.rejectInquiryQuote(inquiry._id, reason);
      toast.success('Quote rejected.');
      setSelectedInquiry(null); // ✨ UPDATED
      fetchInquiries();
    } catch (err) { toast.error(err.message || 'Could not reject quote.'); } finally { setBusyId(null); }
  };

  // ✨ FIX: Much simpler handler. Modal figures out the rest!
  const handleInquiryClick = (rawInquiry) => {
    setSelectedInquiry(rawInquiry);
  };

  if (!clientId) {
    return (
      <div className="px-4 py-10 text-center text-slate-400 max-w-2xl mx-auto mt-6">
        <AlertTriangle className="mx-auto mb-3 text-slate-300" size={40} />
        <p className="text-lg font-bold text-slate-600">Client profile not found.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-slate-900 text-3xl font-black tracking-tight">History & Tracker</h1>
        <p className="text-slate-500 text-base font-medium">Manage your inquiries, quotes, and active orders.</p>
      </div>

      <NoticeBanner notice={notice} onDismiss={() => setNotice(null)} />

      <div className="flex bg-slate-100 rounded-xl p-1 gap-1 max-w-md border border-slate-200">
        <button onClick={() => setActiveTab('inquiries')}
          className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-base font-bold transition-all ${activeTab === 'inquiries' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
          <ClipboardList size={18} /> My Inquiries
          {pendingInquiriesCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm border-[1.5px] border-white">
              {pendingInquiriesCount}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            if (!isApproved) toast.info('Please wait till getting approved to make or see orders.', { position: 'top-center' });
            else setActiveTab('orders');
          }}
          className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-base font-bold transition-all ${!isApproved ? 'opacity-50 text-slate-500' : activeTab === 'orders' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
          <ShoppingBag size={18} /> My Orders
          {pendingOrdersCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm border-[1.5px] border-white">
              {pendingOrdersCount}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 size={24} className="animate-spin text-slate-400" /> <span className="text-lg font-bold">Loading records...</span>
        </div>
      ) : activeTab === 'orders' ? (
        <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex w-full border-b border-slate-200 mb-4">
            <button
              onClick={() => setOrderSubTab('pending')}
              className={`relative flex-1 text-center py-2.5 text-base font-bold border-b-2 transition-all -mb-[1px] ${orderSubTab === 'pending' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Pending
              {pendingOrdersCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm border-[1.5px] border-white">
                  {pendingOrdersCount}
                </span>
              )}
            </button>
            <button onClick={() => setOrderSubTab('completed')} className={`flex-1 text-center py-2.5 text-base font-bold border-b-2 transition-all -mb-[1px] ${orderSubTab === 'completed' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              Completed
            </button>
          </div>

          {orderSubTab === 'completed' && <FilterBar filters={orderFilters} setFilters={setOrderFilters} showBillType={true} showDateRange={true} />}

          <div className="space-y-3">
            {displayedOrders.length === 0 && (
              <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <Package className="mx-auto mb-2 text-slate-300" size={36} />
                <p className="text-lg font-bold text-slate-500">No {orderSubTab} orders found.</p>
              </div>
            )}

            {displayedOrders.map((record) => (
              <TrackingCard key={record._id} record={record} onClick={() => setDetailOrder(record.raw)} />
            ))}
            {displayedOrders.length > 0 && (
              <TrackingTable records={displayedOrders} onClick={(raw) => setDetailOrder(raw)} />
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex w-full border-b border-slate-200 mb-4">
            <button
              onClick={() => setInquirySubTab('pending')}
              className={`relative flex-1 text-center py-2.5 text-base font-bold border-b-2 transition-all -mb-[1px] ${inquirySubTab === 'pending' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Pending
              {pendingInquiriesCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm border-[1.5px] border-white">
                  {pendingInquiriesCount}
                </span>
              )}
            </button>
            <button onClick={() => setInquirySubTab('completed')} className={`flex-1 text-center py-2.5 text-base font-bold border-b-2 transition-all -mb-[1px] ${inquirySubTab === 'completed' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              Completed
            </button>
          </div>

          {inquirySubTab === 'completed' && <FilterBar filters={inquiryFilters} setFilters={setInquiryFilters} showBillType={false} showDateRange={false} />}

          <div className="space-y-3">
            {displayedInquiries.length === 0 && (
              <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <ClipboardList className="mx-auto mb-2 text-slate-300" size={36} />
                <p className="text-lg font-bold text-slate-500">No {inquirySubTab} inquiries found.</p>
              </div>
            )}

            {displayedInquiries.map((record) => (
              <TrackingCard key={record._id} record={record} onClick={() => handleInquiryClick(record.raw)} />
            ))}
            {displayedInquiries.length > 0 && (
              <TrackingTable records={displayedInquiries} onClick={handleInquiryClick} />
            )}
          </div>
        </div>
      )}

      {reasonModal && <ReasonModal title={reasonModal.kind === 'order' ? `Cancel order ${reasonModal.target.orderId}?` : `Withdraw inquiry ${reasonModal.target.inquiryId}?`} message={reasonModal.kind === 'inquiry' ? 'Admin hasn’t reviewed this yet, so it can be withdrawn cleanly.' : undefined} actionLabel={reasonModal.kind === 'order' ? 'Confirm Cancel' : 'Confirm Withdraw'} danger hideReason={reasonModal.kind === 'inquiry'} busy={busyId === `cancel_${reasonModal.target._id}` || busyId === `delete_${reasonModal.target._id}`} onClose={() => setReasonModal(null)} onConfirm={reasonModal.kind === 'order' ? handleCancelOrder : handleDeleteInquiry} />}

      {detailOrder && (
        <OrderDetailsModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          busyId={busyId}
          onCancel={(o) => setReasonModal({ kind: 'order', target: o })}
          onConfirmDelivery={handleConfirmDelivery}
          onDownloadInvoice={handleDownloadInvoice}
          onPrintInvoice={handlePrintInvoice}
          onEdit={(o) => {
            setDetailOrder(null);
            if (o.status === 'Editing') {
              setEditOrder(o);
            } else {
              setConfirmEditOrder(o);
            }
          }}
        />
      )}

      {/* ✨ REPLACED: Single Smart Inquiry Modal */}
      {selectedInquiry && (
        <InquiryModal
          inquiry={selectedInquiry}
          busyId={busyId}
          onClose={() => setSelectedInquiry(null)}
          onDelete={(inq) => setReasonModal({ kind: 'inquiry', target: inq })}
          onConvert={handleConvert}
          onReject={handleRejectQuote}
        />
      )}

      {confirmEditOrder && (
        <ConfirmEditModal
          onClose={() => setConfirmEditOrder(null)}
          onConfirm={() => {
            setEditOrder(confirmEditOrder);
            setConfirmEditOrder(null);
          }}
        />
      )}

      {editOrder && (
        <EditOrderModal
          order={editOrder}
          onClose={() => setEditOrder(null)}
          onSuccess={() => { setEditOrder(null); fetchOrders(); }}
        />
      )}
    </div>
  );
}