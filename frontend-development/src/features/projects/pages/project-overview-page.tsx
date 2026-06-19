import { CheckCircle2, CircleDollarSign, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useOutletContext } from 'react-router';
import { ROLES } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import { FullscreenConfirmDialog } from '../../../components/ui/fullscreen-confirm-dialog';
import { Toast } from '../../../components/ui/toast';
import { useToast } from '../../../hooks/use-toast';
import { HandoverDocumentSections } from '../../handover/components/detail/handover-document-sections';
import { projectService } from '../services/project-service';
import type { ProjectDetailOutletContext } from './project-detail-page';

const sectionClass = 'rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#eceef0]';
const sectionTitleClass = 'mb-4 text-lg font-bold text-[#003c90]';
const labelClass = 'text-xs font-bold uppercase tracking-wider text-[#737784]';

export const ProjectOverviewPage = () => {
  const { project, handover, refresh } = useOutletContext<ProjectDetailOutletContext>();
  const { role, user } = useAuth();

  // PM & Consultant tidak boleh lihat fee structure dari handover. Role lain
  // (COO, CEO, BD, Staff Admin) lihat lengkap.
  const hideFees = role === ROLES.PM || role === ROLES.CONSULTANT;

  // PM completion check (PRD Rule B trigger). Strict: semua milestone harus Done.
  const isPm = role === ROLES.PM && user?.id != null && String(user.id) === project.pm?.id;
  const totalMilestones = project.milestones.length;
  const doneMilestones = project.milestones.filter((m) => m.status === 'Done').length;
  const allMilestonesDone = totalMilestones > 0 && doneMilestones === totalMilestones;
  const isAlreadyCompleted = project.status === 'Completed';
  const isCancelled = project.status === 'Cancelled';
  const canMarkCompleted = isPm && !isAlreadyCompleted && !isCancelled && allMilestonesDone;

  const [isCompleting, setIsCompleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { message: toastMessage, variant: toastVariant, dismiss: dismissToast, show: showToast } = useToast();

  const handleMarkCompletedRequest = () => {
    if (!canMarkCompleted) return;
    setConfirmOpen(true);
  };

  const handleMarkCompletedConfirm = async () => {
    setConfirmOpen(false);
    setIsCompleting(true);
    try {
      const result = await projectService.completeProject(project.id);
      showToast(
        result.triggeredInvoiceTerms > 0
          ? `Project Completed. ${result.triggeredInvoiceTerms} final invoice term diaktifkan.`
          : 'Project Completed. (Tidak ada term FINAL yang ke-trigger — pastikan invoice ter-link ke project.)',
        { variant: 'success' }
      );
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal mark project Completed.', { variant: 'error' });
    } finally {
      setIsCompleting(false);
    }
  };

  // DP payment status indicator (cross-module dari modul Invoice).
  const dpStatus = project.dpPaymentStatus;
  const dpBadgeClass =
    dpStatus === 'PAID'
      ? 'bg-[#006544]/15 text-[#006544]'
      : dpStatus === 'UNPAID'
      ? 'bg-orange-100 text-[#c2410c]'
      : 'bg-[#e0e3e5] text-[#434653]';
  const dpLabel = dpStatus === 'PAID' ? 'PAID' : dpStatus === 'UNPAID' ? 'UNPAID' : '—';

  return (
    <div className="space-y-5">
      {(isPm || isAlreadyCompleted) && (
        <section className={sectionClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#003c90]">Project Completion</h2>
              <p className="mt-1 text-sm text-[#737784]">
                {isAlreadyCompleted
                  ? 'Project sudah Completed — final invoice sudah ditrigger.'
                  : isCancelled
                  ? 'Project Cancelled — completion tidak tersedia.'
                  : allMilestonesDone
                  ? `Semua ${totalMilestones} milestone Done. Klik tombol untuk trigger final invoice.`
                  : `Progress milestone: ${doneMilestones}/${totalMilestones} Done. Tombol akan aktif setelah semua milestone Done.`}
              </p>
            </div>
            {isPm && !isAlreadyCompleted && !isCancelled && (
              <button
                type="button"
                onClick={handleMarkCompletedRequest}
                disabled={!canMarkCompleted || isCompleting}
                className="inline-flex items-center gap-2 rounded-lg bg-[#006544] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#006544]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
              >
                {isCompleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Mark Project Completed
              </button>
            )}
          </div>
        </section>
      )}

      <FullscreenConfirmDialog open={confirmOpen}>
        <div className="w-full max-w-md rounded-xl border border-[#eceef0] border-l-4 border-l-[#003c90] bg-white p-5 shadow-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#003c90]" aria-hidden />
            <div className="flex-1">
              <h2 className="text-base font-semibold text-[#191c1e]">
                Mark project &ldquo;{project.projectCode}&rdquo; sebagai Completed?
              </h2>
              <p className="mt-2 text-sm text-[#737784]">
                Ini akan mengaktifkan tagihan final invoice.
              </p>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={isCompleting}
              className="rounded-lg border border-[#c3c6d5] px-4 py-2 text-sm font-medium text-[#434653] hover:bg-[#eceef0] disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleMarkCompletedConfirm}
              disabled={isCompleting}
              className="rounded-lg bg-[#003c90] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Ya, mark completed
            </button>
          </div>
        </div>
      </FullscreenConfirmDialog>

      <Toast
        open={toastMessage !== null}
        message={toastMessage ?? ''}
        variant={toastVariant}
        onClose={dismissToast}
      />


      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Project Information</h2>
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
          <div className="border-b border-[#f2f4f6] pb-3">
            <p className={labelClass}>Client</p>
            <p className="mt-1 text-sm font-semibold text-[#191c1e]">{project.client}</p>
          </div>
          <div className="border-b border-[#f2f4f6] pb-3">
            <p className={labelClass}>Project Name</p>
            <p className="mt-1 text-sm font-semibold text-[#191c1e]">{project.projectName}</p>
          </div>
          <div className="border-b border-[#f2f4f6] pb-3">
            <p className={labelClass}>Service Line</p>
            <p className="mt-1 text-sm font-semibold text-[#003c90]">{project.serviceLine}</p>
          </div>
          <div className="border-b border-[#f2f4f6] pb-3">
            <p className={labelClass}>Project Period</p>
            <p className="mt-1 text-sm font-semibold text-[#191c1e]">
              {new Date(project.startDate).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}{' '}
              –{' '}
              {new Date(project.endDate).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </p>
          </div>
          <div className="border-b border-[#f2f4f6] pb-3">
            <p className={labelClass}>Project Manager</p>
            <p className="mt-1 text-sm font-semibold text-[#191c1e]">
              {project.pm?.name ?? <span className="text-[#a16207]">Unassigned</span>}
            </p>
          </div>
          <div className="border-b border-[#f2f4f6] pb-3">
            <p className={labelClass}>Consultant Team</p>
            <p className="mt-1 text-sm font-semibold text-[#191c1e]">
              {project.consultants.length === 0 ? (
                <span className="text-[#a16207]">Awaiting Assignment</span>
              ) : (
                `${project.consultants.length} consultant${project.consultants.length > 1 ? 's' : ''} assigned`
              )}
            </p>
          </div>
          <div className="border-b border-[#f2f4f6] pb-3">
            <p className={labelClass}>DP Payment</p>
            <div className="mt-1 flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-[#737784]" />
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${dpBadgeClass}`}>
                {dpLabel}
              </span>
              {project.dpPaidAt && (
                <span className="text-xs text-[#737784]">
                  ({new Date(project.dpPaidAt).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })})
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {handover ? (
        <HandoverDocumentSections detail={handover} hideFees={hideFees} />
      ) : (
        <section className={sectionClass}>
          <p className="text-sm text-[#737784]">
            Detail handover tidak tersedia untuk project ini.
          </p>
        </section>
      )}
    </div>
  );
};
