import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../store/auth-store';

export const GuestGuard = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
