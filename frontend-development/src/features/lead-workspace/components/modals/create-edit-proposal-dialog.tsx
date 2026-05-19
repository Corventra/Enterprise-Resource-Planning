import { useEffect, useMemo, useState } from 'react';
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
  leadCoreInputClassName
} from '../../../lead-tracker/components/forms/lead-core-form-field';
import { useProposalMasters } from '../../hooks/use-proposal-masters';
import { formatRupiahInput, parseRupiahInput } from '../../utils/rupiah-input';
import {
  hasProposalFormErrors,
  validateProposalForm,
  type ProposalFormErrors
} from '../../utils/proposal-form-validation';
import { ProposalDocumentField } from './proposal-document-field';
import type {
  LeadWorkspaceProposalView,
  ProposalIssuerCompany,
  ProposalPayerParty,
  ProposalSaveAction,
  SaveProposalDraftPayload
} from '../../types/lead-proposals.types';

interface CreateEditProposalDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialProposal?: LeadWorkspaceProposalView | null;
  busy?: boolean;
  busyAction?: ProposalSaveAction | null;
  onClose: () => void;
  onSaveDraft: (payload: SaveProposalDraftPayload) => Promise<void> | void;
  onSubmitProposal: (payload: SaveProposalDraftPayload) => Promise<void> | void;
}

type ProposalFormDraft = Omit<SaveProposalDraftPayload, 'issuerCompany'> & {
  issuerCompany: ProposalIssuerCompany | '';
};

const issuerCompanyOptions: ProposalIssuerCompany[] = ['DSK', 'DTAX'];

const emptyDraft = (): ProposalFormDraft => ({
  serviceId: '',
  issuerCompany: '',
  isSubContract: false,
  partnerName: '',
  payerParty: undefined,
  proposalFee: 0,
  discountAmount: 0,
  proposalDocument: null
});

