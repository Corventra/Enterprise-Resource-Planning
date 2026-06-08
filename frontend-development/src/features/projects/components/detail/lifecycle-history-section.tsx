import { Bot, History, ListTree, Sparkles, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { projectsApi, type ApiAuditTrailEntry } from '../../services/projects-api';
import type {
  ProjectMilestoneStatus,
  ProjectStatus
} from '../../types/project.types';
import {
  projectMilestoneStatusStyleMap,
  projectStatusStyleMap
} from '../../types/project.types';

const sectionClass = 'rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#eceef0]';
const sectionTitleClass = 'text-lg font-bold text-[#003c90]';

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

const isProjectStatus = (s: string | null): s is ProjectStatus =>
  s === 'Awaiting Consultant' ||
  s === 'In Progress' ||
  s === 'On Hold' ||
  s === 'Completed' ||
  s === 'Cancelled';

const isMilestoneStatus = (s: string | null): s is ProjectMilestoneStatus =>
  s === 'Pending' || s === 'In Progress' || s === 'Done' || s === 'Blocked';

const renderStatusChip = (status: string | null, entityType: 'project' | 'milestone') => {
  if (status === null) {
    return (
      <span className="inline-flex items-center rounded-full bg-[#eceef0] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#737784]">
        (creation)
      </span>
    );
  }
  let cls = 'bg-[#eceef0] text-[#434653]';
  if (entityType === 'project' && isProjectStatus(status)) {
    cls = projectStatusStyleMap[status];
  } else if (entityType === 'milestone' && isMilestoneStatus(status)) {
    cls = projectMilestoneStatusStyleMap[status];
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cls}`}
    >
      {status}
    </span>
  );
};

interface LifecycleHistorySectionProps {
  projectId: string;
}

/**
 * Render WFMS combined audit trail (project + milestone transitions) sebagai
 * timeline vertikal. Setiap event menampilkan:
 *   - Entity type (project / milestone <title>)
 *   - Status transition (from → to badge)
 *   - Aktor (user nama atau "System" untuk SYSTEM-triggered events)
 *   - Timestamp presisi menit
 *   - Reason / note (jika ada)
 *
 * Lihat WFMS PRD bagian 6.1 (SOP) dan 7.3 (Audit & Akuntabilitas).
 */
export const LifecycleHistorySection = ({ projectId }: LifecycleHistorySectionProps) => {
  const [entries, setEntries] = useState<ApiAuditTrailEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    projectsApi
      .getAuditTrail(projectId)
      .then((rows) => {
        if (!cancelled) {
          setEntries(rows);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Gagal memuat lifecycle history.');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return (
    <section className={sectionClass}>
      <div className="mb-4 flex items-center gap-2">
        <ListTree className="h-5 w-5 text-[#003c90]" />
        <h2 className={sectionTitleClass}>Lifecycle History (WFMS Audit Trail)</h2>
      </div>
      <p className="mb-4 text-xs text-[#737784]">
        Gabungan transisi project + milestone berdasarkan{' '}
        <span className="font-semibold">project_status_transitions</span> dan{' '}
        <span className="font-semibold">project_milestone_updates</span>. Append-only — tercatat sejak project lahir dari handover.
      </p>

      {loading && (
        <p className="rounded-lg bg-[#f2f4f6] px-4 py-3 text-sm italic text-[#737784]">
          Memuat history…
        </p>
      )}

      {error && !loading && (
        <p className="rounded-lg border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {!loading && !error && entries && entries.length === 0 && (
        <p className="rounded-lg bg-[#f2f4f6] px-4 py-3 text-sm italic text-[#737784]">
          Belum ada history untuk project ini.
        </p>
      )}

      {!loading && !error && entries && entries.length > 0 && (
        <ol className="space-y-3 border-l-2 border-[#eceef0] pl-5">
          {entries.map((entry) => {
            const isSystem = entry.trigger_source === 'SYSTEM';
            const isCreation = entry.from_status === null;
            return (
              <li key={`${entry.entity_type}-${entry.id}`} className="relative">
                <span className="absolute -left-[27px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#003c90] bg-white">
                  {isCreation ? (
                    <Sparkles className="h-2.5 w-2.5 text-[#003c90]" strokeWidth={3} />
                  ) : isSystem ? (
                    <Bot className="h-2.5 w-2.5 text-[#737784]" strokeWidth={3} />
                  ) : (
                    <History className="h-2.5 w-2.5 text-[#003c90]" strokeWidth={3} />
                  )}
                </span>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex rounded-full bg-[#003c90]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#003c90]">
                    {entry.entity_type}
                  </span>
                  {entry.entity_label && (
                    <span className="truncate text-xs font-semibold text-[#191c1e]">
                      {entry.entity_label}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {renderStatusChip(entry.from_status, entry.entity_type)}
                  <span className="text-[#737784]">→</span>
                  {renderStatusChip(entry.to_status, entry.entity_type)}
                </div>
                <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-[#434653]">
                  {isSystem ? (
                    <>
                      <Bot className="h-3.5 w-3.5 text-[#737784]" />
                      <span className="font-semibold text-[#737784]">System</span>
                    </>
                  ) : (
                    <>
                      <User className="h-3.5 w-3.5 text-[#737784]" />
                      <span className="font-semibold">{entry.by_name ?? 'Unknown'}</span>
                    </>
                  )}
                  <span className="text-[#737784]">·</span>
                  <span className="text-[#737784]">{formatDateTime(entry.triggered_at)}</span>
                </p>
                {entry.reason && (
                  <p className="mt-1 rounded-md bg-[#f2f4f6] px-2 py-1 text-xs italic text-[#434653]">
                    “{entry.reason}”
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
