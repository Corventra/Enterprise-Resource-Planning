/** KPI dengan perbandingan periode — dipakai revenue & executive summary CEO. */
export interface DashboardKpiMetric {
  value: number;
  previous: number;
  delta: { value: number; direction: 'up' | 'down' | 'flat' };
}

export interface RevenueTrendPoint {
  month: string;
  label: string;
  value: number;
}

export interface RevenuePaidOutstandingPoint {
  month: string;
  label: string;
  paid: number;
  outstanding: number;
}

export interface RevenueMonthlyInvoiceTrendPoint {
  month: string;
  label: string;
  invoiced: number;
  paid: number;
  outstanding: number;
  overdue: number;
  /** @deprecated Legacy API field — use `invoiced`. */
  due?: number;
}

export interface InvoiceStatusDistributionItem {
  status: string;
  count: number;
  amount: number;
}

/** Klien prioritas penagihan (overdue terbesar). */
export interface RevenueAttentionItem {
  lead_id: number;
  client_name: string;
  overdue_amount: number;
  overdue_term_count: number;
  oldest_due_date: string | null;
  max_days_overdue: number;
}

export interface RevenueInvoiceAnalytics {
  payment_trend: RevenueTrendPoint[];
  paid_vs_outstanding_trend: RevenuePaidOutstandingPoint[];
  monthly_invoice_trend: RevenueMonthlyInvoiceTrendPoint[];
  invoice_status_distribution: InvoiceStatusDistributionItem[];
  top_clients_overdue: RevenueAttentionItem[];
  summary: {
    total_invoiced: number;
    total_paid: number;
    total_outstanding: number;
    total_overdue: number;
  };
  summary_metrics: {
    total_invoiced: DashboardKpiMetric;
    total_paid: DashboardKpiMetric;
    total_outstanding: DashboardKpiMetric;
    total_overdue: DashboardKpiMetric;
  };
}
