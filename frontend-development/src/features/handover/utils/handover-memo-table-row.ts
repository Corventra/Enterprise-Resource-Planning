import type { ApprovalItem } from '../../approval/types/approval.types';
import type { HandoverMemoTableRow } from '../components/list/handover-memo-table';
import type { HandoverItem } from '../types/handover.types';
import { mapHandoverDbStatusToLabel } from '../types/handover.types';

const dash = (v?: string | null) => {
  if (v === undefined || v === null) return '—';
  const t = String(v).trim();
  return t === '' ? '—' : t;
};

export const handoverItemToMemoTableRow = (item: HandoverItem): HandoverMemoTableRow => ({
  id: item.id,
  docCode: item.docCode,
  client: item.client,
  title: item.project,
  serviceLine: item.serviceLine && item.serviceLine !== '-' ? item.serviceLine : undefined,
  status: item.status,
  actorBy: item.createdBy,
  actorAt: item.createdAt
});

export const approvalItemToMemoTableRow = (item: ApprovalItem): HandoverMemoTableRow => ({
  id: item.id,
  docCode: item.docCode ?? '—',
  client: item.client,
  title: item.title,
  serviceLine: item.serviceLine,
  status: mapHandoverDbStatusToLabel(item.handoverQueueMeta?.handoverStatus ?? 'WAITING_CEO_APPROVAL'),
  actorBy: dash(item.submittedBy),
  actorAt: item.submittedAt || null
});
