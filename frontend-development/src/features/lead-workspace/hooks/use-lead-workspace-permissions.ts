import { PERMISSIONS } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';

export interface UseLeadWorkspacePermissionsOptions {
  processedByUserId?: number | null;
}

const isLeadWorkspaceOperator = (
  processedByUserId: number | null | undefined,
  currentUserId: number | null | undefined
) =>
  processedByUserId != null &&
  currentUserId != null &&
  Number(processedByUserId) === Number(currentUserId);

/**
 * Permission flags untuk Lead Workspace — tanpa hardcode role.
 * Route sudah dilindungi LEAD_VIEW; manage operasional dibatasi ke `processed_by`.
 */
export const useLeadWorkspacePermissions = (options: UseLeadWorkspacePermissionsOptions = {}) => {
  const { can, user } = useAuth();
  const processedByUserId = options.processedByUserId ?? null;
  const operator = isLeadWorkspaceOperator(processedByUserId, user?.id);

  return {
    /** Akses konten workspace (selaras PermissionGuard LEAD_VIEW). */
    canViewLeadWorkspace: can(PERMISSIONS.LEAD_VIEW),
    /** Manage operasional workspace: butuh LEAD_MANAGE + operator lead (`processed_by`). */
    canManageLeadWorkspace: can(PERMISSIONS.LEAD_MANAGE) && operator,
    /** CEO approval flow — terpisah dari editor draft operator lead. */
    canApproveProposal: can(PERMISSIONS.PROPOSAL_APPROVE),
    canApproveEngagementLetter: can(PERMISSIONS.ENGAGEMENT_LETTER_APPROVE),
    canApproveHandover: can(PERMISSIONS.HANDOVER_APPROVE),
    isLeadWorkspaceOperator: operator
  };
};
