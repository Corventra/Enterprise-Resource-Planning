/**
 * Type shapes untuk analytics section dashboard. Backend payload disusun di
 * dashboard-analytics.repo.js. Frontend pakai shape ini reusable lintas role.
 */

export interface KpiTrendPoint {
  period: string;
  label: string;
  total_score: number;
  task_completion: number;
  timeliness: number;
  update_compliance: number;
  output_quality: number;
  sample_size: number;
}
export interface KpiTrendData {
  points: KpiTrendPoint[];
}

export interface ProjectVelocityPoint {
  period: string;
  label: string;
  created: number;
  completed: number;
}
export interface ProjectVelocityData {
  points: ProjectVelocityPoint[];
}

export interface RatingDistributionBucket {
  rating: 1 | 2 | 3 | 4 | 5;
  count: number;
}
export interface RatingDistributionData {
  buckets: RatingDistributionBucket[];
  total: number;
  average: number;
}

export interface DimensionVsPeerRow {
  key: 'task_completion' | 'timeliness' | 'update_compliance' | 'output_quality';
  label: string;
  self_value: number;
  peer_avg: number;
  delta: number;
}
export interface DimensionVsPeerData {
  dimensions: DimensionVsPeerRow[];
  self_total: number;
  peer_total_avg: number;
}

export type InsightSeverity = 'positive' | 'warning' | 'info';
export interface InsightItem {
  severity: InsightSeverity;
  text: string;
}
