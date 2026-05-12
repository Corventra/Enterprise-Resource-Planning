import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../../services/api-client';
import type { LeadWorkspaceProposalView } from '../../lead-workspace/types/lead-proposals.types';
import { approvalProposalsService } from '../services/approval-proposals-service';
import type { ApprovalItem, ApprovalProposalLeadSummary } from '../types/approval.types';

export const useApprovalProposals = () => {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [proposalsById, setProposalsById] = useState<Record<string, LeadWorkspaceProposalView>>({});
  const [companyNamesById, setCompanyNamesById] = useState<Record<string, string>>({});
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<LeadWorkspaceProposalView | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(null);
  const [selectedLeadSummary, setSelectedLeadSummary] = useState<ApprovalProposalLeadSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await approvalProposalsService.listPending();
      setItems(data.items);
      setProposalsById(data.proposalsById);
      setCompanyNamesById(data.companyNamesById);
      setSelectedProposalId((current) => {
        if (current && data.items.some((item) => item.id === current)) {
          return current;
        }
        return data.items[0]?.id ?? null;
      });
    } catch (e) {
      setItems([]);
      setProposalsById({});
      setCompanyNamesById({});
      setSelectedProposalId(null);
      setLoadError(e instanceof ApiError ? e.message : 'Gagal memuat proposal pending approval.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (!selectedProposalId) {
      setSelectedProposal(null);
      setSelectedCompanyName(null);
      setSelectedLeadSummary(null);
      setDetailError(null);
      return;
    }

    let cancelled = false;
    const loadDetail = async () => {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const data = await approvalProposalsService.getDetail(selectedProposalId);
        if (cancelled) return;
        setSelectedProposal(data.proposal);
        setSelectedCompanyName(data.companyName);
        setSelectedLeadSummary(data.leadSummary);
      } catch (e) {
        if (cancelled) return;
        setSelectedProposal(proposalsById[selectedProposalId] ?? null);
        setSelectedCompanyName(companyNamesById[selectedProposalId] ?? null);
        setSelectedLeadSummary(null);
        setDetailError(e instanceof ApiError ? e.message : 'Gagal memuat detail proposal.');
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    };

    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [companyNamesById, proposalsById, selectedProposalId]);

  const approveSelected = useCallback(async () => {
    if (!selectedProposalId) return;
    setActionBusy(true);
    setActionError(null);
    try {
      await approvalProposalsService.approve(selectedProposalId);
      setSuccessMessage('Proposal berhasil disetujui.');
      await fetchList();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'Gagal menyetujui proposal.');
      throw e;
    } finally {
      setActionBusy(false);
    }
  }, [fetchList, selectedProposalId]);

  const rejectSelected = useCallback(
    async (note: string) => {
      if (!selectedProposalId) return;
      setActionBusy(true);
      setActionError(null);
      try {
        await approvalProposalsService.reject(selectedProposalId, note);
        setSuccessMessage('Permintaan revisi proposal berhasil dikirim.');
        await fetchList();
      } catch (e) {
        setActionError(e instanceof ApiError ? e.message : 'Gagal menolak proposal.');
        throw e;
      } finally {
        setActionBusy(false);
      }
    },
    [fetchList, selectedProposalId]
  );

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  return {
    items,
    proposalsById,
    selectedProposalId,
    setSelectedProposalId,
    selectedProposal,
    selectedCompanyName,
    selectedLeadSummary,
    isLoading,
    detailLoading,
    actionBusy,
    loadError,
    detailError,
    actionError,
    successMessage,
    approveSelected,
    rejectSelected,
    refresh: fetchList
  };
};
