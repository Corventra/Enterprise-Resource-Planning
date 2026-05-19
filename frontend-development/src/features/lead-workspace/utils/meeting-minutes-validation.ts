import type { SaveMeetingMinutesPayload } from '../types/lead-meetings.types';

export interface MeetingMinutesFormErrors {
  internalParticipants?: string;
  clientParticipants?: string;
  meetingObjectives?: string;
  backgroundSummary?: string;
  issuesDiscussed?: string;
  infoClient?: string;
  infoFirm?: string;
  riskConcerns?: string;
  nextSteps?: string;
  agreements?: string;
  agreementItems?: Record<number, string>;
}

const requiredText = (value: string | undefined, message: string): string | undefined =>
  value?.trim() ? undefined : message;

export const validateMeetingMinutesPayload = (
  payload: SaveMeetingMinutesPayload
): MeetingMinutesFormErrors => {
  const errors: MeetingMinutesFormErrors = {};

  const internalFilled = payload.internalParticipants.map((item) => item.trim()).filter(Boolean);
  const clientFilled = payload.clientParticipants.map((item) => item.trim()).filter(Boolean);

  if (internalFilled.length === 0) {
    errors.internalParticipants = 'Minimal satu peserta internal wajib diisi.';
  }
  if (clientFilled.length === 0) {
    errors.clientParticipants = 'Minimal satu peserta klien wajib diisi.';
  }

  errors.meetingObjectives = requiredText(payload.meetingObjectives, 'Meeting objectives wajib diisi.');
  errors.backgroundSummary = requiredText(payload.backgroundSummary, 'Background summary wajib diisi.');
  errors.issuesDiscussed = requiredText(payload.issuesDiscussed, 'Issues discussed wajib diisi.');
  errors.infoClient = requiredText(payload.infoClient, 'Information from client wajib diisi.');
  errors.infoFirm = requiredText(payload.infoFirm, 'Information from our firm wajib diisi.');
  errors.riskConcerns = requiredText(payload.riskConcerns, 'Risks / concerns wajib diisi.');
  errors.nextSteps = requiredText(payload.nextSteps, 'Next steps wajib diisi.');

  const agreementItems: Record<number, string> = {};
  let hasAgreementItem = false;
  payload.agreements.forEach((agreement, index) => {
    if (agreement.item.trim()) {
      hasAgreementItem = true;
      return;
    }
    agreementItems[index] = 'Item agreement wajib diisi.';
  });

  if (!hasAgreementItem) {
    errors.agreements = 'Minimal satu agreement wajib diisi.';
  } else if (Object.keys(agreementItems).length > 0) {
    errors.agreementItems = agreementItems;
  }

  const cleaned: MeetingMinutesFormErrors = {};
  for (const [key, value] of Object.entries(errors)) {
    if (key === 'agreementItems') {
      const items = value as Record<number, string> | undefined;
      if (items && Object.keys(items).length > 0) {
        cleaned.agreementItems = items;
      }
      continue;
    }
    if (value) {
      cleaned[key as keyof Omit<MeetingMinutesFormErrors, 'agreementItems'>] = value as string;
    }
  }
  return cleaned;
};

export const hasMeetingMinutesFormErrors = (errors: MeetingMinutesFormErrors): boolean => {
  if (Object.values(errors).some((value) => typeof value === 'string' && value)) return true;
  return Boolean(errors.agreementItems && Object.keys(errors.agreementItems).length > 0);
};

export const normalizeMeetingMinutesPayload = (
  payload: SaveMeetingMinutesPayload
): SaveMeetingMinutesPayload => ({
  meetingObjectives: payload.meetingObjectives?.trim() || undefined,
  backgroundSummary: payload.backgroundSummary?.trim() || undefined,
  issuesDiscussed: payload.issuesDiscussed?.trim() || undefined,
  infoClient: payload.infoClient?.trim() || undefined,
  infoFirm: payload.infoFirm?.trim() || undefined,
  riskConcerns: payload.riskConcerns?.trim() || undefined,
  nextSteps: payload.nextSteps?.trim() || undefined,
  notesFollowUp: payload.notesFollowUp?.trim() || undefined,
  internalParticipants: payload.internalParticipants.map((item) => item.trim()).filter(Boolean),
  clientParticipants: payload.clientParticipants.map((item) => item.trim()).filter(Boolean),
  agreements: payload.agreements
    .map((agreement) => ({
      item: agreement.item.trim(),
      details: agreement.details?.trim() || undefined
    }))
    .filter((agreement) => agreement.item.length > 0)
});
