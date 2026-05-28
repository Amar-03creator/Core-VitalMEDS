import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';     
import RegisterPage from './pages/RegistrationPage';  

// Client
import ClientLayout from './pages/Client/ClientLayout';
import ClientDashboard from './pages/Client/ClientDashboard';
import ClientProductsPage from './pages/Client/ClientProductsPage';
import ClientInquiryPage from './pages/Client/ClientInquiryPage';
import ClientOrdersPage from './pages/Client/ClientOrdersPage';
import ClientBillingPage from './pages/Client/ClientBillingPage';
import ClientSupportPage from './pages/Client/ClientSupportPage';
import ClientNotificationsPage from './pages/Client/ClientNotificationsPage';
import ClientQuickReorderPage from './pages/Client/ClientQuickReorderPage';
import ClientCart from './pages/Client/ClientCart';

// Admin
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import CustomersPage from './pages/Admin/CustomersPage';
import InquiriesPage from './pages/Admin/InquiriesPage';
import OrdersPage from './pages/Admin/OrdersPage';
import InventoryPage from './pages/Admin/InventoryPage';
import ProductsPage from './pages/Admin/ProductsPage';
import CompaniesPage from './pages/Admin/CompaniesPage';
import BillingPage from './pages/Admin/BillingPage';
import AnalyticsPage from './pages/Admin/AnalyticsPage';
import SupportPage from './pages/Admin/SupportPage';
import NotificationsPage from './pages/Admin/NotificationsPage';
import ExpiryOffersPage from './pages/Admin/ExpiryOffersPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />      
        <Route path="/register" element={<RegisterPage />} /> 

        {/* ── CLIENT ROUTES (require auth – later) ── */}
        <Route path="/client-dashboard" element={<ClientLayout />}>
          <Route index element={<ClientDashboard />} />
          <Route path="products" element={<ClientProductsPage />} />
          <Route path="inquiry" element={<ClientInquiryPage />} />
          <Route path="orders" element={<ClientOrdersPage />} />
          <Route path="billing" element={<ClientBillingPage />} />
          <Route path="support" element={<ClientSupportPage />} />
          <Route path="notifications" element={<ClientNotificationsPage />} />
          <Route path="quick-reorder" element={<ClientQuickReorderPage />} />
          <Route path="cart" element={<ClientCart />} />
        </Route>

        {/* ── ADMIN ROUTES ── */}
        <Route path="/admin-dashboard" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="inquiries" element={<InquiriesPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="expiry-offers" element={<ExpiryOffersPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;