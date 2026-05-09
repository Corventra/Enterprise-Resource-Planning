import { Building2, Plus, Video, VideoIcon } from 'lucide-react';
import { useLeadWorkspacePermissions } from '../hooks/use-lead-workspace-permissions';
import type { LeadWorkspaceMeetingItem } from '../types/lead-workspace.types';

interface MeetingHistorySectionProps {
  meetings: LeadWorkspaceMeetingItem[];
  selectedMeetingId?: string;
  onSelectMeeting: (meetingId: string) => void;
}

const formatMeetingDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value.trim());

const meetingStatusClass = (status: string) =>
  status === 'Done' ? 'bg-[#006544]/10 text-[#006544]' : 'bg-[#d5e3fc] text-[#57657a]';

const platformIcon = (mode: string) => {
  if (mode === 'Zoom') return <VideoIcon className="h-4 w-4 text-blue-500" />;
  if (mode === 'Google Meet') return <Video className="h-4 w-4 text-[#0f52ba]" />;
  return <Building2 className="h-4 w-4 text-[#434653]" />;
};

export const MeetingHistorySection = ({ meetings, selectedMeetingId, onSelectMeeting }: MeetingHistorySectionProps) => {
  const { canManageLeadWorkspace } = useLeadWorkspacePermissions();
  return (
    <div className="col-span-12 flex flex-col gap-4 lg:col-span-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-[#191c1e]">Meeting</h2>
        {canManageLeadWorkspace ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-[#003c90]/20 transition-opacity hover:opacity-90 sm:text-sm"
            >
              <Plus className="h-4 w-4" />
              Schedule Meeting
            </button>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#f2f4f6]/70 text-[11px] font-bold uppercase tracking-wider text-[#737784]">
              <th className="px-5 py-3">Meeting Title</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Platform/Location</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-5 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {meetings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-[#737784]">
                  No meetings found.
                </td>
              </tr>
            ) : (
              meetings.map((meeting) => (
                <tr
                  key={meeting.id}
                  onClick={() => onSelectMeeting(meeting.id)}
                  className={
                    meeting.id === selectedMeetingId
                      ? 'cursor-pointer border-l-4 border-[#003c90] bg-[#003c90]/5 transition-colors'
                      : 'cursor-pointer border-b border-[#eceef0] transition-colors hover:bg-[#f2f4f6]'
                  }
                >
                  <td className="px-5 py-3.5 font-semibold text-[#191c1e]">{meeting.title}</td>
                  <td className="px-4 py-3.5 text-[#434653]">{formatMeetingDate(meeting.date)}</td>
                  <td className="px-4 py-3.5">
                    <div className="inline-flex items-center gap-2">
                      {platformIcon(meeting.mode)}
                      {isHttpUrl(meeting.platformOrLocation) ? (
                        <a
                          href={meeting.platformOrLocation}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="text-xs font-semibold text-[#003c90] underline-offset-2 hover:underline"
                        >
                          {meeting.platformOrLocation}
                        </a>
                      ) : (
                        <span className="text-xs text-[#434653]">{meeting.platformOrLocation}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-[#434653]">
                    <span className="line-clamp-2">{meeting.notes}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${meetingStatusClass(meeting.status)}`}>
                      {meeting.status === 'Scheduled' ? 'Upcoming' : meeting.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
