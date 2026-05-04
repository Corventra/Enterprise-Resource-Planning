import { Check, FilePlus2, RotateCcw, UserCheck, Users } from 'lucide-react';
import { ROLE_LABELS } from '../../../../app/permissions';
import {
  HANDOVER_APPROVAL_ACTION_LABELS,
  handoverStatusStyleMap,
  type HandoverApprovalAction,
  type HandoverApprovalTrailEntry,
  type HandoverStatus
} from '../../types/handover.types';

interface HandoverApprovalTrailProps {
  status: HandoverStatus;
  entries: HandoverApprovalTrailEntry[];
}

const ACTION_ICON: Record<HandoverApprovalAction, typeof Check> = {
  submitted: FilePlus2,
  approved: Check,
  revisionRequested: RotateCcw,
  pmAssigned: UserCheck,
  consultantAssigned: Users,
  projectStarted: Check,
  completed: Check
};

const ACTION_TONE: Record<HandoverApprovalAction, string> = {
  submitted: 'text-[#003c90] bg-[#d5e3fc]',
  approved: 'text-[#006544] bg-[#4edea3]/30',
  revisionRequested: 'text-[#c2410c] bg-orange-100',
  pmAssigned: 'text-[#004b31] bg-[#4edea3]/30',
  consultantAssigned: 'text-[#003c90] bg-[#d5e3fc]',
  projectStarted: 'text-[#006544] bg-[#006544]/15',
  completed: 'text-[#003c2a] bg-[#006544]/25'
};

const formatTrailDate = (iso: string) => {
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

export const HandoverApprovalTrail = ({ status, entries }: HandoverApprovalTrailProps) => {
  return (
    <section
      id="approval-trail"
      className="scroll-mt-24 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#eceef0]"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f2f4f6] px-6 py-5">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[#191c1e]">Approval Trail</h2>
          <p className="mt-0.5 text-xs text-[#737784]">
            Riwayat submission, review, dan transisi status handover memo.
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${handoverStatusStyleMap[status]}`}
        >
          {status}
        </span>
      </header>

      <div className="px-6 py-6">
        {entries.length === 0 ? (
          <p className="rounded-lg bg-[#f2f4f6] px-4 py-3 text-sm italic text-[#737784]">
            Belum ada aktivitas approval. Trail akan muncul setelah memo di-submit.
          </p>
        ) : (
          <ol className="relative space-y-6 border-l-2 border-[#eceef0] pl-6">
            {entries.map((entry, index) => {
              const Icon = ACTION_ICON[entry.action];
              const tone = ACTION_TONE[entry.action];
              return (
                <li key={`${entry.action}-${entry.at}-${index}`} className="relative">
                  <span
                    className={`absolute -left-[34px] flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-white ${tone}`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
                  </span>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className="text-sm font-bold text-[#191c1e]">{HANDOVER_APPROVAL_ACTION_LABELS[entry.action]}</p>
                    <p className="text-[11px] font-medium text-[#737784]">{formatTrailDate(entry.at)}</p>
                  </div>
                  <p className="mt-1 text-xs text-[#434653]">
                    <span className="font-semibold">{entry.actor}</span>
                    <span className="text-[#737784]"> · {ROLE_LABELS[entry.actorRole]}</span>
                  </p>
                  {entry.note && (
                    <div className="mt-2 rounded-lg border-l-2 border-[#003c90] bg-[#f2f4f6] px-3 py-2 text-xs italic text-[#434653]">
                      “{entry.note}”
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
};
