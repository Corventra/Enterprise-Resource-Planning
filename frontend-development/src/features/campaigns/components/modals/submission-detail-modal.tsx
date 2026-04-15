import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogHeader
} from '../../../../components/ui/side-panel-dialog';
import type { Submission } from '../../types/campaign.types';

interface SubmissionDetailModalProps {
  open: boolean;
  submission?: Submission;
  onClose: () => void;
}

const submissionStatusClassMap: Record<Submission['status'], string> = {
  New: 'border-sky-200 bg-sky-50 text-sky-700',
  Qualified: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Rejected: 'border-rose-200 bg-rose-50 text-rose-700'
};

export const SubmissionDetailModal = ({ open, submission, onClose }: SubmissionDetailModalProps) => {
  if (!submission) {
    return null;
  }

  return (
    <SidePanelDialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SidePanelDialogHeader
        title="Submission Detail"
        description="Read-only submission information captured from campaign forms."
      />
      <SidePanelDialogBody>
        <div className="space-y-5 text-sm">
          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Contact Information</h3>
            </div>
            <div className="grid gap-3 px-4 py-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Name</p>
                <p className="mt-1 font-medium text-slate-800">{submission.customerName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Company</p>
                <p className="mt-1 font-medium text-slate-800">{submission.company}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
                <p className="mt-1 font-medium text-slate-800">{submission.email}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Phone</p>
                <p className="mt-1 font-medium text-slate-800">{submission.phone}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                <span
                  className={`mt-1 inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${
                    submissionStatusClassMap[submission.status]
                  }`}
                >
                  {submission.status}
                </span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Submitted At</p>
                <p className="mt-1 font-medium text-slate-800">
                  {new Date(submission.submittedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </section>

          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Answers</h3>
            </div>
            <ul className="divide-y divide-slate-100">
              {Object.entries(submission.answers).map(([key, value]) => (
                <li key={key} className="grid grid-cols-3 gap-2 px-4 py-3">
                  <span className="text-xs uppercase tracking-wide text-slate-500">{key}</span>
                  <span className="col-span-2 font-medium text-slate-800">{value}</span>
                </li>
              ))}
              {Object.keys(submission.answers).length === 0 && (
                <li className="px-4 py-4 text-sm text-slate-500">No answers recorded.</li>
              )}
            </ul>
          </div>
        </div>
      </SidePanelDialogBody>
    </SidePanelDialog>
  );
};
