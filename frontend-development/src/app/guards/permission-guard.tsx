import { Navigate, Outlet } from 'react-router';
import type { Role, Permission } from '../permissions';
import { useAuth } from '../store/auth-store';

interface PermissionGuardProps {
  /** Allowed roles. If both `roles` and `permissions` are provided, both must pass. */
  roles?: Role[];
  /** Required permissions (any-of). If both `roles` and `permissions` are provided, both must pass. */
  permissions?: Permission[];
  /** Where to send the user when access is denied. */
  fallback?: string;
}

export const PermissionGuard = ({ roles, permissions, fallback = '/dashboard' }: PermissionGuardProps) => {
  const { role, canAny } = useAuth();

  const roleOk = !roles || (role !== null && roles.includes(role));
  const permissionOk = !permissions || canAny(permissions);

  if (!roleOk || !permissionOk) {
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
};
