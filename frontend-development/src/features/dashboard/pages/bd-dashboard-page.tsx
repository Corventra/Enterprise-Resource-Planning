import { useMemo, useState } from 'react';
import { DashboardFilters } from '../components/dashboard-filters';
import { CeoDashboardSkeleton } from '../components/ceo/ceo-dashboard-ui';
import { PipelineAnalyticsSection } from '../components/pipeline/pipeline-analytics-section';
import { useBdDashboard } from '../hooks/use-bd-dashboard';
import type { DashboardFiltersQuery } from '../types/dashboard-filters.types';

export const BdDashboardPage = () => {
  const [filters, setFilters] = useState<DashboardFiltersQuery>({
    period: 'this_month',
    comparison: 'prev_month'
  });

  const stableFilters = useMemo(() => filters, [filters]);
  const { data, loading, error, refetch } = useBdDashboard(stableFilters);

  return (
    <div className="space-y-5 pb-10">
      <header>
        <h1 className="text-2xl font-semibold text-[#191c1e]">Pipeline Saya</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#737784]">
          Analitik pipeline milik Anda — lead yang Anda tangani dari aktif hingga handover dan hasil komersial.
        </p>
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
        <PipelineAnalyticsSection
          pipeline={data.pipeline}
          comparisonLabel={data.meta.comparison_label}
        />
      ) : null}
    </div>
  );
};
