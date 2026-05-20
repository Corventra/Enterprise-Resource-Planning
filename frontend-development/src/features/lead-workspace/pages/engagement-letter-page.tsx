import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { useOutletContext } from 'react-router';
import { Toast } from '../../../components/ui/toast';
import { useToast } from '../../../hooks/use-toast';
import { ApiError } from '../../../services/api-client';
import { ENGAGEMENT_LETTER_TOAST } from '../constants/lead-engagement-letter-toast';
import { EngagementLetterDetailSection } from '../components/engagement-letter-detail-section';
import { EngagementLetterHistorySection } from '../components/engagement-letter-history-section';
import { DeleteEngagementLetterDraftDialog } from '../components/modals/delete-engagement-letter-draft-dialog';
import { EngagementLetterFormDialog } from '../components/modals/engagement-letter-form-dialog';
import { EngagementLetterSubmitConfirmDialog } from '../components/modals/engagement-letter-submit-confirm-dialog';
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
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [busyAction, setBusyAction] = useState<'draft' | 'submit' | null>(null);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [sentDialogOpen, setSentDialogOpen] = useState(false);
  const [signedDialogOpen, setSignedDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { message: toastMessage, variant: toastVariant, dismiss: dismissToast, show: showToast } = useToast();
  const pendingSubmitFdRef = useRef<FormData | null>(null);

  const canCreateEngagementLetter = Boolean(proposalWithoutEngagement);

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
    setFormMode('create');
    setFormOpen(true);
  }, []);

  const openEditForm = useCallback(() => {
    if (!selectedEngagementLetter) return;
    setFormMode('edit');
    setFormOpen(true);
  }, [selectedEngagementLetter]);

  const handleFormSubmit = useCallback(
    async (fd: FormData, action: 'draft' | 'submit') => {
      setMutationBusy(true);
      setBusyAction(action);
      try {
        if (formMode === 'create') {
          await createDraftEngagementLetter(fd);
        } else if (selectedEngagementLetter) {
          await updateDraftEngagementLetter(selectedEngagementLetter.id, fd);
        }
        setFormOpen(false);
        setSubmitConfirmOpen(false);
        showToast(action === 'draft' ? ENGAGEMENT_LETTER_TOAST.draftSaved : ENGAGEMENT_LETTER_TOAST.submitted);
        await refetchWorkspace({ silent: true });
        await refetch({ silent: true });
      } catch (e) {
        const message =
          e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Gagal memproses engagement letter.';
        showToast(message, { variant: 'error' });
        throw e;
      } finally {
        setMutationBusy(false);
        setBusyAction(null);
      }
    },
    [
      formMode,
      selectedEngagementLetter,
      createDraftEngagementLetter,
      updateDraftEngagementLetter,
      refetchWorkspace,
      refetch,
      showToast
    ]
  );

  const handleDeleteDraftConfirm = useCallback(
    async (engagementId: string) => {
      setDeleteBusy(true);
      try {
        await deleteDraftEngagementLetter(engagementId);
        setSelectedEngagementLetterId(null);
        showToast(ENGAGEMENT_LETTER_TOAST.draftDeleted);
        await refetchWorkspace({ silent: true });
        await refetch({ silent: true });
      } catch (e) {
        const message =
          e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Gagal menghapus draft engagement letter.';
        showToast(message, { variant: 'error' });
        throw e;
      } finally {
        setDeleteBusy(false);
      }
    },
    [deleteDraftEngagementLetter, refetch, refetchWorkspace, showToast]
  );

  const handleMarkSentToClient = useCallback(async () => {
    if (!selectedEngagementLetter) return;
    setMutationBusy(true);
    try {
      await markEngagementLetterSentToClient(selectedEngagementLetter.id);
      setSentDialogOpen(false);
      showToast(ENGAGEMENT_LETTER_TOAST.sentToClient);
      await refetchWorkspace({ silent: true });
      await refetch({ silent: true });
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Gagal menandai engagement letter terkirim.';
      showToast(message, { variant: 'error' });
    } finally {
      setMutationBusy(false);
    }
  }, [selectedEngagementLetter, markEngagementLetterSentToClient, refetch, refetchWorkspace, showToast]);

  const handleMarkSigned = useCallback(async () => {
    if (!selectedEngagementLetter) return;
    setMutationBusy(true);
    try {
      await markEngagementLetterSigned(selectedEngagementLetter.id);
      setSignedDialogOpen(false);
      showToast(ENGAGEMENT_LETTER_TOAST.markedSigned);
      await refetchWorkspace({ silent: true });
      await refetch({ silent: true });
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Gagal menandai engagement letter signed.';
      showToast(message, { variant: 'error' });
    } finally {
      setMutationBusy(false);
    }
  }, [selectedEngagementLetter, markEngagementLetterSigned, refetch, refetchWorkspace, showToast]);

  let body: ReactNode;

  if (loading) {
    body = (
      <div className="rounded-xl border border-[#eceef0] bg-white p-6 text-sm text-[#737784] shadow-sm">
        Memuat engagement letter…
      </div>
    );
  } else {
    body = (
      <section className="grid grid-cols-12 gap-6">
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
          deleteBusy={deleteBusy}
          onEditDraft={openEditForm}
          onDeleteDraft={() => setDeleteDialogOpen(true)}
          onOpenSentToClient={() => setSentDialogOpen(true)}
          onOpenMarkSigned={() => setSignedDialogOpen(true)}
        />
      </section>
    );
  }

  return (
    <>
      {body}

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
        onRequestSubmitConfirm={(fd) => {
          pendingSubmitFdRef.current = fd;
          setFormOpen(false);
          setSubmitConfirmOpen(true);
        }}
      />

      <EngagementLetterSubmitConfirmDialog
        open={submitConfirmOpen}
        busy={mutationBusy && busyAction === 'submit'}
        onClose={() => {
          if (!mutationBusy) {
            setSubmitConfirmOpen(false);
            pendingSubmitFdRef.current = null;
          }
        }}
        onConfirm={async () => {
          const fd = pendingSubmitFdRef.current;
          if (!fd) return;
          try {
            await handleFormSubmit(fd, 'submit');
          } catch {
            /* toast shown in handleFormSubmit */
          } finally {
            pendingSubmitFdRef.current = null;
          }
        }}
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

      <DeleteEngagementLetterDraftDialog
        open={deleteDialogOpen}
        engagementLetter={selectedEngagementLetter}
        busy={deleteBusy}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteDraftConfirm}
      />

      <Toast
        open={toastMessage != null}
        message={toastMessage ?? ''}
        variant={toastVariant}
        onClose={dismissToast}
      />
    </>
  );
};
