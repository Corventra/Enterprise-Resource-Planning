import { useEffect, useState } from 'react';
import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogFooter,
  SidePanelDialogHeader
} from '../../../../components/ui/side-panel-dialog';
import {
  LeadCoreFieldError,
  LeadCoreFieldLabel,
  leadCoreInputClassName
} from '../../../lead-tracker/components/forms/lead-core-form-field';
import { EngagementLetterDocumentField } from './engagement-letter-document-field';
import { normalizeDateOnlyString } from '../../../../utils/format-date-only';
import {
  getLocalTodayIsoDate,
  hasEngagementLetterFormErrors,
  validateEngagementLetterForm,
  type EngagementLetterFormErrors,
  type TerminEditableRow
} from '../../utils/engagement-letter-form-validation';
import { ApiError } from '../../../../services/api-client';
import { formatRupiahInput, parseRupiahInput } from '../../utils/rupiah-input';
import type {
  EngagementIssuerCompany,
  EngagementPaymentMethod,
  LeadWorkspaceEngagementLetterItem
} from '../../types/lead-engagement-letters.types';

export type { TerminEditableRow };

const toDateOnlyField = (value: string | null | undefined) => normalizeDateOnlyString(value) ?? '';

export type EngagementLetterFormMode = 'create' | 'edit';

const labelClassName = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

interface EngagementLetterFormDialogProps {
  open: boolean;
  mode: EngagementLetterFormMode;
  initialEngagement?: LeadWorkspaceEngagementLetterItem | null;
  busy?: boolean;
  /** Tombol mana yang sedang memproses (untuk label loading). */
  busyAction?: 'draft' | 'submit' | null;
  onClose: () => void;
  onSubmit: (formData: FormData, action: 'draft' | 'submit') => Promise<void> | void;
  /** Tutup panel lalu tampilkan konfirmasi submit di parent (hindari dialog di belakang panel). */
  onRequestSubmitConfirm?: (formData: FormData) => void;
}

const defaultDp = (): TerminEditableRow => ({
  term_name: 'Down Payment',
  percentage: '50',
  description: '',
  billing_schedule_date: ''
});

const defaultFinal = (): TerminEditableRow => ({
  term_name: 'Pelunasan',
  percentage: '50',
  description: '',
  billing_schedule_date: ''
});

const defaultInstallment = (): TerminEditableRow => ({
  term_name: 'Installment',
  percentage: '0',
  description: '',
  billing_schedule_date: ''
});

const defaultRetainer = () => ({
  contract_start_date: '',
  contract_end_date: '',
  billing_timing: 'BEGINNING_OF_MONTH' as 'BEGINNING_OF_MONTH' | 'END_OF_MONTH'
});

const mapItemToTerminParts = (item: LeadWorkspaceEngagementLetterItem) => {
  const draft = item.elTerminsDraft;
  if (!draft || draft.length < 2) {
    return { dp: defaultDp(), installments: [] as TerminEditableRow[], final: defaultFinal() };
  }
  const sorted = [...draft].sort((a, b) => a.sort_order - b.sort_order);
  const dpRow = sorted[0];
  const finalRow = sorted[sorted.length - 1];
  const mid = sorted.slice(1, -1);
  return {
    dp: {
      term_name: dpRow.term_name,
      percentage: String(dpRow.percentage),
      description: dpRow.description ?? '',
      billing_schedule_date: toDateOnlyField(dpRow.billing_schedule_date)
    },
    installments: mid.map((t) => ({
      term_name: t.term_name,
      percentage: String(t.percentage),
      description: t.description ?? '',
      billing_schedule_date: toDateOnlyField(t.billing_schedule_date)
    })),
    final: {
      term_name: finalRow.term_name,
      percentage: String(finalRow.percentage),
      description: finalRow.description ?? '',
      billing_schedule_date: toDateOnlyField(finalRow.billing_schedule_date)
    }
  };
};

