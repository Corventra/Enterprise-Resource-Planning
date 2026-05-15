import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../../../app/store/auth-store';
import { HandoverCeoRevisionNoteCard } from '../components/detail/handover-ceo-revision-note-card';
import { HandoverSubmitDialog } from '../components/detail/handover-submit-dialog';
import { isHandoverEditableDbStatus, shouldShowCeoRevisionNote } from '../utils/handover-editable';
import { HandoverUpdateFormSections } from '../components/update/handover-update-form-sections';
import { HandoverUpdateHeader } from '../components/update/handover-update-header';
import { HandoverUpdateQuickNavigation } from '../components/update/handover-update-quick-navigation';
import { useHandoverDetail } from '../hooks/use-handover-detail';
import { handoverService } from '../services/handover-service';
import type { HandoverDetail } from '../types/handover.types';

export const HandoverUpdatePage = () => {
  const navigate = useNavigate();
  const { handoverId } = useParams();
  const { user } = useAuth();
  const { detail, isLoading } = useHandoverDetail(handoverId);
  const [form, setForm] = useState<HandoverDetail | undefined>();
  const [deletedDocumentIds, setDeletedDocumentIds] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isOperator = useMemo(() => {
    if (!detail?.processedBy || !user?.id) return false;
    return Number(detail.processedBy) === Number(user.id);
  }, [detail?.processedBy, user?.id]);

  const activeForm = form ?? detail;

  const collectPatchExtras = () => {
    const docs = activeForm?.clientDocuments ?? [];
    const newFiles = docs.filter((d) => d.pendingFile).map((d) => d.pendingFile as File);
    return { deletedDocumentIds, newFiles };
  };

  const persistDraft = async () => {
    if (!handoverId || !activeForm) return;
    setBusy(true);
    setActionError(null);
    try {
      const updated = await handoverService.updateDraft(handoverId, activeForm, collectPatchExtras());
      setForm(updated);
      setDeletedDocumentIds([]);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Gagal menyimpan draft handover.');
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      await persistDraft();
    } catch {
      // error shown via actionError
    }
  };

  const handleSubmit = async () => {
    if (!handoverId) return;
    setBusy(true);
    setActionError(null);
    try {
      await persistDraft();
      await handoverService.submit(handoverId);
      setSubmitOpen(false);
      navigate(`/handover/${handoverId}`);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Gagal submit handover.');
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
        Loading handover form...
      </div>
    );
  }

  if (!detail || !activeForm) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 shadow-sm">
        <h1 className="text-base font-semibold text-[#191c1e]">Handover not found</h1>
        <button
          type="button"
          onClick={() => navigate('/handover')}
          className="mt-3 rounded-lg border border-[#c3c6d5] px-3 py-1.5 text-xs font-medium text-[#191c1e] hover:bg-[#eceef0] sm:text-sm"
        >
          Back to Handover List
        </button>
      </div>
    );
  }

  if (!isHandoverEditableDbStatus(detail.dbStatus) || !isOperator) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 shadow-sm">
        <h1 className="text-base font-semibold text-[#191c1e]">Handover tidak dapat diedit</h1>
        <p className="mt-2 text-sm text-[#737784]">
          Hanya BD operator lead yang dapat mengedit handover berstatus Draft atau Revision Needed.
        </p>
        <button
          type="button"
          onClick={() => navigate(`/handover/${detail.id}`)}
          className="mt-3 rounded-lg border border-[#c3c6d5] px-3 py-1.5 text-xs font-medium text-[#191c1e] hover:bg-[#eceef0] sm:text-sm"
        >
          Kembali ke detail
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <HandoverUpdateHeader
        busy={busy}
        onBack={() => navigate(`/handover/${detail.id}`)}
        onSaveDraft={() => void handleSaveDraft()}
        onSubmit={() => setSubmitOpen(true)}
      />

      {actionError ? <p className="text-sm text-red-800">{actionError}</p> : null}

      {shouldShowCeoRevisionNote(detail.dbStatus) ? (
        <HandoverCeoRevisionNoteCard note={detail.ceoRevisionNote} />
      ) : null}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-6">
        <HandoverUpdateQuickNavigation />
        <HandoverUpdateFormSections
          form={activeForm}
          onChange={setForm}
          onDeleteDocument={(documentId) => {
            setDeletedDocumentIds((prev) => (prev.includes(documentId) ? prev : [...prev, documentId]));
          }}
        />
      </div>

      <HandoverSubmitDialog
        open={submitOpen}
        busy={busy}
        isResubmit={detail.dbStatus === 'NEED_REVISION'}
        onClose={() => setSubmitOpen(false)}
        onConfirm={handleSubmit}
      />
    </div>
  );
};
