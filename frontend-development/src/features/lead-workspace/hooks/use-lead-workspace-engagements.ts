import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteLeadWorkspaceEngagementLetter,
  getLeadWorkspaceEngagementLetterBundle,
  patchLeadWorkspaceEngagementLetter,
  postLeadWorkspaceEngagementLetter,
  postLeadWorkspaceEngagementLetterSent,
  postLeadWorkspaceEngagementLetterSigned,
  submitLeadWorkspaceEngagementLetter,
  type ApiEngagementLetterWorkspaceProposalSummary
} from '../services/lead-workspace-engagements-api';
import type { LeadWorkspaceEngagementLetterItem } from '../types/lead-engagement-letters.types';
import { mapApiEngagementWorkspaceItemToLeadItem } from '../utils/map-api-engagement-workspace-item';

export const useLeadWorkspaceEngagements = (leadId: string | undefined) => {
  const [items, setItems] = useState<LeadWorkspaceEngagementLetterItem[]>([]);
  const [proposalWithoutEngagement, setProposalWithoutEngagement] = useState<ApiEngagementLetterWorkspaceProposalSummary | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyBundleData = useCallback((data: Awaited<ReturnType<typeof getLeadWorkspaceEngagementLetterBundle>>) => {
    setItems(data.items.map(mapApiEngagementWorkspaceItemToLeadItem));
    setProposalWithoutEngagement(data.proposal_without_engagement);
  }, []);

  const fetchBundle = useCallback(async (options?: { silent?: boolean }) => {
    if (!leadId || leadId.trim() === '') {
      setItems([]);
      setProposalWithoutEngagement(null);
      setLoading(false);
      setError(null);
      return;
    }
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await getLeadWorkspaceEngagementLetterBundle(leadId);
      applyBundleData(data);
    } catch (e) {
      setItems([]);
      setProposalWithoutEngagement(null);
      setError(e instanceof Error ? e.message : 'Gagal memuat engagement letter.');
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [leadId, applyBundleData]);

  const refreshBundleSilent = useCallback(async () => {
    if (!leadId || leadId.trim() === '') {
      return;
    }
    const data = await getLeadWorkspaceEngagementLetterBundle(leadId);
    applyBundleData(data);
  }, [leadId, applyBundleData]);

  useEffect(() => {
    void fetchBundle();
  }, [fetchBundle]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [items]
  );

  const createDraftEngagementLetter = useCallback(
    async (formData: FormData) => {
      if (!leadId) throw new Error('Lead ID tidak valid.');
      await postLeadWorkspaceEngagementLetter(leadId, formData);
      await refreshBundleSilent();
    },
    [leadId, refreshBundleSilent]
  );

  const updateDraftEngagementLetter = useCallback(
    async (engagementId: string, formData: FormData) => {
      if (!leadId) throw new Error('Lead ID tidak valid.');
      await patchLeadWorkspaceEngagementLetter(leadId, engagementId, formData);
      await refreshBundleSilent();
    },
    [leadId, refreshBundleSilent]
  );

  const deleteDraftEngagementLetter = useCallback(
    async (engagementId: string) => {
      if (!leadId) throw new Error('Lead ID tidak valid.');
      await deleteLeadWorkspaceEngagementLetter(leadId, engagementId);
      await refreshBundleSilent();
    },
    [leadId, refreshBundleSilent]
  );

  const submitEngagementLetter = useCallback(
    async (engagementId: string) => {
      if (!leadId) throw new Error('Lead ID tidak valid.');
      await submitLeadWorkspaceEngagementLetter(leadId, engagementId);
      await refreshBundleSilent();
    },
    [leadId, refreshBundleSilent]
  );

  const markEngagementLetterSentToClient = useCallback(
    async (engagementId: string) => {
      if (!leadId) throw new Error('Lead ID tidak valid.');
      await postLeadWorkspaceEngagementLetterSent(leadId, engagementId);
      await refreshBundleSilent();
    },
    [leadId, refreshBundleSilent]
  );

  const markEngagementLetterSigned = useCallback(
    async (engagementId: string) => {
      if (!leadId) throw new Error('Lead ID tidak valid.');
      await postLeadWorkspaceEngagementLetterSigned(leadId, engagementId);
      await refreshBundleSilent();
    },
    [leadId, refreshBundleSilent]
  );

  return {
    engagementLetters: sortedItems,
    proposalWithoutEngagement,
    loading,
    error,
    refetch: fetchBundle,
    createDraftEngagementLetter,
    updateDraftEngagementLetter,
    deleteDraftEngagementLetter,
    submitEngagementLetter,
    markEngagementLetterSentToClient,
    markEngagementLetterSigned
  };
};
