import type { MeetingMode } from '../types/lead-meetings.types';

export const isHttpUrl = (value: string) => /^https?:\/\//i.test(value.trim());

export const getMeetingAccessHref = (mode: MeetingMode, access: string) => {
  const value = access.trim();
  if (!value) return undefined;
  if (isHttpUrl(value)) return value;
  if (mode === 'OFFLINE') {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
  }
  return undefined;
};

export const meetingModeTableLabel = (mode: MeetingMode) =>
  mode === 'ONLINE' ? 'Online meeting' : 'Offline meeting';

export const meetingTableClampClassName = {
  title: 'line-clamp-2 break-words',
  notes: 'line-clamp-2 break-words'
} as const;

export const formatMeetingDateLines = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { dateLine: iso, timeLine: '' };
  }

  return {
    dateLine: date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }),
    timeLine: date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  };
};

export const meetingStatusClass = (status: 'SCHEDULED' | 'DONE' | 'CANCELLED') =>
  status === 'DONE' ? 'bg-[#006544]/10 text-[#006544]' : 'bg-[#d5e3fc] text-[#57657a]';

export const meetingStatusLabel = (status: 'SCHEDULED' | 'DONE' | 'CANCELLED') => {
  if (status === 'DONE') return 'Done';
  if (status === 'CANCELLED') return 'Cancelled';
  return 'Scheduled';
};
