import type { MeetingMonitorItem } from '../../types/meetings.types';
import { formatMeetingDateLines } from '../../utils/meetings-display';
import {
  MeetingConfirmDialogShell,
  MeetingConfirmSummaryCard,
  modalPrimaryBtnClass,
  modalSecondaryBtnClass
} from './meeting-modal-ui';

interface MarkMeetingCompleteDialogProps {
  open: boolean;
  item?: MeetingMonitorItem;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (item: MeetingMonitorItem) => Promise<void> | void;
}

export const MarkMeetingCompleteDialog = ({
  open,
  item,
  busy = false,
  onClose,
  onConfirm
}: MarkMeetingCompleteDialogProps) => {
  if (!item) return null;

  const { dateLine, timeLine } = formatMeetingDateLines(item.meetingDatetime);
  const scheduleLine = timeLine ? `${dateLine}, ${timeLine}` : dateLine;

  return (
    <MeetingConfirmDialogShell
      open={open}
      title="Tandai meeting selesai?"
      busy={busy}
      onClose={onClose}
      footer={
        <>
          <button type="button" disabled={busy} onClick={onClose} className={modalSecondaryBtnClass}>
            Batal
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              await onConfirm(item);
            }}
            className={modalPrimaryBtnClass}
          >
            {busy ? 'Memproses…' : 'Tandai selesai'}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-[#434653]">
        Meeting akan ditandai sebagai <span className="font-semibold text-[#191c1e]">Done</span>. Lanjutkan pengisian
        notulensi dari Lead Workspace.
      </p>
      <MeetingConfirmSummaryCard>
        <p className="font-semibold text-[#191c1e]">{item.title}</p>
        <p className="mt-1">
          {item.companyName}
          <span className="text-[#737784]"> · </span>
          {item.picName}
        </p>
        <p className="mt-1 text-xs text-[#737784]">{scheduleLine}</p>
      </MeetingConfirmSummaryCard>
    </MeetingConfirmDialogShell>
  );
};
