import { useMemo, useRef, useState } from 'react';
import { ExportPdfButton } from '../../../components/shared/export-pdf-button';
import { DashboardFilters } from '../components/dashboard-filters';
import { CeoDashboardSkeleton } from '../components/ceo/ceo-dashboard-ui';
import { CeoKpiSection } from '../components/ceo/ceo-kpi-section';
import { MarketingAnalyticsSection } from '../components/marketing/marketing-analytics-section';
import { CeoPerformanceSection } from '../components/ceo/ceo-performance-section';
import { CeoProjectOperationsSection } from '../components/ceo/ceo-project-operations-section';
import { CeoConsultantKpiSection } from '../components/ceo/ceo-consultant-kpi-section';
import { InsightsPanel } from '../components/analytics/insights-panel';
import { KpiTrendChart } from '../components/analytics/kpi-trend-chart';
import { ProjectVelocityChart } from '../components/analytics/project-velocity-chart';
import { RatingDistributionChart } from '../components/analytics/rating-distribution-chart';
import { CeoPanel, CeoSectionHeader, ceoSectionClass } from '../components/ceo/ceo-dashboard-ui';
import { RevenueInvoiceAnalyticsSection } from '../components/revenue/revenue-invoice-analytics-section';
import { PipelineAnalyticsSection } from '../components/pipeline/pipeline-analytics-section';
import { useCeoDashboard } from '../hooks/use-ceo-dashboard';
import type { CeoDashboardFiltersQuery } from '../types/ceo-dashboard.types';

export const CeoDashboardPage = () => {
  const [filters, setFilters] = useState<CeoDashboardFiltersQuery>({
    period: 'this_month',
    comparison: 'prev_month'
  });

  const stableFilters = useMemo(() => filters, [filters]);
  const { data, loading, error, refetch } = useCeoDashboard(stableFilters);
  const pdfRef = useRef<HTMLDivElement>(null);

  const periodLabel = filters.period?.replace('_', ' ') || 'periode aktif';
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div ref={pdfRef} className="space-y-5 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard CEO</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ringkasan analitik marketing, pipeline sales, revenue, dan performa untuk pengambilan keputusan strategis.
          </p>
        </div>
        {data && (
          <ExportPdfButton
            targetRef={pdfRef}
            filename={`Dashboard_CEO_${todayIso}`}
            headerText={`Laporan Dashboard CEO — ${periodLabel} (${todayIso})`}
          />
        )}
      </header>

      <DashboardFilters
        filters={filters}
        services={data?.filters.lookups.services ?? []}
        departments={data?.filters.lookups.departments ?? []}
        onChange={setFilters}
      />

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
          <CeoKpiSection kpis={data.executive_kpis} comparisonLabel={data.meta.comparison_label} />

          {/* Auto-generated insights — narrative impact tinggi untuk eksekutif */}
          <InsightsPanel insights={data.analytics.insights} title="Insight Otomatis Periode Ini" />

          <MarketingAnalyticsSection
            marketing={data.marketing}
            comparisonLabel={data.meta.comparison_label}
            title="Marketing Analytics"
            description="Akuisisi form lead capture organisasi — volume, conversion, dan sumber performa terbaik."
          />
          <PipelineAnalyticsSection
            pipeline={data.pipeline}
            comparisonLabel={data.meta.comparison_label}
            title="Pipeline Analytics"
            description="Pipeline sales organisasi — funnel, bottleneck, dan outcome komersial."
          />
          <RevenueInvoiceAnalyticsSection
            revenue={data.revenue}
            comparisonLabel={data.meta.comparison_label}
            title="Revenue & Invoice Analytics"
            description="Performa penagihan dan pembayaran seluruh organisasi."
          />
          <CeoProjectOperationsSection
            data={data.project_operations}
            comparisonLabel={data.meta.comparison_label}
          />
          <CeoConsultantKpiSection data={data.consultant_kpi} />

          {/* Analytics trend section */}
          <section className={ceoSectionClass}>
            <CeoSectionHeader
              title="Analitik Tren"
              description="Pola lintas-periode untuk KPI organisasi dan velocity delivery project."
              badge="6 periode terakhir"
            />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <CeoPanel
                className="xl:col-span-2"
                title="KPI Organisasi per Periode"
                subtitle="Rata-rata 4 dimensi KPI (bobot 35/25/15/25) — Weighted Scoring Method"
              >
                <KpiTrendChart data={data.analytics.kpi_trend} mode="dimensions" />
              </CeoPanel>
              <CeoPanel title="Project Velocity" subtitle="Project created vs completed per bulan">
                <ProjectVelocityChart data={data.analytics.project_velocity} />
              </CeoPanel>
            </div>
            <CeoPanel
              title="Distribusi Quality Rating"
              subtitle="Rating yang diberikan PM atas milestone yang Done — feed dimensi Output Quality"
            >
              <RatingDistributionChart data={data.analytics.rating_distribution} />
            </CeoPanel>
          </section>

          <CeoPerformanceSection performance={data.performance} />
        </div>
      ) : null}
    </div>
  );
};