const mapItemToRetainer = (item: LeadWorkspaceEngagementLetterItem) => {
  const d = item.elRetainerDraft;
  if (d) {
    return {
      contract_start_date: toDateOnlyField(d.contract_start_date),
      contract_end_date: toDateOnlyField(d.contract_end_date),
      billing_timing: d.billing_timing
    };
  }
  return defaultRetainer();
};

const trimDesc = (s: string) => (String(s).trim() === '' ? null : String(s).trim());
const trimDate = (s: string) => (String(s).trim() === '' ? null : String(s).trim().slice(0, 10));

const buildTerminsOrderedPayload = (
  paymentMethod: EngagementPaymentMethod,
  dp: TerminEditableRow,
  installments: TerminEditableRow[],
  final: TerminEditableRow
) => {
  if (paymentMethod !== 'TERMIN') return [];
  return [
    {
      term_name: dp.term_name.trim(),
      percentage: Number(String(dp.percentage).replace(',', '.')),
      description: trimDesc(dp.description),
      billing_schedule_date: trimDate(dp.billing_schedule_date)
    },
    ...installments.map((t) => ({
      term_name: t.term_name.trim(),
      percentage: Number(String(t.percentage).replace(',', '.')),
      description: trimDesc(t.description),
      billing_schedule_date: trimDate(t.billing_schedule_date)
    })),
    {
      term_name: final.term_name.trim(),
      percentage: Number(String(final.percentage).replace(',', '.')),
      description: trimDesc(final.description),
      billing_schedule_date: trimDate(final.billing_schedule_date)
    }
  ];
};

const buildFormData = (
  action: 'draft' | 'submit',
  issuer: EngagementIssuerCompany,
  agreedFee: number,
  paymentMethod: EngagementPaymentMethod,
  dp: TerminEditableRow,
  installments: TerminEditableRow[],
  final: TerminEditableRow,
  ret: ReturnType<typeof defaultRetainer>,
  file: File | null
): FormData => {
  const fd = new FormData();
  fd.append('action', action);
  fd.append('issuer_company', issuer);
  fd.append('agreed_fee', String(agreedFee));
  fd.append('payment_method', paymentMethod);
  if (paymentMethod === 'TERMIN') {
    fd.append('termins_json', JSON.stringify(buildTerminsOrderedPayload(paymentMethod, dp, installments, final)));
  } else {
    fd.append(
      'retainer_json',
      JSON.stringify({
        contract_start_date: ret.contract_start_date.trim(),
        contract_end_date: ret.contract_end_date.trim(),
        billing_timing: ret.billing_timing
      })
    );
  }
  if (file) {
    fd.append('engagement_document', file);
  }
  return fd;
};

