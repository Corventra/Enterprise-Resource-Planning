export interface MarketingTrendPoint {
  month: string;
  label: string;
  value: number;
}

export interface MarketingMonthlyAcquisition {
  month: string;
  label: string;
  submissions: number;
  leads: number;
  conversion_rate: number;
}

export interface MarketingPeriodSummary {
  submissions: number;
  leads: number;
  conversion_rate: number;
  previous: {
    submissions: number;
    leads: number;
    conversion_rate: number;
  };
}

export interface MarketingAnalytics {
  submission_trend: MarketingTrendPoint[];
  lead_trend: MarketingTrendPoint[];
  monthly_acquisition: MarketingMonthlyAcquisition[];
  period_summary: MarketingPeriodSummary;
  top_campaigns: Array<{ campaign_id: number; name: string; lead_count: number }>;
  top_channels: Array<{ name: string; code: string; lead_count: number }>;
  top_topics: Array<{ topic_id: number; name: string; lead_count: number }>;
  submission_to_lead: { submissions: number; leads: number; conversion_rate: number };
}
