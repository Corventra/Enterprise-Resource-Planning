import { Award, Gauge, Lock, Unlock } from 'lucide-react';
import type { ConsultantKpiAnalytics } from '../../types/ceo-dashboard.types';
import { formatDashboardNumber } from '../../utils/format-dashboard';
import {
  CeoEmptyState,
  CeoPanel,
  CeoSectionHeader,
  CeoSummaryCard,
  ceoSectionClass
} from './ceo-dashboard-ui';

interface Props {
  data: ConsultantKpiAnalytics;
}

const DIMENSION_META = [
  { key: 'task_completion', label: 'Task Completion', weight: '35%', color: 'bg-[#003c90]' },
  { key: 'timeliness', label: 'Timeliness', weight: '25%', color: 'bg-[#0f52ba]' },
  { key: 'update_compliance', label: 'Update Compliance', weight: '15%', color: 'bg-[#737784]' },
  { key: 'output_quality', label: 'Output Quality', weight: '25%', color: 'bg-[#006544]' }
] as const;

const scoreBadge = (score: number) => {
  if (score >= 85) return { label: 'Excellent', cls: 'bg-[#e6f4ef] text-[#006544]' };
  if (score >= 70) return { label: 'Good', cls: 'bg-[#fff7e0] text-[#8a6d00]' };
  return { label: 'Need Improvement', cls: 'bg-[#fdecec] text-[#ba1a1a]' };
};

const PerformerRow = ({ name, value, rank }: { name: string; value: number; rank: number }) => {
  const badge = scoreBadge(value);
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f2f4f6] text-xs font-bold text-[#434653]">
        {rank}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#191c1e]">{name}</span>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.cls}`}>
        {badge.label}
      </span>
      <span className="shrink-0 text-sm font-bold tabular-nums text-[#191c1e]">
        {value.toFixed(1)}
      </span>
    </li>
  );
};

export const CeoConsultantKpiSection = ({ data }: Props) => {
  const { period_status, summary_metrics, dimension_averages, top_performers, bottom_performers } = data;
  const coverageText =
    period_status.total_consultants > 0
      ? `${period_status.snapshot_count}/${period_status.total_consultants} consultant ter-snapshot`
      : `${period_status.snapshot_count} snapshot`;

  const totalBand =
    summary_metrics.excellent_count + summary_metrics.good_count + summary_metrics.need_improvement_count;

  return (
    <section className={ceoSectionClass}>
      <CeoSectionHeader
        title="Consultant KPI"
        description="Performa consultant berdasarkan 4 dimensi (Task Completion, Timeliness, Update Compliance, Output Quality) — Weighted Scoring Method."
        badge={`Period ${period_status.period}`}
      />

      {/* Period status banner */}
      <article
        className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${
          period_status.is_finalized
            ? 'border-[#c8e6d3] bg-[#e6f4ef]'
            : 'border-[#fde8b0] bg-[#fff7e0]'
        }`}
      >
        <div className="flex items-center gap-3">
          {period_status.is_finalized ? (
            <Lock className="h-5 w-5 text-[#006544]" />
          ) : (
            <Unlock className="h-5 w-5 text-[#8a6d00]" />
          )}
          <div>
            <p className="text-sm font-bold text-[#191c1e]">
              {period_status.is_finalized
                ? `Period ${period_status.period} sudah Finalized`
                : `Period ${period_status.period} masih Preliminary`}
            </p>
            <p className="text-xs text-[#737784]">
              {coverageText} · {period_status.finalized_count} finalized
            </p>
          </div>
        </div>
        {!period_status.is_finalized && period_status.snapshot_count > 0 && (
          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#8a6d00] ring-1 ring-[#fde8b0]">
            Belum semua snapshot di-lock — CEO finalize via /settings/kpi
          </span>
        )}
      </article>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CeoSummaryCard
          title="Avg KPI Score"
          value={summary_metrics.avg_total_score.toFixed(1)}
          icon={Gauge}
          accent="from-[#003c90] to-[#0f52ba]"
          footer={<span className="text-xs text-[#737784]">Rata-rata organisasi (0-100)</span>}
        />
        <CeoSummaryCard
          title="Excellent (≥ 85)"
          value={formatDashboardNumber(summary_metrics.excellent_count)}
          icon={Award}
          accent="from-[#006544] to-[#1a8a6a]"
          footer={
            <span className="text-xs text-[#737784]">
              {totalBand > 0 ? `${Math.round((summary_metrics.excellent_count / totalBand) * 100)}% dari snapshot` : '—'}
            </span>
          }
        />
        <CeoSummaryCard
          title="Good (70-84)"
          value={formatDashboardNumber(summary_metrics.good_count)}
          icon={Award}
          accent="from-[#8a6d00] to-[#c49a00]"
          footer={
            <span className="text-xs text-[#737784]">
              {totalBand > 0 ? `${Math.round((summary_metrics.good_count / totalBand) * 100)}% dari snapshot` : '—'}
            </span>
          }
        />
        <CeoSummaryCard
          title="Need Improvement (< 70)"
          value={formatDashboardNumber(summary_metrics.need_improvement_count)}
          icon={Award}
          accent="from-[#ba1a1a] to-[#d94a4a]"
          footer={
            <span className="text-xs text-[#737784]">
              {totalBand > 0 ? `${Math.round((summary_metrics.need_improvement_count / totalBand) * 100)}% perlu intervensi` : '—'}
            </span>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Dimension breakdown */}
        <CeoPanel
          className="xl:col-span-1"
          title="Rata-Rata per Dimensi"
          subtitle="Capaian 0-100 per dimensi KPI"
        >
          {totalBand === 0 ? (
            <CeoEmptyState message="Belum ada snapshot KPI di periode ini." />
          ) : (
            <ul className="space-y-4">
              {DIMENSION_META.map((dim) => {
                const value = dimension_averages[dim.key];
                return (
                  <li key={dim.key}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#434653]">
                        {dim.label}{' '}
                        <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[#737784]">
                          bobot {dim.weight}
                        </span>
                      </span>
                      <span className="text-[#737784] tabular-nums">{value.toFixed(1)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#f0f2f5]">
                      <div
                        className={`h-full ${dim.color}`}
                        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CeoPanel>

        {/* Top performers */}
        <CeoPanel
          className="xl:col-span-1"
          title="Top 5 Performer"
          subtitle="Total score tertinggi periode ini"
        >
          {top_performers.length === 0 ? (
            <CeoEmptyState message="Belum ada snapshot." />
          ) : (
            <ul className="divide-y divide-[#f0f2f5]">
              {top_performers.map((p, idx) => (
                <PerformerRow key={p.user_id ?? p.name} rank={idx + 1} name={p.name} value={p.value} />
              ))}
            </ul>
          )}
        </CeoPanel>

        {/* Bottom performers */}
        <CeoPanel
          className="xl:col-span-1"
          title="Bottom 5 — Need Attention"
          subtitle="Total score terendah — pertimbangkan intervensi"
        >
          {bottom_performers.length === 0 ? (
            <CeoEmptyState message="Belum ada snapshot." />
          ) : (
            <ul className="divide-y divide-[#f0f2f5]">
              {bottom_performers.map((p, idx) => (
                <PerformerRow key={p.user_id ?? p.name} rank={idx + 1} name={p.name} value={p.value} />
              ))}
            </ul>
          )}
        </CeoPanel>
      </div>
    </section>
  );
};
