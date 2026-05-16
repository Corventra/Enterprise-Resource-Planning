import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ROLES } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import { projectService } from '../../projects/services/project-service';
import type { ProjectAssignee } from '../../projects/types/project.types';
import { KpiConsultantsTable } from '../components/kpi-consultants-table';
import { KpiSummaryCards } from '../components/kpi-summary-cards';
import { kpiEngine } from '../services/kpi-engine';
import { kpiSnapshotService } from '../services/kpi-snapshot-service';
import type { KpiSnapshot } from '../types/kpi.types';

const currentPeriodIso = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
};

export const KpiCenterPage = () => {
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const [snapshots, setSnapshots] = useState<KpiSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const period = currentPeriodIso();

  // Auto-redirect Consultant ke detail mereka sendiri.
  useEffect(() => {
    if (role === ROLES.CONSULTANT && user?.email) {
      navigate(`/kpi/consultant/${encodeURIComponent(user.email)}`, { replace: true });
    }
  }, [role, user?.email, navigate]);

  useEffect(() => {
    if (role === ROLES.CONSULTANT) return;
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      const allConsultants = await kpiEngine.listAllConsultants();

      // Scope per role: PM lihat hanya consultant di project-nya
      let visible: ProjectAssignee[] = allConsultants;
      if (role === ROLES.PM && user?.email) {
        const projects = await projectService.getAll();
        const myConsultantIds = new Set(
          projects
            .filter((p) => p.pm?.id === user.email)
            .flatMap((p) => p.consultants.map((c) => c.id))
        );
        visible = allConsultants.filter((c) => myConsultantIds.has(c.id));
      }

      const fresh = await Promise.all(
        visible.map(async (consultant) => {
          // Prefer existing finalized snapshot kalau ada untuk period ini, else compute live
          const existing = await kpiSnapshotService.getByConsultantAndPeriod(consultant.id, period);
          if (existing) return existing;
          return kpiEngine.computeSnapshot(consultant, period);
        })
      );

      if (!cancelled) {
        setSnapshots(fresh);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role, user?.email, period]);

  const summary = useMemo(() => {
    const consultantCount = snapshots.length;
    const finalizedCount = snapshots.filter((s) => s.finalizedAt).length;
    const averageTotal =
      consultantCount === 0
        ? 0
        : snapshots.reduce((sum, s) => sum + s.total, 0) / consultantCount;
    return { averageTotal, consultantCount, finalizedCount, period };
  }, [snapshots, period]);

  const subtitle =
    role === ROLES.PM
      ? 'Pantau performa consultant di tim Anda untuk period berjalan.'
      : role === ROLES.CEO
        ? 'Performance Management dashboard — owner: CEO, view-only: COO/Staff Admin.'
        : 'Pantau KPI semua consultant aktif untuk period berjalan.';

  if (role === ROLES.CONSULTANT) {
    // Sedang di-redirect; tampilkan placeholder ringan supaya tidak kosong sesaat.
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
        Mengarahkan ke KPI Anda...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">KPI Center</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
      </header>

      <KpiSummaryCards summary={summary} />

      {isLoading ? (
        <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
          Computing KPI snapshots...
        </div>
      ) : snapshots.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-[#eceef0]">
          <h3 className="text-lg font-semibold text-[#191c1e]">No consultants tracked</h3>
          <p className="max-w-md text-sm text-[#737784]">
            {role === ROLES.PM
              ? 'Belum ada consultant di project Anda. KPI akan muncul setelah Anda assign consultant.'
              : 'Belum ada consultant aktif di project apapun.'}
          </p>
        </div>
      ) : (
        <KpiConsultantsTable
          rows={snapshots}
          onView={(id) => navigate(`/kpi/consultant/${encodeURIComponent(id)}`)}
        />
      )}
    </div>
  );
};
