import { useCallback, useEffect, useState } from 'react';
import { leadWorkspaceService } from '../services/lead-workspace-service';
import type { LeadWorkspace } from '../types/lead-workspace.types';

export const useLeadWorkspace = (leadId?: string) => {
  const [workspace, setWorkspace] = useState<LeadWorkspace | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkspace = useCallback(async () => {
    if (!leadId) {
      setWorkspace(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const data = await leadWorkspaceService.getByLeadId(leadId);
    setWorkspace(data);
    setIsLoading(false);
  }, [leadId]);

  useEffect(() => {
    void fetchWorkspace();
  }, [fetchWorkspace]);

  return {
    workspace,
    isLoading,
    refetch: fetchWorkspace
  };
};
