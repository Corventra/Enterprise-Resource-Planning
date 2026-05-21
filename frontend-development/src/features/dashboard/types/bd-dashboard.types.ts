import type { DashboardFiltersQuery } from './dashboard-filters.types';
import type { DashboardDataScope } from './dashboard-scope.types';
import type { PipelineAnalytics } from './pipeline-analytics.types';

export interface BdDashboardData {
  meta: {
    period: string;
    period_start: string;
    period_end_exclusive: string;
    comparison_label: string;
    scope: Extract<DashboardDataScope, 'own_leads'>;
  };
  filters: {
    service_id: number | null;
    department_id: number | null;
    lookups: {
      services: Array<{ service_id: number; name: string }>;
      departments: Array<{ department_id: number; name: string }>;
    };
  };
  pipeline: PipelineAnalytics;
}

export type { DashboardFiltersQuery };
