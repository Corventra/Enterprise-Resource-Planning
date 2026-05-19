import { ArrowLeft, CheckCircle2, Hourglass, Lock, Save, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { PERMISSIONS, ROLE_LABELS, ROLES } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import { kpiConfigService, type PendingMajorChange } from '../../kpi/services/kpi-config-service';
import {
  KPI_DIMENSION_DESCRIPTIONS,
  KPI_DIMENSION_KEYS,
  KPI_DIMENSION_LABELS,
  type KpiDimensionKey,
  type KpiPeriodConfig
} from '../../kpi/types/kpi.types';

const sectionClass = 'rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#eceef0]';
const sectionTitleClass = 'mb-4 text-lg font-bold text-[#003c90]';
const labelClass = 'text-xs font-bold uppercase tracking-wider text-[#737784]';
const inputClass =
  'w-full rounded-lg border border-[#c3c6d5] bg-white px-3 py-2 text-sm text-[#191c1e] focus:border-[#003c90]/40 focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20 disabled:bg-[#f2f4f6] disabled:text-[#737784]';

export const KpiConfigPage = () => {
  const navigate = useNavigate();
  const { role, user, can } = useAuth();
  const [config, setConfig] = useState<KpiPeriodConfig | null>(null);
  const [draft, setDraft] = useState<KpiPeriodConfig | null>(null);
  const [pending, setPending] = useState<PendingMajorChange | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  // Setelah HRD dihapus (post-bimbingan): CEO = primary owner KPI framework.
  // CEO submit perubahan bobot + approve sendiri (dua step deliberate konfirmasi).
  const canEdit = can(PERMISSIONS.KPI_CONFIGURE) && role === ROLES.CEO;
  const canApproveMajor = role === ROLES.CEO;

  useEffect(() => {
    void (async () => {
      const cur = await kpiConfigService.getCurrent();
      const pen = await kpiConfigService.getPending();
      setConfig(cur);
      setDraft(JSON.parse(JSON.stringify(cur)) as KpiPeriodConfig);
      setPending(pen);
    })();
  }, []);

  // Bobot dalam UI sebagai integer 0-100, tetapi disimpan sebagai 0-1.
  const weightSumPct = useMemo(() => {
    if (!draft) return 0;
    return KPI_DIMENSION_KEYS.reduce((sum, key) => sum + Math.round(draft.weights[key] * 100), 0);
  }, [draft]);

  const isWeightValid = weightSumPct === 100;
  const hasChanges = useMemo(() => {
    if (!draft || !config) return false;
    return JSON.stringify(draft) !== JSON.stringify(config);
  }, [draft, config]);

  const handleWeightChange = (key: KpiDimensionKey, pct: number) => {
    if (!draft) return;
    const clamped = Math.max(0, Math.min(100, pct));
    setDraft({
      ...draft,
      weights: { ...draft.weights, [key]: clamped / 100 }
    });
  };

  const handleSave = async () => {
    if (!draft || !user || !role || !canEdit) return;
    if (!isWeightValid) {
      setFeedback({ kind: 'error', message: `Total bobot harus 100% (saat ini ${weightSumPct}%).` });
      return;
    }
    if (pending) {
      setFeedback({
        kind: 'error',
        message: 'Masih ada pending major change yang menunggu CEO approve. Tunggu approve/reject dulu.'
      });
      return;
    }
    setIsSaving(true);
    setFeedback(null);
    try {
      const result = await kpiConfigService.update(draft, { id: String(user.id ?? ''), name: user.name, role });
      setConfig(result.current);
      setPending(result.pending);
      setDraft(JSON.parse(JSON.stringify(result.current)) as KpiPeriodConfig);
      setFeedback({
        kind: 'success',
        message: result.pending
          ? 'Threshold tersimpan. Perubahan bobot dimensi (major change) menunggu approve CEO.'
          : 'Konfigurasi tersimpan.'
      });
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Gagal menyimpan. Coba lagi.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprovePending = async () => {
    if (!user || !role || !canApproveMajor || !pending) return;
    setIsApproving(true);
    setFeedback(null);
    try {
      const updated = await kpiConfigService.approveMajorChange({
        id: String(user.id ?? ''),
        name: user.name,
        role
      });
      setConfig(updated);
      setDraft(JSON.parse(JSON.stringify(updated)) as KpiPeriodConfig);
      setPending(null);
      setFeedback({ kind: 'success', message: 'Pending major change di-approve dan effective.' });
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Gagal approve. Coba lagi.'
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectPending = async () => {
    if (!user || !role || !canApproveMajor || !pending) return;
    setIsApproving(true);
    setFeedback(null);
    try {
      await kpiConfigService.rejectMajorChange({ id: String(user.id ?? ''), name: user.name, role });
      setPending(null);
      setFeedback({ kind: 'success', message: 'Pending major change di-reject. Bobot lama tetap effective.' });
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Gagal reject. Coba lagi.'
      });
    } finally {
      setIsApproving(false);
    }
  };

  if (!config || !draft) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
        Loading KPI configuration...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col items-start gap-2">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="group inline-flex items-center text-xs font-medium text-[#434653] transition-colors hover:text-[#003c90] sm:text-sm"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 sm:h-4 sm:w-4" />
          Back to Settings
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3 w-full">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">KPI Configuration</h1>
            <p className="mt-1 text-sm text-slate-500">
              Bobot dimensi, threshold, dan periode penilaian. Berlaku ke seluruh kalkulasi snapshot.
            </p>
          </div>
          {!canEdit && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eceef0] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#434653]">
              <Lock className="h-3.5 w-3.5" />
              View-only ({role && ROLE_LABELS[role]})
            </span>
          )}
        </div>
      </header>

      {pending && (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-5">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold text-[#a16207]">
                <Hourglass className="h-4 w-4" />
                Pending Major Change — Menunggu CEO Approve
              </p>
              <p className="mt-1 text-xs text-[#a16207]/80">
                Submitted oleh <strong>{pending.proposedBy.name}</strong> ({ROLE_LABELS[pending.proposedBy.role]}) pada{' '}
                {new Date(pending.proposedAt).toLocaleString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                .
              </p>
            </div>
            {canApproveMajor && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRejectPending}
                  disabled={isApproving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#c2410c]/40 bg-white px-3 py-1.5 text-xs font-bold text-[#c2410c] transition-colors hover:bg-orange-50 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={handleApprovePending}
                  disabled={isApproving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#003c90] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isApproving ? 'Approving...' : 'Approve'}
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {KPI_DIMENSION_KEYS.map((key) => {
              const currentPct = Math.round((config?.weights[key] ?? 0) * 100);
              const proposedPct = Math.round(pending.proposed.weights[key] * 100);
              const diff = proposedPct - currentPct;
              return (
                <div key={key} className="rounded-lg bg-white p-3 ring-1 ring-amber-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">
                    {KPI_DIMENSION_LABELS[key]}
                  </p>
                  <p className="mt-1 text-sm">
                    <span className="font-medium text-[#737784] line-through">{currentPct}%</span>{' '}
                    <span className="font-bold text-[#a16207]">→ {proposedPct}%</span>
                  </p>
                  {diff !== 0 && (
                    <p className={`text-[10px] font-semibold ${diff > 0 ? 'text-[#006544]' : 'text-[#c2410c]'}`}>
                      {diff > 0 ? '+' : ''}
                      {diff} pp
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className={sectionClass}>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={sectionTitleClass}>Bobot Dimensi</h2>
          <p
            className={`text-sm font-bold ${
              isWeightValid ? 'text-[#006544]' : 'text-[#c2410c]'
            }`}
          >
            Total: {weightSumPct}%{' '}
            <span className="text-[#737784]">{isWeightValid ? '· OK' : '· harus 100%'}</span>
          </p>
        </div>
        <p className="mb-4 text-xs text-[#737784]">
          Perubahan bobot dimensi adalah <strong>major change</strong> — masuk pending state setelah
          submit, lalu CEO approve sendiri sebagai konfirmasi audit-trail. Threshold operational di
          bawah dapat di-adjust langsung tanpa pending.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {KPI_DIMENSION_KEYS.map((key) => (
            <div key={key} className="rounded-xl border border-[#eceef0] bg-[#f9fafb] p-4">
              <p className={labelClass}>{KPI_DIMENSION_LABELS[key]}</p>
              <p className="mt-0.5 mb-3 text-[11px] text-[#737784]">{KPI_DIMENSION_DESCRIPTIONS[key]}</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={Math.round(draft.weights[key] * 100)}
                  onChange={(event) => handleWeightChange(key, Number(event.target.value) || 0)}
                  disabled={!canEdit}
                  className={inputClass}
                  aria-label={`Bobot ${KPI_DIMENSION_LABELS[key]}`}
                />
                <span className="text-sm font-bold text-[#737784]">%</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Threshold Operational</h2>
        <p className="mb-4 text-xs text-[#737784]">
          Threshold ini dapat di-adjust langsung tanpa masuk pending approval.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-[#eceef0] bg-[#f9fafb] p-4">
            <p className={labelClass}>On-Time Tolerance (hari)</p>
            <p className="mt-0.5 mb-3 text-[11px] text-[#737784]">
              Task selesai ≤ tolerance dari targetDate dianggap tepat waktu (Timeliness dimension).
            </p>
            <input
              type="number"
              min={0}
              max={30}
              value={draft.onTimeToleranceDays}
              onChange={(event) =>
                setDraft({ ...draft, onTimeToleranceDays: Number(event.target.value) || 0 })
              }
              disabled={!canEdit}
              className={inputClass}
            />
          </div>
          <div className="rounded-xl border border-[#eceef0] bg-[#f9fafb] p-4">
            <p className={labelClass}>Update Gap Target (hari)</p>
            <p className="mt-0.5 mb-3 text-[11px] text-[#737784]">
              Target maksimum hari antar update — Update Compliance = target/actual_avg (cost indicator).
            </p>
            <input
              type="number"
              min={1}
              max={30}
              value={draft.updateGapTargetDays}
              onChange={(event) =>
                setDraft({ ...draft, updateGapTargetDays: Number(event.target.value) || 1 })
              }
              disabled={!canEdit}
              className={inputClass}
            />
          </div>
          <div className="rounded-xl border border-[#eceef0] bg-[#f9fafb] p-4">
            <p className={labelClass}>Periode Penilaian</p>
            <p className="mt-0.5 mb-3 text-[11px] text-[#737784]">
              Frekuensi snapshot dan finalize. Default monthly.
            </p>
            <select
              value={draft.period}
              onChange={(event) =>
                setDraft({ ...draft, period: event.target.value as 'monthly' | 'quarterly' })
              }
              disabled={!canEdit}
              className={inputClass}
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
          <div className="rounded-xl border border-[#eceef0] bg-[#f9fafb] p-4">
            <p className={labelClass}>Quality Rating Scale</p>
            <p className="mt-0.5 mb-3 text-[11px] text-[#737784]">
              Locked di 1–5 Likert (basis akademis tesis).
            </p>
            <input type="number" value={5} disabled className={inputClass} />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Audit Info</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <p className={labelClass}>Effective From</p>
            <p className="mt-1 text-sm font-semibold text-[#191c1e]">{config.effectiveFrom}</p>
          </div>
          <div>
            <p className={labelClass}>Approved By (CEO)</p>
            <p className="mt-1 text-sm font-semibold text-[#191c1e]">
              {config.approvedBy ? config.approvedBy.name : <span className="text-[#a16207]">Awaiting approval</span>}
            </p>
            <p className="text-xs text-[#737784]">
              {config.approvedBy && config.approvedBy.role}
            </p>
          </div>
          <div>
            <p className={labelClass}>Approved At</p>
            <p className="mt-1 text-sm font-semibold text-[#191c1e]">
              {config.approvedAt
                ? new Date(config.approvedAt).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })
                : '—'}
            </p>
          </div>
        </div>
      </section>

      {feedback && (
        <div
          className={
            feedback.kind === 'success'
              ? 'rounded-lg border border-[#006544]/30 bg-[#4edea3]/15 px-4 py-3 text-sm text-[#004b31]'
              : 'rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-[#c2410c]'
          }
        >
          {feedback.message}
        </div>
      )}

      {canEdit && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            disabled={!hasChanges || isSaving}
            onClick={() => setDraft(JSON.parse(JSON.stringify(config)) as KpiPeriodConfig)}
            className="rounded-lg border border-[#c3c6d5] bg-white px-4 py-2 text-sm font-semibold text-[#191c1e] transition-colors hover:bg-[#f2f4f6] disabled:opacity-50"
          >
            Discard Changes
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || !isWeightValid || isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-5 py-2 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      )}
    </div>
  );
};
