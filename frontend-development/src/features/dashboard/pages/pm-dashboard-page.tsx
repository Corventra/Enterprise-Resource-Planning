import {
  AlertOctagon,
  AlertTriangle,
  Award,
  Briefcase,
  CheckCircle2,
  Clock,
  Star
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  CeoDashboardSkeleton,
  CeoEmptyState,
  CeoMetricDeltaFooter,
  CeoPanel,
  CeoSectionHeader,
  CeoSummaryCard,
  ceoPanelClass,
  ceoSectionClass
} from '../components/ceo/ceo-dashboard-ui';
import { DashboardFilters } from '../components/dashboard-filters';
import { InsightsPanel } from '../components/analytics/insights-panel';
import { KpiTrendChart } from '../components/analytics/kpi-trend-chart';
import { ProjectVelocityChart } from '../components/analytics/project-velocity-chart';
import { RatingDistributionChart } from '../components/analytics/rating-distribution-chart';
import { usePmDashboard } from '../hooks/use-pm-dashboard';
import type { PmDashboardFiltersQuery } from '../types/pm-dashboard.types';
import { formatDashboardDate, formatDashboardNumber } from '../utils/format-dashboard';

const statusBadgeClass: Record<string, string> = {
  'Awaiting Consultant': 'bg-amber-100 text-[#a16207]',
  'In Progress': 'bg-[#d5e3fc] text-[#003c90]',
  'On Hold': 'bg-[#e0e3e5] text-[#434653]',
  Completed: 'bg-[#006544]/15 text-[#006544]',
  Cancelled: 'bg-orange-100 text-[#c2410c]'
};

const scoreBadge = (score: number | null) => {
  if (score == null) return { label: 'No snapshot', cls: 'bg-[#eceef0] text-[#434653]' };
  if (score >= 85) return { label: 'Excellent', cls: 'bg-[#e6f4ef] text-[#006544]' };
  if (score >= 70) return { label: 'Good', cls: 'bg-[#fff7e0] text-[#8a6d00]' };
  return { label: 'Need Attention', cls: 'bg-[#fdecec] text-[#ba1a1a]' };
};

