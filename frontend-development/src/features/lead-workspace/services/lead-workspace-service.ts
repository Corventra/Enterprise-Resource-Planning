import { mapLeadWorkspaceDetailRow } from '../utils/lead-workspace-mappers';
import type { LeadWorkspaceDetail, UpdateLeadWorkspaceDetailsPayload } from '../types/lead-workspace.types';
import { getLeadWorkspaceDetail, patchLeadWorkspaceDetails } from './lead-workspace-api';

export const leadWorkspaceService = {
  async getByLeadId(leadId: string): Promise<LeadWorkspaceDetail> {
    const row = await getLeadWorkspaceDetail(leadId);
    return mapLeadWorkspaceDetailRow(row);
  },

  async updateDetails(leadId: string, payload: UpdateLeadWorkspaceDetailsPayload): Promise<LeadWorkspaceDetail> {
    const row = await patchLeadWorkspaceDetails(leadId, {
      company_name: payload.companyName,
      company_address: payload.companyAddress,
      pic_name: payload.picName,
      email: payload.email,
      phone_number: payload.phoneNumber,
      desired_services: payload.desiredServices?.trim() || null
    });
    return mapLeadWorkspaceDetailRow(row);
  }
};
