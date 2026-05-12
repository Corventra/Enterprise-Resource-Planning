import type { ApiLeadWorkspaceActivityLogRow } from '../services/lead-workspace-api';
import type { LeadWorkspaceActivityLogItem } from '../types/lead-activity.types';

export const mapLeadWorkspaceActivityLogRow = (row: ApiLeadWorkspaceActivityLogRow): LeadWorkspaceActivityLogItem => ({
  id: String(row.activity_id),
  activityType: row.activity_type,
  title: row.title,
  description: row.description,
  createdAt: row.created_at,
  createdBy: row.created_by,
  createdByName: row.created_by_name
});
