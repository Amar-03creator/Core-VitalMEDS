import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ClientGuard = () => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  // THE JAIL: If they are a client, but haven't uploaded documents
  if (role === 'client' && user && user.documentsUploaded === false) {
    // If they try to go anywhere EXCEPT the profile page, bounce them back!
    if (!location.pathname.includes('/profile')) {
      return <Navigate to="/client-dashboard/profile?tab=documents" replace />;
    }
  }

  // If they are safe/verified, render the requested page
  return <Outlet />;
};

export default ClientGuard;