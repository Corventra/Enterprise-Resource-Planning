import { useState } from 'react';
import { useOutletContext } from 'react-router';
import { ApiError } from '../../../services/api-client';
import { CreateEditProposalDialog } from '../components/modals/create-edit-proposal-dialog';
import { MarkProposalRespondedDialog } from '../components/modals/mark-proposal-responded-dialog';
import { SentToClientProposalDialog } from '../components/modals/sent-to-client-proposal-dialog';
import { ProposalDetailSection } from '../components/proposal-detail-section';
import { ProposalHistorySection } from '../components/proposal-history-section';
import { useLeadProposal } from '../hooks/use-lead-proposals';
import type { LeadWorkspaceOutletContext } from '../types/lead-workspace.types';
import type { ProposalSaveAction, SaveProposalDraftPayload } from '../types/lead-proposals.types';

export const ProposalPage = () => {
  const { leadId, refetchWorkspace } = useOutletContext<LeadWorkspaceOutletContext>();
  const { proposal, isLoading, loadError, refetch, createDraft, updateDraft, deleteDraft, markSentToClient, markResponded } =
    useLeadProposal(leadId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [dialogBusy, setDialogBusy] = useState(false);
  const [busyAction, setBusyAction] = useState<ProposalSaveAction | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const [sentDialogOpen, setSentDialogOpen] = useState(false);
  const [respondedDialogOpen, setRespondedDialogOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const openCreateDialog = () => {
    setActionError(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const openEditDialog = () => {
    setActionError(null);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const persistProposal = async (payload: SaveProposalDraftPayload, action: ProposalSaveAction) => {
    const nextPayload = { ...payload, action };
    if (dialogMode === 'create') {
      return createDraft(nextPayload);
    }
    if (!proposal) {
      throw new Error('Proposal tidak tersedia.');
    }
    return updateDraft(proposal.id, nextPayload);
  };

  const handleSaveDraft = async (payload: SaveProposalDraftPayload) => {
    setDialogBusy(true);
    setBusyAction('draft');
    setActionError(null);
    try {
      await persistProposal(payload, 'draft');
      setDialogOpen(false);
      await refetch();
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Gagal menyimpan draft proposal.';
      setActionError(message);
      throw e;
    } finally {
      setDialogBusy(false);
      setBusyAction(null);
    }
  };

  const handleSubmitProposal = async (payload: SaveProposalDraftPayload) => {
    setDialogBusy(true);
    setBusyAction('submit');
    setActionError(null);
    try {
      await persistProposal(payload, 'submit');
      setDialogOpen(false);
      await refetch();
      await refetchWorkspace();
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Gagal submit proposal.';
      setActionError(message);
      throw e;
    } finally {
      setDialogBusy(false);
      setBusyAction(null);
    }
  };

  const handleDeleteDraft = async () => {
    if (!proposal) return;
    const confirmed = window.confirm('Hapus draft proposal ini?');
    if (!confirmed) return;

    setDeleteBusy(true);
    setActionError(null);
    try {
      await deleteDraft(proposal.id);
      await refetch();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'Gagal menghapus draft proposal.');
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleMarkSentToClient = async () => {
    if (!proposal) return;
    setLifecycleBusy(true);
    setActionError(null);
    try {
      await markSentToClient(proposal.id);
      setSentDialogOpen(false);
      await refetch();
      await refetchWorkspace();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'Gagal menandai proposal terkirim ke client.');
    } finally {
      setLifecycleBusy(false);
    }
  };

  const handleMarkResponded = async () => {
    if (!proposal) return;
    setLifecycleBusy(true);
    setActionError(null);
    try {
      await markResponded(proposal.id);
      setRespondedDialogOpen(false);
      await refetch();
      await refetchWorkspace();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'Gagal menandai proposal direspons client.');
    } finally {
      setLifecycleBusy(false);
    }
  };

  return (
    <section className="grid grid-cols-12 gap-6">
      {actionError ? (
        <div className="col-span-12 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionError}</div>
      ) : null}

      <ProposalHistorySection
        proposal={proposal}
        isLoading={isLoading}
        loadError={loadError}
        onCreateProposal={openCreateDialog}
      />
      <ProposalDetailSection
        proposal={proposal}
        onEditProposal={openEditDialog}
        onDeleteDraft={() => void handleDeleteDraft()}
        deleteBusy={deleteBusy}
        onSendToClient={() => setSentDialogOpen(true)}
        onMarkResponded={() => setRespondedDialogOpen(true)}
        lifecycleActionsDisabled={lifecycleBusy}
      />

      <CreateEditProposalDialog
        open={dialogOpen}
        mode={dialogMode}
        initialProposal={proposal}
        busy={dialogBusy}
        busyAction={busyAction}
        onClose={() => setDialogOpen(false)}
        onSaveDraft={handleSaveDraft}
        onSubmitProposal={handleSubmitProposal}
      />

      <SentToClientProposalDialog
        open={sentDialogOpen}
        busy={lifecycleBusy}
        onClose={() => setSentDialogOpen(false)}
        onConfirm={handleMarkSentToClient}
      />
      <MarkProposalRespondedDialog
        open={respondedDialogOpen}
        busy={lifecycleBusy}
        onClose={() => setRespondedDialogOpen(false)}
        onConfirm={handleMarkResponded}
      />
    </section>
  );
};
