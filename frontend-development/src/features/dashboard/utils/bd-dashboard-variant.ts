import type { UserDepartment } from '../../auth/types/auth.types';

/**
 * Kode department BD untuk routing dashboard.
 * Selaras `departments.code` di DB / seed (`backend-development/src/db/init.sql`).
 */
export const BD_DEPARTMENT_MEO_CODE = 'MEO';
export const BD_DEPARTMENT_EXECUTIVE_CODE = 'EXECUTIVE';

/** Dashboard yang didukung untuk role BD berdasarkan department utama. */
export type BdDashboardTarget = 'marketing' | 'pipeline' | 'unsupported';

export const getPrimaryDepartment = (departments: UserDepartment[] | undefined) => {
  if (!departments?.length) return undefined;
  return departments.find((d) => d.isPrimary) ?? departments[0];
};

/**
 * Menentukan halaman dashboard BD secara eksplisit:
 * - MEO → marketing (`MeoDashboardPage`)
 * - EXECUTIVE → pipeline (`BdDashboardPage`)
 * - selain itu → unsupported (placeholder aman)
 */
export const resolveBdDashboardTarget = (departments: UserDepartment[] | undefined): BdDashboardTarget => {
  const code = getPrimaryDepartment(departments)?.code;
  if (code === BD_DEPARTMENT_MEO_CODE) return 'marketing';
  if (code === BD_DEPARTMENT_EXECUTIVE_CODE) return 'pipeline';
  return 'unsupported';
};

/** @deprecated Gunakan `resolveBdDashboardTarget` */
export const isBdMeoDepartmentUser = (departments: UserDepartment[] | undefined) =>
  resolveBdDashboardTarget(departments) === 'marketing';
