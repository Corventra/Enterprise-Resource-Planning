import type { Role } from '../../../app/permissions';

/**
 * User shape dari backend `/api/users`. Di-share dengan auth payload —
 * sengaja dipisah dari `DummyUser` (auth context) agar field admin-only
 * (createdAt/updatedAt/isActive) bisa muncul di UI tabel tanpa polusi
 * di context.
 */
export interface ManagedUser {
  id: number;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role: { id: number; code: Role; name: string };
  departments: Array<{ id: number; code: string; name: string; isPrimary: boolean }>;
}

export interface ManagedUserDraft {
  email: string;
  name: string;
  password?: string;       // wajib saat create, optional saat edit
  roleCode: Role;
  departmentCodes: string[];
}

export interface RoleOption {
  id: number;
  code: Role;
  name: string;
  isDepartmentScoped: boolean;
}

export interface DepartmentOption {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

/**
 * Full department record di Department Management page (admin).
 * Beda dengan DepartmentOption yang dipakai di dropdown form user.
 */
export interface ManagedDepartment {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  /** Jumlah user yang ter-assign — read-only, dipakai untuk safety check di UI. */
  userCount: number;
}

export interface ManagedDepartmentCreateDraft {
  code: string;
  name: string;
}

export interface ManagedDepartmentUpdateDraft {
  name?: string;
  isActive?: boolean;
}

export interface SystemConfig {
  organizationName: string;
  organizationCode: string;
  appVersion: string;
  defaultLocale: 'id-ID' | 'en-US';
  sessionTimeoutMinutes: number;
  enableAuditTrail: boolean;
  enableEmailNotifications: boolean;
  maintenanceMode: boolean;
  updatedAt: string;
}
