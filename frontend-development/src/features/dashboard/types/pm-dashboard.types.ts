import type { DashboardFiltersQuery } from './dashboard-filters.types';
import type { MilestoneRiskItem } from './coo-dashboard.types';

export type PmDashboardFiltersQuery = DashboardFiltersQuery;

export interface PmProjectItem {
  project_id: number;
  project_code: string;
  project_name: string;
  client: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  department_code: string | null;
  department_name: string | null;
  dp_payment_status: 'UNPAID' | 'PAID' | null;
  milestones_total: number;
  milestones_done: number;
  consultant_count: number;
}

export interface PmActionItem {
  milestone_id: number;
  title: string;
  project_id: number;
  project_code: string;
  project_name: string;
  consultant_name: string | null;
  completed_at: string | null;
  target_date: string;
}

export interface PmTeamMember {
  user_id: number;
  name: string;
  total_score: number | null;
}

export interface PmTeamKpi {
  period_status: {
    period: string;
    snapshot_count: number;
    finalized_count: number;
    team_size: number;
    is_finalized: boolean;
  };
  summary_metrics: {
    avg_total_score: number;
    excellent_count: number;
    good_count: number;
    need_improvement_count: number;
  };
  top_performer: { user_id: number; name: string; value: number } | null;
  bottom_performer: { user_id: number; name: string; value: number } | null;
  team_members: PmTeamMember[];
}

export interface PmDashboardData {
  meta: {
    period: string;
    period_start: string;
    period_end_exclusive: string;
    comparison_label: string;
    scope: 'pm_owned';
    pm_user_id: number;
  };
  my_projects: {
    summary: {
      active: number;
      completed_total: number;
      completed_this_period: {
        value: number;
        previous: number;
        delta: { value: number; direction: 'up' | 'down' | 'flat' };
      };
      awaiting_consultant: number;
      blocked_by_dp: number;
    };
    items: PmProjectItem[];
  };
  action_items: {
    items: PmActionItem[];
    count: number;
  };
  team_kpi: PmTeamKpi;
  milestones_at_risk: {
    overdue: MilestoneRiskItem[];
    upcoming: MilestoneRiskItem[];
  };
  dp_blocks: {
    items: Array<{
      project_id: number;
      project_code: string;
      project_name: string;
      client_name: string;
      dp_payment_status: string;
      created_at: string;
      days_waiting: number;
    }>;
    count: number;
  };
  analytics: {
    kpi_trend: import('../components/analytics/analytics-shared').KpiTrendData;
    project_velocity: import('../components/analytics/analytics-shared').ProjectVelocityData;
    rating_distribution: import('../components/analytics/analytics-shared').RatingDistributionData;
    insights: import('../components/analytics/analytics-shared').InsightItem[];
  };
}
