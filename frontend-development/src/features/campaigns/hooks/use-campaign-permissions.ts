import { PERMISSIONS } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';

/**
 * Permission flags untuk Campaign & Forms (tanpa hardcode role).
 * Route /campaigns: CAMPAIGN_VIEW | CAMPAIGN_MANAGE (any).
 * Route /forms: FORM_VIEW | FORM_MANAGE (any).
 */
export const useCampaignPermissions = () => {
  const { can } = useAuth();

  return {
    /**
     * Buka list & detail campaign. MANAGE menyiratkan akses halaman meski VIEW tidak disetel di DB.
     */
    canViewCampaignArea: can(PERMISSIONS.CAMPAIGN_VIEW) || can(PERMISSIONS.CAMPAIGN_MANAGE),
    canManageCampaigns: can(PERMISSIONS.CAMPAIGN_MANAGE),
    /** Lihat tab Forms & konten daftar form. MANAGE menyiratkan akses baca. */
    canViewForms: can(PERMISSIONS.FORM_VIEW) || can(PERMISSIONS.FORM_MANAGE),
    canManageForms: can(PERMISSIONS.FORM_MANAGE)
  };
};
