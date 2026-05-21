import { getApiOrigin } from '../../../services/api-client';
import { formatDateOnlyId, formatDateOnlyRangeId } from '../../../utils/format-date-only';
import type {
  ApiHandoverDetailPayload,
  ApiHandoverListRow
} from '../services/handover-api';
import type {
  HandoverActivityLogEntry,
  HandoverChecklistItem,
  HandoverClientDocumentItem,
  HandoverContact,
  HandoverDetail,
  HandoverEngagementStatus,
  HandoverFeeItem,
  HandoverItem,
  HandoverTeamMember,
  HandoverTimelineItem
} from '../types/handover.types';
import { mapHandoverBillingSchedule, mapHandoverRetainerSummary } from './map-handover-billing-schedule';
import { mapHandoverDbStatusToLabel } from '../types/handover.types';

const dash = (v?: string | null) => {
  if (v === undefined || v === null) return '-';
  const t = String(v).trim();
  return t === '' ? '-' : t;
};

/** Nilai untuk input/textarea edit — kosong jika null, bukan "-". */
const formText = (v?: string | null) => {
  if (v === undefined || v === null) return '';
  return String(v).trim();
};

const formatDateTimeId = (iso?: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatIdr = (amount: number | null | undefined) => {
  if (amount == null || !Number.isFinite(Number(amount))) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(amount));
};

const mapEngagementStatus = (status: string | null): HandoverEngagementStatus => {
  if (status === 'SIGNED') return 'Signed';
  return 'Pending';
};

const mapChecklistStatus = (status: ApiHandoverDetailPayload['checklist'][0]['status']): HandoverChecklistItem => {
  const labelMap: Record<string, { tone: HandoverChecklistItem['status']; text: string }> = {
    YES: { tone: 'SUCCESS', text: 'Yes' },
    PENDING: { tone: 'WARNING', text: 'Pending' },
    PARTIAL: { tone: 'INFO', text: 'Partial' },
    NO: { tone: 'INFO', text: 'No' }
  };
  const mapped = labelMap[status] ?? { tone: 'INFO', text: status };
  return { label: '', status: mapped.tone, text: mapped.text, dbStatus: status };
};

export const mapApiHandoverListRowToItem = (row: ApiHandoverListRow): HandoverItem => {
  const period = formatDateOnlyRangeId(row.project_start_date, row.project_end_date);

  return {
    id: String(row.handover_id),
    docCode: row.handover_code,
    client: dash(row.company_name),
    project: dash(row.project_title),
    serviceLine: dash(row.service_name),
    period: period === '' ? '-' : period,
    engagementStatus: mapEngagementStatus(row.engagement_status),
    engagementStatusDate:
      row.engagement_status === 'SIGNED' ? formatDateTimeId(row.engagement_signed_at) : '-',
    status: mapHandoverDbStatusToLabel(row.handover_status),
    dbStatus: row.handover_status,
    createdBy: dash(row.created_by_name),
    createdById: row.created_by ?? null,
    createdAt: row.created_at
  };
};

