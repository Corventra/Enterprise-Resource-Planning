import type { DashboardFiltersQuery } from './dashboard-filters.types';
import type { DashboardDataScope } from './dashboard-scope.types';
import type { MarketingAnalytics } from './marketing-analytics.types';

export interface MeoDashboardData {
  meta: {
    period: string;
    period_start: string;
    period_end_exclusive: string;
    comparison_label: string;
    scope: Extract<DashboardDataScope, 'own_marketing'>;
  };
  filters: {
    service_id: number | null;
    department_id: number | null;
    lookups: {
      services: Array<{ service_id: number; name: string }>;
      departments: Array<{ department_id: number; name: string }>;
    };
  };
  marketing: MarketingAnalytics;
}

export type { DashboardFiltersQuery };
