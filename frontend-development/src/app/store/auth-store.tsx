import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authService } from '../../features/auth/services/auth.service';
import type { DummyUser, UserDepartment } from '../../features/auth/types/auth.types';
import type { Role, Permission } from '../permissions';
import { hasPermission, hasAnyPermission } from '../permissions';

interface AuthContextValue {
  user: DummyUser | null;
  role: Role | null;
  departments: UserDepartment[];
  isAuthenticated: boolean;
  login: (user: DummyUser) => void;
  logout: () => void;
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  /** True saat helang user dari token (POST-login refresh atau initial hydrate). */
  isHydrating: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<DummyUser | null>(() => authService.getStoredAuthUser());
  const [isHydrating, setIsHydrating] = useState<boolean>(() => authService.getStoredAuthUser() !== null);

  // Setelah mount, refresh dari backend kalau ada token. Kalau token invalid,
  // user di-clear. Kalau token valid, user di-update dengan data terbaru.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const refreshed = await authService.fetchCurrentUser();
      if (cancelled) return;
      if (refreshed) {
        authService.setStoredAuthUser(refreshed);
        setUser(refreshed);
      } else if (authService.getStoredAuthUser()) {
        // Ada user di localStorage tapi token tidak valid → clear
        authService.clearStoredAuthUser();
        setUser(null);
      }
      setIsHydrating(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = (next: DummyUser) => {
    authService.setStoredAuthUser(next);
    setUser(next);
  };

  const logout = () => {
    void authService.logout();
    authService.clearStoredAuthUser();
    setUser(null);
  };

  const role = user?.role ?? null;
  const departments = user?.departments ?? [];
  // Prefer permissions dari JWT (server-validated, source of truth setelah Phase 3).
  // Fallback ke static permission-map kalau JWT belum punya field permissions
  // (mis. token lama dari sebelum Phase 3 — auto-refresh saat /me).
  const userPerms = user?.permissions;

  const value: AuthContextValue = {
    user,
    role,
    departments,
    isAuthenticated: user !== null,
    login,
    logout,
    can: (permission) =>
      Array.isArray(userPerms) ? userPerms.includes(permission) : hasPermission(role, permission),
    canAny: (permissions) =>
      Array.isArray(userPerms)
        ? permissions.some((p) => userPerms.includes(p))
        : hasAnyPermission(role, permissions),
    isHydrating
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
