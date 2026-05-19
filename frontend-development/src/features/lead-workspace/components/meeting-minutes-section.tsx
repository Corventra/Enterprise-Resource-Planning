import { Building2, CalendarDays, Download, Share2, Video } from 'lucide-react';
import { useOutletContext } from 'react-router';
import { useLeadWorkspacePermissions } from '../hooks/use-lead-workspace-permissions';
import type { LeadWorkspaceMeetingMinutesView } from '../types/lead-meetings.types';
import type { LeadWorkspaceOutletContext } from '../types/lead-workspace.types';
import { isHttpUrl, meetingModeTableLabel } from '../utils/meeting-history-table-display';

interface MeetingMinutesSectionProps {
  detail?: LeadWorkspaceMeetingMinutesView | null;
  isLoading?: boolean;
  loadError?: string | null;
  onEditMinutes?: () => void;
  /** True jika daftar meeting kosong — tampilan empty selaras tab Engagement Letter. */
  meetingsEmpty?: boolean;
  onScheduleMeeting?: () => void;
}

const formatMeetingDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const detailStatusClass = (status: LeadWorkspaceMeetingMinutesView['meeting']['status']) => {
  if (status === 'DONE') return 'bg-[#006544]/10 text-[#006544]';
  if (status === 'CANCELLED') return 'bg-red-100 text-red-800';
  return 'bg-[#d5e3fc] text-[#57657a]';
};

const detailStatusLabel = (status: LeadWorkspaceMeetingMinutesView['meeting']['status']) => {
  if (status === 'DONE') return 'Done';
  if (status === 'CANCELLED') return 'Cancelled';
  return 'Scheduled';
};

const minutesStatusClass = (hasMinutes: boolean) =>
  hasMinutes ? 'bg-[#006544]/10 text-[#006544]' : 'bg-[#eceef0] text-[#57657a]';

const minutesStatusLabel = (hasMinutes: boolean) => (hasMinutes ? 'Done' : 'Not Created');

const platformIcon = (mode: LeadWorkspaceMeetingMinutesView['meeting']['mode']) => {
  if (mode === 'ONLINE') return <Video className="h-4 w-4 text-[#0f52ba]" />;
  return <Building2 className="h-4 w-4 text-[#434653]" />;
};

const displayValue = (value: string) => (value.trim().length > 0 ? value : '-');

const minutesBodyTextClassName = 'text-justify text-sm text-[#434653]';
const minutesMetaTextClassName = 'text-justify text-xs text-[#434653]';

