import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
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
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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
    setActionError(null);
    setActionSuccess(null);
    try {
      await approve(actionItem);
      await refreshQueue();
      setApproveOpen(false);
      setActionItem(null);
      setActionSuccess('Handover berhasil disetujui.');
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Gagal menyetujui handover.');
    } finally {
      setActionBusy(false);
    }
  }, [actionItem, approve, refreshQueue]);

  const handleRequestRevision = useCallback(
    async (note: string) => {
      if (!actionItem) return;
      setActionBusy(true);
      setActionError(null);
      setActionSuccess(null);
      try {
        await requestRevision(actionItem, note);
        await refreshQueue();
        setRejectOpen(false);
        setActionItem(null);
        setActionSuccess('Permintaan revisi handover telah dikirim.');
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Gagal mengirim permintaan revisi.');
      } finally {
        setActionBusy(false);
      }
    },
    [actionItem, refreshQueue, requestRevision]
  );

  if (queueLoading) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
        Loading approval queue...
      </div>
    );
  }

  if (handoverItems.length === 0) {
    return (
      <>
        {actionSuccess ? (
          <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {actionSuccess}
          </p>
        ) : null}
        {actionError ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionError}</p>
        ) : null}
        <ApprovalEmptyState />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {actionSuccess ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {actionSuccess}
        </p>
      ) : null}
      {actionError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionError}</p>
      ) : null}

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
            setActionError(null);
            setActionSuccess(null);
            setActionItem(item);
            setApproveOpen(true);
          }}
          onRequestRevision={(row) => {
            const item = filteredItems.find((entry) => entry.id === row.id);
            if (!item) return;
            setActionError(null);
            setActionSuccess(null);
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
    </div>
  );
};
