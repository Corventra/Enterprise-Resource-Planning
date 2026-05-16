import { useCallback, useEffect, useState } from 'react';
import { leadWorkspaceService } from '../services/lead-workspace-service';
import type { LeadWorkspaceDetail, UpdateLeadWorkspaceDetailsPayload } from '../types/lead-workspace.types';

export const useLeadWorkspace = (leadId?: string) => {
  const [workspace, setWorkspace] = useState<LeadWorkspaceDetail | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchWorkspace = useCallback(async () => {
    if (!leadId) {
      setWorkspace(undefined);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await leadWorkspaceService.getByLeadId(leadId);
      setWorkspace(data);
    } catch (e) {
      setWorkspace(undefined);
      setLoadError(e instanceof Error ? e.message : 'Gagal memuat Lead Workspace.');
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    void fetchWorkspace();
  }, [fetchWorkspace]);

  const updateDetails = async (payload: UpdateLeadWorkspaceDetailsPayload) => {
    if (!leadId) {
      throw new Error('Lead ID tidak tersedia.');
    }
    const data = await leadWorkspaceService.updateDetails(leadId, payload);
    setWorkspace(data);
    return data;
  };

  return {
    workspace,
    isLoading,
    loadError,
    refetch: fetchWorkspace,
    updateDetails
  };
};
