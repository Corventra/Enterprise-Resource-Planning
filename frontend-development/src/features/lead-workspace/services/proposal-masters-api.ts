import { apiGet } from '../../../services/api-client';

export interface ApiProposalMasterServiceClassRow {
  service_class_id: number;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
}

export interface ApiProposalMasterServiceRow {
  service_id: number;
  service_class_id: number;
  department_id: number;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
}

interface ApiServiceClassListResponse {
  success: boolean;
  data: { items: ApiProposalMasterServiceClassRow[] };
}

interface ApiServiceListResponse {
  success: boolean;
  data: { items: ApiProposalMasterServiceRow[] };
}

export const getProposalMasterServiceClasses = async () => {
  const response = await apiGet<ApiServiceClassListResponse>('/proposal-masters/service-classes');
  return response.data.items;
};

export const getProposalMasterServices = async () => {
  const response = await apiGet<ApiServiceListResponse>('/proposal-masters/services');
  return response.data.items;
};
