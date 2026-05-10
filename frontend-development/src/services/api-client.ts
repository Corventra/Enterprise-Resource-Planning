/**
 * Thin fetch wrapper untuk backend ERP. Pakai JWT bearer dari localStorage
 * kalau ada. Throw `ApiError` dengan message dari server kalau response 4xx/5xx.
 *
 * Ke depan endpoint baru (users, departments, dll) tinggal pakai apiGet/apiPost.
 */

const TOKEN_STORAGE_KEY = 'erp_auth_token';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/** Origin server API (tanpa path `/api`), untuk URL statis seperti `/uploads/...`. */
export const getApiOrigin = (): string => {
  try {
    const u = new URL(BASE_URL);
    return `${u.protocol}//${u.host}`;
  } catch {
    return '';
  }
};

export class ApiError extends Error {
  status: number;
  detail?: unknown;
  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
};

interface RequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  /** Set false untuk endpoint public (mis. login) supaya tidak inject token. */
  withAuth?: boolean;
}

const request = async <T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> => {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts.headers ?? {})
  };
  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (opts.withAuth !== false) {
    const token = tokenStorage.get();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      credentials: 'include'
    });
  } catch (e) {
    throw new ApiError(
      e instanceof Error ? `Tidak bisa terhubung ke server: ${e.message}` : 'Network error',
      0
    );
  }

  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && 'error' in payload && typeof (payload as { error: unknown }).error === 'string')
        ? (payload as { error: string }).error
        : `Request gagal (HTTP ${res.status})`;
    throw new ApiError(message, res.status, payload);
  }

  return payload as T;
};

const requestFormData = async <T>(method: string, path: string, formData: FormData, opts: RequestOptions = {}): Promise<T> => {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts.headers ?? {})
  };
  if (opts.withAuth !== false) {
    const token = tokenStorage.get();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: formData,
      credentials: 'include'
    });
  } catch (e) {
    throw new ApiError(
      e instanceof Error ? `Tidak bisa terhubung ke server: ${e.message}` : 'Network error',
      0
    );
  }

  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && typeof (payload as { error: unknown }).error === 'string'
        ? (payload as { error: string }).error
        : `Request gagal (HTTP ${res.status})`;
    throw new ApiError(message, res.status, payload);
  }

  return payload as T;
};

export const apiGet = <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts);
export const apiPost = <T>(path: string, body?: unknown, opts?: RequestOptions) =>
  request<T>('POST', path, { ...opts, body });
export const apiPut = <T>(path: string, body?: unknown, opts?: RequestOptions) =>
  request<T>('PUT', path, { ...opts, body });
export const apiPatch = <T>(path: string, body?: unknown, opts?: RequestOptions) =>
  request<T>('PATCH', path, { ...opts, body });
export const apiDelete = <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts);

export const apiPostFormData = <T>(path: string, formData: FormData, opts?: RequestOptions) =>
  requestFormData<T>('POST', path, formData, opts);

export const apiPatchFormData = <T>(path: string, formData: FormData, opts?: RequestOptions) =>
  requestFormData<T>('PATCH', path, formData, opts);
