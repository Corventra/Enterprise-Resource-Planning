import type { EngagementPaymentMethod } from '../types/lead-engagement-letters.types';

export interface TerminEditableRow {
  term_name: string;
  percentage: string;
  description: string;
  billing_schedule_date: string;
}

export interface EngagementLetterFormErrors {
  issuerCompany?: string;
  agreedFee?: string;
  engagementDocument?: string;
  terminsTotal?: string;
  dpTermName?: string;
  dpPercentage?: string;
  dpBillingSchedule?: string;
  finalTermName?: string;
  finalPercentage?: string;
  finalBillingSchedule?: string;
  installmentItems?: Record<number, string>;
  installmentBillingItems?: Record<number, string>;
  retainerContractStart?: string;
  retainerContractEnd?: string;
  retainerBillingTiming?: string;
}

export interface ValidateEngagementLetterFormInput {
  mode: 'create' | 'edit';
  issuer: string;
  agreedFee: number;
  paymentMethod: EngagementPaymentMethod;
  dp: TerminEditableRow;
  installments: TerminEditableRow[];
  final: TerminEditableRow;
  retainer: {
    contract_start_date: string;
    contract_end_date: string;
    billing_timing: 'BEGINNING_OF_MONTH' | 'END_OF_MONTH';
  };
  file: File | null;
  intent: 'draft' | 'submit';
  hasExistingDocument: boolean;
}

const hasIndexedErrors = (items?: Record<number, string>) => Boolean(items && Object.keys(items).length > 0);

export const hasEngagementLetterFormErrors = (errors: EngagementLetterFormErrors): boolean => {
  for (const [key, value] of Object.entries(errors)) {
    if (key === 'installmentItems' || key === 'installmentBillingItems') {
      if (hasIndexedErrors(value as Record<number, string> | undefined)) return true;
      continue;
    }
    if (value) return true;
  }
  return false;
};

const isValidBillingScheduleDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(String(value).trim());

export const validateEngagementLetterForm = (input: ValidateEngagementLetterFormInput): EngagementLetterFormErrors => {
  const errors: EngagementLetterFormErrors = {};

  if (input.issuer !== 'DSK' && input.issuer !== 'DTAX') {
    errors.issuerCompany = 'Issuer company wajib dipilih.';
  }

  if (!Number.isFinite(input.agreedFee) || input.agreedFee <= 0) {
    errors.agreedFee = 'Agreed fee wajib diisi dan harus lebih besar dari 0.';
  }

  if (input.mode === 'create' && !input.file) {
    errors.engagementDocument = 'Dokumen engagement letter (PDF) wajib diunggah.';
  }
  if (input.intent === 'submit' && input.mode === 'edit' && !input.file && !input.hasExistingDocument) {
    errors.engagementDocument = 'Dokumen engagement letter wajib ada sebelum submit.';
  }

  if (input.paymentMethod === 'TERMIN') {
    const rows = [input.dp, ...input.installments, input.final];
    let sum = 0;
    const installmentItems: Record<number, string> = {};
    const installmentBillingItems: Record<number, string> = {};

    rows.forEach((row, index) => {
      const isDp = index === 0;
      const isFinal = index === rows.length - 1;
      const installmentIndex = index - 1;

      if (!String(row.term_name).trim()) {
        if (isDp) errors.dpTermName = 'Nama termin wajib diisi.';
        else if (isFinal) errors.finalTermName = 'Nama termin wajib diisi.';
        else installmentItems[installmentIndex] = 'Nama termin wajib diisi.';
      }

      const percentage = Number(String(row.percentage).replace(',', '.'));
      if (!Number.isFinite(percentage) || percentage <= 0) {
        if (isDp) errors.dpPercentage = 'Percentage wajib lebih besar dari 0.';
        else if (isFinal) errors.finalPercentage = 'Percentage wajib lebih besar dari 0.';
        else if (!installmentItems[installmentIndex]) {
          installmentItems[installmentIndex] = 'Percentage wajib lebih besar dari 0.';
        }
      } else {
        sum += percentage;
      }

      if (!isValidBillingScheduleDate(row.billing_schedule_date)) {
        if (isDp) errors.dpBillingSchedule = 'Billing schedule wajib diisi.';
        else if (isFinal) errors.finalBillingSchedule = 'Billing schedule wajib diisi.';
        else installmentBillingItems[installmentIndex] = 'Billing schedule wajib diisi.';
      }
    });

    if (Object.keys(installmentItems).length > 0) {
      errors.installmentItems = installmentItems;
    }
    if (Object.keys(installmentBillingItems).length > 0) {
      errors.installmentBillingItems = installmentBillingItems;
    }

    if (!errors.terminsTotal && Math.abs(sum - 100) > 0.02) {
      errors.terminsTotal = 'Total percentage termin harus 100%.';
    }
  } else {
    const start = input.retainer.contract_start_date.trim();
    const end = input.retainer.contract_end_date.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) {
      errors.retainerContractStart = 'Tanggal mulai kontrak wajib diisi.';
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(end)) {
      errors.retainerContractEnd = 'Tanggal akhir kontrak wajib diisi.';
    }
    if (start && end && start > end) {
      errors.retainerContractEnd = 'Tanggal akhir tidak boleh lebih kecil dari tanggal mulai.';
    }
    if (
      input.retainer.billing_timing !== 'BEGINNING_OF_MONTH' &&
      input.retainer.billing_timing !== 'END_OF_MONTH'
    ) {
      errors.retainerBillingTiming = 'Billing timing wajib dipilih.';
    }
  }

  const cleaned: EngagementLetterFormErrors = {};
  for (const [key, value] of Object.entries(errors)) {
    if (key === 'installmentItems' || key === 'installmentBillingItems') {
      const items = value as Record<number, string> | undefined;
      if (items && Object.keys(items).length > 0) {
        cleaned[key as 'installmentItems' | 'installmentBillingItems'] = items;
      }
      continue;
    }
    if (value) {
      cleaned[key as keyof Omit<EngagementLetterFormErrors, 'installmentItems' | 'installmentBillingItems'>] =
        value as string;
    }
  }
  return cleaned;
};
