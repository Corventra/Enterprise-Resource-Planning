import { createContext, useContext, useState, type ReactNode } from 'react';
import { authService } from '../../features/auth/services/auth.service';
import type { DummyUser } from '../../features/auth/types/auth.types';
import type { Role, Permission } from '../permissions';
import { hasPermission, hasAnyPermission } from '../permissions';

interface AuthContextValue {
  user: DummyUser | null;
  role: Role | null;
  isAuthenticated: boolean;
  login: (user: DummyUser) => void;
  logout: () => void;
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<DummyUser | null>(() => authService.getStoredAuthUser());

  const login = (next: DummyUser) => {
    authService.setStoredAuthUser(next);
    setUser(next);
  };

  const logout = () => {
    authService.clearStoredAuthUser();
    setUser(null);
  };

  const role = user?.role ?? null;

  const value: AuthContextValue = {
    user,
    role,
    isAuthenticated: user !== null,
    login,
    logout,
    can: (permission) => hasPermission(role, permission),
    canAny: (permissions) => hasAnyPermission(role, permissions)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
