import type { ApprovalEngagementLetterQueueMeta, ApprovalItem, ApprovalProposalLeadSummary } from '../types/approval.types';
import {
  getEngagementLetterApprovalDetail,
  getPendingEngagementLetterApprovals,
  postApproveEngagementLetter,
  postRejectEngagementLetter
} from './approval-engagements-api';

const formatIdr = (n: number | null | undefined): string => {
  if (n == null || Number.isNaN(Number(n))) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n));
};

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

const mapQueueMeta = (row: {
  issuer_company: string;
  payment_method: 'TERMIN' | 'RETAINER';
  engagement_status: string;
  agreed_fee: number | null;
}): ApprovalEngagementLetterQueueMeta => ({
  issuerCompany: row.issuer_company,
  paymentMethod: row.payment_method,
  engagementStatus: row.engagement_status as ApprovalEngagementLetterQueueMeta['engagementStatus'],
  agreedFeeDisplay: formatIdr(row.agreed_fee)
});

export const approvalEngagementsService = {
  async listPendingApprovals(): Promise<ApprovalItem[]> {
    const rows = await getPendingEngagementLetterApprovals();
    return rows.map((r) => ({
      id: String(r.engagement_id),
      kind: 'EngagementLetter' as const,
      sourceId: String(r.lead_id),
      client: r.company_name?.trim() ? r.company_name : '-',
      title: `Engagement Letter #${r.engagement_id}`,
      serviceLine: r.service_name ?? undefined,
      submittedBy: r.submitted_by_name?.trim() ? r.submitted_by_name : '-',
      submittedAt: r.submitted_at ?? '',
      detailRoute: `/lead-workspace/${r.lead_id}/engagement-letter`,
      engagementQueueMeta: mapQueueMeta(r)
    }));
  },

  async fetchDetail(engagementId: string) {
    const data = await getEngagementLetterApprovalDetail(engagementId);
    return {
      leadSummary: data.lead_summary ? mapLeadSummary(data.lead_summary) : null,
      approval: data.approval,
      item: data.item
    };
  },

  async approveEngagement(engagementId: string): Promise<void> {
    await postApproveEngagementLetter(engagementId);
  },

  async rejectEngagement(engagementId: string, note: string): Promise<void> {
    await postRejectEngagementLetter(engagementId, note);
  }
};
