import { useState, type FormEvent } from 'react';
import {
  lostReasonLabelMap,
  type LeadTrackerItem,
  type LostReasonCode,
  type MarkLeadLostPayload
} from '../../types/lead-tracker.types';

interface MarkLeadLostDialogProps {
  open: boolean;
  item?: LeadTrackerItem;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (item: LeadTrackerItem, payload: MarkLeadLostPayload) => Promise<void> | void;
}

const lostReasonCodes = Object.keys(lostReasonLabelMap) as LostReasonCode[];

const fieldClassName =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20';

export const MarkLeadLostDialog = ({ open, item, busy = false, onClose, onConfirm }: MarkLeadLostDialogProps) => {
  const [lostReasonCode, setLostReasonCode] = useState<LostReasonCode>('NO_RESPONSE');
  const [lostReasonNote, setLostReasonNote] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  if (!open || !item) {
    return null;
  }

  const handleClose = () => {
    if (busy) return;
    setLostReasonCode('NO_RESPONSE');
    setLostReasonNote('');
    setLocalError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    try {
      await onConfirm(item, {
        lostReasonCode,
        lostReasonNote: lostReasonNote.trim() || undefined
      });
      setLostReasonCode('NO_RESPONSE');
      setLostReasonNote('');
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Gagal menandai lead sebagai lost.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Mark as Lost</h2>
        <p className="mt-1 text-sm text-slate-600">
          Lead <span className="font-semibold text-slate-900">{item.companyName}</span> akan ditandai sebagai lost.
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm text-slate-700">
            Reason
            <select
              required
              value={lostReasonCode}
              onChange={(event) => setLostReasonCode(event.target.value as LostReasonCode)}
              className={`${fieldClassName} mt-1`}
            >
              {lostReasonCodes.map((code) => (
                <option key={code} value={code}>
                  {lostReasonLabelMap[code]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-slate-700">
            Note
            <textarea
              value={lostReasonNote}
              onChange={(event) => setLostReasonNote(event.target.value)}
              rows={3}
              placeholder="Opsional — tambahkan detail atau konteks alasan lost"
              className={`${fieldClassName} mt-1 resize-y`}
            />
          </label>

          {localError ? <p className="text-sm text-red-600">{localError}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={busy}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-[#ba1a1a] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Konfirmasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
