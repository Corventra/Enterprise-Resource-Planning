import { apiGet, apiPost, tokenStorage } from '../../../services/api-client';
import type { Permission } from '../../../app/permissions';
import type { Role } from '../../../app/permissions/roles';
import type { DummyUser, LoginFormValues, UserDepartment, UserRoleInfo } from '../types/auth.types';

const USER_STORAGE_KEY = 'erp_auth_user';

interface BackendUserPayload {
  id: number;
  email: string;
  name: string;
  role: { id: number; code: string; name: string };
  departments: Array<{ id: number; code: string; name: string; isPrimary: boolean }>;
  permissions?: string[];
}

interface LoginResponse {
  token: string;
  user: BackendUserPayload;
}

interface MeResponse {
  user: BackendUserPayload;
}

const toDummyUser = (payload: BackendUserPayload): DummyUser => ({
  id: payload.id,
  email: payload.email,
  name: payload.name,
  role: payload.role.code as Role,
  roleInfo: { id: payload.role.id, code: payload.role.code as Role, name: payload.role.name } satisfies UserRoleInfo,
  departments: payload.departments as UserDepartment[],
  permissions: (payload.permissions ?? []) as Permission[]
});

export const authService = {
  /**
   * Real login via backend `/api/auth/login`. Nama method tetap
   * `loginWithDummyAccount` supaya additive — caller di useLoginForm tidak
   * perlu di-rename. Throw error dengan message dari backend kalau gagal.
   */
  loginWithDummyAccount: async (credentials: LoginFormValues): Promise<DummyUser> => {
    const res = await apiPost<LoginResponse>(
      '/auth/login',
      { email: credentials.email, password: credentials.password },
      { withAuth: false }
    );
    tokenStorage.set(res.token);
    return toDummyUser(res.user);
  },

  /**
   * Refresh user data dari backend pakai token yang sudah ada.
   * Dipakai saat aplikasi load — verify token masih valid + ambil
   * info terkini (department/role bisa berubah).
   */
  fetchCurrentUser: async (): Promise<DummyUser | null> => {
    const token = tokenStorage.get();
    if (!token) return null;
    try {
      const res = await apiGet<MeResponse>('/auth/me');
      return toDummyUser(res.user);
    } catch {
      // Token expired / invalid — bersihkan
      tokenStorage.clear();
      return null;
    }
  },

  /**
   * Server-side logout (audit) + bersihkan token lokal. JWT stateless,
   * jadi server tidak benar-benar revoke; ini sekedar contract bersih.
   */
  logout: async (): Promise<void> => {
    try {
      await apiPost('/auth/logout');
    } catch {
      /* tetap clear token meski request gagal */
    }
    tokenStorage.clear();
  },

  // ===== Local storage user data — tetap dipertahankan untuk hydrate awal =====
  setStoredAuthUser: (user: DummyUser) => {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch {
      /* ignore */
    }
  },
  getStoredAuthUser: (): DummyUser | null => {
    try {
      const data = localStorage.getItem(USER_STORAGE_KEY);
      return data ? (JSON.parse(data) as DummyUser) : null;
    } catch {
      return null;
    }
  },
  clearStoredAuthUser: () => {
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
};
