import { PERMISSIONS } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';

/**
 * Permission flags untuk Invoice (tanpa hardcode role).
 * Route /invoice: INVOICE_VIEW | INVOICE_MANAGE (any).
 * Mutasi termin: INVOICE_MANAGE saja.
 */
export const useInvoicePermissions = () => {
  const { can } = useAuth();

  return {
    canViewInvoices: can(PERMISSIONS.INVOICE_VIEW) || can(PERMISSIONS.INVOICE_MANAGE),
    canManageInvoices: can(PERMISSIONS.INVOICE_MANAGE)
  };
};