export const CreateEditProposalDialog = ({
  open,
  mode,
  initialProposal = null,
  busy = false,
  busyAction = null,
  onClose,
  onSaveDraft,
  onSubmitProposal
}: CreateEditProposalDialogProps) => {
  const { serviceClasses, services, isLoading, loadError } = useProposalMasters();
  const [draft, setDraft] = useState<ProposalFormDraft>(emptyDraft());
  const [selectedServiceClassId, setSelectedServiceClassId] = useState('');
  const [errors, setErrors] = useState<ProposalFormErrors>({});
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && initialProposal) {
      setDraft({
        serviceId: initialProposal.serviceId,
        issuerCompany: initialProposal.issuerCompany,
        isSubContract: initialProposal.isSubContract,
        partnerName: initialProposal.partnerName ?? '',
        payerParty: initialProposal.isSubContract ? initialProposal.payerParty ?? undefined : undefined,
        proposalFee: initialProposal.proposalFee,
        discountAmount: initialProposal.discountAmount,
        proposalDocument: null
      });
      setSelectedServiceClassId(initialProposal.serviceClassId);
    } else {
      setDraft(emptyDraft());
      setSelectedServiceClassId('');
    }
    setErrors({});
    setLocalError(null);
  }, [open, mode, initialProposal]);

  const filteredServices = useMemo(
    () => services.filter((service) => service.serviceClassId === selectedServiceClassId),
    [services, selectedServiceClassId]
  );

  if (!open) {
    return null;
  }

  const handleClose = () => {
    if (busy) return;
    setLocalError(null);
    onClose();
  };

  const clearFieldError = (key: keyof ProposalFormErrors) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const buildPayload = (): SaveProposalDraftPayload | null => {
    const validationErrors = validateProposalForm(draft, selectedServiceClassId, {
      hasExistingDocument: mode === 'edit' && Boolean(initialProposal?.document)
    });

    if (hasProposalFormErrors(validationErrors)) {
      setErrors(validationErrors);
      return null;
    }

    setErrors({});
    return {
      serviceId: draft.serviceId,
      issuerCompany: draft.issuerCompany as ProposalIssuerCompany,
      isSubContract: draft.isSubContract,
      partnerName: draft.isSubContract ? draft.partnerName?.trim() : undefined,
      payerParty: draft.isSubContract ? draft.payerParty : undefined,
      proposalFee: draft.proposalFee,
      discountAmount: draft.discountAmount,
      proposalDocument: draft.proposalDocument ?? undefined
    };
  };

  const handleAction = async (action: ProposalSaveAction) => {
    setLocalError(null);
    const payload = buildPayload();
    if (!payload) {
      return;
    }

    try {
      if (action === 'draft') {
        await onSaveDraft({ ...payload, action: 'draft' });
      } else {
        await onSubmitProposal({ ...payload, action: 'submit' });
      }
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : action === 'draft'
            ? 'Gagal menyimpan draft proposal.'
            : 'Gagal submit proposal.';
      setLocalError(message);
    }
  };

  return (
    <SidePanelDialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <SidePanelDialogHeader
        title={mode === 'edit' ? 'Edit Proposal' : 'Create Proposal'}
        description={
          mode === 'edit'
            ? 'Perbarui draft proposal sebelum diajukan ke CEO.'
            : 'Buat draft proposal untuk lead ini.'
        }
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <SidePanelDialogBody>
          {loadError ? (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{loadError}</p>
          ) : null}
          {localError ? <p className="mb-3 text-sm text-red-600">{localError}</p> : null}

          <div className="space-y-4">
            <div>
              <LeadCoreFieldLabel required>Service Class</LeadCoreFieldLabel>
              <select
                id="proposal-service-class"
                value={selectedServiceClassId}
                disabled={isLoading || busy}
                onChange={(event) => {
                  const nextServiceClassId = event.target.value;
                  setSelectedServiceClassId(nextServiceClassId);
                  clearFieldError('serviceClassId');
                  clearFieldError('serviceId');
                  setDraft((prev) => ({ ...prev, serviceId: '' }));
                }}
                className={leadCoreInputClassName}
              >
                <option value="">Pilih service class</option>
                {serviceClasses.map((serviceClass) => (
                  <option key={serviceClass.id} value={serviceClass.id} disabled={!serviceClass.isActive}>
                    {serviceClass.name}
                    {!serviceClass.isActive ? ' (Inactive)' : ''}
                  </option>
                ))}
              </select>
              <LeadCoreFieldError message={errors.serviceClassId} />
            </div>

            <div>
              <LeadCoreFieldLabel required>Service</LeadCoreFieldLabel>
              <select
                id="proposal-service"
                value={draft.serviceId}
                disabled={isLoading || busy || !selectedServiceClassId}
                onChange={(event) => {
                  clearFieldError('serviceId');
                  setDraft((prev) => ({ ...prev, serviceId: event.target.value }));
                }}
                className={leadCoreInputClassName}
              >
                <option value="">Pilih service</option>
                {filteredServices.map((service) => (
                  <option key={service.id} value={service.id} disabled={!service.isActive}>
                    {service.name}
                    {!service.isActive ? ' (Inactive)' : ''}
                  </option>
                ))}
              </select>
              <LeadCoreFieldError message={errors.serviceId} />
            </div>

            <fieldset>
              <LeadCoreFieldLabel required>Issuer Company</LeadCoreFieldLabel>
              <div className="mt-2 flex flex-wrap gap-6" role="radiogroup" aria-label="Issuer Company">
                {issuerCompanyOptions.map((option) => (
                  <label key={option} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      type="radio"
                      name="issuer-company"
                      value={option}
                      checked={draft.issuerCompany === option}
                      disabled={busy}
                      onChange={() => {
                        clearFieldError('issuerCompany');
                        setDraft((prev) => ({ ...prev, issuerCompany: option }));
                      }}
                      className="h-4 w-4 border-slate-300 text-[#003c90] focus:ring-[#003c90] disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    {option}
                  </label>
                ))}
              </div>
              <LeadCoreFieldError message={errors.issuerCompany} />
            </fieldset>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={draft.isSubContract}
                disabled={busy}
                onChange={(event) => {
                  const checked = event.target.checked;
                  if (!checked) {
                    clearFieldError('partnerName');
                    clearFieldError('payerParty');
                  }
                  setDraft((prev) => ({
                    ...prev,
                    isSubContract: checked,
                    partnerName: checked ? prev.partnerName : '',
                    payerParty: checked ? prev.payerParty : undefined
                  }));
                }}
              />
              Is Sub Contract?
            </label>

            {draft.isSubContract ? (
              <>
                <div>
                  <LeadCoreFieldLabel required>Partner Name</LeadCoreFieldLabel>
                  <input
                    value={draft.partnerName ?? ''}
                    disabled={busy}
                    onChange={(event) => {
                      clearFieldError('partnerName');
                      setDraft((prev) => ({ ...prev, partnerName: event.target.value }));
                    }}
                    placeholder="contoh: Klik Indonesia"
                    className={leadCoreInputClassName}
                  />
                  <LeadCoreFieldError message={errors.partnerName} />
                </div>
                <div>
                  <LeadCoreFieldLabel required>Payer Party</LeadCoreFieldLabel>
                  <select
                    id="proposal-payer-party"
                    value={draft.payerParty ?? ''}
                    disabled={busy}
                    onChange={(event) => {
                      clearFieldError('payerParty');
                      setDraft((prev) => ({
                        ...prev,
                        payerParty: event.target.value ? (event.target.value as ProposalPayerParty) : undefined
                      }));
                    }}
                    className={leadCoreInputClassName}
                  >
                    <option value="">Pilih payer party</option>
                    <option value="PARTNER">Partner</option>
                    <option value="CLIENT">Client</option>
                  </select>
                  <LeadCoreFieldError message={errors.payerParty} />
                </div>
              </>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <LeadCoreFieldLabel required>Proposal Fee (Rp)</LeadCoreFieldLabel>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">Rp</span>
                  <input
                    id="proposal-fee"
                    type="text"
                    inputMode="numeric"
                    value={formatRupiahInput(draft.proposalFee)}
                    disabled={busy}
                    onChange={(event) => {
                      clearFieldError('proposalFee');
                      clearFieldError('discountAmount');
                      setDraft((prev) => ({ ...prev, proposalFee: parseRupiahInput(event.target.value) }));
                    }}
                    placeholder="contoh: 50.000.000"
                    className={`${leadCoreInputClassName} pl-10`}
                  />
                </div>
                <LeadCoreFieldError message={errors.proposalFee} />
              </div>
              <div>
                <LeadCoreFieldLabel>Discount Amount (Rp)</LeadCoreFieldLabel>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatRupiahInput(draft.discountAmount)}
                    disabled={busy}
                    onChange={(event) => {
                      clearFieldError('discountAmount');
                      setDraft((prev) => ({ ...prev, discountAmount: parseRupiahInput(event.target.value) }));
                    }}
                    placeholder="contoh: 0"
                    className={`${leadCoreInputClassName} pl-10`}
                  />
                </div>
                <LeadCoreFieldError message={errors.discountAmount} />
              </div>
            </div>

            <div>
              <LeadCoreFieldLabel required>Upload Proposal Document</LeadCoreFieldLabel>
              <ProposalDocumentField
                pendingFile={draft.proposalDocument ?? null}
                existingDocumentName={mode === 'edit' ? initialProposal?.document?.documentName : null}
                disabled={busy}
                onSelectFile={(file) => {
                  clearFieldError('proposalDocument');
                  setDraft((prev) => ({ ...prev, proposalDocument: file }));
                }}
                onClearPending={() => setDraft((prev) => ({ ...prev, proposalDocument: null }))}
              />
              <LeadCoreFieldError message={errors.proposalDocument} />
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
              type="button"
              onClick={() => void handleAction('draft')}
              disabled={busy || isLoading}
              className="rounded-lg border border-[#c3c6d5] px-4 py-2 text-sm font-semibold text-[#434653] hover:bg-[#eceef0] disabled:opacity-50"
            >
              {busyAction === 'draft' ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              type="button"
              onClick={() => void handleAction('submit')}
              disabled={busy || isLoading}
              className="rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-4 py-2 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busyAction === 'submit' ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </SidePanelDialogFooter>
      </div>
    </SidePanelDialog>
  );
};
