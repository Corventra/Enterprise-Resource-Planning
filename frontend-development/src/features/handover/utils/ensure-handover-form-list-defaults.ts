import type { HandoverContact, HandoverDetail, HandoverTeamMember, HandoverTimelineItem } from '../types/handover.types';

const EMPTY_MILESTONE: HandoverTimelineItem = {
  milestone: '',
  targetDate: '',
  targetDateIso: '',
  notes: ''
};

const EMPTY_EXTERNAL_CONTACT: HandoverContact = {
  role: '',
  name: '',
  contact: '',
  instruction: ''
};

const EMPTY_TEAM_MEMBER: HandoverTeamMember = {
  role: '',
  name: '',
  responsibilities: ''
};

const ensureMinStringItems = (items: string[]): string[] => (items.length > 0 ? items : ['']);

/** Memastikan setiap daftar item di form edit punya minimal satu baris kosong. */
export const ensureHandoverFormListDefaults = (form: HandoverDetail): HandoverDetail => ({
  ...form,
  scopeIncluded: ensureMinStringItems(form.scopeIncluded),
  scopeExcluded: ensureMinStringItems(form.scopeExcluded),
  deliverables: ensureMinStringItems(form.deliverables),
  timelineMilestones: form.timelineMilestones.length > 0 ? form.timelineMilestones : [{ ...EMPTY_MILESTONE }],
  outstandingData: ensureMinStringItems(form.outstandingData),
  keyRisks: ensureMinStringItems(form.keyRisks),
  communicationProtocol: ensureMinStringItems(form.communicationProtocol),
  communicationContacts:
    form.communicationContacts.length > 0 ? form.communicationContacts : [{ ...EMPTY_EXTERNAL_CONTACT }],
  teamAssignments: form.teamAssignments.length > 0 ? form.teamAssignments : [{ ...EMPTY_TEAM_MEMBER }]
});
