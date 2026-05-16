import {
  getProposalMasterServiceClasses,
  getProposalMasterServices
} from './proposal-masters-api';
import type { ProposalMasterService, ProposalMasterServiceClass } from '../types/lead-proposals.types';

const mapServiceClassRow = (row: Awaited<ReturnType<typeof getProposalMasterServiceClasses>>[number]): ProposalMasterServiceClass => ({
  id: String(row.service_class_id),
  name: row.name,
  code: row.code,
  isActive: Boolean(row.is_active)
});

const mapServiceRow = (row: Awaited<ReturnType<typeof getProposalMasterServices>>[number]): ProposalMasterService => ({
  id: String(row.service_id),
  serviceClassId: String(row.service_class_id),
  departmentId: String(row.department_id),
  name: row.name,
  code: row.code,
  isActive: Boolean(row.is_active)
});

export const proposalMastersService = {
  async listServiceClasses(): Promise<ProposalMasterServiceClass[]> {
    const rows = await getProposalMasterServiceClasses();
    return rows.map(mapServiceClassRow);
  },

  async listServices(): Promise<ProposalMasterService[]> {
    const rows = await getProposalMasterServices();
    return rows.map(mapServiceRow);
  }
};
