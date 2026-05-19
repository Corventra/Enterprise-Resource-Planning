import { useState, type FormEvent } from 'react';
import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogFooter,
  SidePanelDialogHeader
} from '../../../../components/ui/side-panel-dialog';
import { ApiError } from '../../../../services/api-client';
import type { CreateManualLeadPayload } from '../../types/lead-tracker.types';
import {
  LeadCoreFieldError,
  LeadCoreFieldLabel,
  leadCoreInputClassName
} from '../forms/lead-core-form-field';
import {
  hasLeadCoreFormErrors,
  validateLeadCoreFormValues,
  type LeadCoreFormErrors
} from '../../utils/lead-core-form-validation';

interface AddManualLeadDialogProps {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateManualLeadPayload) => Promise<void> | void;
}

const initialDraft: CreateManualLeadPayload = {
  companyName: '',
  companyAddress: '',
  picName: '',
  email: '',
  phoneNumber: '',
  desiredServices: ''
};

export const AddManualLeadDialog = ({
  open,
  busy = false,
  onClose,
  onSubmit
}: AddManualLeadDialogProps) => {
  const [draft, setDraft] = useState<CreateManualLeadPayload>(initialDraft);
  const [errors, setErrors] = useState<LeadCoreFormErrors>({});
  const [localError, setLocalError] = useState<string | null>(null);

  const updateField = <K extends keyof CreateManualLeadPayload>(key: K, value: CreateManualLeadPayload[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (key !== 'desiredServices') {
      setErrors((prev) => {
        if (!prev[key as keyof LeadCoreFormErrors]) return prev;
        return { ...prev, [key]: undefined };
      });
    }
  };

  const resetForm = () => {
    setDraft(initialDraft);
    setErrors({});
    setLocalError(null);
  };

  const handleClose = () => {
    if (busy) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    const validationErrors = validateLeadCoreFormValues(draft);
    if (hasLeadCoreFormErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    try {
      await onSubmit({
        ...draft,
        companyName: draft.companyName.trim(),
        companyAddress: draft.companyAddress.trim(),
        picName: draft.picName.trim(),
        email: draft.email.trim(),
        phoneNumber: draft.phoneNumber.trim(),
        desiredServices: draft.desiredServices?.trim() || undefined
      });
      resetForm();
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Gagal membuat lead manual.';
      setLocalError(message);
    }
  };

  return (
    <SidePanelDialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <SidePanelDialogHeader title="Add Lead" description="Lead baru akan langsung masuk ke Lead Tracker." />
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
        <SidePanelDialogBody>
          {localError ? (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{localError}</p>
          ) : null}

          <div className="space-y-4">
            <div>
              <LeadCoreFieldLabel required>Company Name</LeadCoreFieldLabel>
              <input
                value={draft.companyName}
                onChange={(event) => updateField('companyName', event.target.value)}
                placeholder="e.g. PT Contoh Maju"
                className={leadCoreInputClassName}
              />
              <LeadCoreFieldError message={errors.companyName} />
            </div>
            <div>
              <LeadCoreFieldLabel required>Company Address</LeadCoreFieldLabel>
              <input
                value={draft.companyAddress}
                onChange={(event) => updateField('companyAddress', event.target.value)}
                placeholder="e.g. Jl. Sudirman No. 1, Jakarta"
                className={leadCoreInputClassName}
              />
              <LeadCoreFieldError message={errors.companyAddress} />
            </div>
            <div>
              <LeadCoreFieldLabel required>PIC Name</LeadCoreFieldLabel>
              <input
                value={draft.picName}
                onChange={(event) => updateField('picName', event.target.value)}
                placeholder="e.g. Budi Santoso"
                className={leadCoreInputClassName}
              />
              <LeadCoreFieldError message={errors.picName} />
            </div>
            <div>
              <LeadCoreFieldLabel required>Email</LeadCoreFieldLabel>
              <input
                type="email"
                value={draft.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="e.g. contact@company.co.id"
                className={leadCoreInputClassName}
              />
              <LeadCoreFieldError message={errors.email} />
            </div>
            <div>
              <LeadCoreFieldLabel required>Phone Number</LeadCoreFieldLabel>
              <input
                value={draft.phoneNumber}
                onChange={(event) => updateField('phoneNumber', event.target.value)}
                placeholder="e.g. +62 812-3456-7890"
                className={leadCoreInputClassName}
              />
              <LeadCoreFieldError message={errors.phoneNumber} />
            </div>
            <div>
              <LeadCoreFieldLabel>Desired Services</LeadCoreFieldLabel>
              <input
                value={draft.desiredServices ?? ''}
                onChange={(event) => updateField('desiredServices', event.target.value)}
                placeholder="e.g. Consulting, Tax"
                className={leadCoreInputClassName}
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
              {busy ? 'Saving...' : 'Add Lead'}
            </button>
          </div>
        </SidePanelDialogFooter>
      </form>
    </SidePanelDialog>
  );
};
