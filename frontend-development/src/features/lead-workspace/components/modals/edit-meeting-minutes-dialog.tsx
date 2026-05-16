import { useEffect, useState, type FormEvent } from 'react';
import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogFooter,
  SidePanelDialogHeader
} from '../../../../components/ui/side-panel-dialog';
import { ApiError } from '../../../../services/api-client';
import type { SaveMeetingMinutesPayload } from '../../types/lead-meetings.types';
import { buildEmptyMinutesDetail, buildMinutesPayloadFromDetail } from '../../utils/lead-meetings-mappers';

interface EditMeetingMinutesDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  busy?: boolean;
  initialDetail?: SaveMeetingMinutesPayload | null;
  onClose: () => void;
  onSubmit: (payload: SaveMeetingMinutesPayload) => Promise<void> | void;
}

const inputClassName =
  'h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none';
const textareaClassName =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none';
const labelClassName = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

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
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(buildDraft(initialDetail));
      setLocalError(null);
    }
  }, [open, initialDetail]);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    if (busy) return;
    setLocalError(null);
    onClose();
  };

  const updateListItem = (key: 'internalParticipants' | 'clientParticipants', index: number, value: string) => {
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
    try {
      await onSubmit(draft);
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
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <SidePanelDialogBody>
          {localError ? (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{localError}</p>
          ) : null}

          <div className="space-y-5">
            <section className="space-y-3">
              <h4 className="text-sm font-bold text-[#191c1e]">Participants</h4>
              <div>
                <label className={labelClassName}>Internal Participants</label>
                <div className="space-y-2">
                  {draft.internalParticipants.map((value, index) => (
                    <div key={`internal-${index}`} className="flex gap-2">
                      <input
                        value={value}
                        onChange={(event) => updateListItem('internalParticipants', index, event.target.value)}
                        className={inputClassName}
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
              </div>
              <div>
                <label className={labelClassName}>Client Participants</label>
                <div className="space-y-2">
                  {draft.clientParticipants.map((value, index) => (
                    <div key={`client-${index}`} className="flex gap-2">
                      <input
                        value={value}
                        onChange={(event) => updateListItem('clientParticipants', index, event.target.value)}
                        className={inputClassName}
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
              </div>
            </section>

            <div>
              <label className={labelClassName}>Meeting Objectives</label>
              <textarea
                value={draft.meetingObjectives ?? ''}
                onChange={(event) => setDraft((prev) => ({ ...prev, meetingObjectives: event.target.value }))}
                rows={3}
                placeholder="e.g. Memahami kebutuhan layanan dan ekspektasi klien"
                className={`${textareaClassName} resize-y`}
              />
            </div>

            <div>
              <label className={labelClassName}>Background Summary</label>
              <textarea
                value={draft.backgroundSummary ?? ''}
                onChange={(event) => setDraft((prev) => ({ ...prev, backgroundSummary: event.target.value }))}
                rows={3}
                placeholder="e.g. Ringkasan latar belakang klien dan konteks meeting"
                className={`${textareaClassName} resize-y`}
              />
            </div>

            <div>
              <label className={labelClassName}>Issues Discussed</label>
              <textarea
                value={draft.issuesDiscussed ?? ''}
                onChange={(event) => setDraft((prev) => ({ ...prev, issuesDiscussed: event.target.value }))}
                rows={3}
                placeholder="e.g. Isu utama yang dibahas selama meeting"
                className={`${textareaClassName} resize-y`}
              />
            </div>

            <div>
              <label className={labelClassName}>Information from Client</label>
              <textarea
                value={draft.infoClient ?? ''}
                onChange={(event) => setDraft((prev) => ({ ...prev, infoClient: event.target.value }))}
                rows={3}
                placeholder="e.g. Informasi penting yang disampaikan pihak klien"
                className={`${textareaClassName} resize-y`}
              />
            </div>

            <div>
              <label className={labelClassName}>Information from Our Firm</label>
              <textarea
                value={draft.infoFirm ?? ''}
                onChange={(event) => setDraft((prev) => ({ ...prev, infoFirm: event.target.value }))}
                rows={3}
                placeholder="e.g. Informasi penting yang disampaikan tim kita"
                className={`${textareaClassName} resize-y`}
              />
            </div>

            <div>
              <label className={labelClassName}>Risks / Concerns</label>
              <textarea
                value={draft.riskConcerns ?? ''}
                onChange={(event) => setDraft((prev) => ({ ...prev, riskConcerns: event.target.value }))}
                rows={3}
                placeholder="e.g. Risiko atau hal yang perlu diperhatikan"
                className={`${textareaClassName} resize-y`}
              />
            </div>

            <section className="space-y-3">
              <h4 className="text-sm font-bold text-[#191c1e]">Agreements</h4>
              {draft.agreements.map((agreement, index) => (
                <div key={`agreement-${index}`} className="space-y-2 rounded-lg border border-[#eceef0] p-3">
                  <input
                    value={agreement.item}
                    onChange={(event) => updateAgreement(index, 'item', event.target.value)}
                    className={inputClassName}
                    placeholder="e.g. Scope layanan disepakati"
                  />
                  <textarea
                    value={agreement.details ?? ''}
                    onChange={(event) => updateAgreement(index, 'details', event.target.value)}
                    rows={2}
                    className={`${textareaClassName} resize-y`}
                    placeholder="e.g. Detail kesepakatan atau catatan tambahan"
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
            </section>

            <div>
              <label className={labelClassName}>Next Steps</label>
              <textarea
                value={draft.nextSteps ?? ''}
                onChange={(event) => setDraft((prev) => ({ ...prev, nextSteps: event.target.value }))}
                rows={3}
                placeholder="e.g. Langkah berikutnya setelah meeting"
                className={`${textareaClassName} resize-y`}
              />
            </div>

            <div>
              <label className={labelClassName}>Notes & Follow-Up</label>
              <textarea
                value={draft.notesFollowUp ?? ''}
                onChange={(event) => setDraft((prev) => ({ ...prev, notesFollowUp: event.target.value }))}
                rows={3}
                placeholder="e.g. Catatan tambahan dan follow-up yang perlu dilakukan"
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
              {busy ? 'Saving...' : mode === 'create' ? 'Simpan notulensi' : 'Perbarui notulensi'}
            </button>
          </div>
        </SidePanelDialogFooter>
      </form>
    </SidePanelDialog>
  );
};
