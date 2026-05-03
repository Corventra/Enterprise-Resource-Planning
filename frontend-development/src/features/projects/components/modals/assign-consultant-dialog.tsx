import { Check, UserPlus, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogFooter,
  SidePanelDialogHeader
} from '../../../../components/ui/side-panel-dialog';
import { consultantPool } from '../../mocks/consultant-pool.mock';
import type { ConsultantLevel, ProjectAssignee, ProjectConsultant } from '../../types/project.types';

interface AssignConsultantDialogProps {
  open: boolean;
  projectCode: string;
  client: string;
  alreadyAssigned: ProjectConsultant[];
  isSubmitting?: boolean;
  errorMessage?: string;
  onClose: () => void;
  onAssign: (consultants: ProjectConsultant[], note?: string) => Promise<void> | void;
}

interface SelectionState {
  [consultantId: string]: ConsultantLevel;
}

const LEVELS: ConsultantLevel[] = ['Lead', 'Senior', 'Junior'];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export const AssignConsultantDialog = ({
  open,
  projectCode,
  client,
  alreadyAssigned,
  isSubmitting = false,
  errorMessage,
  onClose,
  onAssign
}: AssignConsultantDialogProps) => {
  const [selection, setSelection] = useState<SelectionState>({});
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) {
      setSelection({});
      setNote('');
    }
  }, [open]);

  const assignedIds = useMemo(() => new Set(alreadyAssigned.map((c) => c.id)), [alreadyAssigned]);
  const available = useMemo(
    () => consultantPool.filter((c) => !assignedIds.has(c.id)),
    [assignedIds]
  );

  const toggle = (consultant: ProjectAssignee) => {
    setSelection((prev) => {
      if (prev[consultant.id]) {
        const { [consultant.id]: _omit, ...rest } = prev;
        return rest;
      }
      return { ...prev, [consultant.id]: 'Senior' };
    });
  };

  const setLevel = (id: string, level: ConsultantLevel) => {
    setSelection((prev) => ({ ...prev, [id]: level }));
  };

  const selectedCount = Object.keys(selection).length;

  const handleSubmit = async () => {
    if (selectedCount === 0 || isSubmitting) return;
    const payload: ProjectConsultant[] = Object.entries(selection).map(([id, level]) => {
      const source = consultantPool.find((c) => c.id === id);
      return { id, name: source?.name ?? id, level };
    });
    await onAssign(payload, note.trim() || undefined);
  };

  return (
    <SidePanelDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <SidePanelDialogHeader
        title="Assign Consultant"
        description={`Tambahkan consultant ke project ${projectCode}.`}
      />
      <SidePanelDialogBody>
        <div className="space-y-5">
          <div className="rounded-xl border border-[#003c90]/15 bg-[#d5e3fc]/40 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#003c90]/10">
                <Users className="h-5 w-5 text-[#003c90]" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#737784]">Project</p>
                <p className="text-sm font-bold text-[#191c1e]">{client}</p>
                <p className="font-mono text-xs text-[#003c90]">{projectCode}</p>
              </div>
            </div>
          </div>

          {alreadyAssigned.length > 0 && (
            <div className="rounded-xl border border-[#eceef0] bg-[#f2f4f6] p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#737784]">
                Sudah ter-assign ({alreadyAssigned.length})
              </p>
              <p className="mt-1 text-xs text-[#434653]">
                {alreadyAssigned.map((c) => `${c.name} (${c.level})`).join(' · ')}
              </p>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#737784]">
              Pilih consultant ({selectedCount} dipilih)
            </p>
            {available.length === 0 ? (
              <p className="rounded-lg bg-[#f2f4f6] px-4 py-3 text-sm italic text-[#737784]">
                Semua consultant di pool sudah ter-assign ke project ini.
              </p>
            ) : (
              <ul className="space-y-2">
                {available.map((consultant) => {
                  const selectedLevel = selection[consultant.id];
                  const isSelected = Boolean(selectedLevel);
                  return (
                    <li
                      key={consultant.id}
                      className={
                        isSelected
                          ? 'rounded-xl border-2 border-[#003c90] bg-[#d5e3fc]/40 p-3 transition-colors'
                          : 'rounded-xl border-2 border-[#eceef0] bg-white p-3 transition-colors hover:border-[#003c90]/40 hover:bg-[#f2f4f6]'
                      }
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggle(consultant)}
                          className={
                            isSelected
                              ? 'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-[#003c90] bg-[#003c90] text-white'
                              : 'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-[#c3c6d5] bg-white'
                          }
                          aria-pressed={isSelected}
                          aria-label={`Toggle ${consultant.name}`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                        </button>
                        <span
                          className={
                            isSelected
                              ? 'flex h-9 w-9 items-center justify-center rounded-full bg-[#0f52ba] text-xs font-bold text-white'
                              : 'flex h-9 w-9 items-center justify-center rounded-full bg-[#eceef0] text-xs font-bold text-[#737784]'
                          }
                        >
                          {initials(consultant.name)}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-[#191c1e]">{consultant.name}</p>
                          <p className="text-xs text-[#737784]">{consultant.id}</p>
                        </div>
                        {isSelected && (
                          <select
                            value={selectedLevel}
                            onChange={(event) =>
                              setLevel(consultant.id, event.target.value as ConsultantLevel)
                            }
                            className="rounded-lg border border-[#c3c6d5] bg-white px-2 py-1.5 text-xs font-semibold text-[#434653] focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20"
                            aria-label={`Level for ${consultant.name}`}
                          >
                            {LEVELS.map((level) => (
                              <option key={level} value={level}>
                                {level}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#737784]">
              Catatan (opsional)
            </label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="Mis. focus area per consultant, urgensi, dsb..."
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
            disabled={selectedCount === 0 || isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-5 py-2 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {isSubmitting ? 'Assigning...' : `Assign (${selectedCount})`}
          </button>
        </div>
      </SidePanelDialogFooter>
    </SidePanelDialog>
  );
};
