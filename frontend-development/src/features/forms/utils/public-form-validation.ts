import type { PublicFormField, PublicFormAnswerValue } from '../types/public-form.types';
import { parseFileUploadSettings, validateSelectedFile } from './file-upload-rules';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isEmptyValue = (value: PublicFormAnswerValue | undefined): boolean => {
  if (value === undefined || value === null) return true;
  if (Array.isArray(value)) return value.length === 0;
  return value.trim() === '';
};

export const validatePublicFormAnswers = (
  fields: PublicFormField[],
  answers: Record<number, PublicFormAnswerValue>,
  files: Record<number, File>
): Record<number, string> => {
  const errors: Record<number, string> = {};

  for (const field of fields) {
    if (field.field_type === 'file') {
      const file = files[field.field_id];
      if (field.is_required && !file) {
        errors[field.field_id] = 'File wajib diunggah.';
        continue;
      }
      if (!file) continue;
      const settings = parseFileUploadSettings(field.settings_json);
      const fileError = validateSelectedFile(file, settings);
      if (fileError) {
        errors[field.field_id] = fileError;
      }
      continue;
    }

    const value = answers[field.field_id];

    if (field.is_required && isEmptyValue(value)) {
      errors[field.field_id] = 'Field ini wajib diisi.';
      continue;
    }

    if (isEmptyValue(value)) continue;

    if (field.field_key === 'contact_email') {
      const s = String(value).trim();
      if (!EMAIL_RE.test(s)) {
        errors[field.field_id] = 'Format email tidak valid.';
      }
      continue;
    }

    if (field.field_key === 'contact_phone') {
      const cleaned = String(value).replace(/[\s-]/g, '');
      const digitCount = cleaned.replace(/\D/g, '').length;
      if (!/^\+?[0-9]+$/.test(cleaned) || digitCount < 7 || digitCount > 13) {
        errors[field.field_id] = 'Nomor telepon harus 7–13 digit.';
      }
      continue;
    }

    if (field.field_type === 'date') {
      if (Number.isNaN(Date.parse(String(value).trim()))) {
        errors[field.field_id] = 'Tanggal tidak valid.';
      }
      continue;
    }

    if (field.field_type === 'select' || field.field_type === 'radio') {
      const s = String(value);
      const allowed = new Set(field.options.map((o) => o.value));
      if (!allowed.has(s)) {
        errors[field.field_id] = 'Pilihan tidak valid.';
      }
      continue;
    }

    if (field.field_type === 'checkbox') {
      const values = Array.isArray(value) ? value : [String(value)];
      const allowed = new Set(field.options.map((o) => o.value));
      for (const v of values) {
        if (!allowed.has(v)) {
          errors[field.field_id] = 'Pilihan tidak valid.';
          break;
        }
      }
    }
  }

  return errors;
};

export const buildSubmitAnswers = (
  fields: PublicFormField[],
  answers: Record<number, PublicFormAnswerValue>
): { field_id: number; value: PublicFormAnswerValue }[] => {
  const rows: { field_id: number; value: PublicFormAnswerValue }[] = [];
  for (const field of fields) {
    if (field.field_type === 'file') continue;
    const value = answers[field.field_id];
    if (isEmptyValue(value)) continue;
    if (field.field_type === 'checkbox') {
      rows.push({ field_id: field.field_id, value: Array.isArray(value) ? value : [String(value)] });
    } else {
      rows.push({ field_id: field.field_id, value: String(value).trim() });
    }
  }
  return rows;
};
