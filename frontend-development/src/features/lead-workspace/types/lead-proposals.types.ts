export type ProposalIssuerCompany = 'DSK' | 'DTAX';
export type ProposalPayerParty = 'PARTNER' | 'CLIENT';
export type ProposalStatus =
  | 'DRAFT'
  | 'WAITING_CEO_APPROVAL'
  | 'NEED_REVISION'
  | 'APPROVED'
  | 'SENT'
  | 'RESPONDED';

export interface ProposalMasterServiceClass {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface ProposalMasterService {
  id: string;
  serviceClassId: string;
  departmentId: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface LeadWorkspaceProposalDocument {
  id: string;
  documentName: string;
  fileName: string;
  filePath: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  versionNo: number;
  uploadedByName: string | null;
  createdAt: string;
}

export interface LeadWorkspaceProposalView {
  id: string;
  proposalCode: string;
  leadId: string;
  serviceId: string;
  serviceName: string;
  serviceCode: string;
  serviceClassId: string;
  serviceClassName: string;
  serviceClassCode: string;
  departmentId: string;
  issuerCompany: ProposalIssuerCompany;
  isSubContract: boolean;
  partnerName: string | null;
  payerParty: ProposalPayerParty | null;
  proposalFee: number;
  discountAmount: number;
  status: ProposalStatus;
  revisionNote: string | null;
  submittedByName: string | null;
  submittedAt: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  document: LeadWorkspaceProposalDocument | null;
}

export type ProposalSaveAction = 'draft' | 'submit';

export interface SaveProposalDraftPayload {
  serviceId: string;
  issuerCompany: ProposalIssuerCompany;
  isSubContract: boolean;
  partnerName?: string;
  payerParty?: ProposalPayerParty;
  proposalFee: number;
  discountAmount: number;
  proposalDocument?: File | null;
  action?: ProposalSaveAction;
}
