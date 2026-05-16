import { useEffect, useMemo, useState } from 'react';
import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogFooter,
  SidePanelDialogHeader
} from '../../../../components/ui/side-panel-dialog';
import { ApiError } from '../../../../services/api-client';
import { useProposalMasters } from '../../hooks/use-proposal-masters';
import { formatRupiahInput, parseRupiahInput } from '../../utils/rupiah-input';
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

const inputClassName =
  'h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none';
const labelClassName = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';
const requiredMark = <span className="text-red-600">*</span>;

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

  const buildPayload = (): SaveProposalDraftPayload | null => {
    if (!selectedServiceClassId) {
      setLocalError('Service Class wajib dipilih.');
      return null;
    }

    if (!draft.serviceId) {
      setLocalError('Service wajib dipilih.');
      return null;
    }

    if (!draft.issuerCompany) {
      setLocalError('Issuer Company wajib dipilih.');
      return null;
    }

    if (draft.proposalFee <= 0) {
      setLocalError('Proposal Fee wajib diisi dan harus lebih besar dari 0.');
      return null;
    }

    if (draft.discountAmount < 0 || draft.discountAmount > draft.proposalFee) {
      setLocalError('Discount tidak valid.');
      return null;
    }

    if (draft.isSubContract) {
      if (!draft.partnerName?.trim()) {
        setLocalError('Partner Name wajib diisi untuk sub contract.');
        return null;
      }
      if (!draft.payerParty) {
        setLocalError('Payer Party wajib dipilih untuk sub contract.');
        return null;
      }
    }

    const hasProposalDocument =
      Boolean(draft.proposalDocument) || (mode === 'edit' && Boolean(initialProposal?.document));

    if (!hasProposalDocument) {
      setLocalError('Dokumen proposal wajib diunggah.');
      return null;
    }

    return {
      serviceId: draft.serviceId,
      issuerCompany: draft.issuerCompany,
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
          {localError ? (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{localError}</p>
          ) : null}

          <div className="space-y-4">
            <div>
              <label className={labelClassName} htmlFor="proposal-service-class">
                Service Class {requiredMark}
              </label>
              <select
                id="proposal-service-class"
                required
                value={selectedServiceClassId}
                disabled={isLoading || busy}
                onChange={(event) => {
                  const nextServiceClassId = event.target.value;
                  setSelectedServiceClassId(nextServiceClassId);
                  setDraft((prev) => ({ ...prev, serviceId: '' }));
                }}
                className={inputClassName}
              >
                <option value="">Pilih service class</option>
                {serviceClasses.map((serviceClass) => (
                  <option key={serviceClass.id} value={serviceClass.id} disabled={!serviceClass.isActive}>
                    {serviceClass.name}
                    {!serviceClass.isActive ? ' (Inactive)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClassName} htmlFor="proposal-service">
                Service {requiredMark}
              </label>
              <select
                id="proposal-service"
                required
                value={draft.serviceId}
                disabled={isLoading || busy || !selectedServiceClassId}
                onChange={(event) => setDraft((prev) => ({ ...prev, serviceId: event.target.value }))}
                className={inputClassName}
              >
                <option value="">Pilih service</option>
                {filteredServices.map((service) => (
                  <option key={service.id} value={service.id} disabled={!service.isActive}>
                    {service.name}
                    {!service.isActive ? ' (Inactive)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <fieldset>
              <legend className={labelClassName}>Issuer Company {requiredMark}</legend>
              <div className="mt-2 flex flex-wrap gap-6" role="radiogroup" aria-label="Issuer Company">
                {issuerCompanyOptions.map((option) => (
                  <label key={option} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      type="radio"
                      name="issuer-company"
                      value={option}
                      checked={draft.issuerCompany === option}
                      disabled={busy}
                      onChange={() => setDraft((prev) => ({ ...prev, issuerCompany: option }))}
                      className="h-4 w-4 border-slate-300 text-[#003c90] focus:ring-[#003c90] disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={draft.isSubContract}
                disabled={busy}
                onChange={(event) => {
                  const checked = event.target.checked;
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
                  <label className={labelClassName}>Partner Name {requiredMark}</label>
                  <input
                    required
                    value={draft.partnerName ?? ''}
                    disabled={busy}
                    onChange={(event) => setDraft((prev) => ({ ...prev, partnerName: event.target.value }))}
                    placeholder="contoh: Klik Indonesia"
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className={labelClassName} htmlFor="proposal-payer-party">
                    Payer Party {requiredMark}
                  </label>
                  <select
                    id="proposal-payer-party"
                    required
                    value={draft.payerParty ?? ''}
                    disabled={busy}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        payerParty: event.target.value ? (event.target.value as ProposalPayerParty) : undefined
                      }))
                    }
                    className={inputClassName}
                  >
                    <option value="">Pilih payer party</option>
                    <option value="PARTNER">Partner</option>
                    <option value="CLIENT">Client</option>
                  </select>
                </div>
              </>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClassName} htmlFor="proposal-fee">
                  Proposal Fee (Rp) {requiredMark}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">Rp</span>
                  <input
                    id="proposal-fee"
                    required
                    type="text"
                    inputMode="numeric"
                    value={formatRupiahInput(draft.proposalFee)}
                    disabled={busy}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, proposalFee: parseRupiahInput(event.target.value) }))
                    }
                    placeholder="contoh: 50.000.000"
                    className={`${inputClassName} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label className={labelClassName}>Discount Amount (Rp)</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatRupiahInput(draft.discountAmount)}
                    disabled={busy}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, discountAmount: parseRupiahInput(event.target.value) }))
                    }
                    placeholder="contoh: 0"
                    className={`${inputClassName} pl-10`}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClassName}>
                Upload Proposal Document {requiredMark}
              </label>
              <ProposalDocumentField
                pendingFile={draft.proposalDocument ?? null}
                existingDocumentName={mode === 'edit' ? initialProposal?.document?.documentName : null}
                disabled={busy}
                onSelectFile={(file) => setDraft((prev) => ({ ...prev, proposalDocument: file }))}
                onClearPending={() => setDraft((prev) => ({ ...prev, proposalDocument: null }))}
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
