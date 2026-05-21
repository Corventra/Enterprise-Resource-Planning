import { mapLeadTrackerListRow } from '../utils/lead-tracker-mappers';
import type {
  CreateManualLeadPayload,
  LeadTrackerItem,
  LeadTrackerListMeta,
  LeadTrackerSnapshotCount,
  LeadTrackerSummary,
  LeadTrackerSummaryMetric,
  LeadTrackerSummaryProcessedByTarget,
  MarkLeadLostPayload
} from '../types/lead-tracker.types';
import {
  createManualLeadEntry,
  getLeadTrackerList,
  markLeadLostEntry,
  type LeadTrackerSummaryQuery
} from './lead-tracker-api';

const mapSnapshotCount = (row: { value: number }): LeadTrackerSnapshotCount => ({
  value: row.value
});

const mapSummaryMetric = (row: {
  value: number;
  previous: number;
  delta: { value: number; direction: 'up' | 'down' | 'flat' };
}): LeadTrackerSummaryMetric => ({
  value: row.value,
  previous: row.previous,
  delta: row.delta
});

const mapMeta = (row: {
  period: string;
  period_start: string;
  period_end_exclusive: string;
  comparison_label: string;
  scope: LeadTrackerListMeta['scope'];
  summary_processed_by?: number;
}): LeadTrackerListMeta => ({
  period: row.period,
  periodStart: row.period_start,
  periodEndExclusive: row.period_end_exclusive,
  comparisonLabel: row.comparison_label,
  scope: row.scope,
  summaryProcessedByUserId: row.summary_processed_by
});

const toSummaryQuery = (target: LeadTrackerSummaryProcessedByTarget): LeadTrackerSummaryQuery => {
  if (target == null) return null;
  if (target === 'unassigned') return { unassigned: true };
  return { processedByUserId: target };
};

export const leadTrackerService = {
  async getList(
    period = 'this_month',
    summaryProcessedByTarget: LeadTrackerSummaryProcessedByTarget = null
  ): Promise<{ items: LeadTrackerItem[]; summary: LeadTrackerSummary; meta: LeadTrackerListMeta }> {
    const data = await getLeadTrackerList(period, toSummaryQuery(summaryProcessedByTarget));
    return {
      items: data.entries.map(mapLeadTrackerListRow),
      summary: {
        totalLeads: mapSummaryMetric(data.summary.total_leads),
        activeLeads: mapSnapshotCount(data.summary.active_leads),
        wonLeads: mapSummaryMetric(data.summary.won_leads),
        lostLeads: mapSummaryMetric(data.summary.lost_leads)
      },
      meta: mapMeta(data.meta)
    };
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
