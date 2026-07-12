import type { ScheduleMeetingPayload } from '../types/lead-meetings.types';

export interface ScheduleMeetingFormErrors {
  title?: string;
  meetingDatetime?: string;
  meetingAccess?: string;
}

/** Today's date as YYYY-MM-DD in the user's local timezone. */
export const getLocalTodayIsoDate = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Minimum value for `datetime-local` inputs (start of today). */
export const getLocalDatetimeLocalMin = (): string => `${getLocalTodayIsoDate()}T00:00`;

export const validateScheduleMeetingPayload = (
  values: ScheduleMeetingPayload
): ScheduleMeetingFormErrors => {
  const errors: ScheduleMeetingFormErrors = {};

  if (!values.title.trim()) {
    errors.title = 'Judul meeting wajib diisi.';
  }
  if (!values.meetingDatetime.trim()) {
    errors.meetingDatetime = 'Tanggal dan waktu wajib diisi.';
  } else if (values.meetingDatetime < getLocalDatetimeLocalMin()) {
    errors.meetingDatetime = 'Tanggal meeting tidak boleh sebelum hari ini.';
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
