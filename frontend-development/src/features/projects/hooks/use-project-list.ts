import { useCallback, useEffect, useMemo, useState } from 'react';
import { ROLES } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import { projectService } from '../services/project-service';
import type { Project } from '../types/project.types';

/**
 * Returns projects scoped to the current user's role:
 * - PM: only projects where pm.id matches the user's email.
 * - Consultant: only projects where the user is in `consultants`.
 * - Everyone else with PROJECT_VIEW permission (CEO, COO, BD, Staff Admin): all projects.
 */
export const useProjectList = () => {
  const { role, user } = useAuth();
  const [items, setItems] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    const data = await projectService.getAll();
    setItems(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const scopedItems = useMemo(() => {
    if (!user || !role) return [];
    if (role === ROLES.PM) {
      return items.filter((project) => project.pm?.id === user.email);
    }
    if (role === ROLES.CONSULTANT) {
      return items.filter((project) => project.consultants.some((c) => c.id === user.email));
    }
    return items;
  }, [items, role, user]);

  const summary = useMemo(() => {
    const totalProjects = scopedItems.length;
    const awaitingConsultant = scopedItems.filter((p) => p.status === 'Awaiting Consultant').length;
    const inProgress = scopedItems.filter((p) => p.status === 'In Progress').length;
    const completed = scopedItems.filter((p) => p.status === 'Completed').length;
    return { totalProjects, awaitingConsultant, inProgress, completed };
  }, [scopedItems]);

  return {
    items: scopedItems,
    isLoading,
    summary,
    refresh: fetchItems
  };
};
