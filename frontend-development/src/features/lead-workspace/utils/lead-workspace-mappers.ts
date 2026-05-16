import type { ApiLeadWorkspaceDetailRow } from '../services/lead-workspace-api';
import type { LeadWorkspaceDetail } from '../types/lead-workspace.types';
import { mapLeadWorkspaceActivityLogRow } from './lead-workspace-activity-mappers';
import { formatLeadDisplayId } from './format-lead-display-id';

export const mapLeadWorkspaceDetailRow = (row: ApiLeadWorkspaceDetailRow): LeadWorkspaceDetail => ({
  id: String(row.lead_id),
  leadCode: row.lead_code?.trim() ? row.lead_code.trim() : formatLeadDisplayId(row.lead_id),
  companyName: row.company_name,
  address: row.company_address,
  desiredServices: row.desired_services,
  companyPicName: row.pic_name,
  companyPicPhone: row.phone_number,
  companyPicEmail: row.email,
  leadSource: row.lead_source_label,
  processedAt: row.processed_at,
  processedBy: row.processed_by_name,
  processedByUserId: row.processed_by,
  updatedAt: row.updated_at,
  activityLogs: (row.activity_logs ?? []).map(mapLeadWorkspaceActivityLogRow)
});
