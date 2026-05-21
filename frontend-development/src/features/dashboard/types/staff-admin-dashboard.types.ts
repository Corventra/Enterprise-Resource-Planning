import type { DashboardFiltersQuery } from './dashboard-filters.types';
import type { DashboardDataScope } from './dashboard-scope.types';
import type { RevenueInvoiceAnalytics } from './revenue-analytics.types';

export interface StaffAdminDashboardData {
  meta: {
    period: string;
    period_start: string;
    period_end_exclusive: string;
    comparison_label: string;
    scope: Extract<DashboardDataScope, 'organization'>;
  };
  filters: {
    service_id: number | null;
    department_id: number | null;
    lookups: {
      services: Array<{ service_id: number; name: string }>;
      departments: Array<{ department_id: number; name: string }>;
    };
  };
  revenue: RevenueInvoiceAnalytics;
}

export type { DashboardFiltersQuery };
