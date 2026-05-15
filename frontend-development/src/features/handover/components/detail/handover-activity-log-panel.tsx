import { BadgeCheck, FileSignature, FileText, History, Send } from 'lucide-react';
import type { HandoverActivityLogEntry } from '../../types/handover.types';

interface HandoverActivityLogPanelProps {
  entries: HandoverActivityLogEntry[];
  isLoading?: boolean;
}

const panelBodyClassName = 'min-h-0 flex-1 overflow-y-auto pr-0.5';

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const resolveActorName = (item: HandoverActivityLogEntry) => {
  const name = item.createdByName?.trim();
  return name ? name : 'Sistem';
};

const resolveMetaText = (item: HandoverActivityLogEntry) => {
  return `${formatDateTime(item.createdAt)} · Oleh ${resolveActorName(item)}`;
};

const resolveTimelineStyle = (item: HandoverActivityLogEntry) => {
  const activityType = item.activityType ?? '';

  if (activityType.includes('SUBMITTED') || activityType.includes('APPROVED')) {
    return {
      icon: activityType.includes('SUBMITTED') ? Send : BadgeCheck,
      circleClass: 'bg-[#005c3a] text-white ring-2 ring-[#e9f6ef]',
      lineClass: 'bg-[#d9dde2]'
    };
  }

  if (activityType.includes('REJECTED') || activityType.includes('REVISION')) {
    return {
      icon: History,
      circleClass: 'bg-[#b45309] text-white ring-2 ring-[#fef3c7]',
      lineClass: 'bg-[#d9dde2]'
    };
  }

  if (activityType.includes('SIGNED') || activityType.includes('ENGAGEMENT')) {
    return {
      icon: FileSignature,
      circleClass: 'bg-[#6b7280] text-white ring-2 ring-[#f0f1f3]',
      lineClass: 'bg-[#d9dde2]'
    };
  }

  if (activityType.includes('HANDOVER') || activityType.includes('CREATED')) {
    return {
      icon: FileText,
      circleClass: 'bg-[#0b57d0] text-white ring-2 ring-[#e8f0fe]',
      lineClass: 'bg-[#d9dde2]'
    };
  }

  return {
    icon: History,
    circleClass: 'bg-[#7a7f87] text-white ring-2 ring-[#f3f4f6]',
    lineClass: 'bg-[#d9dde2]'
  };
};

export const HandoverActivityLogPanel = ({ entries, isLoading = false }: HandoverActivityLogPanelProps) => {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl bg-white p-5 shadow-sm ring-1 ring-[#eceef0]">
      <div className="shrink-0 pb-3">
        <h3 className="text-base font-bold text-[#191c1e]">Activity Log</h3>
        <p className="mt-0.5 text-[11px] text-[#737784]">Aktivitas terbaru handover</p>
      </div>

      <div className={panelBodyClassName}>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex gap-2.5">
                <div className="h-7 w-7 animate-pulse rounded-full bg-[#e6e8ea]" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="h-3 w-2/3 animate-pulse rounded bg-[#d9dde2]" />
                  <div className="h-2.5 w-1/2 animate-pulse rounded bg-[#e6e8ea]" />
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[#d9dde2] px-4 py-5 text-center text-xs text-[#737784]">
            Belum ada aktivitas tercatat untuk handover ini.
          </p>
        ) : (
          <ul className="space-y-0">
            {entries.map((item, index) => {
              const { icon: Icon, circleClass, lineClass } = resolveTimelineStyle(item);

              return (
                <li key={item.id} className="relative pl-10 pb-3.5 last:pb-0">
                  {index !== entries.length - 1 ? (
                    <span className={`absolute left-[13px] top-7 bottom-0 w-px ${lineClass}`} aria-hidden="true" />
                  ) : null}

                  <span
                    className={`absolute left-0 top-0 inline-flex h-7 w-7 items-center justify-center rounded-full ${circleClass}`}
                    aria-hidden="true"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>

                  <div className="min-w-0">
                    <p className="text-[13px] font-bold leading-snug text-[#191c1e]">{item.title}</p>
                    <p className="mt-0.5 text-[10px] text-[#6b7280]">{resolveMetaText(item)}</p>
                    {item.description ? (
                      <p className="mt-1 text-[11px] leading-snug text-[#434653]">{item.description}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};
