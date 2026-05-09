import { PERMISSIONS } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';

/**
 * Permission flags untuk Lead Workspace — tanpa hardcode role.
 * Route sudah dilindungi LEAD_VIEW; flag ini untuk konsistensi di dalam halaman.
 */
export const useLeadWorkspacePermissions = () => {
  const { can } = useAuth();

  return {
    /** Akses konten workspace (selaras PermissionGuard LEAD_VIEW). */
    canViewLeadWorkspace: can(PERMISSIONS.LEAD_VIEW),
    /** Edit lead, meeting, proposal, EL operasional BD, dll. */
    canManageLeadWorkspace: can(PERMISSIONS.LEAD_MANAGE),
    canApproveProposal: can(PERMISSIONS.PROPOSAL_APPROVE),
    canApproveEngagementLetter: can(PERMISSIONS.ENGAGEMENT_LETTER_APPROVE),
    canApproveHandover: can(PERMISSIONS.HANDOVER_APPROVE)
  };
};
