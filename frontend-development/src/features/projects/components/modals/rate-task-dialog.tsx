import { Minus, Plus, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogFooter,
  SidePanelDialogHeader
} from '../../../../components/ui/side-panel-dialog';
import type { ProjectMilestone } from '../../types/project.types';

interface RateTaskDialogProps {
  open: boolean;
  milestone: ProjectMilestone | null;
  isSubmitting?: boolean;
  errorMessage?: string;
  onClose: () => void;
  onSubmit: (rating: 1 | 2 | 3 | 4 | 5, revisionCount: number, note?: string) => Promise<void> | void;
}

const RATING_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Poor',
  2: 'Below Expectation',
  3: 'Meets Expectation',
  4: 'Exceeds Expectation',
  5: 'Excellent'
};

export const RateTaskDialog = ({
  open,
  milestone,
  isSubmitting = false,
  errorMessage,
  onClose,
  onSubmit
}: RateTaskDialogProps) => {
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [revisionCount, setRevisionCount] = useState(0);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open && milestone) {
      setRating((milestone.qualityRating as 1 | 2 | 3 | 4 | 5 | undefined) ?? null);
      setRevisionCount(milestone.revisionCount ?? 0);
      setNote('');
    }
    if (!open) {
      setRating(null);
      setRevisionCount(0);
      setNote('');
    }
  }, [open, milestone]);

  const handleSubmit = async () => {
    if (!rating || isSubmitting) return;
    await onSubmit(rating, revisionCount, note.trim() || undefined);
  };

  return (
    <SidePanelDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <SidePanelDialogHeader
        title="Rate Task Quality"
        description={
          milestone
            ? `Beri rating untuk task "${milestone.title}" — feeds dimensi Output Quality KPI.`
            : 'Beri rating quality.'
        }
      />
      <SidePanelDialogBody>
        <div className="space-y-5">
          {milestone && (
            <div className="rounded-xl border border-[#003c90]/15 bg-[#d5e3fc]/40 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#737784]">Task</p>
              <p className="text-sm font-bold text-[#191c1e]">{milestone.title}</p>
              <p className="mt-1 text-xs text-[#737784]">
                Owner: {milestone.ownerName}
                {milestone.completedAt && (
                  <>
                    {' · Completed: '}
                    {new Date(milestone.completedAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </>
                )}
              </p>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#737784]">
              Quality Rating <span className="text-[#c2410c]">*</span>
            </p>
            <div className="flex items-center gap-2">
              {([1, 2, 3, 4, 5] as const).map((value) => {
                const isActive = rating !== null && value <= rating;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    aria-label={`Rate ${value} of 5`}
                    className={
                      isActive
                        ? 'flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-[#a16207] transition-colors hover:bg-amber-200'
                        : 'flex h-12 w-12 items-center justify-center rounded-lg border border-[#eceef0] bg-white text-[#c3c6d5] transition-colors hover:border-[#a16207]/40 hover:text-[#a16207]'
                    }
                  >
                    <Star className="h-6 w-6" fill={isActive ? '#a16207' : 'none'} strokeWidth={2} />
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs font-medium text-[#434653]">
              {rating ? `${rating}/5 — ${RATING_LABELS[rating]}` : 'Belum dipilih'}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#737784]">
              Revision Count
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRevisionCount((prev) => Math.max(0, prev - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#c3c6d5] bg-white text-[#191c1e] hover:bg-[#f2f4f6]"
                aria-label="Decrement revision count"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                value={revisionCount}
                onChange={(event) => setRevisionCount(Math.max(0, Number(event.target.value) || 0))}
                min={0}
                className="h-9 w-16 rounded-lg border border-[#c3c6d5] bg-white px-2 text-center text-sm font-bold text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20"
              />
              <button
                type="button"
                onClick={() => setRevisionCount((prev) => prev + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#c3c6d5] bg-white text-[#191c1e] hover:bg-[#f2f4f6]"
                aria-label="Increment revision count"
              >
                <Plus className="h-4 w-4" />
              </button>
              <span className="text-xs text-[#737784]">Berapa kali task ini di-revisi sebelum approve.</span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#737784]">
              Comment (opsional)
            </label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="Catatan kualitas, observation, atau feedback untuk consultant..."
              className="w-full rounded-lg border border-[#eceef0] bg-white px-3 py-2 text-sm text-[#191c1e] shadow-sm placeholder:text-[#737784]/70 focus:border-[#003c90]/40 focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20"
            />
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-[#c2410c]">
              {errorMessage}
            </div>
          )}
        </div>
      </SidePanelDialogBody>
      <SidePanelDialogFooter>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-[#c3c6d5] bg-white px-4 py-2 text-sm font-semibold text-[#191c1e] transition-colors hover:bg-[#f2f4f6] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!rating || isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-5 py-2 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Star className="h-4 w-4" />
            {isSubmitting ? 'Saving...' : 'Submit Rating'}
          </button>
        </div>
      </SidePanelDialogFooter>
    </SidePanelDialog>
  );
};
