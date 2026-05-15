import { mapApiHandoverDetailToDetail } from '../../handover/utils/map-api-handover';
import type { ApprovalItem, ApprovalProposalLeadSummary } from '../types/approval.types';
import {
  getHandoverApprovalDetail,
  getPendingHandoverApprovals,
  postApproveHandover,
  postRejectHandover
} from './approval-handovers-api';

const mapLeadSummary = (row: {
  company_name: string | null;
  pic_name: string | null;
  email: string | null;
  phone_number: string | null;
  lead_source_label: string | null;
  processed_by_name: string | null;
  processed_at: string | null;
  desired_services: string | null;
}): ApprovalProposalLeadSummary => ({
  companyName: row.company_name,
  picName: row.pic_name,
  email: row.email,
  phoneNumber: row.phone_number,
  leadSourceLabel: row.lead_source_label,
  processedByName: row.processed_by_name,
  processedAt: row.processed_at,
  desiredServices: row.desired_services
});

export const approvalHandoversService = {
  async listPendingApprovals(): Promise<ApprovalItem[]> {
    const rows = await getPendingHandoverApprovals();
    return rows.map((r) => ({
      id: String(r.handover_id),
      kind: 'HandoverMemo' as const,
      sourceId: String(r.lead_id),
      docCode: r.handover_code,
      client: r.company_name?.trim() ? r.company_name : '-',
      title: r.project_title?.trim() ? r.project_title : '-',
      serviceLine: r.service_name ?? undefined,
      submittedBy: r.submitted_by_name?.trim() ? r.submitted_by_name : '-',
      submittedAt: r.submitted_at ?? '',
      detailRoute: `/handover/${r.handover_id}`,
      handoverQueueMeta: {
        handoverStatus: r.handover_status
      }
    }));
  },

  async fetchDetail(handoverId: string) {
    const data = await getHandoverApprovalDetail(handoverId);
    return {
      leadSummary: data.lead_summary ? mapLeadSummary(data.lead_summary) : null,
      approval: data.approval,
      detail: mapApiHandoverDetailToDetail(data.handover),
      ceoRevisionNote: data.ceo_revision_note?.trim() ? data.ceo_revision_note.trim() : null
    };
  },

  async approveHandover(handoverId: string): Promise<void> {
    await postApproveHandover(handoverId);
  },

  async rejectHandover(handoverId: string, note: string): Promise<void> {
    await postRejectHandover(handoverId, note);
  }
};
