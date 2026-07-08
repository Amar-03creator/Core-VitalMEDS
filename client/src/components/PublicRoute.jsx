import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '@/components/ui/spinner';

const PublicRoute = () => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  }

  // If they are already logged in, push them directly to their dashboard
  if (isAuthenticated) {
    return <Navigate to={role === 'admin' ? "/admin-dashboard" : "/client-dashboard"} replace />;
  }

  return <Outlet />;
};

export default PublicRoute;