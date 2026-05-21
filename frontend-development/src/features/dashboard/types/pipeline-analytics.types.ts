export interface PipelineKpiMetric {
  value: number;
  previous: number;
  delta: { value: number; direction: 'up' | 'down' | 'flat' };
}

export interface PipelineFunnelStage {
  stage: string;
  key?: string;
  count: number;
}

export interface PipelineStageTransition {
  key: string;
  label: string;
  from_count: number;
  to_count: number;
  rate: number;
  stuck_count: number;
}

export interface PipelineBottleneck {
  label: string;
  rate: number;
  from_count: number;
  to_count: number;
  stuck_count: number;
  narrative: string | null;
}

export interface PipelineConversions {
  lead_to_meeting: number;
  meeting_to_minutes: number;
  minutes_to_proposal: number;
  lead_to_proposal: number;
  proposal_to_el_signed: number;
  el_signed_to_handover_approved: number;
  lead_to_won: number;
}

export interface PipelineCommercialOutcome {
  won: number;
  lost: number;
  win_rate: number;
  win_rate_label: string;
}

export interface PipelineDocumentTrendPoint {
  month: string;
  label: string;
  proposals: number;
  el_signed: number;
  handover_approved: number;
}

export interface PipelineTrendPoint {
  month: string;
  label: string;
  value: number;
}

export interface PipelineWonLostPoint {
  month: string;
  label: string;
  won: number;
  lost: number;
}

export interface PipelineKpiCards {
  total_lead: PipelineKpiMetric;
  meeting: PipelineKpiMetric;
  minutes_completed: PipelineKpiMetric;
  proposal: PipelineKpiMetric;
  el_signed: PipelineKpiMetric;
  handover_approved: PipelineKpiMetric;
  lost: PipelineKpiMetric;
}

export interface PipelineAnalytics {
  kpi_cards: PipelineKpiCards;
  funnel: PipelineFunnelStage[];
  funnel_insights: {
    largest_stage: { stage: string; count: number };
    biggest_drop: { from_stage: string; to_stage: string; drop: number; rate: number } | null;
  };
  stage_transitions: PipelineStageTransition[];
  bottleneck: PipelineBottleneck | null;
  total_conversion: number;
  commercial_outcome: PipelineCommercialOutcome;
  conversions: PipelineConversions;
  document_trend: PipelineDocumentTrendPoint[];
  won_lost_trend: PipelineWonLostPoint[];
  proposal_trend: PipelineTrendPoint[];
  el_signed_trend: PipelineTrendPoint[];
  handover_approved_trend: PipelineTrendPoint[];
}
