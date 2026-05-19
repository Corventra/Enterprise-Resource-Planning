import type { ProposalIssuerCompany, ProposalPayerParty } from '../types/lead-proposals.types';

export interface ProposalFormDraftInput {
  serviceId: string;
  issuerCompany: ProposalIssuerCompany | '';
  isSubContract: boolean;
  partnerName?: string;
  payerParty?: ProposalPayerParty;
  proposalFee: number;
  discountAmount: number;
  proposalDocument?: File | null;
}

export interface ProposalFormErrors {
  serviceClassId?: string;
  serviceId?: string;
  issuerCompany?: string;
  partnerName?: string;
  payerParty?: string;
  proposalFee?: string;
  discountAmount?: string;
  proposalDocument?: string;
}

export const hasProposalFormErrors = (errors: ProposalFormErrors): boolean =>
  Object.values(errors).some((value) => Boolean(value));

export const validateProposalForm = (
  draft: ProposalFormDraftInput,
  selectedServiceClassId: string,
  options: { hasExistingDocument: boolean }
): ProposalFormErrors => {
  const errors: ProposalFormErrors = {};

  if (!selectedServiceClassId) {
    errors.serviceClassId = 'Service class wajib dipilih.';
  }

  if (!draft.serviceId) {
    errors.serviceId = 'Service wajib dipilih.';
  }

  if (!draft.issuerCompany) {
    errors.issuerCompany = 'Issuer company wajib dipilih.';
  }

  if (draft.proposalFee <= 0) {
    errors.proposalFee = 'Proposal fee wajib diisi dan harus lebih besar dari 0.';
  }

  if (draft.discountAmount < 0) {
    errors.discountAmount = 'Discount tidak boleh negatif.';
  } else if (draft.proposalFee > 0 && draft.discountAmount > draft.proposalFee) {
    errors.discountAmount = 'Discount tidak boleh melebihi proposal fee.';
  }

  if (draft.isSubContract) {
    if (!draft.partnerName?.trim()) {
      errors.partnerName = 'Partner name wajib diisi untuk sub contract.';
    }
    if (!draft.payerParty) {
      errors.payerParty = 'Payer party wajib dipilih untuk sub contract.';
    }
  }

  const hasProposalDocument = Boolean(draft.proposalDocument) || options.hasExistingDocument;
  if (!hasProposalDocument) {
    errors.proposalDocument = 'Dokumen proposal wajib diunggah.';
  }

  return errors;
};
