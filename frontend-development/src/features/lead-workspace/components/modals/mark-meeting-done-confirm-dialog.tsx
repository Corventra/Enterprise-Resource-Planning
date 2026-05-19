import type { LeadWorkspaceMeetingListItem } from '../../types/lead-meetings.types';

interface MarkMeetingDoneConfirmDialogProps {
  open: boolean;
  meeting?: LeadWorkspaceMeetingListItem;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (meetingId: string) => Promise<void> | void;
}

export const MarkMeetingDoneConfirmDialog = ({
  open,
  meeting,
  busy = false,
  onClose,
  onConfirm
}: MarkMeetingDoneConfirmDialogProps) => {
  if (!open || !meeting) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Tandai meeting selesai?</h2>
        <p className="mt-2 text-sm text-slate-600">
          Meeting <span className="font-semibold text-slate-900">{meeting.title}</span> akan ditandai sebagai Done. Anda
          dapat melanjutkan mengisi notulensi setelahnya.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              await onConfirm(meeting.id);
            }}
            className="rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? 'Memproses…' : 'Tandai selesai'}
          </button>
        </div>
      </div>
    </div>
  );
};
