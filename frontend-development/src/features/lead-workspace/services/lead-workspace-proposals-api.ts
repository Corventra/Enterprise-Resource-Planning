import { apiDelete, apiGet, apiPatchFormData, apiPost, apiPostFormData } from '../../../services/api-client';
import type { SaveProposalDraftPayload } from '../types/lead-proposals.types';

export interface ApiLeadWorkspaceProposalDocumentRow {
  document_id: number;
  lead_id: number;
  proposal_id: number;
  document_category: string;
  document_name: string;
  version_no: number;
  is_latest: boolean;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  uploaded_by: number | null;
  uploaded_by_name: string | null;
  created_at: string;
}

export interface ApiLeadWorkspaceProposalRow {
  proposal_id: number;
  lead_id: number;
  service_id: number;
  service_name: string;
  service_code: string;
  service_class_id: number;
  service_class_name: string;
  service_class_code: string;
  department_id: number;
  issuer_company: 'DSK' | 'DTAX';
  is_sub_contract: boolean;
  partner_name: string | null;
  payer_party: 'PARTNER' | 'CLIENT' | null;
  proposal_fee: number;
  discount_amount: number;
  proposal_status:
    | 'DRAFT'
    | 'WAITING_CEO_APPROVAL'
    | 'NEED_REVISION'
    | 'APPROVED'
    | 'SENT'
    | 'RESPONDED';
  revision_note: string | null;
  approved_by: number | null;
  approved_at: string | null;
  sent_to_client_at: string | null;
  client_responded_at: string | null;
  submitted_by: number | null;
  submitted_by_name: string | null;
  submitted_at: string | null;
  created_by: number;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
  document: ApiLeadWorkspaceProposalDocumentRow | null;
}

interface ApiProposalResponse {
  success: boolean;
  data: { proposal: ApiLeadWorkspaceProposalRow | null };
}

interface ApiProposalMutationResponse {
  success: boolean;
  data: { proposal: ApiLeadWorkspaceProposalRow };
}

const buildProposalFormData = (payload: SaveProposalDraftPayload) => {
  const formData = new FormData();
  formData.append('action', payload.action ?? 'draft');
  formData.append('service_id', payload.serviceId);
  formData.append('issuer_company', payload.issuerCompany);
  formData.append('is_sub_contract', payload.isSubContract ? 'true' : 'false');
  if (payload.isSubContract) {
    if (payload.partnerName) {
      formData.append('partner_name', payload.partnerName);
    }
    if (payload.payerParty) {
      formData.append('payer_party', payload.payerParty);
    }
  }
  formData.append('proposal_fee', String(payload.proposalFee));
  formData.append('discount_amount', String(payload.discountAmount));
  if (payload.proposalDocument) {
    formData.append('proposal_document', payload.proposalDocument);
  }
  return formData;
};

export const getLeadWorkspaceProposal = async (leadId: string) => {
  const response = await apiGet<ApiProposalResponse>(`/lead-workspace/${leadId}/proposal`);
  return response.data.proposal;
};

export const postLeadWorkspaceProposal = async (leadId: string, payload: SaveProposalDraftPayload) => {
  const response = await apiPostFormData<ApiProposalMutationResponse>(
    `/lead-workspace/${leadId}/proposal`,
    buildProposalFormData(payload)
  );
  return response.data.proposal;
};

export const patchLeadWorkspaceProposal = async (
  leadId: string,
  proposalId: string,
  payload: SaveProposalDraftPayload
) => {
  const response = await apiPatchFormData<ApiProposalMutationResponse>(
    `/lead-workspace/${leadId}/proposal/${proposalId}`,
    buildProposalFormData(payload)
  );
  return response.data.proposal;
};

export const deleteLeadWorkspaceProposal = async (leadId: string, proposalId: string) => {
  await apiDelete(`/lead-workspace/${leadId}/proposal/${proposalId}`);
};

export const submitLeadWorkspaceProposal = async (leadId: string, proposalId: string) => {
  const response = await apiPost<ApiProposalMutationResponse>(
    `/lead-workspace/${leadId}/proposal/${proposalId}/submit`
  );
  return response.data.proposal;
};

export const postLeadWorkspaceProposalSent = async (leadId: string, proposalId: string) => {
  const response = await apiPost<ApiProposalMutationResponse>(
    `/lead-workspace/${leadId}/proposal/${proposalId}/sent`
  );
  return response.data.proposal;
};

export const postLeadWorkspaceProposalResponded = async (leadId: string, proposalId: string) => {
  const response = await apiPost<ApiProposalMutationResponse>(
    `/lead-workspace/${leadId}/proposal/${proposalId}/responded`
  );
  return response.data.proposal;
};
