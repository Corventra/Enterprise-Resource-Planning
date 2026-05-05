import { useEffect, useState } from 'react';
import { adminUserService } from '../services/admin-user-service';
import type { DepartmentOption, RoleOption } from '../types/admin.types';

/**
 * Fetch roles + departments dari backend untuk populate dropdown form.
 * Lookup di-fetch sekali per mount component yang pakai hook ini.
 */
export const useAdminLookups = () => {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const [r, d] = await Promise.all([
          adminUserService.listRoles(),
          adminUserService.listDepartments()
        ]);
        if (cancelled) return;
        setRoles(r);
        setDepartments(d);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Gagal memuat lookup');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { roles, departments, isLoading, error };
};
