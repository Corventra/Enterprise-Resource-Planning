import { Check, Trash2, UserPlus, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogFooter,
  SidePanelDialogHeader
} from '../../../../components/ui/side-panel-dialog';
import { projectsApi, type ApiLookupUser } from '../../services/projects-api';
import type { ConsultantLevel, ProjectConsultant } from '../../types/project.types';

interface AssignConsultantDialogProps {
  open: boolean;
  projectCode: string;
  client: string;
  alreadyAssigned: ProjectConsultant[];
  /** Department project — kalau ada, dialog filter consultant per department.
   * Optional: kalau tidak ada, tampil semua consultant aktif. */
  departmentId?: string;
  departmentName?: string;
  isSubmitting?: boolean;
  errorMessage?: string;
  onClose: () => void;
  /**
   * Save callback: terima FINAL roster (existing + new, minus removed).
   * Caller harus pakai `setConsultants` (PUT) supaya backend sync diff.
   */
  onAssign: (consultants: ProjectConsultant[], note?: string) => Promise<void> | void;
}

const LEVELS: ConsultantLevel[] = ['Lead', 'Senior', 'Junior'];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

interface RosterEntry {
  id: string;
  name: string;
  email?: string;
  level: ConsultantLevel;
  /** True = sebelumnya sudah ter-assign di project. False = baru ditambah di sesi ini. */
  isExisting: boolean;
}

