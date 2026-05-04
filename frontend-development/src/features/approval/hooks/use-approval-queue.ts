import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../app/store/auth-store';
import { approvalService } from '../services/approval-service';
import type { ApprovalItem, ApprovalSummary } from '../types/approval.types';

export const useApprovalQueue = () => {
  const { user, role } = useAuth();
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    const data = await approvalService.getAll();
    setItems(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const approve = useCallback(
    async (item: ApprovalItem, note?: string) => {
      if (!user || !role) return;
      await approvalService.approve(item, { name: user.name, role }, note);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    },
    [user, role]
  );

  const requestRevision = useCallback(
    async (item: ApprovalItem, note?: string) => {
      if (!user || !role) return;
      await approvalService.requestRevision(item, { name: user.name, role }, note);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    },
    [user, role]
  );

  const summary = useMemo<ApprovalSummary>(
    () => ({
      totalPending: items.length,
      proposals: items.filter((i) => i.kind === 'Proposal').length,
      engagementLetters: items.filter((i) => i.kind === 'EngagementLetter').length,
      handoverMemos: items.filter((i) => i.kind === 'HandoverMemo').length
    }),
    [items]
  );

  return {
    items,
    isLoading,
    summary,
    approve,
    requestRevision,
    refresh: fetchItems
  };
};
