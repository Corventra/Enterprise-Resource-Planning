import { handoverDetailMock } from '../mocks/handover-detail.mock';
import { handoverMock } from '../mocks/handover.mock';
import type {
  HandoverApprovalAction,
  HandoverApprovalTrailEntry,
  HandoverDetail,
  HandoverItem,
  HandoverStatus
} from '../types/handover.types';
import type { Role } from '../../../app/permissions';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const handoverStore: HandoverItem[] = clone(handoverMock);
const handoverDetailStore: HandoverDetail = clone(handoverDetailMock);
const trailByHandoverId: Record<string, HandoverApprovalTrailEntry[]> = {
  [handoverDetailMock.id]: clone(handoverDetailMock.approvalTrail ?? [])
};

const PROJECT_STATUS_LABEL: Record<HandoverStatus, string> = {
  Draft: 'Draft Project',
  'Waiting CEO Approval': 'Awaiting CEO Approval',
  'Revision Needed': 'Revision Required',
  Approved: 'CEO Approved',
  'Assigned to PM': 'Assigned to PM',
  'In Project': 'Active Project',
  Completed: 'Completed Project'
};

const appendTrail = (
  id: string,
  entry: Omit<HandoverApprovalTrailEntry, 'at'> & { at?: string }
) => {
  const list = trailByHandoverId[id] ?? [];
  list.push({ ...entry, at: entry.at ?? new Date().toISOString() } as HandoverApprovalTrailEntry);
  trailByHandoverId[id] = list;
};

const mutateStatus = (id: string, next: HandoverStatus): HandoverItem | undefined => {
  const item = handoverStore.find((entry) => entry.id === id);
  if (!item) return undefined;
  item.status = next;
  return item;
};

export const handoverService = {
  async getAll(): Promise<HandoverItem[]> {
    return clone(handoverStore);
  },
  async getById(id: string): Promise<HandoverDetail | undefined> {
    const fallback = handoverStore.find((item) => item.id === id);
    if (!fallback) return undefined;

    const baseDetail =
      id === handoverDetailStore.id
        ? clone(handoverDetailStore)
        : {
            ...clone(handoverDetailStore),
            id: fallback.id,
            docCode: fallback.docCode,
            projectInformation: handoverDetailStore.projectInformation.map((info) => {
              if (info.label === 'Client Name') return { ...info, value: fallback.client };
              if (info.label === 'Project Title') return { ...info, value: fallback.project };
              if (info.label === 'Service Line') return { ...info, value: fallback.serviceLine };
              if (info.label === 'Project Period') return { ...info, value: fallback.period };
              if (info.label === 'Engagement Letter Status')
                return { ...info, value: `${fallback.engagementStatus} - ${fallback.engagementStatusDate}` };
              return info;
            })
          };

    return {
      ...baseDetail,
      status: fallback.status,
      projectStatus: PROJECT_STATUS_LABEL[fallback.status],
      approvalTrail: clone(trailByHandoverId[fallback.id] ?? [])
    };
  },
  async submit(id: string, actor: { name: string; role: Role }, note?: string): Promise<void> {
    const item = mutateStatus(id, 'Waiting CEO Approval');
    if (!item) return;
    appendTrail(id, { action: 'submitted', actor: actor.name, actorRole: actor.role, note });
  },
  async approve(id: string, actor: { name: string; role: Role }, note?: string): Promise<void> {
    const item = mutateStatus(id, 'Approved');
    if (!item) return;
    appendTrail(id, { action: 'approved', actor: actor.name, actorRole: actor.role, note });
  },
  async requestRevision(id: string, actor: { name: string; role: Role }, note?: string): Promise<void> {
    const item = mutateStatus(id, 'Revision Needed');
    if (!item) return;
    appendTrail(id, { action: 'revisionRequested', actor: actor.name, actorRole: actor.role, note });
  },
  async assignPM(id: string, actor: { name: string; role: Role }, note?: string): Promise<void> {
    const item = mutateStatus(id, 'Assigned to PM');
    if (!item) return;
    appendTrail(id, { action: 'pmAssigned', actor: actor.name, actorRole: actor.role, note });
  },
  async getItemById(id: string): Promise<HandoverItem | undefined> {
    const found = handoverStore.find((entry) => entry.id === id);
    return found ? clone(found) : undefined;
  },
  async getTrail(id: string): Promise<HandoverApprovalTrailEntry[]> {
    return clone(trailByHandoverId[id] ?? []);
  },
  async appendTrailEntry(id: string, action: HandoverApprovalAction, actor: { name: string; role: Role }, note?: string): Promise<void> {
    appendTrail(id, { action, actor: actor.name, actorRole: actor.role, note });
  }
};
