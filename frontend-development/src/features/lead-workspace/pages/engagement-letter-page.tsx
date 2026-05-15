import { useCallback, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import { ApiError } from '../../../services/api-client';
import { EngagementLetterDetailSection } from '../components/engagement-letter-detail-section';
import { EngagementLetterHistorySection } from '../components/engagement-letter-history-section';
import { EngagementLetterFormDialog } from '../components/modals/engagement-letter-form-dialog';
import { EngagementLetterSentToClientDialog } from '../components/modals/engagement-letter-sent-to-client-dialog';
import { EngagementLetterSignedDialog } from '../components/modals/engagement-letter-signed-dialog';
import { useLeadWorkspaceEngagements } from '../hooks/use-lead-workspace-engagements';
import type { LeadWorkspaceOutletContext } from '../types/lead-workspace.types';

export const EngagementLetterPage = () => {
  const { leadId, processedByUserId, refetchWorkspace } = useOutletContext<LeadWorkspaceOutletContext>();
  const {
    engagementLetters,
    proposalWithoutEngagement,
    loading,
    error,
    refetch,
    createDraftEngagementLetter,
    updateDraftEngagementLetter,
    deleteDraftEngagementLetter,
    markEngagementLetterSentToClient,
    markEngagementLetterSigned
  } = useLeadWorkspaceEngagements(leadId);

  const [selectedEngagementLetterId, setSelectedEngagementLetterId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [mutationBusy, setMutationBusy] = useState(false);
  const [busyAction, setBusyAction] = useState<'draft' | 'submit' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [sentDialogOpen, setSentDialogOpen] = useState(false);
  const [signedDialogOpen, setSignedDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canCreateEngagementLetter = proposalWithoutEngagement?.proposal_status === 'RESPONDED';

  const resolvedSelectedId = useMemo(() => {
    if (engagementLetters.length === 0) return null;
    const stillValid =
      selectedEngagementLetterId != null &&
      engagementLetters.some((row) => row.id === selectedEngagementLetterId);
    if (stillValid) return selectedEngagementLetterId;
    return engagementLetters[0]?.id ?? null;
  }, [engagementLetters, selectedEngagementLetterId]);

  const selectedEngagementLetter =
    engagementLetters.find((engagementLetter) => engagementLetter.id === resolvedSelectedId) ?? engagementLetters[0];

  const openCreateForm = useCallback(() => {
    setActionError(null);
    setFormMode('create');
    setFormOpen(true);
  }, []);

  const openEditForm = useCallback(() => {
    if (!selectedEngagementLetter) return;
    setActionError(null);
    setFormMode('edit');
    setFormOpen(true);
  }, [selectedEngagementLetter]);

  const handleFormSubmit = useCallback(
    async (_fd: FormData, action: 'draft' | 'submit') => {
      setMutationBusy(true);
      setBusyAction(action);
      setActionError(null);
      try {
        if (formMode === 'create') {
          await createDraftEngagementLetter(_fd);
        } else if (selectedEngagementLetter) {
          await updateDraftEngagementLetter(selectedEngagementLetter.id, _fd);
        }
        await refetchWorkspace();
        await refetch();
        setFormOpen(false);
      } catch (e) {
        const msg =
          e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Gagal memproses engagement letter.';
        setActionError(msg);
      } finally {
        setMutationBusy(false);
        setBusyAction(null);
      }
    },
    [formMode, selectedEngagementLetter, createDraftEngagementLetter, updateDraftEngagementLetter, refetchWorkspace, refetch]
  );

  const handleDeleteDraft = useCallback(async () => {
    if (!selectedEngagementLetter) return;
    if (
      !window.confirm(
        'Hapus draft engagement letter beserta dokumennya? Tindakan ini tidak dapat dibatalkan.'
      )
    ) {
      return;
    }
    setMutationBusy(true);
    setActionError(null);
    try {
      await deleteDraftEngagementLetter(selectedEngagementLetter.id);
      setSelectedEngagementLetterId(null);
      await refetchWorkspace();
      await refetch();
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Gagal menghapus draft engagement letter.';
      setActionError(msg);
    } finally {
      setMutationBusy(false);
    }
  }, [selectedEngagementLetter, deleteDraftEngagementLetter, refetchWorkspace, refetch]);

  const handleMarkSentToClient = useCallback(async () => {
    if (!selectedEngagementLetter) return;
    setMutationBusy(true);
    setActionError(null);
    try {
      await markEngagementLetterSentToClient(selectedEngagementLetter.id);
      await refetchWorkspace();
      await refetch();
      setSentDialogOpen(false);
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Gagal menandai engagement letter terkirim.';
      setActionError(msg);
    } finally {
      setMutationBusy(false);
    }
  }, [selectedEngagementLetter, markEngagementLetterSentToClient, refetchWorkspace, refetch]);

  const handleMarkSigned = useCallback(async () => {
    if (!selectedEngagementLetter) return;
    setMutationBusy(true);
    setActionError(null);
    setSuccessMessage(null);
    try {
      await markEngagementLetterSigned(selectedEngagementLetter.id);
      await refetchWorkspace();
      await refetch();
      setSignedDialogOpen(false);
      setSuccessMessage('Engagement letter ditandai signed. Draft handover dan akun invoice telah dibuat.');
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Gagal menandai engagement letter signed.';
      setActionError(msg);
    } finally {
      setMutationBusy(false);
    }
  }, [selectedEngagementLetter, markEngagementLetterSigned, refetchWorkspace, refetch]);

  if (loading) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-6 text-sm text-[#737784] shadow-sm">
        Memuat engagement letter…
      </div>
    );
  }

  return (
    <section className="grid grid-cols-12 gap-6">
      {successMessage ? (
        <div className="col-span-12 rounded-lg border border-[#006544]/30 bg-[#006544]/5 px-4 py-3 text-sm text-[#004b31]">
          {successMessage}
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="ml-3 font-bold text-[#003c90] underline"
          >
            Tutup
          </button>
        </div>
      ) : null}
      {actionError ? (
        <div className="col-span-12 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {actionError}
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="ml-3 font-bold text-[#003c90] underline"
          >
            Tutup
          </button>
        </div>
      ) : null}
      {error ? (
        <div className="col-span-12 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
          <button
            type="button"
            onClick={() => void refetch()}
            className="ml-3 font-bold text-[#003c90] underline"
          >
            Coba lagi
          </button>
        </div>
      ) : null}
      <EngagementLetterHistorySection
        engagementLetters={engagementLetters}
        selectedEngagementLetterId={selectedEngagementLetter?.id ?? resolvedSelectedId ?? undefined}
        onSelectEngagementLetter={setSelectedEngagementLetterId}
        onCreateEngagementLetter={openCreateForm}
        canCreateEngagementLetter={canCreateEngagementLetter}
      />
      <EngagementLetterDetailSection
        engagementLetter={selectedEngagementLetter}
        processedByUserId={processedByUserId}
        onCreateEngagementLetter={openCreateForm}
        canCreateEngagementLetter={canCreateEngagementLetter}
        mutationBusy={mutationBusy}
        onEditDraft={openEditForm}
        onDeleteDraft={handleDeleteDraft}
        onOpenSentToClient={() => {
          setActionError(null);
          setSentDialogOpen(true);
        }}
        onOpenMarkSigned={() => {
          setActionError(null);
          setSuccessMessage(null);
          setSignedDialogOpen(true);
        }}
      />

      <EngagementLetterFormDialog
        open={formOpen}
        mode={formMode}
        initialEngagement={formMode === 'edit' ? selectedEngagementLetter : undefined}
        busy={mutationBusy}
        busyAction={busyAction}
        onClose={() => {
          if (!mutationBusy) setFormOpen(false);
        }}
        onSubmit={handleFormSubmit}
      />

      <EngagementLetterSentToClientDialog
        open={sentDialogOpen}
        busy={mutationBusy}
        onClose={() => {
          if (!mutationBusy) setSentDialogOpen(false);
        }}
        onConfirm={handleMarkSentToClient}
      />

      <EngagementLetterSignedDialog
        open={signedDialogOpen}
        busy={mutationBusy}
        onClose={() => {
          if (!mutationBusy) setSignedDialogOpen(false);
        }}
        onConfirm={handleMarkSigned}
      />
    </section>
  );
};
