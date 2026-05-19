import type { ScheduleMeetingPayload } from '../types/lead-meetings.types';

export interface ScheduleMeetingFormErrors {
  title?: string;
  meetingDatetime?: string;
  meetingAccess?: string;
}

export const validateScheduleMeetingPayload = (
  values: ScheduleMeetingPayload
): ScheduleMeetingFormErrors => {
  const errors: ScheduleMeetingFormErrors = {};

  if (!values.title.trim()) {
    errors.title = 'Judul meeting wajib diisi.';
  }
  if (!values.meetingDatetime.trim()) {
    errors.meetingDatetime = 'Tanggal dan waktu wajib diisi.';
  }
  if (!values.meetingAccess.trim()) {
    errors.meetingAccess =
      values.meetingMode === 'ONLINE'
        ? 'Link atau platform meeting wajib diisi.'
        : 'Lokasi meeting wajib diisi.';
  }

  return errors;
};

export const hasScheduleMeetingFormErrors = (errors: ScheduleMeetingFormErrors): boolean =>
  Object.keys(errors).length > 0;
