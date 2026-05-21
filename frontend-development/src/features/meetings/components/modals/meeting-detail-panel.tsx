import { Building2, CheckCircle2, ExternalLink, Video } from 'lucide-react';
import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogFooter,
  SidePanelDialogHeader
} from '../../../../components/ui/side-panel-dialog';
import type { MeetingMonitorItem } from '../../types/meetings.types';
import {
  formatMeetingDateLines,
  getMeetingAccessHref,
  meetingModeTableLabel,
  meetingStatusClass,
  meetingStatusLabel,
  minutesStatusClass,
  minutesStatusLabel
} from '../../utils/meetings-display';
import {
  MeetingDetailField,
  MeetingModalSection,
  modalOutlinePrimaryBtnClass,
  modalPrimaryBtnClass,
  modalSecondaryBtnClass
} from './meeting-modal-ui';

interface MeetingDetailPanelProps {
  open: boolean;
  item?: MeetingMonitorItem;
  canMarkComplete: boolean;
  busy?: boolean;
  onClose: () => void;
  onOpenWorkspace: (item: MeetingMonitorItem) => void;
  onMarkComplete: (item: MeetingMonitorItem) => void;
}

const platformIcon = (mode: MeetingMonitorItem['mode']) => {
  if (mode === 'ONLINE') return <Video className="h-4 w-4 text-[#0f52ba]" />;
  return <Building2 className="h-4 w-4 text-[#434653]" />;
};

export const MeetingDetailPanel = ({
  open,
  item,
  canMarkComplete,
  busy = false,
  onClose,
  onOpenWorkspace,
  onMarkComplete
}: MeetingDetailPanelProps) => {
  if (!item) return null;

  const { dateLine, timeLine } = formatMeetingDateLines(item.meetingDatetime);
  const scheduleLine = timeLine ? `${dateLine}, ${timeLine}` : dateLine;
  const href = getMeetingAccessHref(item.mode, item.meetingAccess);
  const modeLabel = meetingModeTableLabel(item.mode);

  return (
    <SidePanelDialog open={open} onOpenChange={(next) => !next && onClose()} className="max-w-xl">
      <SidePanelDialogHeader
        title={item.title}
        description={`${item.companyName} · ${item.picName}`}
      />
      <SidePanelDialogBody className="space-y-4">
        <MeetingModalSection title="Informasi Lead">
          <div className="grid gap-4 sm:grid-cols-2">
            <MeetingDetailField label="Perusahaan">
              <p className="font-semibold">{item.companyName}</p>
            </MeetingDetailField>
            <MeetingDetailField label="PIC">{item.picName}</MeetingDetailField>
            <MeetingDetailField label="Handled By">{item.handledByName}</MeetingDetailField>
          </div>
        </MeetingModalSection>

        <MeetingModalSection title="Jadwal & Meeting">
          <div className="grid gap-4 sm:grid-cols-2">
            <MeetingDetailField label="Tanggal & Waktu">{scheduleLine}</MeetingDetailField>
            <MeetingDetailField label="Mode">
              <span className="inline-flex items-center gap-2">
                {platformIcon(item.mode)}
                {modeLabel}
              </span>
            </MeetingDetailField>
            <MeetingDetailField label="Link / Lokasi">
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all font-semibold text-[#003c90] hover:underline"
                >
                  {item.meetingAccess.trim() || 'Buka tautan'}
                </a>
              ) : (
                <span>{item.meetingAccess.trim() || '—'}</span>
              )}
            </MeetingDetailField>
          </div>
        </MeetingModalSection>

        <MeetingModalSection title="Status">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${meetingStatusClass(item.status)}`}
            >
              {meetingStatusLabel(item.status)}
            </span>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${minutesStatusClass(item.hasMinutes)}`}
            >
              Minutes: {minutesStatusLabel(item.hasMinutes)}
            </span>
          </div>
        </MeetingModalSection>

        {item.notes.trim() ? (
          <MeetingModalSection title="Catatan">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#434653]">{item.notes}</p>
          </MeetingModalSection>
        ) : null}
      </SidePanelDialogBody>
      <SidePanelDialogFooter>
        <div className="flex w-full flex-wrap justify-end gap-2">
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${modalSecondaryBtnClass} inline-flex items-center gap-2`}
            >
              <ExternalLink className="h-4 w-4" />
              Buka Link Meeting
            </a>
          ) : null}
          <button type="button" onClick={() => onOpenWorkspace(item)} className={modalOutlinePrimaryBtnClass}>
            Buka Lead Workspace
          </button>
          {canMarkComplete && item.status === 'SCHEDULED' ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onMarkComplete(item)}
              className={`${modalPrimaryBtnClass} inline-flex items-center gap-2`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {busy ? 'Memproses…' : 'Tandai Selesai'}
            </button>
          ) : null}
        </div>
      </SidePanelDialogFooter>
    </SidePanelDialog>
  );
};
