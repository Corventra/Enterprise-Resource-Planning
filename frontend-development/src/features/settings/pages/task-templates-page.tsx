import { ArrowLeft, Lock, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { PERMISSIONS, ROLE_LABELS } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import { taskTemplateService } from '../../projects/services/task-template-service';
import type {
  ProjectMilestonePhase,
  ProjectServiceLine,
  TaskTemplate,
  TaskTemplateTask
} from '../../projects/types/project.types';

const sectionClass = 'rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#eceef0]';
const sectionTitleClass = 'mb-3 text-lg font-bold text-[#003c90]';
const inputClass =
  'w-full rounded-lg border border-[#c3c6d5] bg-white px-3 py-1.5 text-sm text-[#191c1e] focus:border-[#003c90]/40 focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20 disabled:bg-[#f2f4f6] disabled:text-[#737784]';

const PHASE_OPTIONS: ProjectMilestonePhase[] = [
  'Initiation',
  'Analysis',
  'Core Work',
  'QC',
  'Delivery'
];

const SERVICE_LINES: ProjectServiceLine[] = ['Transfer Pricing', 'Tax', 'Advisory', 'Audit'];

export const TaskTemplatesPage = () => {
  const navigate = useNavigate();
  const { role, user, can } = useAuth();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [activeServiceLine, setActiveServiceLine] = useState<ProjectServiceLine>('Transfer Pricing');
  const [draft, setDraft] = useState<TaskTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const canEdit = can(PERMISSIONS.TASK_TEMPLATE_MANAGE);

  useEffect(() => {
    void (async () => {
      const all = await taskTemplateService.getAll();
      setTemplates(all);
    })();
  }, []);

  // When activeServiceLine or templates change, refresh draft
  useEffect(() => {
    const found = templates.find((t) => t.serviceLine === activeServiceLine && t.isDefault);
    setDraft(found ? (JSON.parse(JSON.stringify(found)) as TaskTemplate) : null);
    setFeedback(null);
  }, [activeServiceLine, templates]);

  const totalWeight = useMemo(() => {
    if (!draft) return 0;
    return draft.tasks.reduce((sum, t) => sum + (Number(t.weight) || 0), 0);
  }, [draft]);

  const isWeightValid = totalWeight === 100;

  const updateTask = (index: number, patch: Partial<TaskTemplateTask>) => {
    if (!draft) return;
    const next = [...draft.tasks];
    next[index] = { ...next[index], ...patch };
    setDraft({ ...draft, tasks: next });
  };

  const removeTask = (index: number) => {
    if (!draft) return;
    setDraft({ ...draft, tasks: draft.tasks.filter((_, i) => i !== index) });
  };

  const addTask = () => {
    if (!draft) return;
    setDraft({
      ...draft,
      tasks: [
        ...draft.tasks,
        { title: 'New Task', weight: 0, phase: 'Core Work', expectedDurationDays: 5 }
      ]
    });
  };

  const handleSave = async () => {
    if (!draft || !user || !role || !canEdit) return;
    if (!isWeightValid) {
      setFeedback({ kind: 'error', message: `Total weight harus 100 (saat ini ${totalWeight}).` });
      return;
    }
    if (draft.tasks.some((t) => !t.title.trim())) {
      setFeedback({ kind: 'error', message: 'Semua task wajib punya title.' });
      return;
    }
    setIsSaving(true);
    setFeedback(null);
    try {
      // Backend pakai req.user dari JWT, actor.id di-pass untuk kompat lama.
      // Numeric user.id, bukan email (fix dari bug era mock).
      const saved = await taskTemplateService.update(draft, {
        id: String(user.id ?? ''),
        name: user.name,
        role
      });
      setTemplates((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
      setFeedback({ kind: 'success', message: `Template ${saved.name} tersimpan.` });
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Gagal menyimpan. Coba lagi.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col items-start gap-2">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="group inline-flex items-center text-xs font-medium text-[#434653] transition-colors hover:text-[#003c90] sm:text-sm"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 sm:h-4 sm:w-4" />
          Back to Settings
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3 w-full">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Task Templates</h1>
            <p className="mt-1 text-sm text-slate-500">
              Default task list per Service Line — di-clone otomatis saat COO assign PM ke handover.
              Collaborative CEO + COO.
            </p>
          </div>
          {!canEdit && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eceef0] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#434653]">
              <Lock className="h-3.5 w-3.5" />
              View-only ({role && ROLE_LABELS[role]})
            </span>
          )}
        </div>
      </header>

      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Service Line</h2>
        <div className="flex flex-wrap gap-2">
          {SERVICE_LINES.map((sl) => {
            const isActive = activeServiceLine === sl;
            return (
              <button
                key={sl}
                type="button"
                onClick={() => setActiveServiceLine(sl)}
                className={
                  isActive
                    ? 'rounded-lg bg-[#003c90] px-4 py-2 text-sm font-bold text-white shadow-sm'
                    : 'rounded-lg border border-[#c3c6d5] bg-white px-4 py-2 text-sm font-semibold text-[#434653] transition-colors hover:border-[#003c90]/40 hover:text-[#003c90]'
                }
              >
                {sl}
              </button>
            );
          })}
        </div>
      </section>

      {!draft ? (
        <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
          Tidak ada default template untuk service line {activeServiceLine}. Akan dibuatkan saat ada
          handover service line tersebut di-assign PM.
        </div>
      ) : (
        <>
          <section className={sectionClass}>
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className={sectionTitleClass}>{draft.name}</h2>
                <p className="text-[11px] text-[#737784]">
                  {draft.tasks.length} task{draft.tasks.length === 1 ? '' : 's'} · ID: {draft.id}
                </p>
              </div>
              <p
                className={`text-sm font-bold ${
                  isWeightValid ? 'text-[#006544]' : 'text-[#c2410c]'
                }`}
              >
                Total weight: {totalWeight}{' '}
                <span className="text-[#737784]">{isWeightValid ? '· OK' : '· harus 100'}</span>
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#eceef0]">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#eceef0]">
                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#737784]">
                        #
                      </th>
                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#737784]">
                        Title
                      </th>
                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#737784]">
                        Weight
                      </th>
                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#737784]">
                        Phase
                      </th>
                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#737784]">
                        Duration (days)
                      </th>
                      {canEdit && <th className="px-3 py-2"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eceef0] bg-white">
                    {draft.tasks.map((task, idx) => (
                      <tr key={`task-${idx}`}>
                        <td className="px-3 py-2 text-xs font-bold text-[#737784]">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={task.title}
                            onChange={(event) => updateTask(idx, { title: event.target.value })}
                            disabled={!canEdit}
                            className={inputClass}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={task.weight}
                            onChange={(event) =>
                              updateTask(idx, { weight: Number(event.target.value) || 0 })
                            }
                            disabled={!canEdit}
                            className={`${inputClass} max-w-[80px]`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={task.phase ?? ''}
                            onChange={(event) =>
                              updateTask(idx, {
                                phase: (event.target.value || undefined) as ProjectMilestonePhase | undefined
                              })
                            }
                            disabled={!canEdit}
                            className={inputClass}
                          >
                            <option value="">—</option>
                            {PHASE_OPTIONS.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={1}
                            value={task.expectedDurationDays}
                            onChange={(event) =>
                              updateTask(idx, {
                                expectedDurationDays: Math.max(1, Number(event.target.value) || 1)
                              })
                            }
                            disabled={!canEdit}
                            className={`${inputClass} max-w-[100px]`}
                          />
                        </td>
                        {canEdit && (
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => removeTask(idx)}
                              className="inline-flex items-center justify-center rounded-md p-1.5 text-[#c2410c] transition-colors hover:bg-orange-100"
                              aria-label={`Remove task ${idx + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {canEdit && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={addTask}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#c3c6d5] bg-white px-3 py-1.5 text-xs font-semibold text-[#003c90] transition-colors hover:bg-[#f2f4f6]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Task
                </button>
              </div>
            )}
          </section>

          {feedback && (
            <div
              className={
                feedback.kind === 'success'
                  ? 'rounded-lg border border-[#006544]/30 bg-[#4edea3]/15 px-4 py-3 text-sm text-[#004b31]'
                  : 'rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-[#c2410c]'
              }
            >
              {feedback.message}
            </div>
          )}

          {canEdit && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const found = templates.find(
                    (t) => t.serviceLine === activeServiceLine && t.isDefault
                  );
                  if (found) setDraft(JSON.parse(JSON.stringify(found)) as TaskTemplate);
                }}
                className="rounded-lg border border-[#c3c6d5] bg-white px-4 py-2 text-sm font-semibold text-[#191c1e] transition-colors hover:bg-[#f2f4f6]"
              >
                Discard Changes
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!isWeightValid || isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-5 py-2 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
