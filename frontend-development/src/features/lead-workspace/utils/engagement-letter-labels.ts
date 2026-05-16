import type {
  EngagementLetterWorkflowStatus,
  EngagementPaymentMethod,
  EngagementTerminType,
  LeadWorkspaceEngagementLinkedProposalStatus
} from '../types/lead-engagement-letters.types';

export const engagementStatusLabelMap: Record<EngagementLetterWorkflowStatus, string> = {
  DRAFT: 'Draft',
  WAITING_CEO_APPROVAL: 'Menunggu persetujuan CEO',
  NEED_REVISION: 'Perlu revisi',
  APPROVED: 'Disetujui',
  SENT: 'Terkirim ke klien',
  SIGNED: 'Ditandatangani',
  REPLACED: 'Diganti (revisi)'
};

export const engagementStatusClassMap: Record<EngagementLetterWorkflowStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  WAITING_CEO_APPROVAL: 'bg-amber-100 text-amber-900',
  NEED_REVISION: 'bg-orange-100 text-orange-900',
  APPROVED: 'bg-[#006544]/10 text-[#006544]',
  SENT: 'bg-blue-100 text-blue-900',
  SIGNED: 'bg-violet-100 text-violet-900',
  REPLACED: 'bg-[#eceef0] text-[#515f74]'
};

export const paymentMethodLabelMap: Record<EngagementPaymentMethod, string> = {
  TERMIN: 'TERMIN',
  RETAINER: 'RETAINER'
};

export const proposalStatusLabelForEl: Record<LeadWorkspaceEngagementLinkedProposalStatus, string> = {
  DRAFT: 'Draft',
  WAITING_CEO_APPROVAL: 'Menunggu persetujuan CEO',
  NEED_REVISION: 'Perlu revisi',
  APPROVED: 'Disetujui',
  SENT: 'Terkirim ke klien',
  RESPONDED: 'Direspons klien'
};

export const proposalStatusClassForEl: Record<LeadWorkspaceEngagementLinkedProposalStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  WAITING_CEO_APPROVAL: 'bg-amber-100 text-amber-900',
  NEED_REVISION: 'bg-orange-100 text-orange-900',
  APPROVED: 'bg-[#006544]/10 text-[#006544]',
  SENT: 'bg-blue-100 text-blue-900',
  RESPONDED: 'bg-violet-100 text-violet-900'
};

export const terminTypeLabelMap: Record<EngagementTerminType, string> = {
  DOWN_PAYMENT: 'Down payment',
  INSTALLMENT: 'Installment',
  FINAL: 'Final'
};

export const retainerBillingTimingLabelMap = {
  BEGINNING_OF_MONTH: 'Awal bulan',
  END_OF_MONTH: 'Akhir bulan'
} as const;
