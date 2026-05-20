import { formatDateOnlyId } from '../../../utils/format-date-only';
import type { ApiHandoverDetailPayload } from '../services/handover-api';
import type { HandoverBillingScheduleRow, HandoverRetainerSummary } from '../types/handover.types';
import { terminTypeLabelMap } from '../../lead-workspace/utils/engagement-letter-labels';
import type { EngagementTerminType } from '../../lead-workspace/types/lead-engagement-letters.types';

const dash = (v?: string | null) => {
  if (v === undefined || v === null) return '-';
  const t = String(v).trim();
  return t === '' ? '-' : t;
};

const formatIdr = (amount: number | null | undefined) => {
  if (amount == null || !Number.isFinite(Number(amount))) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(amount));
};

const toIsoDate = (year: number, monthIndex: number, day: number) => {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

const billingDateForMonth = (
  year: number,
  monthIndex: number,
  billingTiming: string
): string => {
  if (billingTiming === 'BEGINNING_OF_MONTH') {
    return toIsoDate(year, monthIndex, 1);
  }
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return toIsoDate(year, monthIndex, lastDay);
};

export const mapHandoverRetainerSummary = (
  api: ApiHandoverDetailPayload['fee_structure']
): HandoverRetainerSummary | null => {
  const rs = api.retainer_summary;
  if (!rs) return null;
  const timingLabel =
    rs.billing_timing === 'BEGINNING_OF_MONTH' ? 'Awal bulan' : 'Akhir bulan';
  return {
    contractStartDate: formatDateOnlyId(rs.contract_start_date),
    contractEndDate: formatDateOnlyId(rs.contract_end_date),
    billingTimingLabel: timingLabel,
    monthCount: rs.month_count,
    monthlyAmount: formatIdr(rs.monthly_amount_estimate)
  };
};

export const mapHandoverBillingSchedule = (
  api: ApiHandoverDetailPayload['fee_structure']
): HandoverBillingScheduleRow[] => {
  if (api.payment_method === 'TERMIN') {
    return api.fee_items.map((item) => {
      const termType = item.term_type as EngagementTerminType | undefined;
      const termTypeLabel =
        termType && termType in terminTypeLabelMap ? terminTypeLabelMap[termType] : dash(item.term_type);
      return {
        label: dash(item.term_name),
        termTypeLabel,
        percentage: item.percentage != null ? `${item.percentage}%` : '-',
        amount: formatIdr(item.amount),
        billingDate: formatDateOnlyId(item.billing_schedule_date),
        description: dash(item.description)
      };
    });
  }

  const rs = api.retainer_summary;
  if (!rs?.contract_start_date || !rs?.contract_end_date) return [];

  const start = new Date(`${rs.contract_start_date}T12:00:00`);
  const end = new Date(`${rs.contract_end_date}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const rows: HandoverBillingScheduleRow[] = [];
  const cursor = new Date(start);
  let month = 1;
  const maxMonths = Math.max(rs.month_count || 0, 1);

  while (cursor <= end && month <= maxMonths && month <= 120) {
    const billingIso = billingDateForMonth(
      cursor.getFullYear(),
      cursor.getMonth(),
      rs.billing_timing
    );
    rows.push({
      label: `Bulan ${month}`,
      amount: formatIdr(rs.monthly_amount_estimate),
      billingDate: formatDateOnlyId(billingIso),
      description: rs.billing_timing === 'BEGINNING_OF_MONTH' ? 'Awal bulan' : 'Akhir bulan'
    });
    cursor.setMonth(cursor.getMonth() + 1);
    month += 1;
  }

  return rows;
};
