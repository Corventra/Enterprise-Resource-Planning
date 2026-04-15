import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { Form } from '../../types/campaign.types';

interface FormsTabProps {
  forms: Form[];
  onDeleteForm: (form: Form) => void;
  onToggleStatus: (form: Form) => void;
  onCreateForm: () => void;
}

export const FormsTab = ({ forms, onDeleteForm, onToggleStatus, onCreateForm }: FormsTabProps) => {
  return (
    <section className="pt-5">
      <div className="mb-4 flex items-center justify-between rounded-lg bg-white">
        <h3 className="text-sm font-semibold text-slate-900">Campaign Form</h3>
        <button
          type="button"
          onClick={onCreateForm}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          Create Form
        </button>
      </div>

      {forms.length === 0 ? (
        <div className="py-6 text-sm text-slate-500">No forms registered in this campaign.</div>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {forms.map((form) => (
            <li key={form.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">{form.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Published {form.publishedAt} - {form.submissionCount} submissions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md border px-2 py-1 text-xs font-medium ${
                    form.status === 'Active'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-slate-100 text-slate-700'
                  }`}
                >
                  {form.status}
                </span>
                <button
                  type="button"
                  onClick={() => onToggleStatus(form)}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Toggle Status
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteForm(form)}
                  className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
