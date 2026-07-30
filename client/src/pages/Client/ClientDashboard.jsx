// src/pages/Client/ClientDashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

// ✨ API Imports
import { useCurrentClient } from '../../hooks/useCurrentClient';
import { api } from '../../services/api';
import { productApi } from '../../services/api/productApi';
import { orderApi } from '../../services/api/orderApi';
import { billingApi } from '../../services/api/billingApi';

// ✨ UI Components
import PromoGrid from '../../features/Client/Dashboard/PromoGrid';
import MonthlySummary from '../../features/Client/Dashboard/MonthlySummary';
import CreditLimitUsage from '../../features/Client/Dashboard/CreditLimitUsage';
import Greeting from '../../features/Client/Dashboard/Greeting';
import PendingApprovalAlert from '../../features/Client/Dashboard/PendingApprovalAlert';
import TopSellingProducts from '../../features/Client/Dashboard/TopSellingProducts';

// ✨ Reused Order/Inquiry Components
import TrackingCard from '../../features/Client/OrdersPage/components/Lists/TrackingCard';
import TrackingTable from '../../features/Client/OrdersPage/components/Lists/TrackingTable';
import ReasonModal from '../../features/Client/OrdersPage/components/Modals/ReasonModal';
import OrderDetailsModal from '../../features/Client/OrdersPage/components/Modals/OrderDetailsModal';
import InquiryModal from '../../features/Client/OrdersPage/components/Modals/InquiryModal';

// ✨ Utils
import {
  getOrderAmount,
  ORDER_STATUS_META,
  getInquiryActions,
  INQUIRY_STATUS_META
} from '../../features/Client/OrdersPage/utils';

