import { Building2, CheckCircle2, Pencil, Plus, Video } from 'lucide-react';
import { useOutletContext } from 'react-router';
import { useLeadWorkspacePermissions } from '../hooks/use-lead-workspace-permissions';
import type { LeadWorkspaceMeetingListItem } from '../types/lead-meetings.types';
import type { LeadWorkspaceOutletContext } from '../types/lead-workspace.types';
import {
  formatMeetingDateLines,
  getMeetingAccessHref,
  meetingModeTableLabel,
  meetingStatusClass,
  meetingStatusLabel,
  meetingTableClampClassName
} from '../utils/meeting-history-table-display';

interface MeetingHistorySectionProps {
  meetings: LeadWorkspaceMeetingListItem[];
  selectedMeetingId?: string;
  isLoading?: boolean;
  loadError?: string | null;
  onSelectMeeting: (meetingId: string) => void;
  onScheduleMeeting?: () => void;
  onEditMeeting?: (meetingId: string) => void;
  onMarkDone?: (meetingId: string) => void;
  markDoneBusyMeetingId?: string | null;
}

const platformIcon = (mode: LeadWorkspaceMeetingListItem['mode']) => {
  if (mode === 'ONLINE') return <Video className="h-4 w-4 shrink-0 text-[#0f52ba]" />;
  return <Building2 className="h-4 w-4 shrink-0 text-[#434653]" />;
};

const actionIconClassName =
  'inline-flex rounded-lg p-1.5 text-[#737784] transition-colors hover:bg-[#f2f4f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d59c1]/40 disabled:opacity-50';

const rowCellClassName = 'px-2 py-3.5 align-top first:pl-5 last:pr-5';

export const MeetingHistorySection = ({
  meetings,
  selectedMeetingId,
  isLoading = false,
  loadError = null,
  onSelectMeeting,
  onScheduleMeeting,
  onEditMeeting,
  onMarkDone,
  markDoneBusyMeetingId = null
}: MeetingHistorySectionProps) => {
  const { processedByUserId } = useOutletContext<LeadWorkspaceOutletContext>();
  const { canManageLeadWorkspace } = useLeadWorkspacePermissions({ processedByUserId });

  return (
    <div className="col-span-12 flex flex-col gap-4 lg:col-span-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-[#191c1e]">Meeting</h2>
        {canManageLeadWorkspace ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onScheduleMeeting}
              className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-[#003c90]/20 transition-opacity hover:opacity-90 sm:text-sm"
            >
              <Plus className="h-4 w-4" />
              Schedule Meeting
            </button>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]">
        {loadError ? (
          <p className="px-5 py-4 text-sm text-red-700">{loadError}</p>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[20%]" />
              <col className="w-[25%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className="bg-[#f2f4f6]/70 text-[11px] font-bold uppercase tracking-wider text-[#737784]">
                <th className="px-5 py-3">Meeting Title</th>
                <th className="px-4 py-3">Platform/Location</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3 text-right">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-[#737784]">
                    Loading meetings...
                  </td>
                </tr>
              ) : meetings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-[#737784]">
                    No meetings found.
                  </td>
                </tr>
              ) : (
                meetings.map((meeting) => {
                  const access = meeting.platformOrLocation.trim();
                  const modeLabel = meetingModeTableLabel(meeting.mode);
                  const { dateLine, timeLine } = formatMeetingDateLines(meeting.date);
                  const accessHref = getMeetingAccessHref(meeting.mode, access);

                  return (
                    <tr
                      key={meeting.id}
                      onClick={() => onSelectMeeting(meeting.id)}
                      className={
                        meeting.id === selectedMeetingId
                          ? 'cursor-pointer border-l-4 border-[#003c90] bg-[#003c90]/5 transition-colors'
                          : 'cursor-pointer border-b border-[#eceef0] transition-colors hover:bg-[#f2f4f6]'
                      }
                    >
                      <td className={`${rowCellClassName} font-semibold text-[#191c1e]`}>
                        <span className={meetingTableClampClassName.title} title={meeting.title}>
                          {meeting.title}
                        </span>
                      </td>
                      <td className={rowCellClassName}>
                        <div className="min-w-0">
                          <div className="inline-flex min-w-0 items-start gap-2">
                            {platformIcon(meeting.mode)}
                            {accessHref ? (
                              <a
                                href={accessHref}
                                target="_blank"
                                rel="noreferrer"
                                title={access}
                                onClick={(event) => event.stopPropagation()}
                                className="min-w-0 text-xs font-semibold text-[#003c90] underline-offset-2 hover:underline"
                              >
                                {modeLabel}
                              </a>
                            ) : (
                              <span className="min-w-0 text-xs text-[#434653]" title={access || undefined}>
                                {modeLabel}
                              </span>
                            )}
                          </div>
                          <p className="text-xs leading-snug text-[#434653]">
                            {dateLine}
                            {timeLine ? (
                              <>
                                {' '}
                                <span className="text-[11px] text-[#434653]">{timeLine}</span>
                              </>
                            ) : null}
                          </p>
                        </div>
                      </td>
                      <td className={`${rowCellClassName} text-xs text-[#434653]`}>
                        <span className={meetingTableClampClassName.notes} title={meeting.notes || undefined}>
                          {meeting.notes || '-'}
                        </span>
                      </td>
                      <td className={`${rowCellClassName} text-right`}>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${meetingStatusClass(meeting.status)}`}
                        >
                          {meetingStatusLabel(meeting.status)}
                        </span>
                      </td>
                      <td className={`${rowCellClassName} text-right`}>
                        {canManageLeadWorkspace && meeting.status === 'SCHEDULED' ? (
                          <div
                            className="inline-flex items-center justify-end gap-1"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => onEditMeeting?.(meeting.id)}
                              className={`${actionIconClassName} hover:text-[#003c90]`}
                              aria-label="Edit meeting"
                            >
                              <Pencil className="h-4 w-4" strokeWidth={2} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onMarkDone?.(meeting.id)}
                              disabled={markDoneBusyMeetingId === meeting.id}
                              className={`${actionIconClassName} hover:text-[#006544]`}
                              aria-label="Mark meeting done"
                            >
                              <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#737784]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
