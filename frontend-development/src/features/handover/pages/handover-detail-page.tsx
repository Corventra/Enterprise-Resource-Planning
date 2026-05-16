import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { PERMISSIONS } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import { ApproveHandoverDialog } from '../../approval/components/modals/approve-handover-dialog';
import { RejectHandoverDialog } from '../../approval/components/modals/reject-handover-dialog';
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

export const HandoverDetailPage = () => {
  const navigate = useNavigate();
  const { handoverId } = useParams();
  const { user, can } = useAuth();
  const { detail, error, isLoading, refetch } = useHandoverDetail(handoverId);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const isOperator = useMemo(() => {
    if (!detail?.processedBy || !user?.id) return false;
    return Number(detail.processedBy) === Number(user.id);
  }, [detail?.processedBy, user?.id]);

  const canCeoApprove = useMemo(
    () => can(PERMISSIONS.HANDOVER_APPROVE) && detail?.dbStatus === 'WAITING_CEO_APPROVAL',
    [can, detail?.dbStatus]
  );

  const handleSubmit = async () => {
    if (!handoverId) return;
    setSubmitBusy(true);
    setActionError(null);
    try {
      await handoverService.submit(handoverId);
      setSubmitOpen(false);
      await refetch();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Gagal submit handover.');
    } finally {
      setSubmitBusy(false);
    }
  };

  const handleApprove = useCallback(async () => {
    if (!handoverId) return;
    setApprovalBusy(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await approvalHandoversService.approveHandover(handoverId);
      setApproveOpen(false);
      await refetch();
      setActionSuccess('Handover berhasil disetujui.');
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Gagal menyetujui handover.');
    } finally {
      setApprovalBusy(false);
    }
  }, [handoverId, refetch]);

  const handleReject = useCallback(
    async (note: string) => {
      if (!handoverId) return;
      setApprovalBusy(true);
      setActionError(null);
      setActionSuccess(null);
      try {
        await approvalHandoversService.rejectHandover(handoverId, note);
        setRejectOpen(false);
        await refetch();
        setActionSuccess('Permintaan revisi handover telah dikirim.');
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Gagal mengirim permintaan revisi.');
      } finally {
        setApprovalBusy(false);
      }
    },
    [handoverId, refetch]
  );

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
        Memuat detail handover…
      </div>
    );
  }

  if (!detail) {
    return (
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
        onSubmit={() => setSubmitOpen(true)}
      />

      {shouldShowCeoRevisionNote(detail.dbStatus) ? (
        <HandoverCeoRevisionNoteCard note={detail.ceoRevisionNote} />
      ) : null}

      {actionSuccess ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{actionSuccess}</p>
      ) : null}
      {actionError ? <p className="text-sm text-red-800">{actionError}</p> : null}

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
                  onApprove={() => {
                    setActionSuccess(null);
                    setActionError(null);
                    setApproveOpen(true);
                  }}
                  onReject={() => {
                    setActionSuccess(null);
                    setActionError(null);
                    setRejectOpen(true);
                  }}
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
    </div>
  );
};