export const MeetingMinutesSection = ({
  detail,
  isLoading = false,
  loadError = null,
  onEditMinutes,
  meetingsEmpty = false,
  onScheduleMeeting
}: MeetingMinutesSectionProps) => {
  const { processedByUserId } = useOutletContext<LeadWorkspaceOutletContext>();
  const { canManageLeadWorkspace } = useLeadWorkspacePermissions({ processedByUserId });
  const selectedMeeting = detail?.meeting;
  const minutesDetail = detail?.minutesDetail;
  const hasMinutes = Boolean(minutesDetail);
  const canEditMinutes = canManageLeadWorkspace && selectedMeeting?.status === 'DONE';

  return (
    <aside className="col-span-12 flex flex-col gap-4 lg:col-span-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-[#191c1e]">Minutes</h2>
        <div className="flex items-center gap-2">
          {canEditMinutes ? (
            <button
              type="button"
              onClick={onEditMinutes}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-[#003c90] transition-colors hover:bg-[#003c90]/5 sm:text-sm"
            >
              <CalendarDays className="h-4 w-4" />
              {minutesDetail ? 'Edit Notulensi' : 'Create Notulensi'}
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]">
        {isLoading ? (
          <div className="p-6 text-sm text-[#737784]">Memuat notulensi…</div>
        ) : loadError ? (
          <div className="p-6 text-sm text-red-700">{loadError}</div>
        ) : selectedMeeting ? (
          <>
            <div className="bg-gradient-to-r from-[#f2f4f6] to-[#f2f4f6]/40 p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold leading-tight text-[#191c1e]">{selectedMeeting.title}</h3>
                  <p className="mt-1 text-xs text-[#434653]">{formatMeetingDate(selectedMeeting.date)}</p>
                </div>
                <div className="rounded-full bg-white p-2 shadow-sm">{platformIcon(selectedMeeting.mode)}</div>
              </div>
              <div className="inline-flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${detailStatusClass(selectedMeeting.status)}`}>
                  {detailStatusLabel(selectedMeeting.status)}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${minutesStatusClass(hasMinutes)}`}>
                  Minutes: {minutesStatusLabel(hasMinutes)}
                </span>
                <span className="text-xs text-[#515f74]">{selectedMeeting.mode === 'ONLINE' ? 'Online' : 'Offline'}</span>
                <span className="text-xs text-[#515f74]">-</span>
                {isHttpUrl(selectedMeeting.platformOrLocation) ? (
                  <a
                    href={selectedMeeting.platformOrLocation}
                    target="_blank"
                    rel="noreferrer"
                    title={selectedMeeting.platformOrLocation}
                    className="text-xs font-semibold text-[#003c90] underline-offset-2 hover:underline"
                  >
                    {meetingModeTableLabel(selectedMeeting.mode)}
                  </a>
                ) : (
                  <span className="text-xs text-[#515f74]" title={selectedMeeting.platformOrLocation || undefined}>
                    {selectedMeeting.platformOrLocation.trim()
                      ? selectedMeeting.platformOrLocation
                      : meetingModeTableLabel(selectedMeeting.mode)}
                  </span>
                )}
                <span className="text-xs text-[#515f74]">-</span>
                <span className="text-xs text-[#515f74]">
                  Created By: {selectedMeeting.createdByName?.trim() || 'Sistem'}
                </span>
              </div>
              <p className={`mt-2 ${minutesMetaTextClassName}`}>{selectedMeeting.notes || '-'}</p>
            </div>

            {!minutesDetail ? (
              <div className="p-6 text-sm text-[#737784]">
                {selectedMeeting.status === 'DONE'
                  ? 'Notulensi belum dibuat untuk meeting ini.'
                  : 'Notulensi dapat dibuat setelah meeting ditandai selesai.'}
              </div>
            ) : (
              <div className="max-h-[34rem] space-y-7 overflow-y-auto p-5 text-justify">
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-6 w-1.5 rounded-full bg-[#004b31]" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-[#191c1e]">Participants</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-[#eceef0] p-3">
                      <p className="mb-2 text-xs font-semibold text-[#737784]">Internal Team</p>
                      <ul className="list-inside list-disc space-y-1 text-justify text-sm text-[#434653]">
                        {minutesDetail.participants.internal.length > 0 ? (
                          minutesDetail.participants.internal.map((person) => <li key={person}>{person}</li>)
                        ) : (
                          <li>-</li>
                        )}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-[#eceef0] p-3">
                      <p className="mb-2 text-xs font-semibold text-[#737784]">Client Team</p>
                      <ul className="list-inside list-disc space-y-1 text-justify text-sm text-[#434653]">
                        {minutesDetail.participants.client.length > 0 ? (
                          minutesDetail.participants.client.map((person) => <li key={person}>{person}</li>)
                        ) : (
                          <li>-</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-6 w-1.5 rounded-full bg-[#0f52ba]" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-[#191c1e]">Meeting Objectives</h4>
                  </div>
                  <p className={minutesBodyTextClassName}>{displayValue(minutesDetail.objectives)}</p>
                </section>

                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-6 w-1.5 rounded-full bg-[#0f52ba]" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-[#191c1e]">Discussion Summary</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-[#737784]">Background Summary</p>
                      <p className={minutesBodyTextClassName}>{displayValue(minutesDetail.discussionSummary.background)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#737784]">Issues Discussed</p>
                      <p className={minutesBodyTextClassName}>{displayValue(minutesDetail.discussionSummary.issuesDiscussed)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#737784]">Information from Client</p>
                      <p className={minutesBodyTextClassName}>{displayValue(minutesDetail.discussionSummary.clientInfo)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#737784]">Information from Our Firm</p>
                      <p className={minutesBodyTextClassName}>{displayValue(minutesDetail.discussionSummary.firmInfo)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#737784]">Risks / Concerns</p>
                      <p className={minutesBodyTextClassName}>{displayValue(minutesDetail.discussionSummary.risks)}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-6 w-1.5 rounded-full bg-[#004b31]" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-[#191c1e]">Agreements</h4>
                  </div>
                  {minutesDetail.agreements.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border border-[#eceef0]">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#f8fafc]">
                          <tr>
                            <th className="px-3 py-2 text-xs font-semibold text-[#737784]">Item</th>
                            <th className="px-3 py-2 text-xs font-semibold text-[#737784]">Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {minutesDetail.agreements.map((agreement, index) => (
                            <tr key={`${agreement.item}-${index}`} className="border-t border-[#eceef0]">
                              <td className="px-3 py-2 text-justify text-[#191c1e]">{agreement.item || '-'}</td>
                              <td className="px-3 py-2 text-justify text-[#434653]">{agreement.details || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-[#737784]">-</p>
                  )}
                </section>

                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-6 w-1.5 rounded-full bg-[#0f52ba]" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-[#191c1e]">Next Steps</h4>
                  </div>
                  <p className={minutesBodyTextClassName}>{displayValue(minutesDetail.nextSteps)}</p>
                </section>

                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-6 w-1.5 rounded-full bg-[#0f52ba]" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-[#191c1e]">Notes & Follow-Up</h4>
                  </div>
                  <p className={minutesBodyTextClassName}>{displayValue(minutesDetail.followUpNotes)}</p>
                </section>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3">
              <div className="text-[11px] italic text-[#737784]">Minutes summary for selected meeting</div>
              {canManageLeadWorkspace ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg p-2 text-[#434653] transition-colors hover:bg-[#f2f4f6]"
                    aria-label="Share minutes"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-[#434653] transition-colors hover:bg-[#f2f4f6]"
                    aria-label="Download minutes"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          </>
        ) : meetingsEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
            <p className="max-w-sm text-sm text-[#515f74]">
              Belum ada meeting untuk lead ini. Jadwalkan meeting terlebih dahulu; setelah meeting selesai Anda dapat
              mencatat notulensi di sini.
            </p>
            {canManageLeadWorkspace && onScheduleMeeting ? (
              <button
                type="button"
                onClick={onScheduleMeeting}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#003c90]/20 transition-opacity hover:opacity-90 sm:text-sm"
              >
                Schedule Meeting
              </button>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
            <p className="max-w-sm text-sm text-[#515f74]">Pilih meeting di daftar kiri untuk melihat ringkasan notulensi.</p>
          </div>
        )}
      </div>
    </aside>
  );
};
