import type {
  ConsultantKpiAnalytics,
  ProjectOperationsAnalytics
} from './ceo-dashboard.types';
import type { DashboardFiltersQuery } from './dashboard-filters.types';

export type CooDashboardFiltersQuery = DashboardFiltersQuery;

export interface HandoverQueueItem {
  handover_id: number;
  handover_code: string;
  project_title: string;
  client_name: string;
  department_id: number | null;
  department_name: string | null;
  approved_at: string;
  days_pending: number;
}

export interface MilestoneRiskItem {
  milestone_id: number;
  title: string;
  target_date: string;
  status: string;
  project_id: number;
  project_code: string;
  project_name: string;
  pm_name: string | null;
  owner_name: string | null;
  department_name?: string | null;
  days_overdue?: number;
  days_until?: number;
}

export interface DpUnpaidProjectItem {
  project_id: number;
  project_code: string;
  project_name: string;
  client_name: string;
  pm_name: string | null;
  department_name: string | null;
  dp_payment_status: string;
  created_at: string;
  days_waiting: number;
}

export interface CooDashboardData {
  meta: {
    period: string;
    period_start: string;
    period_end_exclusive: string;
    comparison_label: string;
    scope: 'department';
    departments: string[];
  };
  project_operations: ProjectOperationsAnalytics;
  handover_queue: {
    items: HandoverQueueItem[];
    count: number;
  };
  consultant_kpi: ConsultantKpiAnalytics;
  milestones_at_risk: {
    overdue: MilestoneRiskItem[];
    upcoming: MilestoneRiskItem[];
  };
  dp_unpaid_alert: {
    items: DpUnpaidProjectItem[];
    count: number;
  };
  analytics: {
    kpi_trend: import('../components/analytics/analytics-shared').KpiTrendData;
    project_velocity: import('../components/analytics/analytics-shared').ProjectVelocityData;
    insights: import('../components/analytics/analytics-shared').InsightItem[];
  };
}
