import type { HandoverDetail } from '../types/handover.types';

const REQUIRED_MSG = 'Wajib diisi.';
const MIN_ONE_ITEM_MSG = 'Minimal satu item wajib diisi.';

export interface HandoverSubmitErrors {
  projectTitle?: string;
  companyGroup?: string;
  projectStartDate?: string;
  projectEndDate?: string;
  backgroundSummary?: string;
  scopeIncluded?: string;
  scopeExcluded?: string;
  deliverables?: string;
  timelineMilestones?: string;
  keyRisks?: string;
  communicationProtocol?: string;
  communicationContacts?: string;
  teamAssignments?: string;
}

const trim = (value: string) => value.trim();

const hasNonEmptyString = (items: string[]) => items.some((item) => trim(item) !== '');

export const hasHandoverSubmitErrors = (errors: HandoverSubmitErrors): boolean =>
  Object.values(errors).some((value) => Boolean(value));

const ERROR_SECTION_ORDER: { key: keyof HandoverSubmitErrors; sectionId: string }[] = [
  { key: 'projectTitle', sectionId: 'project-info' },
  { key: 'companyGroup', sectionId: 'project-info' },
  { key: 'projectStartDate', sectionId: 'project-info' },
  { key: 'projectEndDate', sectionId: 'project-info' },
  { key: 'backgroundSummary', sectionId: 'background' },
  { key: 'scopeIncluded', sectionId: 'scope' },
  { key: 'scopeExcluded', sectionId: 'scope' },
  { key: 'deliverables', sectionId: 'scope' },
  { key: 'timelineMilestones', sectionId: 'scope' },
  { key: 'keyRisks', sectionId: 'risks' },
  { key: 'communicationProtocol', sectionId: 'communication' },
  { key: 'communicationContacts', sectionId: 'communication' },
  { key: 'teamAssignments', sectionId: 'team' }
];

export const firstHandoverSubmitErrorSectionId = (errors: HandoverSubmitErrors): string | null => {
  for (const { key, sectionId } of ERROR_SECTION_ORDER) {
    if (errors[key]) return sectionId;
  }
  return null;
};

export const validateHandoverForSubmit = (form: HandoverDetail): HandoverSubmitErrors => {
  const errors: HandoverSubmitErrors = {};

  if (!trim(form.projectTitle ?? '')) {
    errors.projectTitle = REQUIRED_MSG;
  }
  if (!trim(form.companyGroup ?? '')) {
    errors.companyGroup = REQUIRED_MSG;
  }
  if (!trim(form.projectStartDate ?? '')) {
    errors.projectStartDate = REQUIRED_MSG;
  }
  if (!trim(form.projectEndDate ?? '')) {
    errors.projectEndDate = REQUIRED_MSG;
  }
  if (!trim(form.backgroundSummary)) {
    errors.backgroundSummary = REQUIRED_MSG;
  }
  if (!hasNonEmptyString(form.scopeIncluded)) {
    errors.scopeIncluded = MIN_ONE_ITEM_MSG;
  }
  if (!hasNonEmptyString(form.scopeExcluded)) {
    errors.scopeExcluded = MIN_ONE_ITEM_MSG;
  }
  if (!hasNonEmptyString(form.deliverables)) {
    errors.deliverables = MIN_ONE_ITEM_MSG;
  }

  const hasValidMilestone = form.timelineMilestones.some(
    (row) => trim(row.milestone) !== '' && trim(row.targetDateIso ?? '') !== ''
  );
  if (!hasValidMilestone) {
    errors.timelineMilestones = 'Minimal satu milestone dengan nama dan tanggal target wajib diisi.';
  }

  if (!hasNonEmptyString(form.keyRisks)) {
    errors.keyRisks = MIN_ONE_ITEM_MSG;
  }
  if (!hasNonEmptyString(form.communicationProtocol)) {
    errors.communicationProtocol = MIN_ONE_ITEM_MSG;
  }

  const hasValidExternalContact = form.communicationContacts.some(
    (contact) => trim(contact.role) !== '' && trim(contact.name) !== '' && trim(contact.contact) !== ''
  );
  if (!hasValidExternalContact) {
    errors.communicationContacts =
      'Minimal satu kontak eksternal dengan role, name, dan contact wajib diisi.';
  }

  const hasValidTeamRow = form.teamAssignments.some(
    (member) => trim(member.role) !== '' && trim(member.name) !== '' && trim(member.responsibilities) !== ''
  );
  if (!hasValidTeamRow) {
    errors.teamAssignments = 'Minimal satu anggota tim dengan role, needed, dan responsibilities wajib diisi.';
  }

  return errors;
};
