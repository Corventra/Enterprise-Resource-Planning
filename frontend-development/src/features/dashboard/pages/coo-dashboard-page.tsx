import { AlertOctagon, Clock, FileText, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CeoConsultantKpiSection } from '../components/ceo/ceo-consultant-kpi-section';
import {
  CeoDashboardSkeleton,
  CeoEmptyState,
  CeoPanel,
  CeoSectionHeader,
  ceoPanelClass,
  ceoSectionClass
} from '../components/ceo/ceo-dashboard-ui';
import { CeoProjectOperationsSection } from '../components/ceo/ceo-project-operations-section';
import { InsightsPanel } from '../components/analytics/insights-panel';
import { KpiTrendChart } from '../components/analytics/kpi-trend-chart';
import { ProjectVelocityChart } from '../components/analytics/project-velocity-chart';
import { DashboardFilters } from '../components/dashboard-filters';
import { useCooDashboard } from '../hooks/use-coo-dashboard';
import type { CooDashboardFiltersQuery, MilestoneRiskItem } from '../types/coo-dashboard.types';
import { formatDashboardDate, formatDashboardNumber } from '../utils/format-dashboard';

const formatRiskDays = (item: MilestoneRiskItem, mode: 'overdue' | 'upcoming') => {
  if (mode === 'overdue') {
    return `${item.days_overdue ?? 0} hari lewat`;
  }
  return `${item.days_until ?? 0} hari lagi`;
};

export const CooDashboardPage = () => {
  const [filters, setFilters] = useState<CooDashboardFiltersQuery>({
    period: 'this_month',
    comparison: 'prev_month'
  });
  const stable = useMemo(() => filters, [filters]);
  const { data, loading, error, refetch } = useCooDashboard(stable);

  return (
    <div className="space-y-5 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard COO</h1>
          <p className="mt-1 text-sm text-slate-500">
            Helicopter view delivery untuk department yang Anda pegang — project operations,
            handover queue, KPI consultant, dan alert lintas-modul (DP, milestone risk).
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
          <InsightsPanel insights={data.analytics.insights} title="Insight Otomatis — Department Anda" />

          {/* Handover queue at top — actionable for COO */}
          <section className={ceoSectionClass}>
            <CeoSectionHeader
              title="Handover Queue"
              description="Handover APPROVED yang belum di-assign PM. Klik baris untuk assign."
              badge={`${data.handover_queue.count} pending`}
            />
            <article className={ceoPanelClass}>
              {data.handover_queue.items.length === 0 ? (
                <CeoEmptyState
                  message="Tidak ada handover yang menunggu."
                  hint="Semua handover APPROVED sudah ter-assign PM."
                />
              ) : (
                <ul className="divide-y divide-[#f0f2f5]">
                  {data.handover_queue.items.map((h) => (
                    <li key={h.handover_id} className="flex items-center gap-3 py-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#dae8fc] text-[#003c90]">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#191c1e]">
                          {h.handover_code} · {h.project_title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-[#737784]">
                          {h.client_name} · {h.department_name || '—'} · approved {formatDashboardDate(h.approved_at)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#c2410c]">
                        {h.days_pending} hari menunggu
                      </span>
                      <a
                        href={`/handover/${h.handover_id}`}
                        className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#003c90] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                      >
                        <UserPlus className="h-3 w-3" />
                        Assign
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>

          <CeoProjectOperationsSection
            data={data.project_operations}
            comparisonLabel={data.meta.comparison_label}
          />

          <CeoConsultantKpiSection data={data.consultant_kpi} />

          {/* Milestones at risk */}
          <section className={ceoSectionClass}>
            <CeoSectionHeader
              title="Milestones at Risk"
              description="Milestone yang sudah overdue atau mendekati deadline (≤ 7 hari) — perlu escalation ke PM."
              badge={`${data.milestones_at_risk.overdue.length} overdue · ${data.milestones_at_risk.upcoming.length} upcoming`}
            />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <CeoPanel
                title="Overdue"
                subtitle="Target date sudah lewat, status belum Done"
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
                          {m.project_code} · PM: {m.pm_name || '—'} · Owner: {m.owner_name || '—'}
                        </p>
                        <p className="mt-1 text-xs">
                          <span className="font-bold text-[#ba1a1a]">{formatRiskDays(m, 'overdue')}</span>
                          <span className="ml-2 text-[#737784]">target: {formatDashboardDate(m.target_date)}</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CeoPanel>
              <CeoPanel
                title="Upcoming (≤ 7 hari)"
                subtitle="Mendekati deadline"
                headerRight={<Clock className="h-4 w-4 text-[#8a6d00]" />}
              >
                {data.milestones_at_risk.upcoming.length === 0 ? (
                  <CeoEmptyState message="Tidak ada milestone yang mendekati deadline." />
                ) : (
                  <ul className="divide-y divide-[#f0f2f5]">
                    {data.milestones_at_risk.upcoming.map((m) => (
                      <li key={m.milestone_id} className="py-2">
                        <p className="truncate text-sm font-semibold text-[#191c1e]">{m.title}</p>
                        <p className="mt-0.5 text-xs text-[#737784]">
                          {m.project_code} · PM: {m.pm_name || '—'} · Owner: {m.owner_name || '—'}
                        </p>
                        <p className="mt-1 text-xs">
                          <span className="font-bold text-[#8a6d00]">{formatRiskDays(m, 'upcoming')}</span>
                          <span className="ml-2 text-[#737784]">target: {formatDashboardDate(m.target_date)}</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CeoPanel>
            </div>
          </section>

          {/* DP Unpaid */}
          <section className={ceoSectionClass}>
            <CeoSectionHeader
              title="DP Unpaid Alert"
              description="Project yang sudah lahir tapi belum bisa mulai karena DP belum terkonfirmasi modul Invoice."
              badge={`${data.dp_unpaid_alert.count} project`}
            />
            <article className={ceoPanelClass}>
              {data.dp_unpaid_alert.items.length === 0 ? (
                <CeoEmptyState
                  message="Semua project sudah lewat tahap DP."
                  hint="Tidak ada blok cross-module dari modul Invoice."
                />
              ) : (
                <ul className="divide-y divide-[#f0f2f5]">
                  {data.dp_unpaid_alert.items.map((p) => (
                    <li key={p.project_id} className="flex items-center gap-3 py-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-[#c2410c]">
                        <AlertOctagon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#191c1e]">
                          {p.project_code} · {p.project_name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-[#737784]">
                          {p.client_name} · PM: {p.pm_name || '—'} · {p.department_name || '—'}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#c2410c]">
                        {formatDashboardNumber(p.days_waiting)} hari menunggu DP
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>

          {/* Analytics trend section */}
          <section className={ceoSectionClass}>
            <CeoSectionHeader
              title="Analitik Tren"
              description="Pola KPI consultant department dan velocity project."
              badge="6 periode terakhir"
            />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <CeoPanel
                title="KPI Department"
                subtitle="Rata-rata 4 dimensi (bobot 35/25/15/25)"
              >
                <KpiTrendChart data={data.analytics.kpi_trend} mode="dimensions" />
              </CeoPanel>
              <CeoPanel
                title="Project Velocity"
                subtitle="Created vs Completed per bulan (dept-scoped)"
              >
                <ProjectVelocityChart data={data.analytics.project_velocity} />
              </CeoPanel>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
};
