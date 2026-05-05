import { useCallback, useEffect, useState } from 'react';
import { adminDepartmentService } from '../services/admin-department-service';
import type {
  ManagedDepartment,
  ManagedDepartmentCreateDraft,
  ManagedDepartmentUpdateDraft
} from '../types/admin.types';

export const useManagedDepartments = () => {
  const [departments, setDepartments] = useState<ManagedDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await adminDepartmentService.getAll();
      setDepartments(list);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat daftar department');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (draft: ManagedDepartmentCreateDraft) => {
      await adminDepartmentService.create(draft);
      await refresh();
    },
    [refresh]
  );

  const update = useCallback(
    async (id: number, patch: ManagedDepartmentUpdateDraft) => {
      await adminDepartmentService.update(id, patch);
      await refresh();
    },
    [refresh]
  );

  const setActive = useCallback(
    async (id: number, isActive: boolean) => {
      await adminDepartmentService.setActive(id, isActive);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: number) => {
      await adminDepartmentService.remove(id);
      await refresh();
    },
    [refresh]
  );

  return { departments, isLoading, error, refresh, create, update, setActive, remove };
};
