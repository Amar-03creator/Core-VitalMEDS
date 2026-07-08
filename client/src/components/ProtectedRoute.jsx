import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '@/components/ui/spinner';

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  }

  // If not logged in, send them to login page and remember where they tried to go
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If they are logged in but don't have the right role (e.g., Client trying to access Admin)
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={role === 'admin' ? "/admin-dashboard" : "/client-dashboard"} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;