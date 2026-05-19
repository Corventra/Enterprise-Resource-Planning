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
import type { SaveMeetingMinutesPayload } from '../../types/lead-meetings.types';
import { buildEmptyMinutesDetail, buildMinutesPayloadFromDetail } from '../../utils/lead-meetings-mappers';
import {
  hasMeetingMinutesFormErrors,
  normalizeMeetingMinutesPayload,
  validateMeetingMinutesPayload,
  type MeetingMinutesFormErrors
} from '../../utils/meeting-minutes-validation';

interface EditMeetingMinutesDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  busy?: boolean;
  initialDetail?: SaveMeetingMinutesPayload | null;
  onClose: () => void;
  onSubmit: (payload: SaveMeetingMinutesPayload) => Promise<void> | void;
}

const buildDraft = (initialDetail?: SaveMeetingMinutesPayload | null): SaveMeetingMinutesPayload => {
  if (initialDetail) {
    return initialDetail;
  }
  const empty = buildEmptyMinutesDetail();
  return buildMinutesPayloadFromDetail(empty);
};

export const EditMeetingMinutesDialog = ({
  open,
  mode,
  busy = false,
  initialDetail,
  onClose,
  onSubmit
}: EditMeetingMinutesDialogProps) => {
  const [draft, setDraft] = useState<SaveMeetingMinutesPayload>(buildDraft(initialDetail));
  const [errors, setErrors] = useState<MeetingMinutesFormErrors>({});
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(buildDraft(initialDetail));
      setErrors({});
      setLocalError(null);
    }
  }, [open, initialDetail]);

  const clearScalarError = (key: keyof MeetingMinutesFormErrors) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  if (!open) {
    return null;
  }

  const handleClose = () => {
    if (busy) return;
    setLocalError(null);
    onClose();
  };

  const updateListItem = (key: 'internalParticipants' | 'clientParticipants', index: number, value: string) => {
    clearScalarError(key);
    setDraft((prev) => {
      const next = [...prev[key]];
      next[index] = value;
      return { ...prev, [key]: next };
    });
  };

  const addListItem = (key: 'internalParticipants' | 'clientParticipants') => {
    setDraft((prev) => ({ ...prev, [key]: [...prev[key], ''] }));
  };

  const removeListItem = (key: 'internalParticipants' | 'clientParticipants', index: number) => {
    setDraft((prev) => ({ ...prev, [key]: prev[key].filter((_, itemIndex) => itemIndex !== index) }));
  };

  const updateAgreement = (index: number, field: 'item' | 'details', value: string) => {
    if (field === 'item') {
      setErrors((prev) => {
        if (!prev.agreements && !prev.agreementItems?.[index]) return prev;
        const next = { ...prev };
        delete next.agreements;
        if (next.agreementItems) {
          const items = { ...next.agreementItems };
          delete items[index];
          next.agreementItems = Object.keys(items).length > 0 ? items : undefined;
        }
        return next;
      });
    }
    setDraft((prev) => {
      const next = [...prev.agreements];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, agreements: next };
    });
  };

  const addAgreement = () => {
    setDraft((prev) => ({ ...prev, agreements: [...prev.agreements, { item: '', details: '' }] }));
  };

  const removeAgreement = (index: number) => {
    setDraft((prev) => ({ ...prev, agreements: prev.agreements.filter((_, itemIndex) => itemIndex !== index) }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    const validationErrors = validateMeetingMinutesPayload(draft);
    if (hasMeetingMinutesFormErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    try {
      await onSubmit(normalizeMeetingMinutesPayload(draft));
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Gagal menyimpan notulensi.';
      setLocalError(message);
    }
  };

  return (
    <SidePanelDialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <SidePanelDialogHeader
        title={mode === 'create' ? 'Create Notulensi' : 'Edit Notulensi'}
        description="Lengkapi notulensi meeting tanpa mengubah layout workspace."
      />
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
        <SidePanelDialogBody>
          {localError ? (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{localError}</p>
          ) : null}

          <div className="space-y-5">
            <section className="space-y-3">
              <h4 className="text-sm font-bold text-[#191c1e]">Participants</h4>
              <div>
                <LeadCoreFieldLabel required>Internal Participants</LeadCoreFieldLabel>
                <div className="space-y-2">
                  {draft.internalParticipants.map((value, index) => (
                    <div key={`internal-${index}`} className="flex gap-2">
                      <input
                        value={value}
                        onChange={(event) => updateListItem('internalParticipants', index, event.target.value)}
                        className={leadCoreInputClassName}
                        placeholder="e.g. Budi Santoso"
                      />
                      <button
                        type="button"
                        onClick={() => removeListItem('internalParticipants', index)}
                        className="rounded-lg border border-[#c3c6d5] px-3 text-xs font-semibold text-[#434653]"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addListItem('internalParticipants')}
                    className="text-xs font-semibold text-[#003c90]"
                  >
                    + Tambah internal
                  </button>
                </div>
                <LeadCoreFieldError message={errors.internalParticipants} />
              </div>
              <div>
                <LeadCoreFieldLabel required>Client Participants</LeadCoreFieldLabel>
                <div className="space-y-2">
                  {draft.clientParticipants.map((value, index) => (
                    <div key={`client-${index}`} className="flex gap-2">
                      <input
                        value={value}
                        onChange={(event) => updateListItem('clientParticipants', index, event.target.value)}
                        className={leadCoreInputClassName}
                        placeholder="e.g. Andi Wijaya"
                      />
                      <button
                        type="button"
                        onClick={() => removeListItem('clientParticipants', index)}
                        className="rounded-lg border border-[#c3c6d5] px-3 text-xs font-semibold text-[#434653]"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addListItem('clientParticipants')}
                    className="text-xs font-semibold text-[#003c90]"
                  >
                    + Tambah klien
                  </button>
                </div>
                <LeadCoreFieldError message={errors.clientParticipants} />
              </div>
            </section>

            <div>
              <LeadCoreFieldLabel required>Meeting Objectives</LeadCoreFieldLabel>
              <textarea
                value={draft.meetingObjectives ?? ''}
                onChange={(event) => {
                  clearScalarError('meetingObjectives');
                  setDraft((prev) => ({ ...prev, meetingObjectives: event.target.value }));
                }}
                rows={3}
                placeholder="e.g. Memahami kebutuhan layanan dan ekspektasi klien"
                className={leadCoreTextareaClassName}
              />
              <LeadCoreFieldError message={errors.meetingObjectives} />
            </div>

            <div>
              <LeadCoreFieldLabel required>Background Summary</LeadCoreFieldLabel>
              <textarea
                value={draft.backgroundSummary ?? ''}
                onChange={(event) => {
                  clearScalarError('backgroundSummary');
                  setDraft((prev) => ({ ...prev, backgroundSummary: event.target.value }));
                }}
                rows={3}
                placeholder="e.g. Ringkasan latar belakang klien dan konteks meeting"
                className={leadCoreTextareaClassName}
              />
              <LeadCoreFieldError message={errors.backgroundSummary} />
            </div>

            <div>
              <LeadCoreFieldLabel required>Issues Discussed</LeadCoreFieldLabel>
              <textarea
                value={draft.issuesDiscussed ?? ''}
                onChange={(event) => {
                  clearScalarError('issuesDiscussed');
                  setDraft((prev) => ({ ...prev, issuesDiscussed: event.target.value }));
                }}
                rows={3}
                placeholder="e.g. Isu utama yang dibahas selama meeting"
                className={leadCoreTextareaClassName}
              />
              <LeadCoreFieldError message={errors.issuesDiscussed} />
            </div>

            <div>
              <LeadCoreFieldLabel required>Information from Client</LeadCoreFieldLabel>
              <textarea
                value={draft.infoClient ?? ''}
                onChange={(event) => {
                  clearScalarError('infoClient');
                  setDraft((prev) => ({ ...prev, infoClient: event.target.value }));
                }}
                rows={3}
                placeholder="e.g. Informasi penting yang disampaikan pihak klien"
                className={leadCoreTextareaClassName}
              />
              <LeadCoreFieldError message={errors.infoClient} />
            </div>

            <div>
              <LeadCoreFieldLabel required>Information from Our Firm</LeadCoreFieldLabel>
              <textarea
                value={draft.infoFirm ?? ''}
                onChange={(event) => {
                  clearScalarError('infoFirm');
                  setDraft((prev) => ({ ...prev, infoFirm: event.target.value }));
                }}
                rows={3}
                placeholder="e.g. Informasi penting yang disampaikan tim kita"
                className={leadCoreTextareaClassName}
              />
              <LeadCoreFieldError message={errors.infoFirm} />
            </div>

            <div>
              <LeadCoreFieldLabel required>Risks / Concerns</LeadCoreFieldLabel>
              <textarea
                value={draft.riskConcerns ?? ''}
                onChange={(event) => {
                  clearScalarError('riskConcerns');
                  setDraft((prev) => ({ ...prev, riskConcerns: event.target.value }));
                }}
                rows={3}
                placeholder="e.g. Risiko atau hal yang perlu diperhatikan"
                className={leadCoreTextareaClassName}
              />
              <LeadCoreFieldError message={errors.riskConcerns} />
            </div>

            <section className="space-y-3">
              <LeadCoreFieldLabel required>Agreements</LeadCoreFieldLabel>
              {draft.agreements.map((agreement, index) => (
                <div key={`agreement-${index}`} className="space-y-2 rounded-lg border border-[#eceef0] p-3">
                  <input
                    value={agreement.item}
                    onChange={(event) => updateAgreement(index, 'item', event.target.value)}
                    className={leadCoreInputClassName}
                    placeholder="e.g. Scope layanan disepakati"
                  />
                  <LeadCoreFieldError message={errors.agreementItems?.[index]} />
                  <textarea
                    value={agreement.details ?? ''}
                    onChange={(event) => updateAgreement(index, 'details', event.target.value)}
                    rows={2}
                    className={leadCoreTextareaClassName}
                    placeholder="e.g. Detail kesepakatan atau catatan tambahan (opsional)"
                  />
                  <button
                    type="button"
                    onClick={() => removeAgreement(index)}
                    className="text-xs font-semibold text-[#434653]"
                  >
                    Hapus agreement
                  </button>
                </div>
              ))}
              <button type="button" onClick={addAgreement} className="text-xs font-semibold text-[#003c90]">
                + Tambah agreement
              </button>
              <LeadCoreFieldError message={errors.agreements} />
            </section>

            <div>
              <LeadCoreFieldLabel required>Next Steps</LeadCoreFieldLabel>
              <textarea
                value={draft.nextSteps ?? ''}
                onChange={(event) => {
                  clearScalarError('nextSteps');
                  setDraft((prev) => ({ ...prev, nextSteps: event.target.value }));
                }}
                rows={3}
                placeholder="e.g. Langkah berikutnya setelah meeting"
                className={leadCoreTextareaClassName}
              />
              <LeadCoreFieldError message={errors.nextSteps} />
            </div>

            <div>
              <LeadCoreFieldLabel>Notes & Follow-Up</LeadCoreFieldLabel>
              <textarea
                value={draft.notesFollowUp ?? ''}
                onChange={(event) => setDraft((prev) => ({ ...prev, notesFollowUp: event.target.value }))}
                rows={3}
                placeholder="e.g. Catatan tambahan dan follow-up yang perlu dilakukan"
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
              {busy ? 'Saving...' : mode === 'create' ? 'Simpan notulensi' : 'Perbarui notulensi'}
            </button>
          </div>
        </SidePanelDialogFooter>
      </form>
    </SidePanelDialog>
  );
};
