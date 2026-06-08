import { AlertOctagon, Briefcase, Clock, Gauge, ListChecks, Lock, Star, Unlock } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  CeoDashboardSkeleton,
  CeoEmptyState,
  CeoPanel,
  CeoSectionHeader,
  CeoSummaryCard,
  ceoPanelClass,
  ceoSectionClass
} from '../components/ceo/ceo-dashboard-ui';
import { DashboardFilters } from '../components/dashboard-filters';
import { InsightsPanel } from '../components/analytics/insights-panel';
import { KpiTrendChart } from '../components/analytics/kpi-trend-chart';
import { DimensionVsPeerChart } from '../components/analytics/dimension-vs-peer-chart';
import { useConsultantDashboard } from '../hooks/use-consultant-dashboard';
import type { ConsultantDashboardFiltersQuery } from '../types/consultant-dashboard.types';
import { formatDashboardDate, formatDashboardNumber } from '../utils/format-dashboard';

const milestoneStatusBadge: Record<string, string> = {
  Pending: 'bg-[#e0e3e5] text-[#434653]',
  'In Progress': 'bg-[#d5e3fc] text-[#003c90]',
  Done: 'bg-[#006544]/15 text-[#006544]',
  Blocked: 'bg-orange-100 text-[#c2410c]'
};

const DIMENSION_META = [
  { key: 'task_completion' as const, label: 'Task Completion', weight: '35%', color: 'bg-[#003c90]' },
  { key: 'timeliness' as const, label: 'Timeliness', weight: '25%', color: 'bg-[#0f52ba]' },
  { key: 'update_compliance' as const, label: 'Update Compliance', weight: '15%', color: 'bg-[#737784]' },
  { key: 'output_quality' as const, label: 'Output Quality', weight: '25%', color: 'bg-[#006544]' }
];