const ClientDashboard = () => {
    const navigate = useNavigate();
    const { 
        client, 
        clientId, 
        isApproved, 
        creditLimit, 
        totalOutstanding: outstanding, 
        loading: clientLoading 
    } = useCurrentClient();

    const ownerName = client?.contacts?.[0]?.name || 'Partner';
    const tier = client?.partyTier || 'Silver';
    const creditScore = client?.creditScore || 0;
    
    const partyStartDate = client?.createdAt ? {
        year: new Date(client.createdAt).getFullYear(),
        month: new Date(client.createdAt).getMonth()
    } : { year: new Date().getFullYear(), month: new Date().getMonth() };

    const [products, setProducts] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [summaryData, setSummaryData] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    // Modal States
    const [detailOrder, setDetailOrder] = useState(null);
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [reasonModal, setReasonModal] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const fetchDashboardData = useCallback(async () => {
        if (!clientId || !isApproved) {
            setIsLoading(false);
            return;
        }

        try {
            const productsRes = await productApi.getProductsWithBatches().catch(() => ({ data: [] }));
            setProducts(productsRes.data || []);

            const [ordersRes, inquiriesRes, billingRes] = await Promise.all([
                orderApi.getOrders({ clientId }).catch(() => ({ data: [] })),
                orderApi.getInquiries({ clientId }).catch(() => ({ data: [] })),
                billingApi.getClientMonthlySummary(clientId).catch(() => ({ data: {} }))
            ]);

            const allOrders = ordersRes.data || [];
            const allInquiries = inquiriesRes.data || [];

            // ✨ Standardize Orders
            const mappedOrders = allOrders.map(o => {
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
                    raw: { ...o, type: 'order' } // Inject type to distinguish onClick
                };
            });

            // ✨ Standardize Inquiries
            const mappedInquiries = allInquiries.map(i => {
                const meta = INQUIRY_STATUS_META[i.status] || INQUIRY_STATUS_META.Pending;
                const actions = getInquiryActions(i);
                const amount = i.discountedTotalPrice || i.totalPrice || 0;
                return {
                    _id: i._id,
                    recordId: i.inquiryId || i._id.slice(-6).toUpperCase(),
                    date: i.createdAt,
                    subtitle: 'Inquiry',
                    itemCount: (i.items || []).length,
                    amount,
                    isEst: true,
                    billPreference: i.billPreference,
                    meta,
                    showEyeIcon: actions.canSeeQuote || actions.canSeeReadOnlyQuote,
                    raw: { ...i, type: 'inquiry' } // Inject type to distinguish onClick
                };
            });

            // Merge, Sort by Date, Slice Top 5
            const combined = [...mappedOrders, ...mappedInquiries]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);

            setRecentActivity(combined);
            setSummaryData(billingRes.data || {});

        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [isApproved, clientId]);

    useEffect(() => {
        if (!clientLoading) fetchDashboardData();
    }, [clientLoading, fetchDashboardData]);

    const handleRecordClick = (raw) => {
        if (raw.type === 'order') setDetailOrder(raw);
        else setSelectedInquiry(raw);
    };

    /* ── Action Handlers ────────────────────────────────────────────────── */
    const handleCancelOrder = async (reason) => {
        const order = reasonModal.target;
        setBusyId(`cancel_${order._id}`);
        try {
            await api.cancelOrder(order._id, reason, 'client');
            toast.success(`Order ${order.orderId} cancelled.`);
            setReasonModal(null);
            setDetailOrder(null);
            fetchDashboardData();
        } catch (err) { toast.error(err.message || 'Could not cancel order.'); } finally { setBusyId(null); }
    };

    const handleConfirmDelivery = async (order) => {
        setBusyId(`deliver_${order._id}`);
        try {
            await api.confirmOrderDelivery(order._id);
            toast.success(`Delivery confirmed for ${order.orderId}.`);
            setDetailOrder(null);
            fetchDashboardData();
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
            toast.success(`Inquiry withdrawn.`);
            setReasonModal(null);
            setSelectedInquiry(null);
            fetchDashboardData();
        } catch (err) { toast.error(err.message || 'Could not withdraw inquiry.'); } finally { setBusyId(null); }
    };

    const handleConvert = async (inquiry, note) => {
        setBusyId(`convert_${inquiry._id}`);
        try {
            const res = await api.convertInquiryToOrder(inquiry._id, note);
            toast.success(`Converted to order ${res.data?.orderId || ''}.`);
            setSelectedInquiry(null);
            fetchDashboardData();
        } catch (err) { toast.error(err.message || 'Could not convert this inquiry.'); } finally { setBusyId(null); }
    };

    const handleRejectQuote = async (inquiry, reason) => {
        setBusyId(`reject_${inquiry._id}`);
        try {
            await api.rejectInquiryQuote(inquiry._id, reason);
            toast.success('Quote rejected.');
            setSelectedInquiry(null);
            fetchDashboardData();
        } catch (err) { toast.error(err.message || 'Could not reject quote.'); } finally { setBusyId(null); }
    };

    if (clientLoading || isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
    }

    return (
        <div className="px-4 py-5 space-y-6 max-w-2xl mx-auto">
            <Greeting owner={ownerName} tier={tier} isApproved={isApproved} />

            {!isApproved && <PendingApprovalAlert />}

            {isApproved && (
                <CreditLimitUsage
                    outstanding={outstanding}
                    creditLimit={creditLimit}
                    creditScore={creditScore}
                />
            )}

            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-slate-800 font-bold text-xl">Offers & Info</h2>
                    <span className="text-slate-400 text-sm">Tap any tile</span>
                </div>
                <PromoGrid />
            </div>

            {isApproved && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-slate-800 font-bold text-xl">Monthly Summary</h2>
                        <Link to="/client-dashboard/billing" className="text-emerald-600 text-base font-semibold flex items-center gap-1">
                            Full Ledger <ArrowRight size={13} />
                        </Link>
                    </div>
                    <MonthlySummary
                        summaryData={summaryData}
                        startDate={partyStartDate}
                        currentDate={new Date()}
                        onMonthChange={({ year, month }) => console.log(`Selected ${year}-${month + 1}`)}
                    />
                </div>
            )}

            <TopSellingProducts
                products={products}
                isClientApproved={isApproved}
                onAddToCart={(item) => console.log('Add to cart', item)}
                onAddToInquiry={(item) => console.log('Add to inquiry', item)}
            />

            {/* ✨ Reused Tracking UI for Recent Activity */}
            {isApproved && recentActivity.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3 mt-6">
                        <h2 className="text-slate-800 font-bold text-xl">Recent Activity</h2>
                        <Link to="/client-dashboard/orders" className="text-emerald-600 text-base font-semibold flex items-center gap-1">
                            View all <ArrowRight size={13} />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recentActivity.map((record) => (
                            <TrackingCard key={record._id} record={record} onClick={() => handleRecordClick(record.raw)} />
                        ))}
                        {recentActivity.length > 0 && (
                            <TrackingTable records={recentActivity} onClick={handleRecordClick} />
                        )}
                    </div>
                </div>
            )}

            <div className="h-2" />

            {/* ✨ MODALS */}
            {reasonModal && (
                <ReasonModal 
                    title={reasonModal.kind === 'order' ? `Cancel order ${reasonModal.target.orderId}?` : `Withdraw inquiry ${reasonModal.target.inquiryId || 'this inquiry'}?`} 
                    message={reasonModal.kind === 'inquiry' ? 'Admin hasn’t reviewed this yet, so it can be withdrawn cleanly.' : undefined} 
                    actionLabel={reasonModal.kind === 'order' ? 'Confirm Cancel' : 'Confirm Withdraw'} 
                    danger 
                    hideReason={reasonModal.kind === 'inquiry'} 
                    busy={busyId === `cancel_${reasonModal.target._id}` || busyId === `delete_${reasonModal.target._id}`} 
                    onClose={() => setReasonModal(null)} 
                    onConfirm={reasonModal.kind === 'order' ? handleCancelOrder : handleDeleteInquiry} 
                />
            )}

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
                        navigate('/client-dashboard/orders', { state: { initialTab: 'orders' } }); 
                        toast.info("Please edit this order from the Orders page.");
                    }}
                />
            )}
            
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
        </div>
    );
};

export default ClientDashboard;