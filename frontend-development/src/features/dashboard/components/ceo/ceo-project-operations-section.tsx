import { AlertOctagon, Briefcase, CheckCircle2, Clock } from 'lucide-react';
import type { ProjectOperationsAnalytics, ProjectStatusLabel } from '../../types/ceo-dashboard.types';
import { formatDashboardNumber } from '../../utils/format-dashboard';
import { RankedHorizontalBarList } from '../ranked-horizontal-bar-list';
import {
  CeoEmptyState,
  CeoMetricDeltaFooter,
  CeoPanel,
  CeoSectionHeader,
  CeoSummaryCard,
  ceoPanelClass,
  ceoSectionClass
} from './ceo-dashboard-ui';

const statusBarColor: Record<ProjectStatusLabel, string> = {
  'Awaiting Consultant': 'bg-[#c49a00]',
  'In Progress': 'bg-[#0f52ba]',
  'On Hold': 'bg-[#737784]',
  Completed: 'bg-[#006544]',
  Cancelled: 'bg-[#ba1a1a]'
};

interface Props {
  data: ProjectOperationsAnalytics;
  comparisonLabel: string;
}

export const CeoProjectOperationsSection = ({ data, comparisonLabel }: Props) => {
  const totalStatus = data.status_distribution.reduce((sum, r) => sum + r.count, 0);
  const totalOutcome = data.completion_outcome.on_time + data.completion_outcome.delayed;
  const onTimeRate =
    totalOutcome > 0 ? Math.round((data.completion_outcome.on_time / totalOutcome) * 100) : 0;

  return (
    <section className={ceoSectionClass}>
      <CeoSectionHeader
        title="Project Operations"
        description="Monitoring eksekusi post-handover — active, completed, dan project yang masih menunggu konfirmasi DP dari modul Invoice."
        badge="Delivery"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CeoSummaryCard
          title="Active Projects"
          value={formatDashboardNumber(data.summary_metrics.active_projects.value)}
          icon={Briefcase}
          accent="from-[#0f52ba] to-[#2d6fd4]"
          footer={
            <span className="text-xs text-[#737784]">Status In Progress saat ini</span>
          }
        />
        <CeoSummaryCard
          title="Completed Period Ini"
          value={formatDashboardNumber(data.summary_metrics.completed_in_period.value)}
          icon={CheckCircle2}
          accent="from-[#006544] to-[#1a8a6a]"
          footer={
            <CeoMetricDeltaFooter
              metric={data.summary_metrics.completed_in_period}
              comparisonLabel={comparisonLabel}
              currency={false}
            />
          }
        />
        <CeoSummaryCard
          title="Avg Durasi (Hari)"
          value={formatDashboardNumber(data.summary_metrics.avg_duration_days.value)}
          icon={Clock}
          accent="from-[#434653] to-[#5c6070]"
          footer={
            <span className="text-xs text-[#737784]">Start → end project completed</span>
          }
        />
        <CeoSummaryCard
          title="Blocked by DP"
          value={formatDashboardNumber(data.summary_metrics.blocked_by_dp.value)}
          icon={AlertOctagon}
          accent="from-[#8a6d00] to-[#c49a00]"
          footer={
            <span className="text-xs text-[#737784]">
              Project menunggu konfirmasi DP (Modul Invoice)
            </span>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Status Distribution */}
        <CeoPanel
          title="Distribusi Status Project"
          subtitle={`Total ${formatDashboardNumber(totalStatus)} project — snapshot saat ini`}
        >
          {totalStatus === 0 ? (
            <CeoEmptyState message="Belum ada project." />
          ) : (
            <ul className="space-y-3">
              {data.status_distribution.map((row) => {
                const pct = totalStatus > 0 ? (row.count / totalStatus) * 100 : 0;
                return (
                  <li key={row.status}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#434653]">{row.status}</span>
                      <span className="text-[#737784]">
                        {formatDashboardNumber(row.count)} · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#f0f2f5]">
                      <div
                        className={`h-full ${statusBarColor[row.status]}`}
                        style={{ width: `${pct.toFixed(1)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CeoPanel>

        {/* On-time vs Delayed */}
        <CeoPanel
          title="Completion Outcome"
          subtitle="Project Completed di periode ini — on-time vs delayed (vs target end date handover)"
        >
          {totalOutcome === 0 ? (
            <CeoEmptyState
              message="Belum ada project completed di periode ini."
              hint="On-time rate dihitung dari project_end_date snapshot handover."
            />
          ) : (
            <div className="space-y-4">
              <div className="flex h-3 overflow-hidden rounded-full bg-[#f0f2f5]">
                <div
                  className="h-full bg-[#006544]"
                  style={{ width: `${onTimeRate}%` }}
                  title={`On-time: ${data.completion_outcome.on_time}`}
                />
                <div
                  className="h-full bg-[#ba1a1a]"
                  style={{ width: `${100 - onTimeRate}%` }}
                  title={`Delayed: ${data.completion_outcome.delayed}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#e6f4ef] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#006544]">
                    On-time
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#006544]">
                    {formatDashboardNumber(data.completion_outcome.on_time)}
                  </p>
                  <p className="mt-1 text-xs text-[#434653]">{onTimeRate}% dari total completed</p>
                </div>
                <div className="rounded-xl bg-[#fdecec] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#ba1a1a]">
                    Delayed
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#ba1a1a]">
                    {formatDashboardNumber(data.completion_outcome.delayed)}
                  </p>
                  <p className="mt-1 text-xs text-[#434653]">{100 - onTimeRate}% dari total completed</p>
                </div>
              </div>
            </div>
          )}
        </CeoPanel>
      </div>

      {/* Top departments */}
      <article className={ceoPanelClass}>
        <div className="mb-4 border-b border-[#eceef0] pb-3">
          <h3 className="text-sm font-bold text-[#191c1e]">Top Department by Completed Projects</h3>
          <p className="mt-0.5 text-xs text-[#737784]">
            Departemen pengirim hasil delivery terbanyak di periode ini.
          </p>
        </div>
        {data.top_departments_by_completed.length === 0 ? (
          <CeoEmptyState message="Belum ada project completed di periode ini." />
        ) : (
          <RankedHorizontalBarList
            items={data.top_departments_by_completed.map((r) => ({ name: r.name, value: r.value }))}
            valueFormatter={formatDashboardNumber}
            maxItems={5}
          />
        )}
      </article>
    </section>
  );
};