export const ConsultantDashboardPage = () => {
  const [filters, setFilters] = useState<ConsultantDashboardFiltersQuery>({
    period: 'this_month',
    comparison: 'prev_month'
  });
  const stable = useMemo(() => filters, [filters]);
  const { data, loading, error, refetch } = useConsultantDashboard(stable);

  return (
    <div className="space-y-5 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard Konsultan</h1>
          <p className="mt-1 text-sm text-slate-500">
            Milestone Anda, deadline yang mendekat, dan KPI Anda untuk periode ini.
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
          <InsightsPanel insights={data.analytics.insights} title="Insight Personal Anda" />

          {/* Urgent action items at top */}
          <section className={ceoSectionClass}>
            <CeoSectionHeader
              title="Action Items"
              description="Milestone yang sudah overdue dan yang mendekati deadline (≤ 7 hari)."
              badge={`${data.urgent.overdue.length} overdue · ${data.urgent.upcoming.length} upcoming`}
            />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <CeoPanel
                title="Overdue"
                subtitle="Target date sudah lewat — prioritas tinggi"
                headerRight={<AlertOctagon className="h-4 w-4 text-[#ba1a1a]" />}
              >
                {data.urgent.overdue.length === 0 ? (
                  <CeoEmptyState message="Tidak ada milestone overdue. Good job!" />
                ) : (
                  <ul className="divide-y divide-[#f0f2f5]">
                    {data.urgent.overdue.map((m) => (
                      <li key={m.milestone_id} className="py-2">
                        <p className="truncate text-sm font-semibold text-[#191c1e]">{m.title}</p>
                        <p className="mt-0.5 text-xs text-[#737784]">{m.project_code} · {m.project_name}</p>
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
                subtitle="Deadline mendekat"
                headerRight={<Clock className="h-4 w-4 text-[#8a6d00]" />}
              >
                {data.urgent.upcoming.length === 0 ? (
                  <CeoEmptyState message="Tidak ada deadline dekat." />
                ) : (
                  <ul className="divide-y divide-[#f0f2f5]">
                    {data.urgent.upcoming.map((m) => (
                      <li key={m.milestone_id} className="py-2">
                        <p className="truncate text-sm font-semibold text-[#191c1e]">{m.title}</p>
                        <p className="mt-0.5 text-xs text-[#737784]">{m.project_code} · {m.project_name}</p>
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

          {/* My KPI */}
          <section className={ceoSectionClass}>
            <CeoSectionHeader
              title="My KPI"
              description="Performa Anda berdasarkan 4 dimensi (Task Completion, Timeliness, Update Compliance, Output Quality)."
              badge={`Period ${data.my_kpi.period}`}
            />
            <article
              className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${
                data.my_kpi.is_finalized
                  ? 'border-[#c8e6d3] bg-[#e6f4ef]'
                  : 'border-[#fde8b0] bg-[#fff7e0]'
              }`}
            >
              <div className="flex items-center gap-3">
                {data.my_kpi.is_finalized ? (
                  <Lock className="h-5 w-5 text-[#006544]" />
                ) : (
                  <Unlock className="h-5 w-5 text-[#8a6d00]" />
                )}
                <div>
                  <p className="text-sm font-bold text-[#191c1e]">
                    {data.my_kpi.has_snapshot
                      ? data.my_kpi.is_finalized
                        ? `Snapshot Finalized — period ${data.my_kpi.period}`
                        : `Snapshot Preliminary — period ${data.my_kpi.period}`
                      : `Belum ada snapshot untuk period ${data.my_kpi.period}`}
                  </p>
                  {data.my_kpi.previous && (
                    <p className="text-xs text-[#737784]">
                      Period sebelumnya ({data.my_kpi.previous.period}):{' '}
                      <span className="font-semibold">{data.my_kpi.previous.total_score.toFixed(1)}</span>
                    </p>
                  )}
                </div>
              </div>
            </article>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <CeoSummaryCard
                title="Total KPI Score"
                value={data.my_kpi.has_snapshot ? data.my_kpi.total_score.toFixed(1) : '—'}
                icon={Gauge}
                accent="from-[#003c90] to-[#0f52ba]"
                footer={
                  data.my_kpi.previous ? (
                    <span className="text-xs text-[#737784]">
                      vs {data.my_kpi.previous.period}:{' '}
                      <span className="font-semibold text-[#434653]">
                        {data.my_kpi.previous.total_score.toFixed(1)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-[#737784]">No previous data</span>
                  )
                }
              />
              <CeoPanel className="xl:col-span-2" title="Breakdown 4 Dimensi" subtitle="Capaian 0-100 per dimensi">
                {!data.my_kpi.has_snapshot ? (
                  <CeoEmptyState
                    message="Belum ada snapshot."
                    hint="Snapshot akan tersedia setelah CEO finalize period atau computed preliminary di halaman KPI."
                  />
                ) : (
                  <ul className="space-y-4">
                    {DIMENSION_META.map((dim) => {
                      const value = data.my_kpi.dimensions[dim.key];
                      return (
                        <li key={dim.key}>
                          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-[#434653]">
                              {dim.label}{' '}
                              <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[#737784]">
                                bobot {dim.weight}
                              </span>
                            </span>
                            <span className="tabular-nums text-[#737784]">{value.toFixed(1)}</span>
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
            </div>
          </section>

          {/* My Projects */}
          <section className={ceoSectionClass}>
            <CeoSectionHeader
              title="My Projects"
              description="Project yang Anda di-assign sebagai consultant."
              badge={`${data.my_projects.count} project`}
            />
            {data.my_projects.items.length === 0 ? (
              <CeoEmptyState message="Belum di-assign ke project apapun." hint="PM akan assign Anda saat DP project dibayar." />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.my_projects.items.map((p) => (
                  <a key={p.project_id} href={`/projects/${p.project_id}`} className={`${ceoPanelClass} block hover:shadow-md`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-[#737784]">{p.project_code}</p>
                      <span className="shrink-0 rounded-full bg-[#dae8fc] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#003c90]">
                        {p.my_level}
                      </span>
                    </div>
                    <h3 className="mt-1 truncate text-sm font-bold text-[#191c1e]">{p.project_name}</h3>
                    <p className="mt-0.5 truncate text-xs text-[#737784]">
                      {p.client} · PM: {p.pm_name || '—'}
                    </p>
                    <p className="mt-2 text-xs text-[#737784]">
                      {p.milestones_owned} milestone Anda owned (dari {p.milestones_total})
                    </p>
                  </a>
                ))}
              </div>
            )}
          </section>

          {/* My Milestones */}
          <section className={ceoSectionClass}>
            <CeoSectionHeader
              title="My Milestones"
              description="Daftar lengkap milestone yang Anda owned, terurut prioritas (Blocked → In Progress → Pending → Done)."
              badge={`${data.my_milestones.count} milestone`}
            />
            <article className={ceoPanelClass}>
              {data.my_milestones.items.length === 0 ? (
                <CeoEmptyState message="Belum ada milestone." />
              ) : (
                <ul className="divide-y divide-[#f0f2f5]">
                  {data.my_milestones.items.map((m) => (
                    <li key={m.milestone_id} className="flex items-center gap-3 py-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f2f4f6] text-[#434653]">
                        <ListChecks className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#191c1e]">{m.title}</p>
                        <p className="mt-0.5 truncate text-xs text-[#737784]">
                          {m.project_code} · target: {formatDashboardDate(m.target_date)}
                        </p>
                      </div>
                      {m.is_overdue && (
                        <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#c2410c]">
                          OVERDUE
                        </span>
                      )}
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          milestoneStatusBadge[m.status] ?? 'bg-[#eceef0] text-[#434653]'
                        }`}
                      >
                        {m.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>

          {/* Recent ratings */}
          <section className={ceoSectionClass}>
            <CeoSectionHeader
              title="Recent Quality Ratings"
              description="Rating terbaru dari PM untuk milestone yang Anda selesaikan."
              badge={`${data.recent_ratings.items.length} rating`}
            />
            <article className={ceoPanelClass}>
              {data.recent_ratings.items.length === 0 ? (
                <CeoEmptyState
                  message="Belum ada rating dari PM."
                  hint="Rating akan muncul setelah PM review milestone yang sudah Done."
                />
              ) : (
                <ul className="divide-y divide-[#f0f2f5]">
                  {data.recent_ratings.items.map((r) => (
                    <li key={r.milestone_id} className="flex items-center gap-3 py-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff7e0] text-[#8a6d00]">
                        <Star className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#191c1e]">{r.title}</p>
                        <p className="mt-0.5 truncate text-xs text-[#737784]">
                          {r.project_code} · {r.project_name} · oleh {r.pm_name || '—'}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold tabular-nums text-[#191c1e]">
                          {r.quality_rating}/5
                        </p>
                        <p className="text-xs text-[#737784]">{formatDashboardNumber(r.revision_count)} revisi</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>

          {/* Summary card showing total assigned projects */}
          <section className={ceoSectionClass}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <CeoSummaryCard
                title="Assigned Projects"
                value={formatDashboardNumber(data.my_projects.count)}
                icon={Briefcase}
                accent="from-[#0f52ba] to-[#2d6fd4]"
              />
              <CeoSummaryCard
                title="Milestones Owned"
                value={formatDashboardNumber(data.my_milestones.count)}
                icon={ListChecks}
                accent="from-[#434653] to-[#5c6070]"
              />
              <CeoSummaryCard
                title="Action Items"
                value={formatDashboardNumber(data.urgent.overdue.length + data.urgent.upcoming.length)}
                icon={AlertOctagon}
                accent="from-[#8a6d00] to-[#c49a00]"
                footer={<span className="text-xs text-[#737784]">Overdue + upcoming</span>}
              />
            </div>
          </section>

          {/* Analytics — own trend + self vs peer */}
          <section className={ceoSectionClass}>
            <CeoSectionHeader
              title="Analitik KPI Anda"
              description="Tren skor pribadi lintas periode dan perbandingan dengan rata-rata kolega satu department."
              badge="6 periode terakhir"
            />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <CeoPanel
                title="Tren KPI Saya"
                subtitle="Skor 4 dimensi per periode (TC / TM / UC / OQ)"
              >
                <KpiTrendChart data={data.analytics.kpi_trend} mode="dimensions" />
              </CeoPanel>
              <CeoPanel
                title="Anda vs Rata-rata Department"
                subtitle="Perbandingan capaian periode ini terhadap kolega satu department"
              >
                <DimensionVsPeerChart data={data.analytics.dimension_vs_peer} />
              </CeoPanel>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
};
