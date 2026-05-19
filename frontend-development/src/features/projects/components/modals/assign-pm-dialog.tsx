import { Briefcase, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogFooter,
  SidePanelDialogHeader
} from '../../../../components/ui/side-panel-dialog';
import { projectsApi, type ApiLookupUser } from '../../services/projects-api';
import type { ProjectAssignee } from '../../types/project.types';

interface AssignPMDialogProps {
  open: boolean;
  handoverDocCode: string;
  client: string;
  isSubmitting?: boolean;
  errorMessage?: string;
  onClose: () => void;
  onAssign: (pm: ProjectAssignee, note?: string) => Promise<void> | void;
}

export const AssignPMDialog = ({
  open,
  handoverDocCode,
  client,
  isSubmitting = false,
  errorMessage,
  onClose,
  onAssign
}: AssignPMDialogProps) => {
  const [selectedPmId, setSelectedPmId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [pmList, setPmList] = useState<ApiLookupUser[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingPMs, setIsLoadingPMs] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedPmId(null);
      setNote('');
      setLoadError(null);
      return;
    }
    let cancelled = false;
    setIsLoadingPMs(true);
    setLoadError(null);
    projectsApi
      .listUsersByRole('PM')
      .then((users) => {
        if (cancelled) return;
        setPmList(users);
        if (users.length === 0) {
          setLoadError('Tidak ada user dengan role PM yang aktif di database.');
        }
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setLoadError(e.message || 'Gagal memuat daftar PM.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPMs(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedPm = pmList.find((pm) => String(pm.id) === selectedPmId) ?? null;

  const handleSubmit = async () => {
    if (!selectedPm || isSubmitting) return;
    const assignee: ProjectAssignee = { id: String(selectedPm.id), name: selectedPm.name };
    await onAssign(assignee, note.trim() || undefined);
  };

  return (
    <SidePanelDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <SidePanelDialogHeader
        title="Assign Project Manager"
        description={`Convert ${handoverDocCode} ke Project dan assign PM untuk eksekusi.`}
      />
      <SidePanelDialogBody>
        <div className="space-y-5">
          <div className="rounded-xl border border-[#003c90]/15 bg-[#d5e3fc]/40 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#003c90]/10">
                <Briefcase className="h-5 w-5 text-[#003c90]" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#737784]">Source Handover</p>
                <p className="text-sm font-bold text-[#191c1e]">{client}</p>
                <p className="font-mono text-xs text-[#003c90]">{handoverDocCode}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#737784]">
              Pilih Project Manager
            </p>
            {isLoadingPMs ? (
              <p className="text-sm text-[#737784]">Memuat daftar PM...</p>
            ) : pmList.length === 0 ? (
              <p className="text-sm text-[#737784]">Belum ada user dengan role PM aktif.</p>
            ) : (
              <ul className="space-y-2">
                {pmList.map((pm) => {
                  const pmIdStr = String(pm.id);
                  const isActive = pmIdStr === selectedPmId;
                  return (
                    <li key={pm.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedPmId(pmIdStr)}
                        className={
                          isActive
                            ? 'flex w-full items-center gap-3 rounded-xl border-2 border-[#003c90] bg-[#d5e3fc]/40 p-3 text-left transition-colors'
                            : 'flex w-full items-center gap-3 rounded-xl border-2 border-[#eceef0] bg-white p-3 text-left transition-colors hover:border-[#003c90]/40 hover:bg-[#f2f4f6]'
                        }
                      >
                        <span
                          className={
                            isActive
                              ? 'flex h-9 w-9 items-center justify-center rounded-full bg-[#003c90] text-xs font-bold text-white'
                              : 'flex h-9 w-9 items-center justify-center rounded-full bg-[#eceef0] text-xs font-bold text-[#737784]'
                          }
                        >
                          {pm.name
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((p) => p[0]?.toUpperCase())
                            .join('')}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-[#191c1e]">{pm.name}</p>
                          <p className="text-xs text-[#737784]">{pm.email}</p>
                        </div>
                        {isActive && <UserCheck className="h-5 w-5 text-[#003c90]" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {loadError && !isLoadingPMs && (
              <p className="mt-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-[#c2410c]">
                {loadError}
              </p>
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
              placeholder="Mis. prioritas tinggi, fokus phase-1 pre-Maret..."
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
            disabled={!selectedPm || isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-5 py-2 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserCheck className="h-4 w-4" />
            {isSubmitting ? 'Assigning...' : 'Assign & Create Project'}
          </button>
        </div>
      </SidePanelDialogFooter>
    </SidePanelDialog>
  );
};
