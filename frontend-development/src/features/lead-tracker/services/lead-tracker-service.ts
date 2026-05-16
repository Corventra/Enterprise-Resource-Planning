import { mapLeadTrackerListRow } from '../utils/lead-tracker-mappers';
import type { CreateManualLeadPayload, LeadTrackerItem, MarkLeadLostPayload } from '../types/lead-tracker.types';
import {
  createManualLeadEntry,
  getLeadTrackerEntries,
  markLeadLostEntry
} from './lead-tracker-api';

export const leadTrackerService = {
  async getAll(): Promise<LeadTrackerItem[]> {
    const rows = await getLeadTrackerEntries();
    return rows.map(mapLeadTrackerListRow);
  },

  async createManual(payload: CreateManualLeadPayload): Promise<LeadTrackerItem> {
    const row = await createManualLeadEntry({
      company_name: payload.companyName,
      company_address: payload.companyAddress,
      pic_name: payload.picName,
      email: payload.email,
      phone_number: payload.phoneNumber,
      desired_services: payload.desiredServices?.trim() || null
    });
    return mapLeadTrackerListRow(row);
  },

  async markLost(leadId: string, payload: MarkLeadLostPayload): Promise<LeadTrackerItem> {
    const row = await markLeadLostEntry(leadId, {
      lost_reason_code: payload.lostReasonCode,
      lost_reason_note: payload.lostReasonNote?.trim() || null
    });
    return mapLeadTrackerListRow(row);
  }
};