export const AssignConsultantDialog = ({
  open,
  projectCode,
  client,
  alreadyAssigned,
  departmentId,
  departmentName,
  isSubmitting = false,
  errorMessage,
  onClose,
  onAssign
}: AssignConsultantDialogProps) => {
  const [roster, setRoster] = useState<Map<string, RosterEntry>>(() => new Map());
  const [note, setNote] = useState('');
  const [pool, setPool] = useState<ApiLookupUser[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingPool, setIsLoadingPool] = useState(false);

  // Init roster dari alreadyAssigned setiap kali dialog dibuka.
  useEffect(() => {
    if (!open) {
      setNote('');
      setLoadError(null);
      return;
    }
    const initial = new Map<string, RosterEntry>();
    alreadyAssigned.forEach((c) => {
      initial.set(c.id, {
        id: c.id,
        name: c.name,
        level: c.level,
        isExisting: true
      });
    });
    setRoster(initial);

    let cancelled = false;
    setIsLoadingPool(true);
    setLoadError(null);
    projectsApi
      .listUsersByRole('CONSULTANT', departmentId ? { departmentId } : {})
      .then((users) => {
        if (cancelled) return;
        setPool(users);
        if (users.length === 0) {
          const ctx = departmentName ? ` di department "${departmentName}"` : '';
          setLoadError(`Tidak ada user dengan role CONSULTANT yang aktif${ctx}.`);
        }
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setLoadError(e.message || 'Gagal memuat daftar Consultant.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPool(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, departmentId, departmentName, alreadyAssigned]);

  const addConsultant = (user: ApiLookupUser) => {
    setRoster((prev) => {
      const next = new Map(prev);
      const idStr = String(user.id);
      next.set(idStr, {
        id: idStr,
        name: user.name,
        email: user.email,
        level: 'Senior',
        isExisting: false
      });
      return next;
    });
  };

  const removeConsultant = (id: string) => {
    setRoster((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  const setLevel = (id: string, level: ConsultantLevel) => {
    setRoster((prev) => {
      const next = new Map(prev);
      const entry = next.get(id);
      if (entry) next.set(id, { ...entry, level });
      return next;
    });
  };

  const rosterList = useMemo(() => Array.from(roster.values()), [roster]);
  const available = useMemo(
    () => pool.filter((c) => !roster.has(String(c.id))),
    [pool, roster]
  );

  // Compute apakah ada perubahan dari initial state (deteksi dirty)
  const hasChanges = useMemo(() => {
    if (rosterList.length !== alreadyAssigned.length) return true;
    const existingMap = new Map(alreadyAssigned.map((c) => [c.id, c.level]));
    for (const r of rosterList) {
      if (!existingMap.has(r.id)) return true;
      if (existingMap.get(r.id) !== r.level) return true;
    }
    return false;
  }, [rosterList, alreadyAssigned]);

  const handleSubmit = async () => {
    if (isSubmitting || !hasChanges) return;
    const payload: ProjectConsultant[] = rosterList.map((r) => ({
      id: r.id,
      name: r.name,
      level: r.level
    }));
    await onAssign(payload, note.trim() || undefined);
  };

  return (
    <SidePanelDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <SidePanelDialogHeader
        title="Manage Consultants"
        description={`Atur consultant + level di project ${projectCode}.`}
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
            {departmentName && (
              <p className="mt-3 text-xs text-[#434653]">
                Filter aktif: hanya menampilkan consultant department{' '}
                <span className="font-semibold text-[#003c90]">{departmentName}</span>.
              </p>
            )}
          </div>

          {/* Current roster section */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#737784]">
              Roster saat ini ({rosterList.length})
            </p>
            {rosterList.length === 0 ? (
              <p className="rounded-lg bg-[#f2f4f6] px-4 py-3 text-sm italic text-[#737784]">
                Belum ada consultant. Tambah dari list di bawah.
              </p>
            ) : (
              <ul className="space-y-2">
                {rosterList.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl border-2 border-[#003c90]/30 bg-[#d5e3fc]/30 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0f52ba] text-xs font-bold text-white">
                        {initials(r.name)}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#191c1e]">{r.name}</p>
                        {r.email && <p className="text-xs text-[#737784]">{r.email}</p>}
                      </div>
                      {!r.isExisting && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                          baru
                        </span>
                      )}
                      <select
                        value={r.level}
                        onChange={(event) => setLevel(r.id, event.target.value as ConsultantLevel)}
                        className="rounded-lg border border-[#c3c6d5] bg-white px-2 py-1.5 text-xs font-semibold text-[#434653] focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20"
                        aria-label={`Level for ${r.name}`}
                      >
                        {LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeConsultant(r.id)}
                        className="rounded-lg p-1.5 text-[#c2410c] transition-colors hover:bg-orange-50"
                        aria-label={`Remove ${r.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Add more section */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#737784]">
              Tambah consultant
            </p>
            {isLoadingPool ? (
              <p className="text-sm text-[#737784]">Memuat daftar Consultant...</p>
            ) : available.length === 0 ? (
              <p className="rounded-lg bg-[#f2f4f6] px-4 py-3 text-sm italic text-[#737784]">
                {pool.length === 0
                  ? 'Belum ada user dengan role Consultant aktif.'
                  : 'Semua consultant yang tersedia sudah ada di roster.'}
              </p>
            ) : (
              <ul className="space-y-2">
                {available.map((consultant) => (
                  <li
                    key={consultant.id}
                    className="rounded-xl border-2 border-[#eceef0] bg-white p-3 transition-colors hover:border-[#003c90]/40 hover:bg-[#f2f4f6]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eceef0] text-xs font-bold text-[#737784]">
                        {initials(consultant.name)}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#191c1e]">{consultant.name}</p>
                        <p className="text-xs text-[#737784]">{consultant.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addConsultant(consultant)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#003c90]/30 bg-[#003c90]/5 px-3 py-1.5 text-xs font-semibold text-[#003c90] transition-colors hover:bg-[#003c90]/10"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Tambah
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {loadError && !isLoadingPool && (
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
              placeholder="Mis. perubahan level, alasan remove, dsb..."
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
            disabled={!hasChanges || isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-5 py-2 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {isSubmitting ? 'Saving...' : 'Save Roster'}
          </button>
        </div>
      </SidePanelDialogFooter>
    </SidePanelDialog>
  );
};
