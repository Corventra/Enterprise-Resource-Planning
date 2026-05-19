import type { LeadWorkspaceMeetingListItem } from '../../types/lead-meetings.types';

interface CancelMeetingConfirmDialogProps {
  open: boolean;
  meeting?: LeadWorkspaceMeetingListItem;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (meetingId: string) => Promise<void> | void;
}

export const CancelMeetingConfirmDialog = ({
  open,
  meeting,
  busy = false,
  onClose,
  onConfirm
}: CancelMeetingConfirmDialogProps) => {
  if (!open || !meeting) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Batalkan meeting?</h2>
        <p className="mt-2 text-sm text-slate-600">
          Meeting <span className="font-semibold text-slate-900">{meeting.title}</span> akan ditandai sebagai Cancelled.
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
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? 'Memproses…' : 'Batalkan meeting'}
          </button>
        </div>
      </div>
    </div>
  );
};
