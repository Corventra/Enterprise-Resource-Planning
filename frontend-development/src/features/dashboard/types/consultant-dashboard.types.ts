import type { DashboardFiltersQuery } from './dashboard-filters.types';

export type ConsultantDashboardFiltersQuery = DashboardFiltersQuery;

export interface ConsultantProjectItem {
  project_id: number;
  project_code: string;
  project_name: string;
  client: string;
  status: string;
  pm_name: string | null;
  my_level: 'Lead' | 'Senior' | 'Junior';
  department_name: string | null;
  start_date: string | null;
  end_date: string | null;
  milestones_total: number;
  milestones_owned: number;
}

export interface ConsultantMilestoneItem {
  milestone_id: number;
  title: string;
  project_id: number;
  project_code: string;
  project_name: string;
  target_date: string;
  status: 'Pending' | 'In Progress' | 'Done' | 'Blocked';
  completed_at: string | null;
  quality_rating: number | null;
  revision_count: number | null;
  days_until: number | null;
  is_overdue: boolean;
}

export interface ConsultantUrgentItem {
  milestone_id: number;
  title: string;
  project_code: string;
  project_name: string;
  target_date: string;
  status: string;
  days_overdue?: number;
  days_until?: number;
}

export interface ConsultantKpiSnapshot {
  period: string;
  has_snapshot: boolean;
  is_finalized: boolean;
  total_score: number;
  dimensions: {
    task_completion: number;
    timeliness: number;
    update_compliance: number;
    output_quality: number;
  };
  previous: { period: string; total_score: number } | null;
}

export interface ConsultantRatingItem {
  milestone_id: number;
  title: string;
  project_code: string;
  project_name: string;
  pm_name: string | null;
  quality_rating: number;
  revision_count: number;
  completed_at: string | null;
  rated_at: string;
}

export interface ConsultantDashboardData {
  meta: {
    period: string;
    period_start: string;
    period_end_exclusive: string;
    scope: 'consultant_owned';
    consultant_user_id: number;
  };
  my_projects: {
    items: ConsultantProjectItem[];
    count: number;
  };
  my_milestones: {
    items: ConsultantMilestoneItem[];
    count: number;
  };
  urgent: {
    overdue: ConsultantUrgentItem[];
    upcoming: ConsultantUrgentItem[];
  };
  my_kpi: ConsultantKpiSnapshot;
  recent_ratings: {
    items: ConsultantRatingItem[];
  };
  analytics: {
    kpi_trend: import('../components/analytics/analytics-shared').KpiTrendData;
    dimension_vs_peer: import('../components/analytics/analytics-shared').DimensionVsPeerData;
    insights: import('../components/analytics/analytics-shared').InsightItem[];
  };
}
