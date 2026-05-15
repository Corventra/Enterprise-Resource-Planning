import { useEffect, useState } from 'react';
import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogFooter,
  SidePanelDialogHeader
} from '../../../../components/ui/side-panel-dialog';
import { EngagementLetterDocumentField } from './engagement-letter-document-field';
import { normalizeDateOnlyString } from '../../../../utils/format-date-only';
import type {
  EngagementIssuerCompany,
  EngagementPaymentMethod,
  LeadWorkspaceEngagementLetterItem
} from '../../types/lead-engagement-letters.types';

const toDateOnlyField = (value: string | null | undefined) => normalizeDateOnlyString(value) ?? '';

const inputClassName =
  'h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none';
const labelClassName = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

export type EngagementLetterFormMode = 'create' | 'edit';

/** Satu baris termin (tanpa term_type / sort_order — diatur server). */
export interface TerminEditableRow {
  term_name: string;
  percentage: string;
  description: string;
  billing_schedule_date: string;
}

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

const validateForm = (
  mode: EngagementLetterFormMode,
  issuer: string,
  agreedFee: string,
  paymentMethod: EngagementPaymentMethod,
  dp: TerminEditableRow,
  installments: TerminEditableRow[],
  final: TerminEditableRow,
  ret: ReturnType<typeof defaultRetainer>,
  file: File | null,
  intent: 'draft' | 'submit',
  hasExistingDocument: boolean
): string | null => {
  if (issuer !== 'DSK' && issuer !== 'DTAX') {
    return 'Pilih issuer company.';
  }
  const fee = Number(String(agreedFee).replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(fee) || fee <= 0) {
    return 'Agreed fee wajib lebih besar dari 0.';
  }
  if (mode === 'create' && !file) {
    return 'Unggah dokumen engagement letter (PDF).';
  }
  if (intent === 'submit' && mode === 'edit' && !file && !hasExistingDocument) {
    return 'Dokumen engagement letter wajib ada sebelum submit.';
  }
  if (paymentMethod === 'TERMIN') {
    const rows = [dp, ...installments, final];
    let sum = 0;
    for (const t of rows) {
      const p = Number(String(t.percentage).replace(',', '.'));
      if (!Number.isFinite(p) || p <= 0) {
        return 'Setiap termin wajib percentage > 0.';
      }
      sum += p;
      if (!String(t.term_name).trim()) {
        return 'Nama termin wajib diisi.';
      }
    }
    if (Math.abs(sum - 100) > 0.02) {
      return 'Total percentage termin harus 100%.';
    }
  } else {
    const start = ret.contract_start_date.trim();
    const end = ret.contract_end_date.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
      return 'Tanggal kontrak retainer wajib diisi (format YYYY-MM-DD).';
    }
    if (start > end) {
      return 'Tanggal akhir kontrak tidak boleh lebih kecil dari tanggal mulai.';
    }
    if (ret.billing_timing !== 'BEGINNING_OF_MONTH' && ret.billing_timing !== 'END_OF_MONTH') {
      return 'Pilih billing timing retainer.';
    }
  }
  return null;
};

