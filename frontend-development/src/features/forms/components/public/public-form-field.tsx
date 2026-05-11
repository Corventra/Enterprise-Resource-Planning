import type { PublicFormAnswerValue, PublicFormField } from '../../types/public-form.types';
import { buildFileUploadAllowedTypesHint } from '../../utils/file-upload-categories';
import { buildFileAcceptAttribute, parseFileUploadSettings } from '../../utils/file-upload-rules';

const inputClass =
  'mt-2 w-full rounded-lg border border-[#c3c6d5] bg-white px-3 py-2.5 text-sm text-[#191c1e] shadow-sm outline-none transition focus:border-[#003c90] focus:ring-2 focus:ring-[#003c90]/15 disabled:cursor-not-allowed disabled:bg-[#f7f9fb] disabled:text-[#737784]';

interface PublicFormFieldInputProps {
  field: PublicFormField;
  value: PublicFormAnswerValue | undefined;
  fileValue?: File | null;
  disabled: boolean;
  error?: string;
  onChange: (value: PublicFormAnswerValue) => void;
  onFileChange?: (file: File | null) => void;
}

export const PublicFormFieldInput = ({
  field,
  value,
  fileValue,
  disabled,
  error,
  onChange,
  onFileChange
}: PublicFormFieldInputProps) => {
  const fieldId = `public-field-${field.field_id}`;
  const helpId = field.help_text ? `${fieldId}-help` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;

  const renderControl = () => {
    switch (field.field_type) {
      case 'textarea':
        return (
          <textarea
            id={fieldId}
            rows={4}
            disabled={disabled}
            placeholder={field.placeholder ?? undefined}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            aria-describedby={describedBy}
            className={inputClass}
          />
        );
      case 'select':
        return (
          <select
            id={fieldId}
            disabled={disabled}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            aria-describedby={describedBy}
            className={inputClass}
          >
            <option value="">{field.placeholder ?? 'Pilih…'}</option>
            {field.options.map((opt) => (
              <option key={opt.option_id} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      case 'radio':
        return (
          <div className="mt-2 space-y-2" role="radiogroup" aria-labelledby={`${fieldId}-label`}>
            {field.options.map((opt) => (
              <label
                key={opt.option_id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#eceef0] bg-white px-3 py-2 text-sm text-[#434653] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
              >
                <input
                  type="radio"
                  name={fieldId}
                  disabled={disabled}
                  checked={value === opt.value}
                  onChange={() => onChange(opt.value)}
                  className="h-4 w-4 text-[#003c90]"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        );
      case 'checkbox': {
        const selected = Array.isArray(value) ? value : [];
        const toggle = (optValue: string) => {
          if (disabled) return;
          if (selected.includes(optValue)) {
            onChange(selected.filter((v) => v !== optValue));
          } else {
            onChange([...selected, optValue]);
          }
        };
        return (
          <div className="mt-2 space-y-2" role="group" aria-labelledby={`${fieldId}-label`}>
            {field.options.map((opt) => (
              <label
                key={opt.option_id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#eceef0] bg-white px-3 py-2 text-sm text-[#434653] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
              >
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                  className="h-4 w-4 rounded border-[#c3c6d5] text-[#003c90]"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        );
      }
      case 'file': {
        const settings = parseFileUploadSettings(field.settings_json);
        const accept = buildFileAcceptAttribute(settings);
        const allowedTypesHint = buildFileUploadAllowedTypesHint(settings);
        return (
          <div className="mt-2 space-y-2">
            <input
              id={fieldId}
              type="file"
              disabled={disabled}
              accept={accept}
              onChange={(event) => onFileChange?.(event.target.files?.[0] ?? null)}
              aria-describedby={describedBy}
              className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-[#003c90] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-[#002f73]`}
            />
            <p className="text-xs text-[#737784]">Format diizinkan: {allowedTypesHint}</p>
            {fileValue ? (
              <p className="text-xs text-[#434653]">
                File dipilih: <span className="font-medium text-[#191c1e]">{fileValue.name}</span>
              </p>
            ) : (
              <p className="text-xs text-[#737784]">
                Maks. {settings.maxSizeMb} MB · 1 file
              </p>
            )}
          </div>
        );
      }
      default: {
        const inputType =
          field.field_key === 'contact_email'
            ? 'email'
            : field.field_key === 'contact_phone'
              ? 'tel'
              : field.field_type === 'date'
                ? 'date'
                : 'text';
        return (
          <input
            id={fieldId}
            type={inputType}
            disabled={disabled}
            placeholder={field.placeholder ?? undefined}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            aria-describedby={describedBy}
            className={inputClass}
          />
        );
      }
    }
  };

  return (
    <div className="rounded-xl border border-[#eceef0] bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
      <label
        id={`${fieldId}-label`}
        htmlFor={field.field_type === 'radio' || field.field_type === 'checkbox' ? undefined : fieldId}
        className="text-sm font-semibold text-[#191c1e]"
      >
        {field.label}
        {field.is_required ? <span className="ml-0.5 text-[#c62828]">*</span> : null}
      </label>
      {renderControl()}
      {field.help_text ? (
        <p id={helpId} className="mt-2 text-xs text-[#737784]">
          {field.help_text}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-2 text-xs font-medium text-[#c62828]">
          {error}
        </p>
      ) : null}
    </div>
  );
};
