import type { LeadWorkspace, LeadWorkspaceDetail } from '../types/lead-workspace.types';

/** Shell tampilan legacy `LeadWorkspace`; tab nyata memakai data API terpisah. */
const emptyLeadWorkspaceShell = (): Pick<
  LeadWorkspace,
  | 'industry'
  | 'companyPicRole'
  | 'currentStage'
  | 'archiveLabel'
  | 'minutesHighlight'
  | 'meetings'
  | 'minutes'
  | 'proposal'
  | 'proposals'
  | 'engagementLetter'
  | 'engagementLetters'
  | 'nextSteps'
  | 'winProbability'
> => ({
  industry: '',
  companyPicRole: '',
  currentStage: '',
  archiveLabel: '',
  minutesHighlight: '',
  meetings: [],
  minutes: [],
  proposal: {
    title: '',
    serviceType: '',
    estimatedFee: '',
    paymentTerms: '',
    status: 'Drafting'
  },
  proposals: [],
  engagementLetter: {
    status: 'Not Created',
    lastUpdatedAt: '',
    owner: '',
    notes: ''
  },
  engagementLetters: [],
  nextSteps: [],
  winProbability: 0
});

export const buildLeadWorkspacePreview = (detail: LeadWorkspaceDetail): LeadWorkspace => ({
  ...emptyLeadWorkspaceShell(),
  id: detail.id,
  leadCode: detail.leadCode,
  companyName: detail.companyName,
  address: detail.address,
  companyPicName: detail.companyPicName,
  companyPicPhone: detail.companyPicPhone,
  companyPicEmail: detail.companyPicEmail,
  leadSource: detail.leadSource,
  processedAt: detail.processedAt ?? '',
  processedBy: detail.processedBy ?? ''
});
