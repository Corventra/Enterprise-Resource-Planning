import type { Submission } from '../../types/campaign.types';

interface SubmissionsTableProps {
  submissions: Submission[];
  onViewSubmission: (submission: Submission) => void;
}

export const SubmissionsTable = ({ submissions, onViewSubmission }: SubmissionsTableProps) => {
  if (submissions.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
        No submissions found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Company
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Submitted At
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {submissions.map((submission) => (
              <tr key={submission.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{submission.customerName}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{submission.company}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{submission.email}</td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {new Date(submission.submittedAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onViewSubmission(submission)}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    View Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
