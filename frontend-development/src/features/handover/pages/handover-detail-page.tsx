import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { Toast } from '../../../components/ui/toast';
import { useToast } from '../../../hooks/use-toast';
import { PERMISSIONS } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import { ApiError } from '../../../services/api-client';
import { HANDOVER_TOAST } from '../constants/handover-toast';
import { hasHandoverSubmitErrors, validateHandoverForSubmit } from '../utils/handover-submit-validation';
import { ApproveHandoverDialog } from '../../approval/components/modals/approve-handover-dialog';
import { RejectHandoverDialog } from '../../approval/components/modals/reject-handover-dialog';
import { APPROVAL_HANDOVER_TOAST } from '../../approval/constants/approval-handover-toast';
import { approvalHandoversService } from '../../approval/services/approval-handovers-service';
import { HandoverActivityLogPanel } from '../components/detail/handover-activity-log-panel';
import { HandoverApprovalTrail } from '../components/detail/handover-approval-trail';
import { HandoverDetailHeader } from '../components/detail/handover-detail-header';
import { HandoverDocumentSections } from '../components/detail/handover-document-sections';
import { HandoverQuickNavigation } from '../components/detail/handover-quick-navigation';
import { HandoverCeoApprovalActions } from '../components/detail/handover-ceo-approval-actions';
import { HandoverCeoRevisionNoteCard } from '../components/detail/handover-ceo-revision-note-card';
import { HandoverSubmitDialog } from '../components/detail/handover-submit-dialog';
import { shouldShowCeoRevisionNote } from '../utils/handover-editable';
import { useHandoverDetail } from '../hooks/use-handover-detail';
import { handoverService } from '../services/handover-service';
import { AssignPMDialog } from '../../projects/components/modals/assign-pm-dialog';
import { projectService } from '../../projects/services/project-service';
import type { ProjectAssignee } from '../../projects/types/project.types';

