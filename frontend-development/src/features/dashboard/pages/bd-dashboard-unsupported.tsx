import type { UserDepartment } from '../../auth/types/auth.types';
import { getPrimaryDepartment } from '../utils/bd-dashboard-variant';

interface BdDashboardUnsupportedProps {
  departments: UserDepartment[] | undefined;
}

/** BD dengan department utama selain MEO / EXECUTIVE — tidak ada dashboard analytics. */
export const BdDashboardUnsupported = ({ departments }: BdDashboardUnsupportedProps) => {
  const primary = getPrimaryDepartment(departments);
  const deptLabel = primary ? `${primary.name} (${primary.code})` : 'tidak terdefinisi';

  return (
    <div className="rounded-xl border border-[#eceef0] bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-[#191c1e]">Dashboard tidak tersedia</h1>
      <p className="mt-2 text-sm text-[#737784]">
        Akun Business Development Anda terdaftar pada department utama <span className="font-semibold">{deptLabel}</span>.
        Dashboard analytics saat ini hanya tersedia untuk unit <span className="font-semibold">MEO</span> (marketing) dan{' '}
        <span className="font-semibold">Executive</span> (pipeline).
      </p>
      <p className="mt-3 text-xs text-[#737784]">
        Hubungi administrator jika department utama Anda perlu disesuaikan.
      </p>
    </div>
  );
};
