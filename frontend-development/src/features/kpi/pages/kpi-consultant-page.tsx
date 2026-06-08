import { ArrowLeft, Calculator, CheckCircle2, Lock, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { PERMISSIONS, ROLES } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import { projectService } from '../../projects/services/project-service';
import type { ProjectAssignee } from '../../projects/types/project.types';
import { KpiDimensionCard } from '../components/kpi-dimension-card';
import { KpiProjectBreakdown } from '../components/kpi-project-breakdown';
import { KpiTrendChart } from '../components/kpi-trend-chart';
import { kpiEngine } from '../services/kpi-engine';
import { kpiSnapshotService } from '../services/kpi-snapshot-service';
import {
  KPI_DIMENSION_KEYS,
  type KpiSnapshot,
  type ProjectKpiBreakdown
} from '../types/kpi.types';

const currentPeriodIso = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
};

export const KpiConsultantPage = () => {
  const navigate = useNavigate();
  const { consultantId: rawId } = useParams();
  const consultantId = rawId ? decodeURIComponent(rawId) : undefined;
  const { role, user, can } = useAuth();

  const [snapshot, setSnapshot] = useState<KpiSnapshot | undefined>();
  const [history, setHistory] = useState<KpiSnapshot[]>([]);
  const [breakdown, setBreakdown] = useState<ProjectKpiBreakdown[]>([]);
  const [consultant, setConsultant] = useState<ProjectAssignee | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | undefined>();
  const [isRecomputing, setIsRecomputing] = useState(false);
  const [recomputeFeedback, setRecomputeFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const period = currentPeriodIso();

  // Authorization guard:
  // - Consultant: hanya boleh lihat dirinya sendiri
  // - PM: hanya boleh lihat consultant di project-nya
  // - CEO/COO/Staff Admin: full
  useEffect(() => {
    if (!consultantId || !user || !role) return;
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      setAccessDenied(false);

      // Backend pakai numeric user id (string-encoded di consultant.id).
      const userIdStr = user.id != null ? String(user.id) : '';

      if (role === ROLES.CONSULTANT && consultantId !== userIdStr) {
        setAccessDenied(true);
        setIsLoading(false);
        return;
      }
      if (role === ROLES.PM) {
        const projects = await projectService.getAll();
        const teamIds = new Set(
          projects
            .filter((p) => p.pm?.id === userIdStr)
            .flatMap((p) => p.consultants.map((c) => c.id))
        );
        if (consultantId !== userIdStr && !teamIds.has(consultantId)) {
          setAccessDenied(true);
          setIsLoading(false);
          return;
        }
      }

      // Resolve consultant identity dari pool project (untuk dapat name)
      const allConsultants = await kpiEngine.listAllConsultants();
      const found = allConsultants.find((c) => c.id === consultantId)
        ?? (consultantId === userIdStr ? { id: userIdStr, name: user.name } : undefined);
      if (!found) {
        if (!cancelled) {
          setAccessDenied(true);
          setIsLoading(false);
        }
        return;
      }
      if (cancelled) return;
      setConsultant(found);

      const [maybeSaved, hist, perProject] = await Promise.all([
        kpiSnapshotService.getByConsultantAndPeriod(found.id, period),
        kpiSnapshotService.getByConsultant(found.id),
        kpiEngine.getProjectBreakdown(found)
      ]);

      const current = maybeSaved ?? (await kpiEngine.computeSnapshot(found, period));

      if (cancelled) return;

      // Build history yang termasuk current period (kalau belum ada di store, append)
      const histIncludingCurrent = hist.some((h) => h.period === current.period)
        ? hist
        : [...hist, current];

      setSnapshot(current);
      setHistory(histIncludingCurrent);
      setBreakdown(perProject);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [consultantId, role, user, period]);

  const canFinalize = can(PERMISSIONS.KPI_FINALIZE_PERIOD);
  const canRecompute = can(PERMISSIONS.KPI_RECOMPUTE);

  const handleRecompute = async () => {
    if (!snapshot || !consultant || !user || !role || !canRecompute) return;
    setIsRecomputing(true);
    setRecomputeFeedback(null);
    try {
      const fresh = await kpiEngine.computeSnapshot(consultant, snapshot.period);
      // Preserve finalize metadata kalau snapshot sebelumnya finalized
      const merged: KpiSnapshot = snapshot.finalizedAt
        ? {
            ...fresh,
            finalizedAt: snapshot.finalizedAt,
            finalizedBy: snapshot.finalizedBy
          }
        : fresh;
      const saved = snapshot.finalizedAt
        ? await kpiSnapshotService.overwriteFinalized(merged)
        : await kpiSnapshotService.save(merged);
      setSnapshot(saved);
      setHistory((prev) =>
        prev.some((h) => h.period === saved.period)
          ? prev.map((h) => (h.period === saved.period ? saved : h))
          : [...prev, saved]
      );
      // Refresh project breakdown juga (raw data mungkin berubah)
      const fb = await kpiEngine.getProjectBreakdown(consultant);
      setBreakdown(fb);
      setRecomputeFeedback({
        kind: 'success',
        message: snapshot.finalizedAt
          ? 'Snapshot finalized di-overwrite dengan data terbaru (audit-logged).'
          : 'Snapshot di-recompute dengan data raw terbaru.'
      });
    } catch (error) {
      setRecomputeFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Gagal recompute. Coba lagi.'
      });
    } finally {
      setIsRecomputing(false);
    }
  };

  const handleFinalize = async () => {
    if (!snapshot || !consultant || !user || !role || !canFinalize || snapshot.finalizedAt) return;
    setIsFinalizing(true);
    setFinalizeError(undefined);
    try {
      // Pastikan snapshot tersimpan dulu (kalau sebelumnya cuma live-computed).
      const existing = await kpiSnapshotService.getByConsultantAndPeriod(consultant.id, snapshot.period);
      if (!existing) {
        await kpiSnapshotService.save(snapshot);
      }
      const finalized = await kpiSnapshotService.finalize(snapshot, {
        id: String(user.id ?? ''),
        name: user.name,
        role
      });
      if (finalized) {
        setSnapshot(finalized);
        setHistory((prev) =>
          prev.map((h) => (h.period === finalized.period ? finalized : h))
        );
      }
    } catch (error) {
      setFinalizeError(error instanceof Error ? error.message : 'Gagal finalize. Coba lagi.');
    } finally {
      setIsFinalizing(false);
    }
  };

  const totalToneClass = useMemo(() => {
    if (!snapshot) return 'bg-[#eceef0] text-[#434653]';
    const t = snapshot.total;
    if (t >= 80) return 'bg-[#006544]/15 text-[#006544]';
    if (t >= 65) return 'bg-[#d5e3fc] text-[#003c90]';
    if (t >= 50) return 'bg-amber-100 text-[#a16207]';
    return 'bg-orange-100 text-[#c2410c]';
  }, [snapshot]);

  if (!consultantId) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 shadow-sm">
        <h1 className="text-base font-semibold text-[#191c1e]">Invalid consultant id</h1>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
        Loading KPI detail...
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-[#eceef0]">
        <span className="rounded-full bg-orange-100 p-3">
          <Lock className="h-7 w-7 text-[#c2410c]" />
        </span>
        <h3 className="text-lg font-semibold text-[#191c1e]">Tidak punya akses</h3>
        <p className="max-w-md text-sm text-[#737784]">
          Anda tidak memiliki akses untuk melihat KPI consultant ini.
        </p>
        <button
          type="button"
          onClick={() => navigate('/kpi')}
          className="mt-2 inline-flex items-center rounded-lg bg-[#003c90] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0f52ba]"
        >
          Back to KPI Center
        </button>
      </div>
    );
  }

  if (!snapshot || !consultant) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 shadow-sm">
        <h1 className="text-base font-semibold text-[#191c1e]">Consultant not found</h1>
      </div>
    );
  }

  const isOwn = role === ROLES.CONSULTANT;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col items-start">
          {!isOwn && (
            <button
              type="button"
              onClick={() => navigate('/kpi')}
              className="group inline-flex items-center text-xs font-medium text-[#434653] transition-colors hover:text-[#003c90] sm:text-sm"
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 sm:h-4 sm:w-4" />
              Back to KPI Center
            </button>
          )}
          <div className="mt-2 mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-[#d5e3fc] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#57657a] sm:text-[11px]">
              Period: {snapshot.period}
            </span>
            {snapshot.finalizedAt ? (
              <span className="inline-flex rounded-full bg-[#006544]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#006544]">
                Finalized
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#a16207]">
                Preliminary
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#191c1e] sm:text-3xl">
            {isOwn ? 'My KPI' : consultant.name}
          </h1>
          <p className="mt-1 text-sm text-[#737784]">
            {isOwn
              ? `Snapshot performa KPI Anda untuk periode ${snapshot.period}.`
              : `Detail KPI consultant untuk periode ${snapshot.period}.`}
          </p>
        </div>
        <div
          className={`flex shrink-0 flex-col items-center justify-center rounded-2xl px-6 py-4 ${totalToneClass}`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">KPI Total</span>
          <span className="text-3xl font-bold leading-tight">{snapshot.total.toFixed(1)}%</span>
          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider opacity-80">
            <Calculator className="h-3 w-3" /> Σ(w × c)
          </span>
        </div>
      </header>

      <section>
        <h2 className="mb-3 text-base font-bold text-[#003c90]">4 Dimensi KPI</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {KPI_DIMENSION_KEYS.map((key) => (
            <KpiDimensionCard key={key} dimensionKey={key} score={snapshot.dimensions[key]} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold text-[#003c90]">Trend per Period</h2>
        <KpiTrendChart snapshots={history} />
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold text-[#003c90]">Per-Project Breakdown</h2>
        <p className="mb-3 text-xs text-[#737784]">
          KPI cross-project di-aggregate weighted by jumlah task per project (PRD Section 9.7).
        </p>
        <KpiProjectBreakdown rows={breakdown} />
      </section>

      {snapshot.finalizedAt && snapshot.finalizedBy ? (
        <section className="rounded-xl border border-[#006544]/20 bg-[#4edea3]/10 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold text-[#004b31]">
            <Lock className="h-3.5 w-3.5" />
            Snapshot finalized oleh {snapshot.finalizedBy.name} ({snapshot.finalizedBy.role}) pada{' '}
            {new Date(snapshot.finalizedAt).toLocaleString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
            .
          </p>
        </section>
      ) : canFinalize ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div>
            <p className="text-sm font-bold text-[#a16207]">Snapshot masih preliminary</p>
            <p className="mt-0.5 text-xs text-[#a16207]/80">
              Finalize untuk lock snapshot. Setelah lock, angka tidak akan berubah meski raw data
              mengalami perubahan. Hanya CEO/COO via "manual recompute" yang bisa override.
            </p>
            {finalizeError && (
              <p className="mt-2 rounded-md bg-orange-100 px-2 py-1 text-xs text-[#c2410c]">{finalizeError}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleFinalize}
            disabled={isFinalizing}
            className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-5 py-2 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isFinalizing ? 'Finalizing...' : 'Finalize Snapshot'}
          </button>
        </section>
      ) : null}

      {canRecompute && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#003c90]/20 bg-[#d5e3fc]/30 p-4">
          <div>
            <p className="text-sm font-bold text-[#003c90]">Manual Recompute (audit-logged)</p>
            <p className="mt-0.5 text-xs text-[#003c90]/80">
              {snapshot.finalizedAt
                ? 'Override snapshot finalized dengan rekalkulasi terbaru — gunakan hanya untuk koreksi data masal. Audit info finalize tetap di-pertahankan.'
                : 'Rekalkulasi snapshot preliminary dari raw data terbaru — preserve hasil bila ada perubahan upstream.'}
            </p>
            {recomputeFeedback && (
              <p
                className={
                  recomputeFeedback.kind === 'success'
                    ? 'mt-2 rounded-md bg-[#4edea3]/15 px-2 py-1 text-xs text-[#004b31]'
                    : 'mt-2 rounded-md bg-orange-100 px-2 py-1 text-xs text-[#c2410c]'
                }
              >
                {recomputeFeedback.message}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleRecompute}
            disabled={isRecomputing}
            className="inline-flex items-center gap-2 rounded-lg border border-[#003c90]/30 bg-white px-4 py-2 text-sm font-bold text-[#003c90] shadow-sm transition-colors hover:bg-[#d5e3fc]/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRecomputing ? 'animate-spin' : ''}`} />
            {isRecomputing ? 'Recomputing...' : 'Recompute Snapshot'}
          </button>
        </section>
      )}
    </div>
  );
};