export const HandoverDetailPage = () => {
  const navigate = useNavigate();
  const { handoverId } = useParams();
  const { user, can, role } = useAuth();
  const { detail, error, isLoading, refetch } = useHandoverDetail(handoverId);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const { message: toastMessage, variant: toastVariant, dismiss: dismissToast, show: showToast } = useToast();
  const [assignPmOpen, setAssignPmOpen] = useState(false);
  const [assignPmBusy, setAssignPmBusy] = useState(false);
  const [assignPmError, setAssignPmError] = useState<string | undefined>(undefined);

  const isOperator = useMemo(() => {
    if (!detail?.processedBy || !user?.id) return false;
    return Number(detail.processedBy) === Number(user.id);
  }, [detail?.processedBy, user?.id]);

  const canCeoApprove = useMemo(
    () => can(PERMISSIONS.HANDOVER_APPROVE) && detail?.dbStatus === 'WAITING_CEO_APPROVAL',
    [can, detail?.dbStatus]
  );

  const handleRequestSubmit = useCallback(() => {
    if (!detail) return;
    const errors = validateHandoverForSubmit(detail);
    if (hasHandoverSubmitErrors(errors)) {
      navigate(`/handover/${detail.id}/edit`, {
        state: { showSubmitErrors: true, showIncompleteToast: true }
      });
      return;
    }
    setSubmitOpen(true);
  }, [detail, navigate]);

  const handleSubmit = async () => {
    if (!handoverId || !detail) return;
    setSubmitBusy(true);
    try {
      await handoverService.submit(handoverId);
      setSubmitOpen(false);
      showToast(detail.dbStatus === 'NEED_REVISION' ? HANDOVER_TOAST.resubmitted : HANDOVER_TOAST.submitted, {
        immediate: true
      });
      await refetch({ silent: true });
    } catch (e) {
      const message = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Gagal submit handover.';
      showToast(message, { variant: 'error' });
    } finally {
      setSubmitBusy(false);
    }
  };

  const handleApprove = useCallback(async () => {
    if (!handoverId) return;
    setApprovalBusy(true);
    try {
      await approvalHandoversService.approveHandover(handoverId);
      setApproveOpen(false);
      showToast(APPROVAL_HANDOVER_TOAST.approved, { immediate: true });
      await refetch({ silent: true });
    } catch (e) {
      const message = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Gagal menyetujui handover.';
      showToast(message, { variant: 'error' });
    } finally {
      setApprovalBusy(false);
    }
  }, [handoverId, refetch, showToast]);

  const handleReject = useCallback(
    async (note: string) => {
      if (!handoverId) return;
      setApprovalBusy(true);
      try {
        await approvalHandoversService.rejectHandover(handoverId, note);
        setRejectOpen(false);
        showToast(APPROVAL_HANDOVER_TOAST.rejected, { immediate: true });
        await refetch({ silent: true });
      } catch (e) {
        const message =
          e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Gagal mengirim permintaan revisi.';
        showToast(message, { variant: 'error' });
      } finally {
        setApprovalBusy(false);
      }
    },
    [handoverId, refetch, showToast]
  );

  const canAssignPM = can(PERMISSIONS.PROJECT_ASSIGN_PM);

  const handleAssignPm = useCallback(
    async (pm: ProjectAssignee, note?: string) => {
      if (!handoverId || !role) return;
      setAssignPmBusy(true);
      setAssignPmError(undefined);
      try {
        await projectService.createFromHandover(
          handoverId,
          pm,
          { name: user?.name || '', role },
          note
        );
        setAssignPmOpen(false);
        showToast(`Project berhasil dibuat dan di-assign ke ${pm.name}.`, { immediate: true });
        await refetch({ silent: true });
      } catch (e) {
        setAssignPmError(e instanceof Error ? e.message : 'Gagal assign PM.');
      } finally {
        setAssignPmBusy(false);
      }
    },
    [handoverId, role, user?.name, refetch, showToast]
  );

  const toast = (
    <Toast
      open={toastMessage != null}
      message={toastMessage ?? ''}
      variant={toastVariant}
      onClose={dismissToast}
    />
  );

  if (isLoading) {
    return (
      <>
        <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
          Memuat detail handover…
        </div>
        {toast}
      </>
    );
  }

  if (!detail) {
    return (
      <>
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 shadow-sm">
        <h1 className="text-base font-semibold text-[#191c1e]">Handover tidak ditemukan</h1>
        {error ? <p className="mt-2 text-sm text-red-800">{error}</p> : null}
        <button
          type="button"
          onClick={() => navigate('/handover')}
          className="mt-3 rounded-lg border border-[#c3c6d5] px-3 py-1.5 text-xs font-medium text-[#191c1e] hover:bg-[#eceef0] sm:text-sm"
        >
          Back to Handover List
        </button>
      </div>
        {toast}
      </>
    );
  }

  return (
    <div className="space-y-5">
      <button
          type="button"
          onClick={() => navigate('/handover')}
          className="group inline-flex w-fit items-center text-xs font-medium text-[#434653] transition-colors hover:text-[#003c90] sm:text-sm"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 sm:h-4 sm:w-4" />
        Back to Handover List
      </button>

      <HandoverDetailHeader
        status={detail.status}
        dbStatus={detail.dbStatus}
        isOperator={isOperator}
        onEdit={() => navigate(`/handover/${detail.id}/edit`)}
        onSubmit={handleRequestSubmit}
        onAssignPM={canAssignPM ? () => setAssignPmOpen(true) : undefined}
      />

      {shouldShowCeoRevisionNote(detail.dbStatus) ? (
        <HandoverCeoRevisionNoteCard note={detail.ceoRevisionNote} />
      ) : null}

      <HandoverActivityLogPanel entries={detail.activityLogs} isLoading={isLoading} />

      {detail.approvalTrail && detail.approvalTrail.length > 0 ? (
        <HandoverApprovalTrail status={detail.status} entries={detail.approvalTrail} />
      ) : null}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-6">
        <div className="sticky top-20 self-start md:col-span-2">
          <HandoverQuickNavigation />
        </div>
        <div className="md:col-span-10">
          <HandoverDocumentSections
            detail={detail}
            ceoApprovalActions={
              canCeoApprove ? (
                <HandoverCeoApprovalActions
                  embedded
                  disabled={approvalBusy || submitBusy}
                  onApprove={() => setApproveOpen(true)}
                  onReject={() => setRejectOpen(true)}
                />
              ) : null
            }
          />
        </div>
      </div>

      <HandoverSubmitDialog
        open={submitOpen}
        busy={submitBusy}
        isResubmit={detail.dbStatus === 'NEED_REVISION'}
        onClose={() => setSubmitOpen(false)}
        onConfirm={handleSubmit}
      />
      <ApproveHandoverDialog
        open={approveOpen}
        busy={approvalBusy}
        onClose={() => setApproveOpen(false)}
        onConfirm={handleApprove}
      />
      <RejectHandoverDialog
        open={rejectOpen}
        busy={approvalBusy}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
      />
      <AssignPMDialog
        open={assignPmOpen}
        handoverDocCode={detail.docCode}
        client={detail.projectInformation.find((info) => info.label === 'Client Name')?.value ?? detail.docCode}
        isSubmitting={assignPmBusy}
        errorMessage={assignPmError}
        onClose={() => {
          setAssignPmOpen(false);
          setAssignPmError(undefined);
        }}
        onAssign={handleAssignPm}
      />

      {toast}
    </div>
  );
};
