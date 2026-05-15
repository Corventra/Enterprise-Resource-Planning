import {
  deleteLeadWorkspaceProposal,
  getLeadWorkspaceProposal,
  patchLeadWorkspaceProposal,
  postLeadWorkspaceProposal,
  postLeadWorkspaceProposalResponded,
  postLeadWorkspaceProposalSent,
  submitLeadWorkspaceProposal,
  type ApiLeadWorkspaceProposalRow
} from './lead-workspace-proposals-api';
import type { LeadWorkspaceProposalView, SaveProposalDraftPayload } from '../types/lead-proposals.types';

const mapProposalDocument = (row: NonNullable<ApiLeadWorkspaceProposalRow['document']>) => ({
  id: String(row.document_id),
  documentName: row.document_name,
  fileName: row.file_name,
  filePath: row.file_path,
  mimeType: row.mime_type,
  fileSizeBytes: row.file_size_bytes,
  versionNo: row.version_no,
  uploadedByName: row.uploaded_by_name,
  createdAt: row.created_at
});

export const mapLeadWorkspaceProposalRow = (row: ApiLeadWorkspaceProposalRow): LeadWorkspaceProposalView => ({
  id: String(row.proposal_id),
  proposalCode: row.proposal_code?.trim() ? row.proposal_code.trim() : '',
  leadId: String(row.lead_id),
  serviceId: String(row.service_id),
  serviceName: row.service_name,
  serviceCode: row.service_code,
  serviceClassId: String(row.service_class_id),
  serviceClassName: row.service_class_name,
  serviceClassCode: row.service_class_code,
  departmentId: String(row.department_id),
  issuerCompany: row.issuer_company,
  isSubContract: Boolean(row.is_sub_contract),
  partnerName: row.partner_name,
  payerParty: row.payer_party,
  proposalFee: Number(row.proposal_fee),
  discountAmount: Number(row.discount_amount),
  status: row.proposal_status,
  revisionNote: row.revision_note ?? null,
  submittedByName: row.submitted_by_name,
  submittedAt: row.submitted_at,
  createdByName: row.created_by_name,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  document: row.document ? mapProposalDocument(row.document) : null
});

export const mapSaveProposalDraftPayload = (payload: SaveProposalDraftPayload) => payload;

export const leadProposalsService = {
  async get(leadId: string): Promise<LeadWorkspaceProposalView | null> {
    const row = await getLeadWorkspaceProposal(leadId);
    return row ? mapLeadWorkspaceProposalRow(row) : null;
  },

  async createDraft(leadId: string, payload: SaveProposalDraftPayload): Promise<LeadWorkspaceProposalView> {
    const row = await postLeadWorkspaceProposal(leadId, {
      ...mapSaveProposalDraftPayload(payload),
      action: payload.action ?? 'draft'
    });
    return mapLeadWorkspaceProposalRow(row);
  },

  async updateDraft(
    leadId: string,
    proposalId: string,
    payload: SaveProposalDraftPayload
  ): Promise<LeadWorkspaceProposalView> {
    const row = await patchLeadWorkspaceProposal(leadId, proposalId, {
      ...mapSaveProposalDraftPayload(payload),
      action: payload.action ?? 'draft'
    });
    return mapLeadWorkspaceProposalRow(row);
  },

  async deleteDraft(leadId: string, proposalId: string): Promise<void> {
    await deleteLeadWorkspaceProposal(leadId, proposalId);
  },

  async submit(leadId: string, proposalId: string): Promise<LeadWorkspaceProposalView> {
    const row = await submitLeadWorkspaceProposal(leadId, proposalId);
    return mapLeadWorkspaceProposalRow(row);
  },

  async markSentToClient(leadId: string, proposalId: string): Promise<LeadWorkspaceProposalView> {
    const row = await postLeadWorkspaceProposalSent(leadId, proposalId);
    return mapLeadWorkspaceProposalRow(row);
  },

  async markResponded(leadId: string, proposalId: string): Promise<LeadWorkspaceProposalView> {
    const row = await postLeadWorkspaceProposalResponded(leadId, proposalId);
    return mapLeadWorkspaceProposalRow(row);
  }
};
