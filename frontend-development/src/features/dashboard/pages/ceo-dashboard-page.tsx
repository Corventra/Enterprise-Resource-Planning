import { useMemo, useState } from 'react';
import { DashboardFilters } from '../components/dashboard-filters';
import { CeoDashboardSkeleton } from '../components/ceo/ceo-dashboard-ui';
import { CeoKpiSection } from '../components/ceo/ceo-kpi-section';
import { MarketingAnalyticsSection } from '../components/marketing/marketing-analytics-section';
import { CeoPerformanceSection } from '../components/ceo/ceo-performance-section';
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

  return (
    <div className="space-y-5 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard CEO</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ringkasan analitik marketing, pipeline sales, revenue, dan performa untuk pengambilan keputusan strategis.
          </p>
        </div>
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
          <CeoPerformanceSection performance={data.performance} />
        </div>
      ) : null}
    </div>
  );
};