export const mapApiHandoverDetailToDetail = (api: ApiHandoverDetailPayload): HandoverDetail => {
  const pi = api.project_information;
  const status = mapHandoverDbStatusToLabel(api.status);

  const engagementLabel =
    pi.engagement_status === 'SIGNED'
      ? `Signed · ${formatDateTimeId(pi.engagement_signed_at)}`
      : dash(pi.engagement_status);

  const feeItems: HandoverFeeItem[] = api.fee_structure.fee_items.map((item) => ({
    item: item.term_name,
    amount: formatIdr(item.amount),
    notes: dash(item.description)
  }));

  const paymentMethod = api.fee_structure.payment_method;
  const agreedFee = formatIdr(api.fee_structure.agreed_fee);
  const retainerSummary =
    paymentMethod === 'RETAINER' ? mapHandoverRetainerSummary(api.fee_structure) : null;
  const billingSchedule = mapHandoverBillingSchedule(api.fee_structure);

  const paymentTerms =
    paymentMethod === 'RETAINER' && api.fee_structure.retainer_summary
      ? `Retainer · ${formatDateOnlyId(api.fee_structure.retainer_summary.contract_start_date)} s/d ${formatDateOnlyId(
          api.fee_structure.retainer_summary.contract_end_date
        )} · penagihan ${
          api.fee_structure.retainer_summary.billing_timing === 'BEGINNING_OF_MONTH'
            ? 'awal bulan'
            : 'akhir bulan'
        }`
      : paymentMethod === 'TERMIN'
        ? 'Termin pembayaran sesuai engagement letter (Down Payment, Installment, Final).'
        : '-';

  const timelineMilestones: HandoverTimelineItem[] = api.scope.milestones.map((m) => ({
    milestone: m.milestone_name,
    targetDate: formatDateOnlyId(m.target_date),
    targetDateIso: m.target_date,
    notes: formText(m.notes)
  }));

  const communicationContacts: HandoverContact[] = api.communication_protocol.external_items.map((c) => ({
    role: c.role,
    name: c.name,
    contact: c.contact,
    instruction: formText(c.instruction)
  }));

  const teamAssignments: HandoverTeamMember[] = api.team_requirements.map((t) => ({
    role: t.role_name,
    name: t.needed,
    responsibilities: t.responsibilities,
    notes: t.notes
  }));

  const clientDocuments: HandoverClientDocumentItem[] = api.client_documents.map((doc) => {
    const path = doc.file_path;
    const url =
      path && path.startsWith('/')
        ? `${getApiOrigin()}${path}`
        : path && path.startsWith('http')
          ? path
          : null;
    return {
      id: String(doc.document_id),
      name: doc.document_name,
      filePath: path,
      downloadUrl: url,
      uploadedAt: formatDateTimeId(doc.created_at)
    };
  });

  const checklist: HandoverChecklistItem[] = api.checklist.map((row) => ({
    ...mapChecklistStatus(row.status),
    label: row.item_name
  }));

  const activityLogs: HandoverActivityLogEntry[] = api.activity_logs.map((log) => ({
    id: String(log.activity_id),
    activityType: log.activity_type,
    title: log.title,
    description: log.description,
    createdByName: log.created_by_name,
    createdAt: log.created_at ?? ''
  }));

  return {
    id: String(api.handover_id),
    docCode: api.handover_code,
    leadId: String(api.lead_id),
    processedBy: api.processed_by ?? null,
    projectTitle: pi.project_title ?? '',
    companyGroup: pi.company_group ?? '',
    projectStartDate: pi.project_start_date ?? '',
    projectEndDate: pi.project_end_date ?? '',
    confidentiality: 'Internal',
    projectStatus: status,
    status,
    dbStatus: api.status,
    ceoRevisionNote: api.ceo_revision_note?.trim() ? api.ceo_revision_note.trim() : null,
    approvalTrail: [],
    title: 'PROJECT HANDOVER MEMO',
    subtitle: pi.client_name ? String(pi.client_name) : '-',
    projectInformation: [
      { label: 'Project Title', value: dash(pi.project_title) },
      { label: 'Client Name', value: dash(pi.client_name) },
      { label: 'Company Group', value: dash(pi.company_group) },
      { label: 'Service Line', value: dash(pi.service_line) },
      {
        label: 'Project Period',
        value: formatDateOnlyRangeId(pi.project_start_date, pi.project_end_date, { empty: '-' })
      },
      { label: 'PIC Client', value: dash(pi.pic_client_name) },
      { label: 'Client Contact', value: dash(pi.client_contact), accent: 'primary' },
      { label: 'Engagement Status', value: engagementLabel, accent: pi.engagement_status === 'SIGNED' ? 'success' : undefined },
      { label: 'EL Reference', value: dash(pi.engagement_reference) },
      { label: 'Proposal Reference', value: dash(pi.proposal_reference) },
      { label: 'Created By', value: dash(pi.created_by_name) }
    ],
    backgroundSummary: formText(api.background_summary),
    scopeIncluded: api.scope.scope_included,
    scopeExcluded: api.scope.scope_excluded,
    deliverables: api.scope.deliverables,
    timelineMilestones,
    feeItems,
    agreedFee,
    paymentMethod,
    paymentTerms,
    billingSchedule,
    retainerSummary,
    clientDocuments,
    storageLocation: '-',
    outstandingData: api.outstanding_requirements.map((r) => r.requirement_text),
    confidentialNote: formText(api.risks.risk_internal_note),
    keyRisks: api.risks.risk_items,
    communicationProtocol: api.communication_protocol.internal_items,
    communicationContacts,
    teamAssignments,
    checklist,
    activityLogs,
    signOff: []
  };
};
