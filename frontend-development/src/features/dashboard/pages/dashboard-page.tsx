import { ROLES } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import { resolveBdDashboardTarget } from '../utils/bd-dashboard-variant';
import { BdDashboardPage } from './bd-dashboard-page';
import { BdDashboardUnsupported } from './bd-dashboard-unsupported';
import { CeoDashboardPage } from './ceo-dashboard-page';
import { MeoDashboardPage } from './meo-dashboard-page';
import { StaffAdminDashboardPage } from './staff-admin-dashboard-page';

/**
 * Entry `/dashboard` — routing eksplisit per role (+ department untuk BD).
 *
 * BD:
 * - primary department MEO → marketing
 * - primary department EXECUTIVE → pipeline
 * - lainnya → placeholder unsupported
 */
export const DashboardPage = () => {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === ROLES.CEO || user.role === ROLES.SUPERADMIN) {
    return <CeoDashboardPage />;
  }

  if (user.role === ROLES.STAFF_ADMIN) {
    return <StaffAdminDashboardPage />;
  }

  if (user.role === ROLES.BD) {
    const target = resolveBdDashboardTarget(user.departments);
    if (target === 'marketing') return <MeoDashboardPage />;
    if (target === 'pipeline') return <BdDashboardPage />;
    return <BdDashboardUnsupported departments={user.departments} />;
  }

  return (
    <div className="rounded-xl border border-[#eceef0] bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-[#191c1e]">Dashboard</h1>
      <p className="mt-2 text-sm text-[#737784]">
        Selamat datang, {user.name}. Dashboard khusus role Anda akan tersedia pada tahap berikutnya.
      </p>
    </div>
  );
};
