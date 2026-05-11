import type { FormSubmissionListItem } from '../../../forms/types/form-submissions.types';
import { formatSubmissionSourceLabel } from '../../../forms/utils/submission-source-label';

interface SubmissionsTableProps {
  submissions: FormSubmissionListItem[];
  onViewSubmission: (submissionId: number) => void;
}

const formatSubmittedAt = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const SubmissionsTable = ({ submissions, onViewSubmission }: SubmissionsTableProps) => {
  if (submissions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#c3c6d5] bg-[#f7f9fb]/50 px-4 py-10 text-center text-sm text-[#737784]">
        Belum ada submission untuk form ini.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.map((submission) => {
        const source = formatSubmissionSourceLabel(submission);
        return (
          <article
            key={submission.submission_id}
            className="rounded-xl border border-[#eceef0] bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <h4 className="text-sm font-bold text-[#191c1e] sm:text-base">
                  Respons ke-{submission.response_number}
                </h4>
                <p className="text-sm leading-relaxed text-[#434653]">“{submission.summary_text}”</p>
                <p className="text-xs text-[#737784] sm:text-sm">
                  {source}
                  <span className="mx-1.5 text-[#c3c6d5]">•</span>
                  {formatSubmittedAt(submission.submitted_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onViewSubmission(submission.submission_id)}
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-[#c3c6d5] bg-white px-3 py-2 text-xs font-semibold text-[#434653] hover:bg-[#f7f9fb] sm:text-sm"
              >
                View
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
};
