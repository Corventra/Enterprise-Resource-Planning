import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../store/auth-store';

export const AuthGuard = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};