const buildFormData = (
  action: 'draft' | 'submit',
  issuer: EngagementIssuerCompany,
  agreedFee: string,
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
  fd.append('agreed_fee', String(agreedFee).replace(/\s/g, '').replace(',', '.'));
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
  const [agreedFee, setAgreedFee] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<EngagementPaymentMethod>('TERMIN');
  const [dpRow, setDpRow] = useState<TerminEditableRow>(() => defaultDp());
  const [finalRow, setFinalRow] = useState<TerminEditableRow>(() => defaultFinal());
  const [installments, setInstallments] = useState<TerminEditableRow[]>([]);
  const [retainerState, setRetainerState] = useState(() => defaultRetainer());
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const hasExistingDocument = Boolean(
    mode === 'edit' && initialEngagement?.document?.filePath && String(initialEngagement.document.filePath).trim() !== ''
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setLocalError(null);
    setFile(null);
    if (mode === 'edit' && initialEngagement) {
      setIssuer(initialEngagement.issuerCompany);
      setAgreedFee(
        initialEngagement.agreedFeeAmount != null && Number.isFinite(initialEngagement.agreedFeeAmount)
          ? String(initialEngagement.agreedFeeAmount)
          : ''
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
      setAgreedFee('');
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

  const runSubmit = async (intent: 'draft' | 'submit') => {
    const err = validateForm(
      mode,
      issuer,
      agreedFee,
      paymentMethod,
      dpRow,
      installments,
      finalRow,
      retainerState,
      file,
      intent,
      hasExistingDocument
    );
    if (err) {
      setLocalError(err);
      return;
    }
    setLocalError(null);
    const fd = buildFormData(intent, issuer, agreedFee, paymentMethod, dpRow, installments, finalRow, retainerState, file);
    await onSubmit(fd, intent);
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
    const err = validateForm(
      mode,
      issuer,
      agreedFee,
      paymentMethod,
      dpRow,
      installments,
      finalRow,
      retainerState,
      file,
      'submit',
      hasExistingDocument
    );
    if (err) {
      setLocalError(err);
      return;
    }
    setLocalError(null);
    const fd = buildFormData(
      'submit',
      issuer,
      agreedFee,
      paymentMethod,
      dpRow,
      installments,
      finalRow,
      retainerState,
      file
    );
    if (onRequestSubmitConfirm) {
      onRequestSubmitConfirm(fd);
      return;
    }
    void runSubmit('submit');
  };

  if (!open) {
    return null;
  }

  return (
    <>
      <SidePanelDialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
        <SidePanelDialogHeader
          title={mode === 'create' ? 'Create Engagement Letter' : 'Edit Engagement Letter'}
          description="Simpan draft atau langsung ajukan ke CEO. PDF maks. 20 MB. Validasi lengkap di server."
        />
        <div className="flex min-h-0 flex-1 flex-col">
          <SidePanelDialogBody>
            {localError ? (
              <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{localError}</p>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClassName} htmlFor="el-issuer">
                  Issuer company
                </label>
                <select
                  id="el-issuer"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value as EngagementIssuerCompany)}
                  className={inputClassName}
                  disabled={busy}
                >
                  <option value="DSK">DSK</option>
                  <option value="DTAX">DTAX</option>
                </select>
              </div>
              <div>
                <label className={labelClassName} htmlFor="el-fee">
                  Agreed fee (IDR)
                </label>
                <input
                  id="el-fee"
                  type="number"
                  min={1}
                  step={1}
                  value={agreedFee}
                  onChange={(e) => setAgreedFee(e.target.value)}
                  className={inputClassName}
                  disabled={busy}
                  placeholder="contoh: 150000000"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClassName} htmlFor="el-payment">
                  Payment method
                </label>
                <select
                  id="el-payment"
                  value={paymentMethod}
                  onChange={(e) => {
                    const v = e.target.value as EngagementPaymentMethod;
                    setPaymentMethod(v);
                    if (v === 'TERMIN') {
                      setDpRow(defaultDp());
                      setFinalRow(defaultFinal());
                      setInstallments([]);
                    } else {
                      setRetainerState(defaultRetainer());
                    }
                  }}
                  className={inputClassName}
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

                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  <p className="mb-2 text-[11px] font-bold uppercase text-slate-500">Down Payment</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={labelClassName}>Nama termin</label>
                      <input
                        value={dpRow.term_name}
                        onChange={(e) => setDpRow((r) => ({ ...r, term_name: e.target.value }))}
                        className={inputClassName}
                        disabled={busy}
                        placeholder="Down Payment"
                      />
                    </div>
                    <div>
                      <label className={labelClassName}>Percentage (%)</label>
                      <input
                        type="number"
                        min={0.01}
                        step={0.01}
                        value={dpRow.percentage}
                        onChange={(e) => setDpRow((r) => ({ ...r, percentage: e.target.value }))}
                        className={inputClassName}
                        disabled={busy}
                        placeholder="contoh: 30"
                      />
                    </div>
                    <div>
                      <label className={labelClassName}>Billing schedule (opsional)</label>
                      <input
                        type="date"
                        value={dpRow.billing_schedule_date}
                        onChange={(e) => setDpRow((r) => ({ ...r, billing_schedule_date: e.target.value }))}
                        className={inputClassName}
                        disabled={busy}
                        title="Jadwal penagihan"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClassName}>Deskripsi (opsional)</label>
                      <input
                        value={dpRow.description}
                        onChange={(e) => setDpRow((r) => ({ ...r, description: e.target.value }))}
                        className={inputClassName}
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
                          onChange={(e) => updateInstallment(idx, { term_name: e.target.value })}
                          className={inputClassName}
                          disabled={busy}
                          placeholder="Installment"
                        />
                      </div>
                      <div>
                        <label className={labelClassName}>Percentage (%)</label>
                        <input
                          type="number"
                          min={0.01}
                          step={0.01}
                          value={row.percentage}
                          onChange={(e) => updateInstallment(idx, { percentage: e.target.value })}
                          className={inputClassName}
                          disabled={busy}
                        />
                      </div>
                      <div>
                        <label className={labelClassName}>Billing schedule (opsional)</label>
                        <input
                          type="date"
                          value={row.billing_schedule_date}
                          onChange={(e) => updateInstallment(idx, { billing_schedule_date: e.target.value })}
                          className={inputClassName}
                          disabled={busy}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClassName}>Deskripsi (opsional)</label>
                        <input
                          value={row.description}
                          onChange={(e) => updateInstallment(idx, { description: e.target.value })}
                          className={inputClassName}
                          disabled={busy}
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
                        onChange={(e) => setFinalRow((r) => ({ ...r, term_name: e.target.value }))}
                        className={inputClassName}
                        disabled={busy}
                        placeholder="Pelunasan"
                      />
                    </div>
                    <div>
                      <label className={labelClassName}>Percentage (%)</label>
                      <input
                        type="number"
                        min={0.01}
                        step={0.01}
                        value={finalRow.percentage}
                        onChange={(e) => setFinalRow((r) => ({ ...r, percentage: e.target.value }))}
                        className={inputClassName}
                        disabled={busy}
                        placeholder="contoh: 50"
                      />
                    </div>
                    <div>
                      <label className={labelClassName}>Billing schedule (opsional)</label>
                      <input
                        type="date"
                        value={finalRow.billing_schedule_date}
                        onChange={(e) => setFinalRow((r) => ({ ...r, billing_schedule_date: e.target.value }))}
                        className={inputClassName}
                        disabled={busy}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClassName}>Deskripsi (opsional)</label>
                      <input
                        value={finalRow.description}
                        onChange={(e) => setFinalRow((r) => ({ ...r, description: e.target.value }))}
                        className={inputClassName}
                        disabled={busy}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClassName}>Contract start</label>
                  <input
                    type="date"
                    value={retainerState.contract_start_date}
                    onChange={(e) => setRetainerState((r) => ({ ...r, contract_start_date: e.target.value }))}
                    className={inputClassName}
                    disabled={busy}
                    title="Tanggal mulai kontrak retainer"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClassName}>Contract end</label>
                  <input
                    type="date"
                    value={retainerState.contract_end_date}
                    onChange={(e) => setRetainerState((r) => ({ ...r, contract_end_date: e.target.value }))}
                    className={inputClassName}
                    disabled={busy}
                    title="Tanggal berakhir kontrak retainer"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClassName}>Billing timing</label>
                  <select
                    value={retainerState.billing_timing}
                    onChange={(e) =>
                      setRetainerState((r) => ({
                        ...r,
                        billing_timing: e.target.value as 'BEGINNING_OF_MONTH' | 'END_OF_MONTH'
                      }))
                    }
                    className={inputClassName}
                    disabled={busy}
                  >
                    <option value="BEGINNING_OF_MONTH">Awal bulan</option>
                    <option value="END_OF_MONTH">Akhir bulan</option>
                  </select>
                </div>
              </div>
            )}

            <div className="mt-5">
              <label className={labelClassName}>
                Upload engagement letter document (PDF)
                {mode === 'create' ? <span className="text-red-600"> *</span> : null}
              </label>
              <div className="mt-2">
                <EngagementLetterDocumentField
                  pendingFile={file}
                  existingDocumentName={
                    mode === 'edit' ? (initialEngagement?.document?.uploadedFileName ?? null) : null
                  }
                  disabled={busy}
                  onSelectFile={setFile}
                  onClearPending={() => setFile(null)}
                />
              </div>
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
