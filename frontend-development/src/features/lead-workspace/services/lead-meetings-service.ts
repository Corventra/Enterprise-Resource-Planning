import {
  getLeadMeetingMinutes,
  getLeadMeetings,
  patchCancelLeadMeeting,
  patchCompleteLeadMeeting,
  patchLeadMeeting,
  patchLeadMeetingMinutes,
  postLeadMeeting,
  postLeadMeetingMinutes
} from '../services/lead-workspace-meetings-api';
import type {
  LeadWorkspaceMeetingListItem,
  LeadWorkspaceMeetingMinutesView,
  SaveMeetingMinutesPayload,
  ScheduleMeetingPayload
} from '../types/lead-meetings.types';
import {
  mapLeadMeetingMinutesEntry,
  mapLeadMeetingRow,
  mapSaveMeetingMinutesPayload,
  mapScheduleMeetingPayload
} from '../utils/lead-meetings-mappers';

export const leadMeetingsService = {
  async list(leadId: string): Promise<LeadWorkspaceMeetingListItem[]> {
    const rows = await getLeadMeetings(leadId);
    return rows.map(mapLeadMeetingRow);
  },

  async schedule(leadId: string, payload: ScheduleMeetingPayload): Promise<LeadWorkspaceMeetingListItem> {
    const row = await postLeadMeeting(leadId, mapScheduleMeetingPayload(payload));
    return mapLeadMeetingRow(row);
  },

  async complete(leadId: string, meetingId: string): Promise<LeadWorkspaceMeetingListItem> {
    const row = await patchCompleteLeadMeeting(leadId, meetingId);
    return mapLeadMeetingRow(row);
  },

  async cancel(leadId: string, meetingId: string): Promise<LeadWorkspaceMeetingListItem> {
    const row = await patchCancelLeadMeeting(leadId, meetingId);
    return mapLeadMeetingRow(row);
  },

  async update(leadId: string, meetingId: string, payload: ScheduleMeetingPayload): Promise<LeadWorkspaceMeetingListItem> {
    const row = await patchLeadMeeting(leadId, meetingId, mapScheduleMeetingPayload(payload));
    return mapLeadMeetingRow(row);
  },

  async getMinutes(leadId: string, meetingId: string): Promise<LeadWorkspaceMeetingMinutesView> {
    const entry = await getLeadMeetingMinutes(leadId, meetingId);
    return mapLeadMeetingMinutesEntry(entry);
  },

  async createMinutes(
    leadId: string,
    meetingId: string,
    payload: SaveMeetingMinutesPayload
  ): Promise<LeadWorkspaceMeetingMinutesView> {
    const entry = await postLeadMeetingMinutes(leadId, meetingId, mapSaveMeetingMinutesPayload(payload));
    return mapLeadMeetingMinutesEntry(entry);
  },

  async updateMinutes(
    leadId: string,
    meetingId: string,
    payload: SaveMeetingMinutesPayload
  ): Promise<LeadWorkspaceMeetingMinutesView> {
    const entry = await patchLeadMeetingMinutes(leadId, meetingId, mapSaveMeetingMinutesPayload(payload));
    return mapLeadMeetingMinutesEntry(entry);
  }
};
