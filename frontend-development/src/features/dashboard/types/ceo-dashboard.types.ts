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
}
