import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import { MeetingHistorySection } from '../components/meeting-history-section';
import { MeetingMinutesSection } from '../components/meeting-minutes-section';
import type { LeadWorkspaceOutletContext } from '../types/lead-workspace.types';

export const MeetingPage = () => {
  const { workspace } = useOutletContext<LeadWorkspaceOutletContext>();
  const filteredMeetings = useMemo(() => workspace.meetings, [workspace.meetings]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(filteredMeetings[0]?.id ?? null);

  useEffect(() => {
    if (filteredMeetings.length === 0) {
      setSelectedMeetingId(null);
      return;
    }

    const hasSelectedMeeting = filteredMeetings.some((meeting) => meeting.id === selectedMeetingId);
    if (!hasSelectedMeeting) {
      setSelectedMeetingId(filteredMeetings[0].id);
    }
  }, [filteredMeetings, selectedMeetingId]);

  const selectedMeeting = filteredMeetings.find((meeting) => meeting.id === selectedMeetingId) ?? filteredMeetings[0];

  return (
    <section className="grid grid-cols-12 gap-6">
      <MeetingHistorySection
        meetings={filteredMeetings}
        selectedMeetingId={selectedMeeting?.id}
        onSelectMeeting={setSelectedMeetingId}
      />
      <MeetingMinutesSection selectedMeeting={selectedMeeting} />
    </section>
  );
};
