import { useCallback, useEffect, useState } from 'react';
import { adminUserService } from '../services/admin-user-service';
import type { ManagedUser, ManagedUserDraft } from '../types/admin.types';

export const useManagedUsers = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await adminUserService.getAll();
      setUsers(list);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat daftar user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (draft: ManagedUserDraft) => {
      await adminUserService.create(draft);
      await refresh();
    },
    [refresh]
  );

  const update = useCallback(
    async (id: number, draft: ManagedUserDraft) => {
      await adminUserService.update(id, draft);
      await refresh();
    },
    [refresh]
  );

  const resetPassword = useCallback(
    async (id: number, newPassword: string) => {
      await adminUserService.resetPassword(id, newPassword);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: number) => {
      await adminUserService.remove(id);
      await refresh();
    },
    [refresh]
  );

  return { users, isLoading, error, refresh, create, update, resetPassword, remove };
};
