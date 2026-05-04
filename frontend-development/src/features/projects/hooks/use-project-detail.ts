import { useCallback, useEffect, useState } from 'react';
import { handoverService } from '../../handover/services/handover-service';
import type { HandoverDetail } from '../../handover/types/handover.types';
import { projectService } from '../services/project-service';
import type { Project } from '../types/project.types';

/**
 * Returns the Project plus its linked HandoverDetail (for Overview, Financials,
 * and Documents tabs). Both are fetched together so individual tabs can read
 * via `useOutletContext` without re-fetching.
 */
export const useProjectDetail = (projectId?: string) => {
  const [project, setProject] = useState<Project | undefined>();
  const [handover, setHandover] = useState<HandoverDetail | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId) {
      setProject(undefined);
      setHandover(undefined);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const data = await projectService.getById(projectId);
    setProject(data);
    if (data) {
      const ho = await handoverService.getById(data.handoverId);
      setHandover(ho);
    } else {
      setHandover(undefined);
    }
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { project, handover, isLoading, refresh: fetch };
};
