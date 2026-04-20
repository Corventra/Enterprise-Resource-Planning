import { leadWorkspaceMock } from '../mocks/lead-workspace.mock';
import type { LeadWorkspace } from '../types/lead-workspace.types';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const workspaceStore: LeadWorkspace[] = clone(leadWorkspaceMock);

export const leadWorkspaceService = {
  async getByLeadId(leadId: string): Promise<LeadWorkspace | undefined> {
    return clone(workspaceStore.find((item) => item.id === leadId));
  }
};
