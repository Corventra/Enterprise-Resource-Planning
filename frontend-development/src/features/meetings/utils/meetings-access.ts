import { ROLES, type Role } from '../../../app/permissions';
import type { UserDepartment } from '../../auth/types/auth.types';
import { BD_DEPARTMENT_EXECUTIVE_CODE, getPrimaryDepartment } from '../../dashboard/utils/bd-dashboard-variant';

/**
 * Halaman Meeting monitoring: CEO (semua) + BD dengan department utama EXECUTIVE.
 * Selaras backend `meetings-monitor-access.js` dan seed `departments.code`.
 */
export const canAccessMeetingsMonitor = (
  role: Role | null,
  departments: UserDepartment[] | undefined
): boolean => {
  if (!role) return false;
  if (role === ROLES.CEO) return true;
  if (role !== ROLES.BD) return false;
  return getPrimaryDepartment(departments)?.code === BD_DEPARTMENT_EXECUTIVE_CODE;
};
