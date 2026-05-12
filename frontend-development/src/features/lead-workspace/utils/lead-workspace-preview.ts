import { leadWorkspaceMock } from '../mocks/lead-workspace.mock';
import type { LeadWorkspace, LeadWorkspaceDetail } from '../types/lead-workspace.types';

export const buildLeadWorkspacePreview = (detail: LeadWorkspaceDetail): LeadWorkspace => {
  const template = leadWorkspaceMock.find((item) => item.id === detail.id) ?? leadWorkspaceMock[0];

  return {
    ...template,
    id: detail.id,
    leadCode: detail.leadCode,
    companyName: detail.companyName,
    address: detail.address,
    companyPicName: detail.companyPicName,
    companyPicPhone: detail.companyPicPhone,
    companyPicEmail: detail.companyPicEmail,
    leadSource: detail.leadSource,
    processedAt: detail.processedAt ?? template.processedAt,
    processedBy: detail.processedBy ?? template.processedBy
  };
};
