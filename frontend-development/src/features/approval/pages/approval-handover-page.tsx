import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { Toast } from '../../../components/ui/toast';
import { useToast } from '../../../hooks/use-toast';
import { ApiError } from '../../../services/api-client';
import { APPROVAL_HANDOVER_TOAST } from '../constants/approval-handover-toast';
import { ApprovalEmptyState } from '../components/approval-empty-state';
import { ApprovalSearch } from '../components/approval-search';
import { HandoverMemoTable } from '../../handover/components/list/handover-memo-table';
import { approvalItemToMemoTableRow } from '../../handover/utils/handover-memo-table-row';
import { ApproveHandoverDialog } from '../components/modals/approve-handover-dialog';
import { RejectHandoverDialog } from '../components/modals/reject-handover-dialog';
import type { ApprovalItem, ApprovalOutletContext } from '../types/approval.types';

export const ApprovalHandoverPage = () => {
  const navigate = useNavigate();
  const { pendingItems, queueLoading, isReadOnly, approve, requestRevision, refreshQueue } =
    useOutletContext<ApprovalOutletContext>();

  const [search, setSearch] = useState('');
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [actionItem, setActionItem] = useState<ApprovalItem | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const { message: toastMessage, variant: toastVariant, dismiss: dismissToast, show: showToast } = useToast();

  const handoverItems = useMemo(
    () => pendingItems.filter((item) => item.kind === 'HandoverMemo'),
    [pendingItems]
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return handoverItems;

    return handoverItems.filter((item) => {
      const haystack = [item.docCode, item.client, item.title, item.serviceLine, item.submittedBy]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [handoverItems, search]);

  const tableRows = useMemo(() => filteredItems.map(approvalItemToMemoTableRow), [filteredItems]);

  const handleApprove = useCallback(async () => {
    if (!actionItem) return;
    setActionBusy(true);
    try {
      await approve(actionItem);
      setApproveOpen(false);
      setActionItem(null);
      showToast(APPROVAL_HANDOVER_TOAST.approved, { immediate: true });
      await refreshQueue({ silent: true });
    } catch (e) {
      const message = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Gagal menyetujui handover.';
      showToast(message, { variant: 'error' });
    } finally {
      setActionBusy(false);
    }
  }, [actionItem, approve, refreshQueue, showToast]);

  const handleRequestRevision = useCallback(
    async (note: string) => {
      if (!actionItem) return;
      setActionBusy(true);
      try {
        await requestRevision(actionItem, note);
        setRejectOpen(false);
        setActionItem(null);
        showToast(APPROVAL_HANDOVER_TOAST.rejected, { immediate: true });
        await refreshQueue({ silent: true });
      } catch (e) {
        const message =
          e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Gagal mengirim permintaan revisi.';
        showToast(message, { variant: 'error' });
      } finally {
        setActionBusy(false);
      }
    },
    [actionItem, refreshQueue, requestRevision, showToast]
  );

  const toast = (
    <Toast
      open={toastMessage != null}
      message={toastMessage ?? ''}
      variant={toastVariant}
      onClose={dismissToast}
    />
  );

  if (queueLoading) {
    return (
      <>
        <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
          Loading approval queue...
        </div>
        {toast}
      </>
    );
  }

  if (handoverItems.length === 0) {
    return (
      <>
        <ApprovalEmptyState />
        {toast}
      </>
    );
  }

  return (
    <div className="space-y-4">
      <ApprovalSearch search={search} onSearchChange={setSearch} onReset={() => setSearch('')} />

      {filteredItems.length === 0 ? (
        <ApprovalEmptyState onReset={search ? () => setSearch('') : undefined} />
      ) : (
        <HandoverMemoTable
          rows={tableRows}
          showApprovalActions
          isReadOnly={isReadOnly}
          onView={(row) => navigate(`/handover/${row.id}`)}
          onApprove={(row) => {
            const item = filteredItems.find((entry) => entry.id === row.id);
            if (!item) return;
            setActionItem(item);
            setApproveOpen(true);
          }}
          onRequestRevision={(row) => {
            const item = filteredItems.find((entry) => entry.id === row.id);
            if (!item) return;
            setActionItem(item);
            setRejectOpen(true);
          }}
        />
      )}

      <ApproveHandoverDialog
        open={approveOpen}
        busy={actionBusy}
        onClose={() => {
          if (!actionBusy) {
            setApproveOpen(false);
            setActionItem(null);
          }
        }}
        onConfirm={handleApprove}
      />
      <RejectHandoverDialog
        open={rejectOpen}
        busy={actionBusy}
        onClose={() => {
          if (!actionBusy) {
            setRejectOpen(false);
            setActionItem(null);
          }
        }}
        onConfirm={handleRequestRevision}
      />

      {toast}
    </div>
  );
};
