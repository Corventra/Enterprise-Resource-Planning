import { apiGet, apiPost, tokenStorage, ApiError } from '../../../services/api-client';
import type { Permission } from '../../../app/permissions';
import type { Role } from '../../../app/permissions/roles';
import type { DummyUser, LoginFormValues, UserDepartment, UserRoleInfo } from '../types/auth.types';
import { findMockAccount } from '../mocks/mock-accounts';

const USER_STORAGE_KEY = 'erp_auth_user';
const MOCK_SESSION_KEY = 'erp_auth_mock_session';
const MOCK_TOKEN_VALUE = 'mock-demo-token';

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

const getStoredUser = (): DummyUser | null => {
  try {
    const data = localStorage.getItem(USER_STORAGE_KEY);
    return data ? (JSON.parse(data) as DummyUser) : null;
  } catch {
    return null;
  }
};

const mockSessionStorage = {
  isMock(): boolean {
    try {
      return localStorage.getItem(MOCK_SESSION_KEY) === '1';
    } catch {
      return false;
    }
  },
  markMock() {
    try {
      localStorage.setItem(MOCK_SESSION_KEY, '1');
    } catch {
      /* ignore */
    }
  },
  clearMock() {
    try {
      localStorage.removeItem(MOCK_SESSION_KEY);
    } catch {
      /* ignore */
    }
  }
};

export const authService = {
  /**
   * Login flow: coba backend `/api/auth/login` dulu (source of truth).
   * Kalau backend unreachable (ApiError.status === 0 = network error),
   * fallback ke mock accounts untuk keperluan demo. Wrong password / 401
   * dari backend tetap di-throw seperti biasa (TIDAK fallback ke mock).
   *
   * Nama method tetap `loginWithDummyAccount` supaya additive — caller di
   * useLoginForm tidak perlu di-rename.
   */
  loginWithDummyAccount: async (credentials: LoginFormValues): Promise<DummyUser> => {
    try {
      const res = await apiPost<LoginResponse>(
        '/auth/login',
        { email: credentials.email, password: credentials.password },
        { withAuth: false }
      );
      tokenStorage.set(res.token);
      mockSessionStorage.clearMock();
      return toDummyUser(res.user);
    } catch (err) {
      // Fallback ke mock untuk keperluan demo, dipicu kalau:
      //   (a) status 0 = backend unreachable (server mati / CORS / DNS fail), ATAU
      //   (b) status 401 = backend reject — kemungkinan akun mock memang tidak
      //       ada di DB (mis. `meo@erp.local`). Kita coba match ke mock list;
      //       kalau cocok, sukses; kalau tidak, lempar error asli.
      // Status lain (500, 403, dll) tetap diteruskan tanpa fallback.
      const shouldTryMock =
        err instanceof ApiError && (err.status === 0 || err.status === 401);
      if (shouldTryMock) {
        const mockUser = findMockAccount(credentials.email, credentials.password);
        if (mockUser) {
          tokenStorage.set(MOCK_TOKEN_VALUE);
          mockSessionStorage.markMock();
          return mockUser;
        }
      }
      throw err;
    }
  },

  /**
   * Refresh user data dari backend pakai token yang sudah ada.
   * Dipakai saat aplikasi load — verify token masih valid + ambil
   * info terkini (department/role bisa berubah).
   *
   * Untuk session mock (backend down saat login), skip `/auth/me` dan
   * return stored user — supaya demo tetap jalan meski backend mati.
   */
  fetchCurrentUser: async (): Promise<DummyUser | null> => {
    const token = tokenStorage.get();
    if (!token) return null;
    if (mockSessionStorage.isMock()) {
      return getStoredUser();
    }
    try {
      const res = await apiGet<MeResponse>('/auth/me');
      return toDummyUser(res.user);
    } catch (err) {
      // Backend unreachable saat hydrate → pertahankan stored user supaya
      // user tidak ter-logout otomatis. Hanya clear kalau benar-benar 401.
      if (err instanceof ApiError && err.status === 0) {
        return getStoredUser();
      }
      tokenStorage.clear();
      return null;
    }
  },

  /**
   * Server-side logout (audit) + bersihkan token lokal. JWT stateless,
   * jadi server tidak benar-benar revoke; ini sekedar contract bersih.
   * Mock session: skip request ke backend.
   */
  logout: async (): Promise<void> => {
    if (!mockSessionStorage.isMock()) {
      try {
        await apiPost('/auth/logout');
      } catch {
        /* tetap clear token meski request gagal */
      }
    }
    tokenStorage.clear();
    mockSessionStorage.clearMock();
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