export const PmDashboardPage = () => {
  const [filters, setFilters] = useState<PmDashboardFiltersQuery>({
    period: 'this_month',
    comparison: 'prev_month'
  });
  const stable = useMemo(() => filters, [filters]);
  const { data, loading, error, refetch } = usePmDashboard(stable);

  return (
    <div className="space-y-5 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard PM</h1>
          <p className="mt-1 text-sm text-slate-500">
            My projects, action items (milestone Done yang butuh rating), tim consultant, dan
            risk milestones — semua project yang Anda PM-nya.
          </p>
        </div>
      </header>

      <DashboardFilters filters={filters} services={[]} departments={[]} onChange={setFilters} />

      {loading ? <CeoDashboardSkeleton /> : null}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
          <button type="button" onClick={() => void refetch()} className="ml-3 font-bold underline">
            Coba lagi
          </button>
        </div>
      ) : null}

      {data ? (
        <div className="space-y-10">
          <InsightsPanel insights={data.analytics.insights} title="Insight Otomatis — Tim Anda" />

          {/* Summary cards */}
          <section className={ceoSectionClass}>
            <CeoSectionHeader
              title="My Projects Summary"
              description="Snapshot proyek yang Anda PM-nya."
              badge={`${data.my_projects.items.length} total`}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <CeoSummaryCard
                title="Active"
                value={formatDashboardNumber(data.my_projects.summary.active)}
                icon={Briefcase}
                accent="from-[#0f52ba] to-[#2d6fd4]"
                footer={<span className="text-xs text-[#737784]">Status In Progress</span>}
              />
              <CeoSummaryCard
                title="Completed Period Ini"
                value={formatDashboardNumber(data.my_projects.summary.completed_this_period.value)}
                icon={CheckCircle2}
                accent="from-[#006544] to-[#1a8a6a]"
                footer={
                  <CeoMetricDeltaFooter
                    metric={data.my_projects.summary.completed_this_period}
                    comparisonLabel={data.meta.comparison_label}
                    currency={false}
                  />
                }
              />
              <CeoSummaryCard
                title="Awaiting Consultant"
                value={formatDashboardNumber(data.my_projects.summary.awaiting_consultant)}
                icon={Clock}
                accent="from-[#8a6d00] to-[#c49a00]"
                footer={<span className="text-xs text-[#737784]">Belum di-assign consultant</span>}
              />
              <CeoSummaryCard
                title="Blocked by DP"
                value={formatDashboardNumber(data.my_projects.summary.blocked_by_dp)}
                icon={AlertOctagon}
                accent="from-[#ba1a1a] to-[#d94a4a]"
                footer={<span className="text-xs text-[#737784]">Project menunggu DP</span>}
              />
            </div>
          </section>

          {/* Action items: Done milestones pending rating */}
          <section className={ceoSectionClass}>
            <CeoSectionHeader
              title="Action Items — Pending Rating"
              description="Milestone Done yang belum Anda kasih rating. Setiap rating feed KPI Output Quality consultant."
              badge={`${data.action_items.count} milestone`}
            />
            <article className={ceoPanelClass}>
              {data.action_items.items.length === 0 ? (
                <CeoEmptyState
                  message="Semua milestone Done sudah ter-rate."
                  hint="Bagus — KPI Output Quality consultant Anda tetap akurat."
                />
              ) : (
                <ul className="divide-y divide-[#f0f2f5]">
                  {data.action_items.items.map((m) => (
                    <li key={m.milestone_id} className="flex items-center gap-3 py-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff7e0] text-[#8a6d00]">
                        <Star className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#191c1e]">{m.title}</p>
                        <p className="mt-0.5 truncate text-xs text-[#737784]">
                          {m.project_code} · oleh {m.consultant_name || '—'} · selesai {formatDashboardDate(m.completed_at)}
                        </p>
                      </div>
                      <a
                        href={`/projects/${m.project_id}/timeline`}
                        className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#003c90] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                      >
                        Beri rating
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>

          {/* My Projects list */}
          <section className={ceoSectionClass}>
            <CeoSectionHeader title="My Projects" description="Klik kartu untuk masuk ke detail project." />
            {data.my_projects.items.length === 0 ? (
              <CeoEmptyState
                message="Anda belum di-assign sebagai PM project apapun."
                hint="COO akan assign Anda saat handover di-approve."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.my_projects.items.map((p) => {
                  const pct =
                    p.milestones_total > 0
                      ? Math.round((p.milestones_done / p.milestones_total) * 100)
                      : 0;
                  return (
                    <a
                      key={p.project_id}
                      href={`/projects/${p.project_id}`}
                      className={`${ceoPanelClass} block hover:shadow-md`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-[#737784]">{p.project_code}</p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            statusBadgeClass[p.status] ?? 'bg-[#eceef0] text-[#434653]'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <h3 className="mt-1 truncate text-sm font-bold text-[#191c1e]">{p.project_name}</h3>
                      <p className="mt-0.5 truncate text-xs text-[#737784]">
                        {p.client} · {p.department_name || '—'}
                      </p>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#434653]">Milestone progress</span>
                          <span className="text-[#737784]">
                            {p.milestones_done}/{p.milestones_total} · {pct}%
                          </span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#f0f2f5]">
                          <div className="h-full bg-[#006544]" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-[#737784]">
                        {p.consultant_count} consultant · DP {p.dp_payment_status || '—'}
                      </p>
                    </a>
                  );
                })}
              </div>
            )}
          </section>

          {/* Team KPI */}
          <section className={ceoSectionClass}>
            <CeoSectionHeader
              title="Team KPI"
              description="Performa consultant yang Anda kelola pada periode ini."
              badge={`Period ${data.team_kpi.period_status.period}`}
            />
            {data.team_kpi.period_status.team_size === 0 ? (
              <CeoEmptyState message="Anda belum punya tim consultant." />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <CeoSummaryCard
                    title="Avg Team Score"
                    value={data.team_kpi.summary_metrics.avg_total_score.toFixed(1)}
                    icon={Award}
                    accent="from-[#003c90] to-[#0f52ba]"
                    footer={
                      <span className="text-xs text-[#737784]">
                        {data.team_kpi.period_status.snapshot_count}/{data.team_kpi.period_status.team_size} ter-snapshot
                      </span>
                    }
                  />
                  <CeoSummaryCard
                    title="Excellent (≥85)"
                    value={formatDashboardNumber(data.team_kpi.summary_metrics.excellent_count)}
                    icon={Award}
                    accent="from-[#006544] to-[#1a8a6a]"
                  />
                  <CeoSummaryCard
                    title="Good (70-84)"
                    value={formatDashboardNumber(data.team_kpi.summary_metrics.good_count)}
                    icon={Award}
                    accent="from-[#8a6d00] to-[#c49a00]"
                  />
                  <CeoSummaryCard
                    title="Need Improvement (<70)"
                    value={formatDashboardNumber(data.team_kpi.summary_metrics.need_improvement_count)}
                    icon={Award}
                    accent="from-[#ba1a1a] to-[#d94a4a]"
                  />
                </div>
                <CeoPanel title="Team members" subtitle="Sorted by score (desc)" className="mt-4">
                  {data.team_kpi.team_members.length === 0 ? (
                    <CeoEmptyState message="Belum ada snapshot untuk tim Anda." />
                  ) : (
                    <ul className="divide-y divide-[#f0f2f5]">
                      {data.team_kpi.team_members.map((m, idx) => {
                        const badge = scoreBadge(m.total_score);
                        return (
                          <li key={m.user_id} className="flex items-center gap-3 py-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f2f4f6] text-xs font-bold text-[#434653]">
                              {idx + 1}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#191c1e]">
                              {m.name}
                            </span>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.cls}`}>
                              {badge.label}
                            </span>
                            <span className="shrink-0 text-sm font-bold tabular-nums text-[#191c1e]">
                              {m.total_score != null ? m.total_score.toFixed(1) : '—'}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CeoPanel>
              </>
            )}
          </section>

          {/* Milestones at risk (my projects) */}
          <section className={ceoSectionClass}>
            <CeoSectionHeader
              title="Milestones at Risk (My Projects)"
              description="Overdue dan mendekati deadline di project yang Anda PM-nya."
            />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <CeoPanel
                title="Overdue"
                headerRight={<AlertOctagon className="h-4 w-4 text-[#ba1a1a]" />}
              >
                {data.milestones_at_risk.overdue.length === 0 ? (
                  <CeoEmptyState message="Tidak ada milestone overdue." />
                ) : (
                  <ul className="divide-y divide-[#f0f2f5]">
                    {data.milestones_at_risk.overdue.map((m) => (
                      <li key={m.milestone_id} className="py-2">
                        <p className="truncate text-sm font-semibold text-[#191c1e]">{m.title}</p>
                        <p className="mt-0.5 text-xs text-[#737784]">
                          {m.project_code} · owner: {m.owner_name || '—'}
                        </p>
                        <p className="mt-1 text-xs">
                          <span className="font-bold text-[#ba1a1a]">{m.days_overdue} hari lewat</span>
                          <span className="ml-2 text-[#737784]">target: {formatDashboardDate(m.target_date)}</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CeoPanel>
              <CeoPanel
                title="Upcoming (≤ 7 hari)"
                headerRight={<Clock className="h-4 w-4 text-[#8a6d00]" />}
              >
                {data.milestones_at_risk.upcoming.length === 0 ? (
                  <CeoEmptyState message="Tidak ada deadline dekat." />
                ) : (
                  <ul className="divide-y divide-[#f0f2f5]">
                    {data.milestones_at_risk.upcoming.map((m) => (
                      <li key={m.milestone_id} className="py-2">
                        <p className="truncate text-sm font-semibold text-[#191c1e]">{m.title}</p>
                        <p className="mt-0.5 text-xs text-[#737784]">
                          {m.project_code} · owner: {m.owner_name || '—'}
                        </p>
                        <p className="mt-1 text-xs">
                          <span className="font-bold text-[#8a6d00]">{m.days_until} hari lagi</span>
                          <span className="ml-2 text-[#737784]">target: {formatDashboardDate(m.target_date)}</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CeoPanel>
            </div>
          </section>

          {/* DP Blocks */}
          {data.dp_blocks.count > 0 ? (
            <section className={ceoSectionClass}>
              <CeoSectionHeader
                title="DP Block (My Projects)"
                description="Project Anda yang menunggu konfirmasi DP modul Invoice."
                badge={`${data.dp_blocks.count} project`}
              />
              <article className={ceoPanelClass}>
                <ul className="divide-y divide-[#f0f2f5]">
                  {data.dp_blocks.items.map((p) => (
                    <li key={p.project_id} className="flex items-center gap-3 py-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-[#c2410c]">
                        <AlertTriangle className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#191c1e]">
                          {p.project_code} · {p.project_name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-[#737784]">{p.client_name}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#c2410c]">
                        {p.days_waiting} hari menunggu
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            </section>
          ) : null}

          {/* Analytics trend section */}
          <section className={ceoSectionClass}>
            <CeoSectionHeader
              title="Analitik Tim"
              description="Tren KPI team, velocity project, dan pola rating yang Anda berikan."
              badge="6 periode terakhir"
            />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <CeoPanel
                title="KPI Tim per Periode"
                subtitle="Rata-rata consultant yang Anda PM-nya (bobot 35/25/15/25)"
              >
                <KpiTrendChart data={data.analytics.kpi_trend} mode="dimensions" />
              </CeoPanel>
              <CeoPanel
                title="Velocity Project Anda"
                subtitle="Created vs Completed per bulan (scope project Anda)"
              >
                <ProjectVelocityChart data={data.analytics.project_velocity} />
              </CeoPanel>
            </div>
            <CeoPanel
              title="Pola Quality Rating Anda"
              subtitle="Distribusi rating yang Anda berikan ke milestone Done — refleksi kualitas tim"
            >
              <RatingDistributionChart data={data.analytics.rating_distribution} />
            </CeoPanel>
          </section>
        </div>
      ) : null}
    </div>
  );
};
