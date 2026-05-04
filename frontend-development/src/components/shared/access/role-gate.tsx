import type { ReactNode } from 'react';
import type { Role, Permission } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';

interface RoleGateProps {
  /** Render children only when current role is in this list. */
  roles?: Role[];
  /** Render children only when current role has any of these permissions. */
  permissions?: Permission[];
  children: ReactNode;
  /** Optional fallback when access is denied. Defaults to nothing rendered. */
  fallback?: ReactNode;
}

/**
 * Render-gates UI sections by role or permission. Use this — not CSS — to mask
 * sensitive sections (e.g. financials for PM/Consultant). Children are not
 * rendered to the DOM at all when access is denied.
 */
export const RoleGate = ({ roles, permissions, children, fallback = null }: RoleGateProps) => {
  const { role, canAny } = useAuth();

  const roleOk = !roles || (role !== null && roles.includes(role));
  const permissionOk = !permissions || canAny(permissions);

  if (!roleOk || !permissionOk) return <>{fallback}</>;

  return <>{children}</>;
};
