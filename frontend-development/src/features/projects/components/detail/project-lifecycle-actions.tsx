import { Ban, Pause, Play } from 'lucide-react';
import { useState } from 'react';
import { ROLES } from '../../../../app/permissions';
import { useAuth } from '../../../../app/store/auth-store';
import { projectService } from '../../services/project-service';
import type { Project } from '../../types/project.types';

interface ProjectLifecycleActionsProps {
  project: Project;
  onAction: () => Promise<void> | void;
}

interface PromptState {
  action: 'pause' | 'resume' | 'cancel';
  title: string;
  requireReason: boolean;
}

/**
 * Action panel untuk WFMS lifecycle transitions di luar Mark Completed:
 *   - Pause (In Progress → On Hold): PM/CEO/COO; reason required
 *   - Resume (On Hold → In Progress): PM/CEO/COO; reason optional (WFMS re-check DP)
 *   - Cancel (* → Cancelled): CEO/COO only; reason required
 *
 * Lihat WFMS PRD bagian 3.1.4 (Transition Rules TP3, TP4, TP6) dan 6.1 SOP.
 */
export const ProjectLifecycleActions = ({ project, onAction }: ProjectLifecycleActionsProps) => {
  const { user, role } = useAuth();

  const [prompt, setPrompt] = useState<PromptState | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userIdStr = user?.id != null ? String(user.id) : null;
  const isProjectPm = role === ROLES.PM && userIdStr !== null && project.pm?.id === userIdStr;
  const isLeader = role === ROLES.CEO || role === ROLES.COO || role === ROLES.SUPERADMIN;

  const canPause = (isProjectPm || isLeader) && project.status === 'In Progress';
  const canResume = (isProjectPm || isLeader) && project.status === 'On Hold';
  const canCancel = isLeader && project.status !== 'Completed' && project.status !== 'Cancelled';

  if (!canPause && !canResume && !canCancel) return null;

  const submit = async () => {
    if (!prompt) return;
    if (prompt.requireReason && reason.trim().length === 0) {
      setError('Reason wajib diisi.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (prompt.action === 'pause') {
        await projectService.pauseProject(project.id, reason.trim());
      } else if (prompt.action === 'resume') {
        await projectService.resumeProject(project.id, reason.trim() || undefined);
      } else if (prompt.action === 'cancel') {
        await projectService.cancelProject(project.id, reason.trim());
      }
      setPrompt(null);
      setReason('');
      await onAction();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal melakukan transisi. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const closePrompt = () => {
    if (submitting) return;
    setPrompt(null);
    setReason('');
    setError(null);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canPause && (
          <button
            type="button"
            onClick={() => setPrompt({ action: 'pause', title: 'Pause Project', requireReason: true })}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-[#a16207] transition-colors hover:bg-amber-100"
          >
            <Pause className="h-3.5 w-3.5" />
            Pause Project
          </button>
        )}
        {canResume && (
          <button
            type="button"
            onClick={() => setPrompt({ action: 'resume', title: 'Resume Project', requireReason: false })}
            className="inline-flex items-center gap-2 rounded-lg border border-[#003c90]/30 bg-[#d5e3fc] px-3 py-1.5 text-xs font-bold text-[#003c90] transition-colors hover:bg-[#003c90]/20"
          >
            <Play className="h-3.5 w-3.5" />
            Resume Project
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            onClick={() => setPrompt({ action: 'cancel', title: 'Cancel Project', requireReason: true })}
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-100"
          >
            <Ban className="h-3.5 w-3.5" />
            Cancel Project
          </button>
        )}
      </div>

      {prompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[#191c1e]">{prompt.title}</h3>
            <p className="mt-1 text-sm text-[#737784]">
              {prompt.action === 'pause' && 'Project akan dihentikan sementara. Konsultan tidak dapat update milestone selama pause.'}
              {prompt.action === 'resume' && 'Project akan dilanjutkan. Sistem akan re-check DP — harus PAID.'}
              {prompt.action === 'cancel' && 'Project akan dibatalkan secara permanen (terminal). Tindakan ini tidak dapat di-undo.'}
            </p>
            <label className="mt-4 block text-xs font-semibold text-[#191c1e]">
              Reason{prompt.requireReason && <span className="text-red-600"> *</span>}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={submitting}
              rows={3}
              placeholder={prompt.requireReason ? 'Wajib diisi…' : 'Optional…'}
              className="mt-1 w-full resize-none rounded-lg border border-[#c3c6d5] px-3 py-2 text-sm focus:border-[#003c90] focus:outline-none focus:ring-2 focus:ring-[#003c90]/20"
            />
            {error && (
              <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closePrompt}
                disabled={submitting}
                className="rounded-lg border border-[#c3c6d5] px-3 py-1.5 text-xs font-semibold text-[#191c1e] hover:bg-[#eceef0] disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={submitting}
                className="rounded-lg bg-[#003c90] px-4 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Memproses…' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