export const EngagementLetterFormDialog = ({
  open,
  mode,
  initialEngagement,
  busy = false,
  busyAction = null,
  onClose,
  onSubmit,
  onRequestSubmitConfirm
}: EngagementLetterFormDialogProps) => {
  const [issuer, setIssuer] = useState<EngagementIssuerCompany>('DSK');
  const [agreedFee, setAgreedFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<EngagementPaymentMethod>('TERMIN');
  const [dpRow, setDpRow] = useState<TerminEditableRow>(() => defaultDp());
  const [finalRow, setFinalRow] = useState<TerminEditableRow>(() => defaultFinal());
  const [installments, setInstallments] = useState<TerminEditableRow[]>([]);
  const [retainerState, setRetainerState] = useState(() => defaultRetainer());
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<EngagementLetterFormErrors>({});
  const [localError, setLocalError] = useState<string | null>(null);
  const hasExistingDocument = Boolean(
    mode === 'edit' && initialEngagement?.document?.filePath && String(initialEngagement.document.filePath).trim() !== ''
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setLocalError(null);
    setErrors({});
    setFile(null);
    if (mode === 'edit' && initialEngagement) {
      setIssuer(initialEngagement.issuerCompany);
      setAgreedFee(
        initialEngagement.agreedFeeAmount != null && Number.isFinite(initialEngagement.agreedFeeAmount)
          ? initialEngagement.agreedFeeAmount
          : 0
      );
      setPaymentMethod(initialEngagement.paymentMethod);
      if (initialEngagement.paymentMethod === 'TERMIN') {
        const parts = mapItemToTerminParts(initialEngagement);
        setDpRow(parts.dp);
        setFinalRow(parts.final);
        setInstallments(parts.installments);
      } else {
        setDpRow(defaultDp());
        setFinalRow(defaultFinal());
        setInstallments([]);
      }
      setRetainerState(mapItemToRetainer(initialEngagement));
    } else {
      setIssuer('DSK');
      setAgreedFee(0);
      setPaymentMethod('TERMIN');
      setDpRow(defaultDp());
      setFinalRow(defaultFinal());
      setInstallments([]);
      setRetainerState(defaultRetainer());
    }
  }, [open, mode, initialEngagement?.id]);

  const updateInstallment = (index: number, patch: Partial<TerminEditableRow>) => {
    setInstallments((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addInstallmentRow = () => {
    setInstallments((prev) => [...prev, defaultInstallment()]);
  };

  const removeInstallmentRow = (index: number) => {
    setInstallments((prev) => prev.filter((_, i) => i !== index));
  };

  const clearFieldError = (key: keyof EngagementLetterFormErrors) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateAndBuild = (intent: 'draft' | 'submit') => {
    const validationErrors = validateEngagementLetterForm({
      mode,
      issuer,
      agreedFee,
      paymentMethod,
      dp: dpRow,
      installments,
      final: finalRow,
      retainer: retainerState,
      file,
      intent,
      hasExistingDocument
    });
    if (hasEngagementLetterFormErrors(validationErrors)) {
      setErrors(validationErrors);
      return null;
    }
    setErrors({});
    return buildFormData(intent, issuer, agreedFee, paymentMethod, dpRow, installments, finalRow, retainerState, file);
  };

  const runSubmit = async (intent: 'draft' | 'submit') => {
    const fd = validateAndBuild(intent);
    if (!fd) return;
    setLocalError(null);
    try {
      await onSubmit(fd, intent);
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Gagal memproses engagement letter.';
      setLocalError(message);
    }
  };

  const handleSaveDraft = async () => {
    await runSubmit('draft');
  };

  const handleClose = () => {
    if (busy) return;
    setLocalError(null);
    onClose();
  };

  const tryOpenSubmitConfirm = () => {
    const fd = validateAndBuild('submit');
    if (!fd) return;
    setLocalError(null);
    if (onRequestSubmitConfirm) {
      onRequestSubmitConfirm(fd);
      return;
    }
    void runSubmit('submit');
  };

  if (!open) {
    return null;
  }

  const billingScheduleMin = getLocalTodayIsoDate();

  return (
    <>
      <SidePanelDialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
        <SidePanelDialogHeader
          title={mode === 'create' ? 'Create Engagement Letter' : 'Edit Engagement Letter'}
          description="Simpan draft atau langsung ajukan ke CEO. PDF maks. 20 MB. Validasi lengkap di server."
        />
        <div className="flex min-h-0 flex-1 flex-col">
          <SidePanelDialogBody>
            {localError ? <p className="mb-3 text-sm text-red-600">{localError}</p> : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <LeadCoreFieldLabel required>Issuer company</LeadCoreFieldLabel>
                <select
                  id="el-issuer"
                  value={issuer}
                  onChange={(e) => {
                    clearFieldError('issuerCompany');
                    setIssuer(e.target.value as EngagementIssuerCompany);
                  }}
                  className={leadCoreInputClassName}
                  disabled={busy}
                >
                  <option value="DSK">DSK</option>
                  <option value="DTAX">DTAX</option>
                </select>
                <LeadCoreFieldError message={errors.issuerCompany} />
              </div>
              <div>
                <LeadCoreFieldLabel required>Agreed fee (Rp)</LeadCoreFieldLabel>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    Rp
                  </span>
                  <input
                    id="el-fee"
                    type="text"
                    inputMode="numeric"
                    value={formatRupiahInput(agreedFee)}
                    onChange={(e) => {
                      clearFieldError('agreedFee');
                      setAgreedFee(parseRupiahInput(e.target.value));
                    }}
                    className={`${leadCoreInputClassName} pl-10`}
                    disabled={busy}
                    placeholder="contoh: 100.000.000"
                  />
                </div>
                <LeadCoreFieldError message={errors.agreedFee} />
              </div>
              <div className="sm:col-span-2">
                <LeadCoreFieldLabel required>Payment method</LeadCoreFieldLabel>
                <select
                  id="el-payment"
                  value={paymentMethod}
                  onChange={(e) => {
                    const v = e.target.value as EngagementPaymentMethod;
                    setPaymentMethod(v);
                    setErrors({});
                    if (v === 'TERMIN') {
                      setDpRow(defaultDp());
                      setFinalRow(defaultFinal());
                      setInstallments([]);
                    } else {
                      setRetainerState(defaultRetainer());
                    }
                  }}
                  className={leadCoreInputClassName}
                  disabled={busy}
                >
                  <option value="TERMIN">Termin</option>
                  <option value="RETAINER">Retainer</option>
                </select>
              </div>
            </div>

            {paymentMethod === 'TERMIN' ? (
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">Termin</h3>
                  <button
                    type="button"
                    onClick={addInstallmentRow}
                    disabled={busy}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-[#003c90] hover:bg-slate-50 disabled:opacity-50"
                  >
                    Tambah baris (cicilan)
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Down Payment selalu di atas, Pelunasan selalu di bawah. Baris tambahan = cicilan di tengah.
                </p>
                <LeadCoreFieldError message={errors.terminsTotal} />

                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  <p className="mb-2 text-[11px] font-bold uppercase text-slate-500">Down Payment</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={labelClassName}>Nama termin</label>
                      <input
                        value={dpRow.term_name}
                        onChange={(e) => {
                          clearFieldError('dpTermName');
                          setDpRow((r) => ({ ...r, term_name: e.target.value }));
                        }}
                        className={leadCoreInputClassName}
                        disabled={busy}
                        placeholder="Down Payment"
                      />
                      <LeadCoreFieldError message={errors.dpTermName} />
                    </div>
                    <div>
                      <label className={labelClassName}>Percentage (%)</label>
                      <input
                        type="number"
                        min={0.01}
                        step={0.01}
                        value={dpRow.percentage}
                        onChange={(e) => {
                          clearFieldError('dpPercentage');
                          clearFieldError('terminsTotal');
                          setDpRow((r) => ({ ...r, percentage: e.target.value }));
                        }}
                        className={leadCoreInputClassName}
                        disabled={busy}
                        placeholder="contoh: 30"
                      />
                      <LeadCoreFieldError message={errors.dpPercentage} />
                    </div>
                    <div>
                      <LeadCoreFieldLabel required>Billing schedule</LeadCoreFieldLabel>
                      <input
                        type="date"
                        value={dpRow.billing_schedule_date}
                        min={billingScheduleMin}
                        onChange={(e) => {
                          clearFieldError('dpBillingSchedule');
                          setDpRow((r) => ({ ...r, billing_schedule_date: e.target.value }));
                        }}
                        className={leadCoreInputClassName}
                        disabled={busy}
                        title="Jadwal penagihan"
                      />
                      <LeadCoreFieldError message={errors.dpBillingSchedule} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClassName}>Deskripsi (opsional)</label>
                      <input
                        value={dpRow.description}
                        onChange={(e) => setDpRow((r) => ({ ...r, description: e.target.value }))}
                        className={leadCoreInputClassName}
                        disabled={busy}
                        placeholder="Keterangan (opsional)"
                      />
                    </div>
                  </div>
                </div>

                {installments.map((row, idx) => (
                  <div key={`ins-${idx}`} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase text-slate-500">Cicilan {idx + 1}</p>
                      <button
                        type="button"
                        onClick={() => removeInstallmentRow(idx)}
                        disabled={busy}
                        className="text-xs font-semibold text-red-700 hover:underline disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className={labelClassName}>Nama termin</label>
                        <input
                          value={row.term_name}
                          onChange={(e) => {
                            setErrors((prev) => {
                              if (!prev.installmentItems?.[idx]) return prev;
                              const items = { ...prev.installmentItems };
                              delete items[idx];
                              return { ...prev, installmentItems: Object.keys(items).length ? items : undefined };
                            });
                            updateInstallment(idx, { term_name: e.target.value });
                          }}
                          className={leadCoreInputClassName}
                          disabled={busy}
                          placeholder="Installment"
                        />
                        <LeadCoreFieldError message={errors.installmentItems?.[idx]} />
                      </div>
                      <div>
                        <label className={labelClassName}>Percentage (%)</label>
                        <input
                          type="number"
                          min={0.01}
                          step={0.01}
                          value={row.percentage}
                          onChange={(e) => updateInstallment(idx, { percentage: e.target.value })}
                          className={leadCoreInputClassName}
                          disabled={busy}
                        />
                      </div>
                      <div>
                        <LeadCoreFieldLabel required>Billing schedule</LeadCoreFieldLabel>
                        <input
                          type="date"
                          value={row.billing_schedule_date}
                          min={billingScheduleMin}
                          onChange={(e) => {
                            setErrors((prev) => {
                              if (!prev.installmentBillingItems?.[idx]) return prev;
                              const items = { ...prev.installmentBillingItems };
                              delete items[idx];
                              return {
                                ...prev,
                                installmentBillingItems: Object.keys(items).length ? items : undefined
                              };
                            });
                            updateInstallment(idx, { billing_schedule_date: e.target.value });
                          }}
                          className={leadCoreInputClassName}
                          disabled={busy}
                        />
                        <LeadCoreFieldError message={errors.installmentBillingItems?.[idx]} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClassName}>Deskripsi (opsional)</label>
                        <input
                          value={row.description}
                          onChange={(e) => updateInstallment(idx, { description: e.target.value })}
                          className={leadCoreInputClassName}
                          disabled={busy}
                          placeholder="Keterangan (opsional)"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  <p className="mb-2 text-[11px] font-bold uppercase text-slate-500">Pelunasan</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={labelClassName}>Nama termin</label>
                      <input
                        value={finalRow.term_name}
                        onChange={(e) => {
                          clearFieldError('finalTermName');
                          setFinalRow((r) => ({ ...r, term_name: e.target.value }));
                        }}
                        className={leadCoreInputClassName}
                        disabled={busy}
                        placeholder="Pelunasan"
                      />
                      <LeadCoreFieldError message={errors.finalTermName} />
                    </div>
                    <div>
                      <label className={labelClassName}>Percentage (%)</label>
                      <input
                        type="number"
                        min={0.01}
                        step={0.01}
                        value={finalRow.percentage}
                        onChange={(e) => {
                          clearFieldError('finalPercentage');
                          clearFieldError('terminsTotal');
                          setFinalRow((r) => ({ ...r, percentage: e.target.value }));
                        }}
                        className={leadCoreInputClassName}
                        disabled={busy}
                        placeholder="contoh: 50"
                      />
                      <LeadCoreFieldError message={errors.finalPercentage} />
                    </div>
                    <div>
                      <LeadCoreFieldLabel required>Billing schedule</LeadCoreFieldLabel>
                      <input
                        type="date"
                        value={finalRow.billing_schedule_date}
                        min={billingScheduleMin}
                        onChange={(e) => {
                          clearFieldError('finalBillingSchedule');
                          setFinalRow((r) => ({ ...r, billing_schedule_date: e.target.value }));
                        }}
                        className={leadCoreInputClassName}
                        disabled={busy}
                      />
                      <LeadCoreFieldError message={errors.finalBillingSchedule} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClassName}>Deskripsi (opsional)</label>
                      <input
                        value={finalRow.description}
                        onChange={(e) => setFinalRow((r) => ({ ...r, description: e.target.value }))}
                        className={leadCoreInputClassName}
                        disabled={busy}
                        placeholder="Keterangan (opsional)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <LeadCoreFieldLabel required>Contract start</LeadCoreFieldLabel>
                  <input
                    type="date"
                    value={retainerState.contract_start_date}
                    onChange={(e) => {
                      clearFieldError('retainerContractStart');
                      setRetainerState((r) => ({ ...r, contract_start_date: e.target.value }));
                    }}
                    className={leadCoreInputClassName}
                    disabled={busy}
                    title="Tanggal mulai kontrak retainer"
                  />
                  <LeadCoreFieldError message={errors.retainerContractStart} />
                </div>
                <div className="sm:col-span-2">
                  <LeadCoreFieldLabel required>Contract end</LeadCoreFieldLabel>
                  <input
                    type="date"
                    value={retainerState.contract_end_date}
                    onChange={(e) => {
                      clearFieldError('retainerContractEnd');
                      setRetainerState((r) => ({ ...r, contract_end_date: e.target.value }));
                    }}
                    className={leadCoreInputClassName}
                    disabled={busy}
                    title="Tanggal berakhir kontrak retainer"
                  />
                  <LeadCoreFieldError message={errors.retainerContractEnd} />
                </div>
                <div className="sm:col-span-2">
                  <LeadCoreFieldLabel required>Billing timing</LeadCoreFieldLabel>
                  <select
                    value={retainerState.billing_timing}
                    onChange={(e) => {
                      clearFieldError('retainerBillingTiming');
                      setRetainerState((r) => ({
                        ...r,
                        billing_timing: e.target.value as 'BEGINNING_OF_MONTH' | 'END_OF_MONTH'
                      }));
                    }}
                    className={leadCoreInputClassName}
                    disabled={busy}
                  >
                    <option value="BEGINNING_OF_MONTH">Awal bulan</option>
                    <option value="END_OF_MONTH">Akhir bulan</option>
                  </select>
                  <LeadCoreFieldError message={errors.retainerBillingTiming} />
                </div>
              </div>
            )}

            <div className="mt-5">
              <LeadCoreFieldLabel required={mode === 'create'}>Upload engagement letter document (PDF)</LeadCoreFieldLabel>
              <div className="mt-2">
                <EngagementLetterDocumentField
                  pendingFile={file}
                  existingDocumentName={
                    mode === 'edit' ? (initialEngagement?.document?.uploadedFileName ?? null) : null
                  }
                  disabled={busy}
                  onSelectFile={(nextFile) => {
                    clearFieldError('engagementDocument');
                    setFile(nextFile);
                  }}
                  onClearPending={() => setFile(null)}
                />
              </div>
              <LeadCoreFieldError message={errors.engagementDocument} />
            </div>
          </SidePanelDialogBody>

          <SidePanelDialogFooter>
            <div className="flex flex-wrap justify-end gap-2">
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
                disabled={busy}
                onClick={() => void handleSaveDraft()}
                className="rounded-lg border border-[#c3c6d5] px-4 py-2 text-sm font-semibold text-[#434653] hover:bg-[#eceef0] disabled:opacity-50"
              >
                {busy && busyAction === 'draft' ? 'Menyimpan…' : 'Save Draft'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => tryOpenSubmitConfirm()}
                className="rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-4 py-2 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy && busyAction === 'submit' ? 'Mengirim…' : 'Submit'}
              </button>
            </div>
          </SidePanelDialogFooter>
        </div>
      </SidePanelDialog>
    </>
  );
};
