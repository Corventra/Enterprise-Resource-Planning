import { useCallback, useEffect, useState } from 'react';
import { leadProposalsService } from '../services/lead-proposals-service';
import type { LeadWorkspaceProposalView, SaveProposalDraftPayload } from '../types/lead-proposals.types';

export const useLeadProposal = (leadId?: string) => {
  const [proposal, setProposal] = useState<LeadWorkspaceProposalView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchProposal = useCallback(async () => {
    if (!leadId) {
      setProposal(null);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    try {
      const nextProposal = await leadProposalsService.get(leadId);
      setProposal(nextProposal);
    } catch (e) {
      setProposal(null);
      setLoadError(e instanceof Error ? e.message : 'Gagal memuat proposal.');
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    void fetchProposal();
  }, [fetchProposal]);

  const createDraft = async (payload: SaveProposalDraftPayload) => {
    if (!leadId) {
      throw new Error('Lead ID tidak tersedia.');
    }
    const nextProposal = await leadProposalsService.createDraft(leadId, payload);
    setProposal(nextProposal);
    return nextProposal;
  };

  const updateDraft = async (proposalId: string, payload: SaveProposalDraftPayload) => {
    if (!leadId) {
      throw new Error('Lead ID tidak tersedia.');
    }
    const nextProposal = await leadProposalsService.updateDraft(leadId, proposalId, payload);
    setProposal(nextProposal);
    return nextProposal;
  };

  const deleteDraft = async (proposalId: string) => {
    if (!leadId) {
      throw new Error('Lead ID tidak tersedia.');
    }
    await leadProposalsService.deleteDraft(leadId, proposalId);
    setProposal(null);
  };

  const submitProposal = async (proposalId: string) => {
    if (!leadId) {
      throw new Error('Lead ID tidak tersedia.');
    }
    const nextProposal = await leadProposalsService.submit(leadId, proposalId);
    setProposal(nextProposal);
    return nextProposal;
  };

  const markSentToClient = async (proposalId: string) => {
    if (!leadId) {
      throw new Error('Lead ID tidak tersedia.');
    }
    const nextProposal = await leadProposalsService.markSentToClient(leadId, proposalId);
    setProposal(nextProposal);
    return nextProposal;
  };

  const markResponded = async (proposalId: string) => {
    if (!leadId) {
      throw new Error('Lead ID tidak tersedia.');
    }
    const nextProposal = await leadProposalsService.markResponded(leadId, proposalId);
    setProposal(nextProposal);
    return nextProposal;
  };

  return {
    proposal,
    isLoading,
    loadError,
    refetch: fetchProposal,
    createDraft,
    updateDraft,
    deleteDraft,
    submitProposal,
    markSentToClient,
    markResponded
  };
};
