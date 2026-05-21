import { useMemo, useState } from 'react';
import { DashboardFilters } from '../components/dashboard-filters';
import { CeoDashboardSkeleton } from '../components/ceo/ceo-dashboard-ui';
import { RevenueInvoiceAnalyticsSection } from '../components/revenue/revenue-invoice-analytics-section';
import { useStaffAdminDashboard } from '../hooks/use-staff-admin-dashboard';
import type { DashboardFiltersQuery } from '../types/dashboard-filters.types';

export const StaffAdminDashboardPage = () => {
  const [filters, setFilters] = useState<DashboardFiltersQuery>({
    period: 'this_month',
    comparison: 'prev_month'
  });

  const stableFilters = useMemo(() => filters, [filters]);
  const { data, loading, error, refetch } = useStaffAdminDashboard(stableFilters);

  return (
    <div className="space-y-5 pb-10">
      <header>
        <h1 className="text-2xl font-semibold text-[#191c1e]">Dashboard Revenue & Invoice</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#737784]">
          Analitik penagihan perusahaan — pembayaran, outstanding, overdue, dan daftar prioritas penagihan.
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
        <RevenueInvoiceAnalyticsSection
          revenue={data.revenue}
          comparisonLabel={data.meta.comparison_label}
        />
      ) : null}
    </div>
  );
};
