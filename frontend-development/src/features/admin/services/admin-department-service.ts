import { apiDelete, apiGet, apiPost, apiPut } from '../../../services/api-client';
import type {
  ManagedDepartment,
  ManagedDepartmentCreateDraft,
  ManagedDepartmentUpdateDraft
} from '../types/admin.types';

interface ListResponse {
  departments: ManagedDepartment[];
}

interface DetailResponse {
  department: ManagedDepartment;
}

export const adminDepartmentService = {
  async getAll(): Promise<ManagedDepartment[]> {
    const res = await apiGet<ListResponse>('/departments');
    return res.departments;
  },

  async getById(id: number): Promise<ManagedDepartment> {
    const res = await apiGet<DetailResponse>(`/departments/${id}`);
    return res.department;
  },

  async create(draft: ManagedDepartmentCreateDraft): Promise<ManagedDepartment> {
    const res = await apiPost<DetailResponse>('/departments', draft);
    return res.department;
  },

  async update(id: number, patch: ManagedDepartmentUpdateDraft): Promise<ManagedDepartment> {
    const res = await apiPut<DetailResponse>(`/departments/${id}`, patch);
    return res.department;
  },

  async setActive(id: number, isActive: boolean): Promise<ManagedDepartment> {
    return adminDepartmentService.update(id, { isActive });
  },

  async remove(id: number): Promise<void> {
    await apiDelete(`/departments/${id}`);
  }
};
