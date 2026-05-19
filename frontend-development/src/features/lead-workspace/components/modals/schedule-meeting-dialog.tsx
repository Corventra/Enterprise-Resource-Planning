import { useEffect, useState, type FormEvent } from 'react';
import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogFooter,
  SidePanelDialogHeader
} from '../../../../components/ui/side-panel-dialog';
import { ApiError } from '../../../../services/api-client';
import {
  LeadCoreFieldError,
  LeadCoreFieldLabel,
  leadCoreInputClassName,
  leadCoreTextareaClassName
} from '../../../lead-tracker/components/forms/lead-core-form-field';
import type { ScheduleMeetingPayload } from '../../types/lead-meetings.types';
import {
  hasScheduleMeetingFormErrors,
  validateScheduleMeetingPayload,
  type ScheduleMeetingFormErrors
} from '../../utils/schedule-meeting-validation';

interface ScheduleMeetingDialogProps {
  open: boolean;
  mode?: 'create' | 'edit';
  initialMeeting?: ScheduleMeetingPayload | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (payload: ScheduleMeetingPayload) => Promise<void> | void;
}

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
  const [errors, setErrors] = useState<ScheduleMeetingFormErrors>({});
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(mode === 'edit' && initialMeeting ? initialMeeting : emptyDraft());
      setErrors({});
      setLocalError(null);
    }
  }, [open, mode, initialMeeting]);

  if (!open) {
    return null;
  }

  const updateField = <K extends keyof ScheduleMeetingPayload>(key: K, value: ScheduleMeetingPayload[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (key !== 'notes' && key !== 'meetingMode') {
      setErrors((prev) => {
        if (!prev[key as keyof ScheduleMeetingFormErrors]) return prev;
        return { ...prev, [key]: undefined };
      });
    }
    if (key === 'meetingMode') {
      setErrors((prev) => (prev.meetingAccess ? { ...prev, meetingAccess: undefined } : prev));
    }
  };

  const handleClose = () => {
    if (busy) return;
    setLocalError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    const validationErrors = validateScheduleMeetingPayload(draft);
    if (hasScheduleMeetingFormErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    try {
      await onSubmit({
        ...draft,
        title: draft.title.trim(),
        meetingAccess: draft.meetingAccess.trim(),
        notes: draft.notes?.trim() || undefined
      });
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : mode === 'edit'
            ? 'Gagal memperbarui meeting.'
            : 'Gagal menjadwalkan meeting.';
      setLocalError(message);
    }
  };

  const platformPlaceholder =
    draft.meetingMode === 'ONLINE'
      ? 'e.g. https://meet.google.com/abc-defg-hij'
      : 'e.g. Kantor Klien, Jakarta';

  return (
    <SidePanelDialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <SidePanelDialogHeader
        title={mode === 'edit' ? 'Edit Meeting' : 'Schedule Meeting'}
        description={
          mode === 'edit'
            ? 'Perbarui jadwal meeting yang masih Scheduled.'
            : 'Jadwalkan meeting baru untuk lead ini.'
        }
      />
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
        <SidePanelDialogBody>
          {localError ? (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{localError}</p>
          ) : null}

          <div className="space-y-4">
            <div>
              <LeadCoreFieldLabel required>Meeting Title</LeadCoreFieldLabel>
              <input
                value={draft.title}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="e.g. Kickoff Meeting"
                className={leadCoreInputClassName}
              />
              <LeadCoreFieldError message={errors.title} />
            </div>
            <div>
              <LeadCoreFieldLabel required>Date & Time</LeadCoreFieldLabel>
              <input
                type="datetime-local"
                value={draft.meetingDatetime}
                onChange={(event) => updateField('meetingDatetime', event.target.value)}
                className={leadCoreInputClassName}
              />
              <LeadCoreFieldError message={errors.meetingDatetime} />
            </div>
            <div>
              <LeadCoreFieldLabel required>Meeting Mode</LeadCoreFieldLabel>
              <select
                value={draft.meetingMode}
                onChange={(event) =>
                  updateField('meetingMode', event.target.value as ScheduleMeetingPayload['meetingMode'])
                }
                className={leadCoreInputClassName}
              >
                <option value="ONLINE">Online</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </div>
            <div>
              <LeadCoreFieldLabel required>Platform/Location</LeadCoreFieldLabel>
              <input
                value={draft.meetingAccess}
                onChange={(event) => updateField('meetingAccess', event.target.value)}
                placeholder={platformPlaceholder}
                className={leadCoreInputClassName}
              />
              <LeadCoreFieldError message={errors.meetingAccess} />
            </div>
            <div>
              <LeadCoreFieldLabel>Notes</LeadCoreFieldLabel>
              <textarea
                value={draft.notes ?? ''}
                onChange={(event) => updateField('notes', event.target.value)}
                rows={4}
                placeholder="e.g. Agenda singkat, PIC hadir, atau catatan persiapan meeting"
                className={leadCoreTextareaClassName}
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
