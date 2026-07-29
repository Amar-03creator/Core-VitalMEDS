// src/pages/Client/ClientDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

// ✨ API Imports
import { useCurrentClient } from '../../hooks/useCurrentClient';
import { productApi } from '../../services/api/productApi';
import { orderApi } from '../../services/api/orderApi';
import { billingApi } from '../../services/api/billingApi';

// Components
import PromoGrid from '../../features/Client/Dashboard/PromoGrid';
import MonthlySummary from '../../features/Client/Dashboard/MonthlySummary';
import CreditLimitUsage from '../../features/Client/Dashboard/CreditLimitUsage';
import Greeting from '../../features/Client/Dashboard/Greeting';
import PendingApprovalAlert from '../../features/Client/Dashboard/PendingApprovalAlert';
import TopProducts from '../../features/Client/Dashboard/TopProducts';
import RecentOrders from '../../features/Client/Dashboard/RecentOrders';

const ClientDashboard = () => {
    // ✨ FIX 1: Pulling LIVE financial data, not the stale login token!
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
    const [recentOrders, setRecentOrders] = useState([]);
    const [summaryData, setSummaryData] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (clientLoading) return;

        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                // ✨ FIX 2: Hitting the Virtual Stock Engine for Top Products
                const productsRes = await productApi.getProductsWithBatches().catch(() => ({ data: [] }));
                setProducts(productsRes.data || []);

                if (isApproved && clientId) {
                    const [ordersRes, billingRes] = await Promise.all([
                        // Safely grab recent orders
                        orderApi.getOrders({ clientId }).catch(() => ({ data: [] })),
                        
                        // ✨ FIX 3: Hitting the correct Monthly Summary route
                        billingApi.getClientMonthlySummary(clientId).catch(() => ({ data: {} }))
                    ]);

                    const allOrders = ordersRes.data || [];
                    setRecentOrders(allOrders.slice(0, 5));
                    
                    setSummaryData(billingRes.data || {});
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [isApproved, clientId, clientLoading]);

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

            <TopProducts
                products={products}
                isClientApproved={isApproved}
                onAddToCart={(item) => console.log('Add to cart', item)}
                onAddToInquiry={(item) => console.log('Add to inquiry', item)}
            />

            {isApproved && <RecentOrders orders={recentOrders} />}

            <div className="h-2" />
        </div>
    );
};

export default ClientDashboard;