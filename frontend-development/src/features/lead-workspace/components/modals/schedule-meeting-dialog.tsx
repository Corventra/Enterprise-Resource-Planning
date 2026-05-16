import { useEffect, useState, type FormEvent } from 'react';
import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogFooter,
  SidePanelDialogHeader
} from '../../../../components/ui/side-panel-dialog';
import { ApiError } from '../../../../services/api-client';
import type { ScheduleMeetingPayload } from '../../types/lead-meetings.types';

interface ScheduleMeetingDialogProps {
  open: boolean;
  mode?: 'create' | 'edit';
  initialMeeting?: ScheduleMeetingPayload | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (payload: ScheduleMeetingPayload) => Promise<void> | void;
}

const inputClassName =
  'h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none';
const textareaClassName =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none';
const labelClassName = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

const emptyDraft = (): ScheduleMeetingPayload => ({
  title: '',
  meetingDatetime: '',
  meetingMode: 'ONLINE',
  meetingAccess: '',
  notes: ''
});

export const ScheduleMeetingDialog = ({
  open,
  mode = 'create',
  initialMeeting = null,
  busy = false,
  onClose,
  onSubmit
}: ScheduleMeetingDialogProps) => {
  const [draft, setDraft] = useState<ScheduleMeetingPayload>(emptyDraft());
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(mode === 'edit' && initialMeeting ? initialMeeting : emptyDraft());
      setLocalError(null);
    }
  }, [open, mode, initialMeeting]);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    if (busy) return;
    setLocalError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    try {
      await onSubmit({
        ...draft,
        title: draft.title.trim(),
        meetingAccess: draft.meetingAccess.trim(),
        notes: draft.notes?.trim() || undefined
      });
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Gagal menjadwalkan meeting.';
      setLocalError(message);
    }
  };

  return (
    <SidePanelDialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <SidePanelDialogHeader
        title={mode === 'edit' ? 'Edit Meeting' : 'Schedule Meeting'}
        description={mode === 'edit' ? 'Perbarui jadwal meeting yang masih Scheduled.' : 'Jadwalkan meeting baru untuk lead ini.'}
      />
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <SidePanelDialogBody>
          {localError ? (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{localError}</p>
          ) : null}

          <div className="space-y-4">
            <div>
              <label className={labelClassName}>Meeting Title</label>
              <input
                required
                value={draft.title}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="e.g. Kickoff Meeting"
                className={inputClassName}
              />
            </div>
            <div>
              <label className={labelClassName}>Date & Time</label>
              <input
                required
                type="datetime-local"
                value={draft.meetingDatetime}
                onChange={(event) => setDraft((prev) => ({ ...prev, meetingDatetime: event.target.value }))}
                className={inputClassName}
              />
            </div>
            <div>
              <label className={labelClassName}>Meeting Mode</label>
              <select
                required
                value={draft.meetingMode}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    meetingMode: event.target.value as ScheduleMeetingPayload['meetingMode']
                  }))
                }
                className={inputClassName}
              >
                <option value="ONLINE">Online</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </div>
            <div>
              <label className={labelClassName}>Platform/Location</label>
              <input
                required
                value={draft.meetingAccess}
                onChange={(event) => setDraft((prev) => ({ ...prev, meetingAccess: event.target.value }))}
                placeholder={draft.meetingMode === 'ONLINE' ? 'e.g. https://meet.google.com/abc-defg-hij' : 'e.g. Kantor Klien, Jakarta'}
                className={inputClassName}
              />
            </div>
            <div>
              <label className={labelClassName}>Notes</label>
              <textarea
                value={draft.notes ?? ''}
                onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
                rows={4}
                placeholder="e.g. Agenda singkat, PIC hadir, atau catatan persiapan meeting"
                className={`${textareaClassName} resize-y`}
              />
            </div>
          </div>
        </SidePanelDialogBody>

        <SidePanelDialogFooter>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={busy}
              className="rounded-lg border border-[#c3c6d5] px-4 py-2 text-sm font-semibold text-[#434653] hover:bg-[#eceef0] disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-4 py-2 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy ? 'Saving...' : mode === 'edit' ? 'Simpan perubahan' : 'Jadwalkan meeting'}
            </button>
          </div>
        </SidePanelDialogFooter>
      </form>
    </SidePanelDialog>
  );
};
