import { Building2, CalendarDays, Download, Share2, Video, VideoIcon } from 'lucide-react';
import type { LeadWorkspaceMeetingItem } from '../types/lead-workspace.types';

interface MeetingMinutesSectionProps {
  selectedMeeting?: LeadWorkspaceMeetingItem;
}

const formatMeetingDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value.trim());

const detailStatusClass = (status: string) =>
  status === 'Done' ? 'bg-[#006544]/10 text-[#006544]' : 'bg-[#d5e3fc] text-[#57657a]';

const platformIcon = (mode: string) => {
  if (mode === 'Zoom') return <VideoIcon className="h-4 w-4 text-blue-500" />;
  if (mode === 'Google Meet') return <Video className="h-4 w-4 text-[#0f52ba]" />;
  return <Building2 className="h-4 w-4 text-[#434653]" />;
};

export const MeetingMinutesSection = ({ selectedMeeting }: MeetingMinutesSectionProps) => {
  return (
    <aside className="col-span-12 flex flex-col gap-4 lg:col-span-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-[#191c1e]">Minutes</h2>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-[#003c90] transition-colors hover:bg-[#003c90]/5 sm:text-sm"
        >
          <CalendarDays className="h-4 w-4" />
          Edit Notulensi
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]">
        {selectedMeeting ? (
          <>
            <div className="bg-gradient-to-r from-[#f2f4f6] to-[#f2f4f6]/40 p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold leading-tight text-[#191c1e]">{selectedMeeting.title}</h3>
                  <p className="mt-1 text-xs text-[#434653]">{formatMeetingDate(selectedMeeting.date)}</p>
                </div>
                <div className="rounded-full bg-white p-2 shadow-sm">{platformIcon(selectedMeeting.mode)}</div>
              </div>
              <div className="inline-flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${detailStatusClass(selectedMeeting.status)}`}>
                  {selectedMeeting.status === 'Scheduled' ? 'Upcoming' : selectedMeeting.status}
                </span>
                <span className="text-xs text-[#515f74]">{selectedMeeting.mode}</span>
                <span className="text-xs text-[#515f74]">-</span>
                {isHttpUrl(selectedMeeting.platformOrLocation) ? (
                  <a
                    href={selectedMeeting.platformOrLocation}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-[#003c90] underline-offset-2 hover:underline"
                  >
                    {selectedMeeting.platformOrLocation}
                  </a>
                ) : (
                  <span className="text-xs text-[#515f74]">{selectedMeeting.platformOrLocation}</span>
                )}
                <span className="text-xs text-[#515f74]">-</span>
                <span className="text-xs text-[#515f74]">Created By: System User</span>
              </div>
              <p className="mt-2 text-xs text-[#434653]">{selectedMeeting.notes}</p>
            </div>

            <div className="max-h-[34rem] space-y-7 overflow-y-auto p-5">
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-6 w-1.5 rounded-full bg-[#004b31]" />
                  <h4 className="text-sm font-bold uppercase tracking-wider text-[#191c1e]">Participants</h4>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-[#eceef0] p-3">
                    <p className="mb-2 text-xs font-semibold text-[#737784]">Internal Team</p>
                    <ul className="list-inside list-disc space-y-1 text-sm text-[#434653]">
                      {selectedMeeting.minutesDetail.participants.internal.length > 0 ? (
                        selectedMeeting.minutesDetail.participants.internal.map((person) => <li key={person}>{person}</li>)
                      ) : (
                        <li>-</li>
                      )}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-[#eceef0] p-3">
                    <p className="mb-2 text-xs font-semibold text-[#737784]">Client Team</p>
                    <ul className="list-inside list-disc space-y-1 text-sm text-[#434653]">
                      {selectedMeeting.minutesDetail.participants.client.length > 0 ? (
                        selectedMeeting.minutesDetail.participants.client.map((person) => <li key={person}>{person}</li>)
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
                <p className="text-sm text-[#434653]">{selectedMeeting.minutesDetail.objectives || '-'}</p>
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-6 w-1.5 rounded-full bg-[#0f52ba]" />
                  <h4 className="text-sm font-bold uppercase tracking-wider text-[#191c1e]">Discussion Summary</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-[#737784]">Background Summary</p>
                    <p className="text-sm text-[#434653]">{selectedMeeting.minutesDetail.discussionSummary.background || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#737784]">Issues Discussed</p>
                    <p className="text-sm text-[#434653]">{selectedMeeting.minutesDetail.discussionSummary.issuesDiscussed || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#737784]">Information from Client</p>
                    <p className="text-sm text-[#434653]">{selectedMeeting.minutesDetail.discussionSummary.clientInfo || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#737784]">Information from Our Firm</p>
                    <p className="text-sm text-[#434653]">{selectedMeeting.minutesDetail.discussionSummary.firmInfo || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#737784]">Risks / Concerns</p>
                    <p className="text-sm text-[#434653]">{selectedMeeting.minutesDetail.discussionSummary.risks || '-'}</p>
                  </div>
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-6 w-1.5 rounded-full bg-[#004b31]" />
                  <h4 className="text-sm font-bold uppercase tracking-wider text-[#191c1e]">Agreements</h4>
                </div>
                {selectedMeeting.minutesDetail.agreements.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-[#eceef0]">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#f8fafc]">
                        <tr>
                          <th className="px-3 py-2 text-xs font-semibold text-[#737784]">Item</th>
                          <th className="px-3 py-2 text-xs font-semibold text-[#737784]">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMeeting.minutesDetail.agreements.map((agreement, index) => (
                          <tr key={`${agreement.item}-${index}`} className="border-t border-[#eceef0]">
                            <td className="px-3 py-2 text-[#191c1e]">{agreement.item || '-'}</td>
                            <td className="px-3 py-2 text-[#434653]">{agreement.details || '-'}</td>
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
                  <span className="h-6 w-1.5 rounded-full bg-[#004b31]" />
                  <h4 className="text-sm font-bold uppercase tracking-wider text-[#191c1e]">Action Items</h4>
                </div>
                {selectedMeeting.minutesDetail.actionItems.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-[#eceef0]">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#f8fafc]">
                        <tr>
                          <th className="px-3 py-2 text-xs font-semibold text-[#737784]">Action</th>
                          <th className="px-3 py-2 text-xs font-semibold text-[#737784]">PIC</th>
                          <th className="px-3 py-2 text-xs font-semibold text-[#737784]">Deadline</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMeeting.minutesDetail.actionItems.map((item, index) => (
                          <tr key={`${item.action}-${index}`} className="border-t border-[#eceef0]">
                            <td className="px-3 py-2 text-[#191c1e]">{item.action || '-'}</td>
                            <td className="px-3 py-2 text-[#434653]">{item.pic || '-'}</td>
                            <td className="px-3 py-2 text-[#434653]">{item.deadline || '-'}</td>
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
                <p className="text-sm text-[#434653]">{selectedMeeting.minutesDetail.nextSteps || '-'}</p>
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-6 w-1.5 rounded-full bg-[#0f52ba]" />
                  <h4 className="text-sm font-bold uppercase tracking-wider text-[#191c1e]">Notes & Follow-Up</h4>
                </div>
                <p className="text-sm text-[#434653]">{selectedMeeting.minutesDetail.followUpNotes || '-'}</p>
              </section>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3">
              <div className="text-[11px] italic text-[#737784]">Last synced with Cloud at 14:20 PM</div>
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
            </div>
          </>
        ) : (
          <div className="p-6 text-sm text-[#737784]">Select a meeting to see minutes summary.</div>
        )}
      </div>
    </aside>
  );
};
