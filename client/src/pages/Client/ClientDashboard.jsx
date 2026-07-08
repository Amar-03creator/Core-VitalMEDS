// import { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { ArrowRight } from 'lucide-react';
// import { useAuth } from '../../context/AuthContext'; 
// import { Spinner } from '@/components/ui/spinner';

// import PromoGrid from '../../features/Client/Dashboard/PromoGrid';
// import MonthlySummary from '../../features/Client/Dashboard/MonthlySummary';
// import CreditLimitUsage from '../../features/Client/Dashboard/CreditLimitUsage';
// import Greeting from '../../features/Client/Dashboard/Greeting';
// import PendingApprovalAlert from '../../features/Client/Dashboard/PendingApprovalAlert';      
// import TopProducts from '../../features/Client/Dashboard/TopProducts';
// import RecentOrders from '../../features/Client/Dashboard/RecentOrders';

// const ClientDashboard = () => {
//     // PULL REAL USER & AXIOS FROM CONTEXT
//     const { user, authAxios } = useAuth();
//     const isApproved = user?.status === 'Active';

//     // Safe fallbacks for user profile
//     const ownerName = user?.contacts?.[0]?.name || 'Partner';
//     const tier = user?.tier || 'Silver';
//     const outstanding = user?.outstanding || 0;
//     const creditLimit = user?.creditLimit || 0;
//     const creditScore = user?.creditScore || 0;
//     const partyStartDate = user?.createdAt ? { 
//         year: new Date(user.createdAt).getFullYear(), 
//         month: new Date(user.createdAt).getMonth() 
//     } : { year: new Date().getFullYear(), month: new Date().getMonth() };

//     // STATE FOR REAL DATABASE DATA
//     const [products, setProducts] = useState([]);
//     const [recentOrders, setRecentOrders] = useState([]);
//     const [summaryData, setSummaryData] = useState({});
//     const [isLoading, setIsLoading] = useState(true);

//     // FETCH DATA FROM NODE.JS BACKEND
//     useEffect(() => {
//         const fetchDashboardData = async () => {
//             try {
//                 // Fetch all active products for the catalog (Visible to everyone)
//                 const productsRes = await authAxios.get('/api/products');
//                 setProducts(productsRes.data.products || productsRes.data || []);

//                 // Only fetch financial data if the client is Approved
//                 if (isApproved) {
//                     // Fail gracefully if routes don't exist yet by mapping over errors
//                     const [ordersRes, billingRes] = await Promise.all([
//                         authAxios.get('/api/orders/recent').catch(() => ({ data: [] })),
//                         authAxios.get('/api/billing/summary').catch(() => ({ data: {} }))
//                     ]);
                    
//                     setRecentOrders(ordersRes.data.orders || ordersRes.data || []);
//                     setSummaryData(billingRes.data.summary || billingRes.data || {});
//                 }
//             } catch (error) {
//                 console.error("Failed to fetch dashboard data:", error);
//             } finally {
//                 setIsLoading(false);
//             }
//         };

//         fetchDashboardData();
//     }, [isApproved, authAxios]);

//     if (isLoading) {
//         return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
//     }

//     return (
//         <div className="px-4 py-5 space-y-6 max-w-2xl mx-auto">
//             <Greeting owner={ownerName} tier={tier} isApproved={isApproved}/>

//             {!isApproved && <PendingApprovalAlert />}

//             {isApproved && (
//                 <CreditLimitUsage
//                     outstanding={outstanding}
//                     creditLimit={creditLimit}
//                     creditScore={creditScore}
//                 />
//             )}

//             <div>
//                 <div className="flex items-center justify-between mb-3">
//                     <h2 className="text-slate-800 font-bold text-xl">Offers & Info</h2>
//                     <span className="text-slate-400 text-sm">Tap any tile</span>
//                 </div>
//                 <PromoGrid />
//             </div>

//             {isApproved && (
//                 <div>
//                     <div className="flex items-center justify-between mb-3">
//                         <h2 className="text-slate-800 font-bold text-xl">Monthly Summary</h2>
//                         <Link to="/client-dashboard/billing" className="text-emerald-600 text-md font-semibold flex items-center gap-1">
//                             Full Ledger <ArrowRight size={13} />
//                         </Link>
//                     </div>
//                     <MonthlySummary
//                         summaryData={summaryData}
//                         startDate={partyStartDate}
//                         currentDate={new Date()}
//                         onMonthChange={({ year, month }) => console.log(`Selected ${year}-${month + 1}`)}
//                     />
//                 </div>
//             )}

//             <TopProducts
//                 products={products}
//                 isClientApproved={isApproved} 
//                 onAddToCart={(item) => console.log('Add to cart', item)}
//                 onAddToInquiry={(item) => console.log('Add to inquiry', item)}
//             />

//             {isApproved && <RecentOrders orders={recentOrders} />}

//             <div className="h-2" />
//         </div>
//     );
// };

// export default ClientDashboard;

// pages/Client/ClientDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '@/components/ui/spinner';

import PromoGrid from '../../features/Client/Dashboard/PromoGrid';
import MonthlySummary from '../../features/Client/Dashboard/MonthlySummary';
import CreditLimitUsage from '../../features/Client/Dashboard/CreditLimitUsage';
import Greeting from '../../features/Client/Dashboard/Greeting';
import PendingApprovalAlert from '../../features/Client/Dashboard/PendingApprovalAlert';
import TopProducts from '../../features/Client/Dashboard/TopProducts';
import RecentOrders from '../../features/Client/Dashboard/RecentOrders';

const ClientDashboard = () => {
    const { user, authAxios } = useAuth();
    const isApproved = user?.status === 'Active';

    const ownerName = user?.contacts?.[0]?.name || 'Partner';
    const tier = user?.tier || 'Silver';
    const outstanding = user?.outstanding || 0;
    const creditLimit = user?.creditLimit || 0;
    const creditScore = user?.creditScore || 0;
    const partyStartDate = user?.createdAt ? {
        year: new Date(user.createdAt).getFullYear(),
        month: new Date(user.createdAt).getMonth()
    } : { year: new Date().getFullYear(), month: new Date().getMonth() };

    const [products, setProducts] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [summaryData, setSummaryData] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const productsRes = await authAxios.get('/api/products');
                setProducts(productsRes.data.products || productsRes.data || []);

                if (isApproved) {
                    const [ordersRes, billingRes] = await Promise.all([
                        authAxios.get('/api/orders/recent').catch(() => ({ data: [] })),
                        authAxios.get('/api/billing/summary').catch(() => ({ data: {} }))
                    ]);

                    setRecentOrders(ordersRes.data.orders || ordersRes.data || []);
                    setSummaryData(billingRes.data.summary || billingRes.data || {});
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [isApproved, authAxios]);

    if (isLoading) {
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