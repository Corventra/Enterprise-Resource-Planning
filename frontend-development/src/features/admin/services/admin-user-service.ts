import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '../../../services/api-client';
import type {
  DepartmentOption,
  ManagedUser,
  ManagedUserDraft,
  RoleOption
} from '../types/admin.types';

interface ListResponse {
  users: ManagedUser[];
}

interface DetailResponse {
  user: ManagedUser;
}

interface RolesResponse {
  roles: RoleOption[];
}

interface DepartmentsResponse {
  departments: DepartmentOption[];
}

const buildPayload = (draft: ManagedUserDraft, includePassword: boolean) => {
  const base = {
    email: draft.email,
    name: draft.name,
    roleCode: draft.roleCode,
    departmentCodes: draft.departmentCodes
  };
  if (includePassword && draft.password) {
    return { ...base, password: draft.password };
  }
  return base;
};

export const adminUserService = {
  async getAll(params: { search?: string; role?: string } = {}): Promise<ManagedUser[]> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.role) query.set('role', params.role);
    const qs = query.toString();
    const res = await apiGet<ListResponse>(`/users${qs ? `?${qs}` : ''}`);
    return res.users;
  },

  async getById(id: number): Promise<ManagedUser> {
    const res = await apiGet<DetailResponse>(`/users/${id}`);
    return res.user;
  },

  async create(draft: ManagedUserDraft): Promise<ManagedUser> {
    const res = await apiPost<DetailResponse>('/users', buildPayload(draft, true));
    return res.user;
  },

  async update(id: number, draft: ManagedUserDraft): Promise<ManagedUser> {
    const res = await apiPut<DetailResponse>(`/users/${id}`, buildPayload(draft, false));
    return res.user;
  },

  async resetPassword(id: number, newPassword: string): Promise<void> {
    await apiPatch(`/users/${id}/password`, { newPassword });
  },

  async remove(id: number): Promise<void> {
    await apiDelete(`/users/${id}`);
  },

  // ====== Lookups (cached per session di consumer) ======
  async listRoles(): Promise<RoleOption[]> {
    const res = await apiGet<RolesResponse>('/lookup/roles');
    return res.roles;
  },

  async listDepartments(): Promise<DepartmentOption[]> {
    const res = await apiGet<DepartmentsResponse>('/lookup/departments?activeOnly=1');
    return res.departments;
  }
};
