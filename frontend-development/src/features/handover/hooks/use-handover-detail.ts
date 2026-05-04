import { useCallback, useEffect, useState } from 'react';
import { projectService } from '../../projects/services/project-service';
import type { Project } from '../../projects/types/project.types';
import { handoverService } from '../services/handover-service';
import type { HandoverDetail } from '../types/handover.types';

export const useHandoverDetail = (handoverId?: string) => {
  const [detail, setDetail] = useState<HandoverDetail | undefined>();
  const [linkedProject, setLinkedProject] = useState<Project | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!handoverId) {
      setDetail(undefined);
      setLinkedProject(undefined);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const data = await handoverService.getById(handoverId);
    setDetail(data);
    if (data) {
      const project = await projectService.getByHandoverId(data.id);
      setLinkedProject(project);
    } else {
      setLinkedProject(undefined);
    }
    setIsLoading(false);
  }, [handoverId]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  return {
    detail,
    linkedProject,
    isLoading
  };
};
