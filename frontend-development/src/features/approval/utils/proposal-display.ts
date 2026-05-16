import type { ProposalStatus } from '../../lead-workspace/types/lead-proposals.types';

export const formatProposalCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

export const formatProposalDateTime = (iso: string | null | undefined) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const proposalStatusLabelMap: Record<ProposalStatus, string> = {
  DRAFT: 'Draft',
  WAITING_CEO_APPROVAL: 'Waiting CEO Approval',
  NEED_REVISION: 'Need Revision',
  APPROVED: 'Approved',
  SENT: 'Sent',
  RESPONDED: 'Responded'
};

export const proposalStatusClassMap: Record<ProposalStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  WAITING_CEO_APPROVAL: 'bg-amber-100 text-amber-900',
  NEED_REVISION: 'bg-orange-100 text-orange-900',
  APPROVED: 'bg-[#006544]/10 text-[#006544]',
  SENT: 'bg-blue-100 text-blue-900',
  RESPONDED: 'bg-violet-100 text-violet-900'
};

export const getProposalStatusLabel = (status: ProposalStatus | undefined) =>
  status ? proposalStatusLabelMap[status] : 'Waiting CEO Approval';

export const formatProposalPayerParty = (value: 'PARTNER' | 'CLIENT' | null | undefined) => {
  if (value === 'PARTNER') return 'Partner';
  if (value === 'CLIENT') return 'Client';
  return '-';
};
