import type { Permission, Role } from '../../../app/permissions';

/** @deprecated Use `Role` from `app/permissions` instead. */
export type UserRole = Role;

export interface UserDepartment {
  id: number;
  code: string;
  name: string;
  isPrimary: boolean;
}

export interface UserRoleInfo {
  id: number;
  code: Role;
  name: string;
}

/**
 * Auth user shape — dipakai di context dan localStorage.
 * Nama tetap `DummyUser` untuk additive compat dengan kode existing,
 * meski sekarang sudah backed by real backend (bukan dummy lagi).
 */
export interface DummyUser {
  email: string;
  name: string;
  role: Role;
  /** ID numeric user dari backend (optional untuk kompatibilitas mundur). */
  id?: number;
  /** Display name & metadata role (optional). */
  roleInfo?: UserRoleInfo;
  /** Department user — kosong array untuk role all-spanning (CEO, HRD, dll). */
  departments?: UserDepartment[];
  /**
   * Permission codes yang dimiliki user — di-fetch dari backend saat login & /me.
   * `useAuth().can()` baca dari sini (preferred) sebelum fallback ke static map.
   */
  permissions?: Permission[];
}

export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
  submit?: string;
}
