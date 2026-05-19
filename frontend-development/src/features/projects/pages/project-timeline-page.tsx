import { Calendar, ChevronDown, ChevronRight, History, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import { ROLES } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import { RateTaskDialog } from '../components/modals/rate-task-dialog';
import { projectService } from '../services/project-service';
import {
  projectMilestoneStatusStyleMap,
  type ProjectMilestone,
  type ProjectMilestonePhase,
  type ProjectMilestoneStatus
} from '../types/project.types';
import type { ProjectDetailOutletContext } from './project-detail-page';

const sectionClass = 'rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#eceef0]';
const sectionTitleClass = 'mb-4 text-lg font-bold text-[#003c90]';

const PHASE_ORDER: ProjectMilestonePhase[] = [
  'Initiation',
  'Analysis',
  'Core Work',
  'QC',
  'Delivery'
];

const PHASE_TONE: Record<ProjectMilestonePhase, string> = {
  Initiation: 'bg-[#d5e3fc] text-[#003c90]',
  Analysis: 'bg-amber-100 text-[#a16207]',
  'Core Work': 'bg-[#003c90]/10 text-[#003c90]',
  QC: 'bg-[#4edea3]/30 text-[#004b31]',
  Delivery: 'bg-[#006544]/15 text-[#006544]'
};

const STATUS_OPTIONS: ProjectMilestoneStatus[] = ['Pending', 'In Progress', 'Done', 'Blocked'];

const formatDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const ProjectTimelinePage = () => {
  const { project, refresh } = useOutletContext<ProjectDetailOutletContext>();
  const { user, role } = useAuth();

  const [pendingMilestoneId, setPendingMilestoneId] = useState<string | null>(null);
  const [ratingTarget, setRatingTarget] = useState<ProjectMilestone | null>(null);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState<string | undefined>();
  const [openLogIds, setOpenLogIds] = useState<Set<string>>(new Set());

  // Backend mengembalikan pm.id & ownerId sebagai numeric user_id (string).
  // Bandingkan via String(user.id) — bug fix dari era mock yang pakai email.
  const userIdStr = user?.id != null ? String(user.id) : null;
  const isProjectPm = role === ROLES.PM && userIdStr !== null && project.pm?.id === userIdStr;
  const isOwnerOf = (milestone: ProjectMilestone) =>
    role === ROLES.CONSULTANT && userIdStr !== null && milestone.ownerId === userIdStr;
  const canUpdateStatus = (milestone: ProjectMilestone) =>
    isProjectPm || isOwnerOf(milestone);
  const canRate = (milestone: ProjectMilestone) =>
    isProjectPm && milestone.status === 'Done';

  // Weighted progress: Σ(weight × done) / Σ(weight) × 100. Aligned dengan KPI
  // Task Completion dimensi (Section 9.2 PRD).
  const { totalWeight, doneWeight, doneCount, totalCount, progressPct } = useMemo(() => {
    const totalWeight = project.milestones.reduce((sum, m) => sum + m.weight, 0);
    const doneWeight = project.milestones
      .filter((m) => m.status === 'Done')
      .reduce((sum, m) => sum + m.weight, 0);
    const doneCount = project.milestones.filter((m) => m.status === 'Done').length;
    const totalCount = project.milestones.length;
    const progressPct = totalWeight === 0 ? 0 : Math.round((doneWeight / totalWeight) * 100);
    return { totalWeight, doneWeight, doneCount, totalCount, progressPct };
  }, [project.milestones]);

  const grouped = useMemo(() => {
    const result: Record<string, ProjectMilestone[]> = {};
    PHASE_ORDER.forEach((phase) => {
      result[phase] = [];
    });
    result['Other'] = [];
    project.milestones.forEach((m) => {
      const key = m.phase ?? 'Other';
      (result[key] ?? result['Other']).push(m);
    });
    return result;
  }, [project.milestones]);

  const handleStatusChange = async (milestoneId: string, nextStatus: ProjectMilestoneStatus) => {
    if (!user) return;
    setPendingMilestoneId(milestoneId);
    try {
      await projectService.updateMilestoneStatus(
        project.id,
        milestoneId,
        nextStatus,
        { id: String(user.id ?? ''), name: user.name }
      );
      await refresh();
    } finally {
      setPendingMilestoneId(null);
    }
  };

  const handleRateSubmit = async (
    rating: 1 | 2 | 3 | 4 | 5,
    revisionCount: number,
    note?: string
  ) => {
    if (!user || !ratingTarget) return;
    setIsRatingSubmitting(true);
    setRatingError(undefined);
    try {
      await projectService.rateMilestone(
        project.id,
        ratingTarget.id,
        rating,
        revisionCount,
        { id: String(user.id ?? ''), name: user.name },
        note
      );
      await refresh();
      setRatingTarget(null);
    } catch (error) {
      setRatingError(error instanceof Error ? error.message : 'Gagal submit rating. Coba lagi.');
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  const toggleLog = (milestoneId: string) => {
    setOpenLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(milestoneId)) next.delete(milestoneId);
      else next.add(milestoneId);
      return next;
    });
  };

  const renderMilestoneCard = (milestone: ProjectMilestone) => {
    const isUpdating = pendingMilestoneId === milestone.id;
    const showActions = canUpdateStatus(milestone) || canRate(milestone);
    const isLogOpen = openLogIds.has(milestone.id);
    const hasLog = milestone.updateLog.length > 0;

    return (
      <li
        key={milestone.id}
        className="rounded-xl border border-[#eceef0] bg-white p-4 transition-colors hover:border-[#003c90]/30"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${projectMilestoneStatusStyleMap[milestone.status]}`}
              >
                {milestone.status}
              </span>
              <span className="inline-flex rounded-full bg-[#eceef0] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#434653]">
                Weight {milestone.weight}
              </span>
              {milestone.qualityRating && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#a16207]">
                  <Star className="h-3 w-3" fill="#a16207" strokeWidth={2.4} />
                  {milestone.qualityRating}/5
                  {milestone.revisionCount !== undefined && milestone.revisionCount > 0 && (
                    <span className="text-[#737784]">· {milestone.revisionCount} rev</span>
                  )}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm font-bold text-[#191c1e]">{milestone.title}</p>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[#434653]">
              <Calendar className="h-3.5 w-3.5 text-[#737784]" />
              Target: <span className="font-semibold">{formatDate(milestone.targetDate)}</span>
              <span className="text-[#737784]">· Owner: {milestone.ownerName}</span>
              {milestone.completedAt && (
                <span className="text-[#006544]">
                  · Done: {formatDate(milestone.completedAt)}
                </span>
              )}
            </p>
            {milestone.notes && (
              <p className="mt-2 rounded-lg border-l-2 border-[#003c90] bg-[#f2f4f6] px-3 py-2 text-xs italic text-[#434653]">
                {milestone.notes}
              </p>
            )}
          </div>

          {showActions && (
            <div className="flex shrink-0 flex-col items-stretch gap-2">
              {canUpdateStatus(milestone) && (
                <select
                  value={milestone.status}
                  onChange={(event) =>
                    handleStatusChange(milestone.id, event.target.value as ProjectMilestoneStatus)
                  }
                  disabled={isUpdating}
                  className="rounded-lg border border-[#c3c6d5] bg-white px-3 py-1.5 text-xs font-semibold text-[#191c1e] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20 disabled:opacity-50"
                  aria-label={`Change status of ${milestone.title}`}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              )}
              {canRate(milestone) && (
                <button
                  type="button"
                  onClick={() => setRatingTarget(milestone)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                  <Star className="h-3.5 w-3.5" />
                  {milestone.qualityRating ? 'Update Rating' : 'Rate Task'}
                </button>
              )}
            </div>
          )}
        </div>

        {hasLog && (
          <div className="mt-3 border-t border-[#f2f4f6] pt-3">
            <button
              type="button"
              onClick={() => toggleLog(milestone.id)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#737784] transition-colors hover:text-[#003c90]"
            >
              {isLogOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              <History className="h-3.5 w-3.5" />
              {milestone.updateLog.length} update{milestone.updateLog.length === 1 ? '' : 's'}
            </button>
            {isLogOpen && (
              <ol className="mt-2 space-y-2 border-l-2 border-[#eceef0] pl-4">
                {milestone.updateLog.map((entry, idx) => (
                  <li key={`${milestone.id}-log-${idx}`} className="text-xs text-[#434653]">
                    <p>
                      <span className="font-semibold">{entry.byName}</span>
                      <span className="text-[#737784]"> changed </span>
                      <span className="font-mono text-[10px] uppercase">{entry.fromStatus}</span>
                      <span className="text-[#737784]"> → </span>
                      <span className="font-mono text-[10px] uppercase">{entry.toStatus}</span>
                      <span className="text-[#737784]"> · {formatDateTime(entry.at)}</span>
                    </p>
                    {entry.note && (
                      <p className="mt-0.5 rounded-md bg-[#f2f4f6] px-2 py-1 italic text-[#434653]">“{entry.note}”</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-5">
      <section className={sectionClass}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className={sectionTitleClass}>Milestone Progress</h2>
          <p className="text-sm font-semibold text-[#737784]">
            <span className="text-[#191c1e]">
              {doneCount}/{totalCount}
            </span>{' '}
            milestones · weighted{' '}
            <span className="text-[#003c90]">{progressPct}%</span>{' '}
            <span className="text-[#737784]">({doneWeight}/{totalWeight} pts)</span>
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#eceef0]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#003c90] to-[#0f52ba] transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </section>

      {project.milestones.length === 0 ? (
        <section className={sectionClass}>
          <p className="rounded-lg bg-[#f2f4f6] px-4 py-3 text-sm italic text-[#737784]">
            Belum ada milestone. Akan dibuat saat project di-spawn dari TaskTemplate.
          </p>
        </section>
      ) : (
        <>
          {PHASE_ORDER.map((phase) => {
            const items = grouped[phase];
            if (!items || items.length === 0) return null;
            return (
              <section key={phase} className={sectionClass}>
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[#003c90]">{phase}</h2>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${PHASE_TONE[phase]}`}
                  >
                    {items.length} task{items.length === 1 ? '' : 's'}
                  </span>
                </div>
                <ul className="space-y-3">{items.map(renderMilestoneCard)}</ul>
              </section>
            );
          })}
          {grouped['Other'] && grouped['Other'].length > 0 && (
            <section className={sectionClass}>
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#003c90]">Other</h2>
                <span className="inline-flex rounded-full bg-[#eceef0] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#434653]">
                  {grouped['Other'].length} task{grouped['Other'].length === 1 ? '' : 's'}
                </span>
              </div>
              <ul className="space-y-3">{grouped['Other'].map(renderMilestoneCard)}</ul>
            </section>
          )}
        </>
      )}

      <RateTaskDialog
        open={ratingTarget !== null}
        milestone={ratingTarget}
        isSubmitting={isRatingSubmitting}
        errorMessage={ratingError}
        onClose={() => {
          if (!isRatingSubmitting) {
            setRatingTarget(null);
            setRatingError(undefined);
          }
        }}
        onSubmit={handleRateSubmit}
      />
    </div>
  );
};
