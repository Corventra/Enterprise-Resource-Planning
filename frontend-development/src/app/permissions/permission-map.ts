import { ROLES, type Role } from './roles';
import { PERMISSIONS, type Permission } from './permissions';

export const rolePermissionMap: Record<Role, Permission[]> = {
  [ROLES.MEO]: [
    PERMISSIONS.BANK_DATA_VIEW,
    PERMISSIONS.CAMPAIGN_VIEW,
    PERMISSIONS.CAMPAIGN_MANAGE,
    PERMISSIONS.FORM_VIEW,
    PERMISSIONS.FORM_MANAGE,
    PERMISSIONS.LEAD_VIEW
  ],
  [ROLES.BD]: [
    PERMISSIONS.BANK_DATA_VIEW,
    PERMISSIONS.BANK_DATA_PROCESS,
    PERMISSIONS.LEAD_VIEW,
    PERMISSIONS.LEAD_TRACKER_VIEW,
    PERMISSIONS.LEAD_MANAGE,
    PERMISSIONS.HANDOVER_MANAGE,
    PERMISSIONS.DOCUMENT_VIEW
  ],
  [ROLES.CEO]: [
    PERMISSIONS.BANK_DATA_VIEW,
    PERMISSIONS.CAMPAIGN_VIEW,
    PERMISSIONS.FORM_VIEW,
    PERMISSIONS.LEAD_VIEW,
    PERMISSIONS.LEAD_TRACKER_VIEW,
    PERMISSIONS.PROPOSAL_APPROVE,
    PERMISSIONS.ENGAGEMENT_LETTER_APPROVE,
    PERMISSIONS.HANDOVER_APPROVE,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_VIEW_FINANCIALS,
    PERMISSIONS.DOCUMENT_VIEW,
    // KPI: primary owner Performance Management framework — configure bobot
    // dimensi & threshold, finalize period, manual recompute, export laporan.
    // Task template manage collaborative dengan COO.
    PERMISSIONS.KPI_VIEW_OWN,
    PERMISSIONS.KPI_VIEW_ALL,
    PERMISSIONS.KPI_FINALIZE_PERIOD,
    PERMISSIONS.KPI_CONFIGURE,
    PERMISSIONS.KPI_RECOMPUTE,
    PERMISSIONS.KPI_EXPORT,
    PERMISSIONS.TASK_TEMPLATE_MANAGE
  ],
  [ROLES.COO]: [
    PERMISSIONS.LEAD_VIEW,
    PERMISSIONS.LEAD_TRACKER_VIEW,
    PERMISSIONS.HANDOVER_MANAGE,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_VIEW_FINANCIALS,
    PERMISSIONS.PROJECT_ASSIGN_PM,
    PERMISSIONS.DOCUMENT_VIEW,
    // KPI: oversight + operational override + collaborative pada task templates
    PERMISSIONS.KPI_VIEW_OWN,
    PERMISSIONS.KPI_VIEW_ALL,
    PERMISSIONS.KPI_RECOMPUTE,
    PERMISSIONS.TASK_TEMPLATE_MANAGE
  ],
  [ROLES.PM]: [
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_ASSIGN_CONSULTANT,
    PERMISSIONS.PROJECT_UPDATE_PROGRESS,
    PERMISSIONS.DOCUMENT_VIEW,
    // KPI: rate task (input utama dimensi Output Quality), lihat tim sendiri
    PERMISSIONS.KPI_VIEW_OWN,
    PERMISSIONS.KPI_VIEW_TEAM,
    PERMISSIONS.KPI_RATE_TASK
  ],
  [ROLES.CONSULTANT]: [
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_UPDATE_PROGRESS,
    PERMISSIONS.DOCUMENT_VIEW,
    // KPI: lihat KPI sendiri
    PERMISSIONS.KPI_VIEW_OWN
  ],
  [ROLES.STAFF_ADMIN]: [PERMISSIONS.DOCUMENT_VIEW, PERMISSIONS.INVOICE_MANAGE],
  // Superadmin = administrator teknis sistem (full access teknis).
  // Otomatis ikut semua permission saat ini & yang ditambahkan ke depan.
  [ROLES.SUPERADMIN]: Object.values(PERMISSIONS)
};

export const hasPermission = (role: Role | null, permission: Permission): boolean => {
  if (!role) return false;
  return rolePermissionMap[role].includes(permission);
};

export const hasAnyPermission = (role: Role | null, permissions: Permission[]): boolean => {
  if (!role) return false;
  return permissions.some(p => rolePermissionMap[role].includes(p));
};
