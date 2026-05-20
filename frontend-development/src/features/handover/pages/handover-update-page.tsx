import { useEffect, useMemo, useState } from 'react';
import { ensureHandoverFormListDefaults } from '../utils/ensure-handover-form-list-defaults';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Toast } from '../../../components/ui/toast';
import { useToast } from '../../../hooks/use-toast';
import { useAuth } from '../../../app/store/auth-store';
import { HandoverCeoRevisionNoteCard } from '../components/detail/handover-ceo-revision-note-card';
import { HandoverSubmitDialog } from '../components/detail/handover-submit-dialog';
import { HANDOVER_TOAST } from '../constants/handover-toast';
import { isHandoverEditableDbStatus, shouldShowCeoRevisionNote } from '../utils/handover-editable';
import { HandoverUpdateFormSections } from '../components/update/handover-update-form-sections';
import { HandoverUpdateHeader } from '../components/update/handover-update-header';
import { HandoverUpdateQuickNavigation } from '../components/update/handover-update-quick-navigation';
import { useHandoverDetail } from '../hooks/use-handover-detail';
import { handoverService } from '../services/handover-service';
import type { HandoverDetail } from '../types/handover.types';
import {
  firstHandoverSubmitErrorSectionId,
  hasHandoverSubmitErrors,
  validateHandoverForSubmit,
  type HandoverSubmitErrors
} from '../utils/handover-submit-validation';
import { ApiError } from '../../../services/api-client';

type HandoverUpdateLocationState = {
  showSubmitErrors?: boolean;
  showIncompleteToast?: boolean;
};

export const HandoverUpdatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handoverId } = useParams();
  const { user } = useAuth();
  const { detail, isLoading } = useHandoverDetail(handoverId);
  const [form, setForm] = useState<HandoverDetail | undefined>();
  const [deletedDocumentIds, setDeletedDocumentIds] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<HandoverSubmitErrors>({});
  const [showSubmitErrors, setShowSubmitErrors] = useState(false);
  const { message: toastMessage, variant: toastVariant, dismiss: dismissToast, show: showToast } = useToast();

  const isOperator = useMemo(() => {
    if (!detail?.processedBy || !user?.id) return false;
    return Number(detail.processedBy) === Number(user.id);
  }, [detail?.processedBy, user?.id]);

  const activeForm = useMemo(() => {
    const base = form ?? detail;
    if (!base) return undefined;
    return ensureHandoverFormListDefaults(base);
  }, [form, detail]);

  useEffect(() => {
    const state = location.state as HandoverUpdateLocationState | null;
    if (!state?.showSubmitErrors) return;

    if (state.showIncompleteToast) {
      showToast(HANDOVER_TOAST.submitIncomplete, { variant: 'error' });
    }

    if (!activeForm) return;

    const errors = validateHandoverForSubmit(activeForm);
    setSubmitErrors(errors);
    setShowSubmitErrors(true);
    const sectionId = firstHandoverSubmitErrorSectionId(errors);
    if (sectionId) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [activeForm, location.pathname, location.state, navigate, showToast]);

  const collectPatchExtras = () => {
    const docs = activeForm?.clientDocuments ?? [];
    const newFiles = docs.filter((d) => d.pendingFile).map((d) => d.pendingFile as File);
    return { deletedDocumentIds, newFiles };
  };

  const persistDraft = async () => {
    if (!handoverId || !activeForm) return;
    setBusy(true);
    try {
      const updated = await handoverService.updateDraft(handoverId, activeForm, collectPatchExtras());
      setForm(ensureHandoverFormListDefaults(updated));
      setDeletedDocumentIds([]);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Gagal menyimpan draft handover.';
      showToast(message, { variant: 'error' });
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const handleFormChange = (next: HandoverDetail) => {
    setForm(next);
    setShowSubmitErrors(false);
    setSubmitErrors({});
  };

  const handleSaveDraft = async () => {
    try {
      await persistDraft();
      showToast(HANDOVER_TOAST.draftSaved);
    } catch {
      /* toast shown in persistDraft */
    }
  };

  const handleRequestSubmit = () => {
    if (!activeForm) return;
    const errors = validateHandoverForSubmit(activeForm);
    if (hasHandoverSubmitErrors(errors)) {
      setSubmitErrors(errors);
      setShowSubmitErrors(true);
      showToast(HANDOVER_TOAST.submitIncomplete, { variant: 'error' });
      const sectionId = firstHandoverSubmitErrorSectionId(errors);
      if (sectionId) {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    setSubmitErrors({});
    setShowSubmitErrors(false);
    setSubmitOpen(true);
  };

  const handleSubmit = async () => {
    if (!handoverId || !activeForm) return;
    const errors = validateHandoverForSubmit(activeForm);
    if (hasHandoverSubmitErrors(errors)) {
      setSubmitErrors(errors);
      setShowSubmitErrors(true);
      setSubmitOpen(false);
      const sectionId = firstHandoverSubmitErrorSectionId(errors);
      if (sectionId) {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    setBusy(true);
    try {
      await persistDraft();
      await handoverService.submit(handoverId);
      setSubmitOpen(false);
      showToast(detail?.dbStatus === 'NEED_REVISION' ? HANDOVER_TOAST.resubmitted : HANDOVER_TOAST.submitted);
      navigate(`/handover/${handoverId}`);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Gagal submit handover.';
      showToast(message, { variant: 'error' });
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
    <>
      <div className="space-y-5">
        <HandoverUpdateHeader
          busy={busy}
          onBack={() => navigate(`/handover/${detail.id}`)}
          onSaveDraft={() => void handleSaveDraft()}
          onSubmit={handleRequestSubmit}
        />

        {shouldShowCeoRevisionNote(detail.dbStatus) ? (
          <HandoverCeoRevisionNoteCard note={detail.ceoRevisionNote} />
        ) : null}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-6">
          <HandoverUpdateQuickNavigation />
          <HandoverUpdateFormSections
            form={activeForm}
            onChange={handleFormChange}
            onDeleteDocument={(documentId) => {
              setDeletedDocumentIds((prev) => (prev.includes(documentId) ? prev : [...prev, documentId]));
            }}
            submitErrors={submitErrors}
            showSubmitErrors={showSubmitErrors}
          />
        </div>

        <HandoverSubmitDialog
          open={submitOpen}
          busy={busy}
          isResubmit={detail.dbStatus === 'NEED_REVISION'}
          onClose={() => {
            if (!busy) setSubmitOpen(false);
          }}
          onConfirm={handleSubmit}
        />
      </div>

      <Toast
        open={toastMessage != null}
        message={toastMessage ?? ''}
        variant={toastVariant}
        onClose={dismissToast}
      />
    </>
  );
};
