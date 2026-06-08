import type { DashboardComparison, DashboardFiltersQuery, DashboardPeriod } from './dashboard-filters.types';
import type { DashboardDataScope } from './dashboard-scope.types';
import type { MarketingAnalytics } from './marketing-analytics.types';
import type { PipelineAnalytics } from './pipeline-analytics.types';
import type {
  DashboardKpiMetric,
  RevenueInvoiceAnalytics,
  RevenuePaidOutstandingPoint,
  RevenueTrendPoint
} from './revenue-analytics.types';

export type CeoDashboardPeriod = DashboardPeriod;
export type CeoDashboardComparison = DashboardComparison;
export type CeoDashboardFiltersQuery = DashboardFiltersQuery;

/** @deprecated Pakai `DashboardKpiMetric` dari revenue-analytics.types */
export type CeoKpiMetric = DashboardKpiMetric;

/** @deprecated Pakai `RevenueTrendPoint` */
export type CeoTrendPoint = RevenueTrendPoint;

/** @deprecated Pakai `RevenuePaidOutstandingPoint` */
export type CeoPaidOutstandingPoint = RevenuePaidOutstandingPoint;

export interface CeoRankedItem {
  name: string;
  value: number;
  code?: string;
  service_id?: number;
  campaign_id?: number;
  department_id?: number;
  user_id?: number;
}

/** ===== Project Operations (post-handover delivery) ===== */
export type ProjectStatusLabel =
  | 'Awaiting Consultant'
  | 'In Progress'
  | 'On Hold'
  | 'Completed'
  | 'Cancelled';

export interface ProjectOperationsAnalytics {
  summary_metrics: {
    /** Current snapshot — bukan period-bound (live). */
    active_projects: { value: number };
    /** Completed end_date di period (vs comparison). */
    completed_in_period: {
      value: number;
      previous: number;
      delta: { value: number; direction: 'up' | 'down' | 'flat' };
    };
    /** Cross-module signal ke modul Invoice: project status Awaiting Consultant
     *  + handover.dp_payment_status != PAID. Current snapshot. */
    blocked_by_dp: { value: number };
    /** Avg days antara start_date & end_date untuk completed in period. */
    avg_duration_days: { value: number };
  };
  status_distribution: Array<{ status: ProjectStatusLabel; count: number }>;
  completion_outcome: {
    on_time: number;
    delayed: number;
  };
  top_departments_by_completed: CeoRankedItem[];
}

/** ===== Consultant KPI ===== */
export interface ConsultantKpiAnalytics {
  period_status: {
    /** 'YYYY-MM' diturunkan dari period filter dashboard. */
    period: string;
    snapshot_count: number;
    finalized_count: number;
    total_consultants: number;
    /** True kalau semua snapshot di periode itu sudah finalized. */
    is_finalized: boolean;
  };
  summary_metrics: {
    avg_total_score: number;
    excellent_count: number;
    good_count: number;
    need_improvement_count: number;
  };
  dimension_averages: {
    task_completion: number;
    timeliness: number;
    update_compliance: number;
    output_quality: number;
  };
  top_performers: CeoRankedItem[];
  bottom_performers: CeoRankedItem[];
}

export interface CeoDashboardData {
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
  executive_kpis: {
    total_lead: CeoKpiMetric;
    client_won: CeoKpiMetric;
    proposals_created: CeoKpiMetric;
    engagement_letters_signed: CeoKpiMetric;
    handovers_approved: CeoKpiMetric;
    payments_received: CeoKpiMetric;
    invoice_outstanding: CeoKpiMetric;
    overdue_amount: CeoKpiMetric;
  };
  marketing: MarketingAnalytics;
  pipeline: PipelineAnalytics;
  revenue: RevenueInvoiceAnalytics;
  performance: {
    top_services_by_leads: CeoRankedItem[];
    top_services_by_won: CeoRankedItem[];
    top_services_by_invoice_value: CeoRankedItem[];
  };
  project_operations: ProjectOperationsAnalytics;
  consultant_kpi: ConsultantKpiAnalytics;
  analytics: {
    kpi_trend: import('../components/analytics/analytics-shared').KpiTrendData;
    project_velocity: import('../components/analytics/analytics-shared').ProjectVelocityData;
    rating_distribution: import('../components/analytics/analytics-shared').RatingDistributionData;
    insights: import('../components/analytics/analytics-shared').InsightItem[];
  };
}
