import { ROLES, type Role } from '../../../app/permissions/roles';
import { rolePermissionMap } from '../../../app/permissions/permission-map';
import type { Permission } from '../../../app/permissions/permissions';
import type { DummyUser, UserDepartment } from '../types/auth.types';

/**
 * Mock accounts untuk demo aplikasi tanpa harus running backend.
 * Dipakai sebagai fallback otomatis di authService.loginWithDummyAccount
 * kalau request ke `/auth/login` gagal karena network error (backend down).
 *
 * Permission per user di-derive dari `rolePermissionMap` sehingga match
 * dengan permission yang di-issue backend nyata.
 */

const DEFAULT_PASSWORD = '12345678';

interface MockAccountSeed {
  id: number;
  email: string;
  name: string;
  role: Role;
  roleName: string;
  departments: UserDepartment[];
}

const mockSeeds: MockAccountSeed[] = [
  {
    id: 9001,
    email: 'meo@erp.local',
    name: 'MEO Demo',
    role: ROLES.MEO,
    roleName: 'Marketing Executive Officer',
    departments: [{ id: 1, code: 'MKT', name: 'Marketing', isPrimary: true }]
  },
  {
    id: 9002,
    email: 'bd@erp.local',
    name: 'BD Demo',
    role: ROLES.BD,
    roleName: 'Business Development',
    departments: [{ id: 2, code: 'BD', name: 'Business Development', isPrimary: true }]
  },
  {
    id: 9003,
    email: 'ceo@erp.local',
    name: 'CEO Demo',
    role: ROLES.CEO,
    roleName: 'Chief Executive Officer',
    departments: []
  },
  {
    id: 9004,
    email: 'coo@erp.local',
    name: 'COO Demo',
    role: ROLES.COO,
    roleName: 'Chief Operating Officer',
    departments: []
  },
  {
    id: 9005,
    email: 'pm@erp.local',
    name: 'PM Demo',
    role: ROLES.PM,
    roleName: 'Project Manager',
    departments: [{ id: 3, code: 'TP', name: 'Transfer Pricing', isPrimary: true }]
  },
  {
    id: 9006,
    email: 'consultant@erp.local',
    name: 'Consultant Demo',
    role: ROLES.CONSULTANT,
    roleName: 'Consultant',
    departments: [{ id: 3, code: 'TP', name: 'Transfer Pricing', isPrimary: true }]
  },
  {
    id: 9007,
    email: 'admin@erp.local',
    name: 'Staff Admin Demo',
    role: ROLES.STAFF_ADMIN,
    roleName: 'Staff Admin',
    departments: [{ id: 7, code: 'ADM', name: 'Administrasi', isPrimary: true }]
  },
  {
    id: 9008,
    email: 'superadmin@erp.local',
    name: 'Superadmin Demo',
    role: ROLES.SUPERADMIN,
    roleName: 'Superadmin',
    departments: []
  }
];

const buildMockUser = (seed: MockAccountSeed): DummyUser => ({
  id: seed.id,
  email: seed.email,
  name: seed.name,
  role: seed.role,
  roleInfo: { id: seed.id, code: seed.role, name: seed.roleName },
  departments: seed.departments,
  permissions: rolePermissionMap[seed.role] as Permission[]
});

export const MOCK_ACCOUNTS: ReadonlyArray<DummyUser> = mockSeeds.map(buildMockUser);

/**
 * Cari akun mock yang cocok dengan email + password. Password default
 * untuk semua akun demo: `12345678`. Case-insensitive untuk email.
 */
export const findMockAccount = (email: string, password: string): DummyUser | null => {
  if (password !== DEFAULT_PASSWORD) return null;
  const normalized = email.trim().toLowerCase();
  const found = MOCK_ACCOUNTS.find((u) => u.email.toLowerCase() === normalized);
  return found ?? null;
};

export const MOCK_DEFAULT_PASSWORD = DEFAULT_PASSWORD;
