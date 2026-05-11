import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { FormBuilderField, FormFieldType } from '../../types/form-builder.types';
import { fieldTypeSupportsOptions, uiFieldTypeToApi } from '../../services/forms-api';
import { fileUploadCategories } from '../../utils/file-upload-categories';
import { defaultFileUploadSettings } from '../../utils/file-upload-rules';
import { optionValueFromLabel } from '../../utils/lead-capture-field-fallbacks';

const DEBOUNCE_MS = 380;

export interface FieldSettingsCommitPayload {
  label: string;
  placeholder: string;
  note: string;
  required: boolean;
  type: FormFieldType;
  fileUpload?: FormBuilderField['fileUpload'];
}

interface FieldSettingsPanelProps {
  field: FormBuilderField;
  readOnly: boolean;
  locked: boolean;
  onCommitFieldSettings: (fieldId: string, payload: FieldSettingsCommitPayload) => void;
  onAddOption: (fieldId: string) => void;
  onUpdateOption: (
    fieldId: string,
    optionLocalId: string,
    patch: { label?: string; value?: string; sort_order?: number }
  ) => void;
  onRemoveOption: (fieldId: string, optionLocalId: string) => void;
}

const FIELD_TYPE_OPTIONS: { value: FormFieldType; label: string }[] = [
  { value: 'short-text', label: 'Short text' },
  { value: 'long-text', label: 'Long text' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'radio', label: 'Radio' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Date' },
  { value: 'file-upload', label: 'File upload' }
];

const supportsOptionsUi = (t: FormFieldType) => fieldTypeSupportsOptions(uiFieldTypeToApi(t));

export const FieldSettingsPanel = ({
  field,
  readOnly,
  locked,
  onCommitFieldSettings,
  onAddOption,
  onUpdateOption,
  onRemoveOption
}: FieldSettingsPanelProps) => {
  const [label, setLabel] = useState(field.label);
  const [placeholder, setPlaceholder] = useState(field.placeholder);
  const [note, setNote] = useState(field.note);
  const [required, setRequired] = useState(field.required);
  const [type, setType] = useState<FormFieldType>(field.type);
  const [fileUpload, setFileUpload] = useState(field.fileUpload ?? defaultFileUploadSettings());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disabled = readOnly || locked;

  useEffect(() => {
    setLabel(field.label);
    setPlaceholder(field.placeholder);
    setNote(field.note);
    setRequired(field.required);
    setType(field.type);
    setFileUpload(field.fileUpload ?? defaultFileUploadSettings());
  }, [field.id]);

  const flushCommit = useCallback(() => {
    if (disabled) return;
    onCommitFieldSettings(field.id, {
      label,
      placeholder,
      note,
      required,
      type,
      fileUpload: type === 'file-upload' ? { ...fileUpload, maxFiles: 1 } : undefined
    });
  }, [disabled, field.id, label, placeholder, note, required, type, fileUpload, onCommitFieldSettings]);

  const scheduleCommit = useCallback(() => {
    if (disabled) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      flushCommit();
    }, DEBOUNCE_MS);
  }, [disabled, flushCommit]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const blurFlush = () => {
    if (disabled) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = null;
    flushCommit();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Label</label>
        <input
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
            if (!disabled) scheduleCommit();
          }}
          onBlur={blurFlush}
          disabled={disabled}
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-600"
        />
      </div>

      {!locked ? (
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Field type</label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as FormFieldType);
              if (!disabled) scheduleCommit();
            }}
            onBlur={blurFlush}
            disabled={disabled}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-50"
          >
            {FIELD_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Field type</label>
          <input
            value={FIELD_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type}
            disabled
            className="h-10 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Placeholder</label>
        <input
          value={placeholder}
          onChange={(e) => {
            setPlaceholder(e.target.value);
            if (!disabled) scheduleCommit();
          }}
          onBlur={blurFlush}
          disabled={disabled}
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-600"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Helper text</label>
        <textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (!disabled) scheduleCommit();
          }}
          onBlur={blurFlush}
          disabled={disabled}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-600"
        />
      </div>

      <label
        className={`flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm ${
          disabled ? 'cursor-not-allowed bg-slate-50 text-slate-600' : 'cursor-pointer bg-slate-50 text-slate-700'
        }`}
      >
        <input
          type="checkbox"
          checked={required}
          onChange={(e) => {
            setRequired(e.target.checked);
            if (!disabled) {
              const next = e.target.checked;
              if (debounceRef.current) clearTimeout(debounceRef.current);
              debounceRef.current = null;
              onCommitFieldSettings(field.id, {
                label,
                placeholder,
                note,
                required: next,
                type
              });
            }
          }}
          disabled={disabled}
          className="h-4 w-4 disabled:cursor-not-allowed"
        />
        Required field
      </label>

      {supportsOptionsUi(type) && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Options</label>
            {!disabled ? (
              <button
                type="button"
                onClick={() => onAddOption(field.id)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            ) : null}
          </div>
          <div className="space-y-2">
            {(field.options || []).map((option, idx) => (
              <OptionRow
                key={option.id}
                option={option}
                optionIndex={idx + 1}
                readOnly={disabled}
                onCommit={(patch) => onUpdateOption(field.id, option.id, patch)}
                onRemove={() => onRemoveOption(field.id, option.id)}
              />
            ))}
          </div>
        </div>
      )}

      {type === 'file-upload' ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">File upload</p>
          <p className="text-xs text-slate-500">Maksimal 1 file per field.</p>
          <div>
            <p className="mb-2 text-xs font-medium text-slate-600">Pilih satu kategori file</p>
            <div className="space-y-2">
              {fileUploadCategories.map((category) => {
                const selected = fileUpload.allowedCategories[0] === category.value;
                return (
                  <label key={category.value} className="flex items-start gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name={`file-upload-category-${field.id}`}
                      checked={selected}
                      disabled={disabled}
                      className="mt-0.5 h-4 w-4 border-slate-300 text-blue-600"
                      onChange={() => {
                        setFileUpload((prev) => ({
                          ...prev,
                          allowedCategories: [category.value],
                          maxFiles: 1
                        }));
                        if (!disabled) scheduleCommit();
                      }}
                    />
                    <span>
                      <span className="block font-medium text-slate-800">{category.label}</span>
                      <span className="block text-xs text-slate-500">({category.formatHint})</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Ukuran maksimum (MB)</label>
            <input
              type="number"
              min={1}
              max={50}
              value={fileUpload.maxSizeMb}
              disabled={disabled}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (!Number.isFinite(next)) return;
                setFileUpload((prev) => ({ ...prev, maxSizeMb: next, maxFiles: 1 }));
                if (!disabled) scheduleCommit();
              }}
              onBlur={blurFlush}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-600"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};

function OptionRow({
  option,
  optionIndex,
  readOnly,
  onCommit,
  onRemove
}: {
  option: { id: string; label: string; value: string };
  optionIndex: number;
  readOnly: boolean;
  onCommit: (patch: { label?: string; value?: string }) => void;
  onRemove: () => void;
}) {
  const [label, setLabel] = useState(option.label);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLabel(option.label);
  }, [option.id]);

  const pushCommit = useCallback(
    (nextLabel: string) => {
      const v = optionValueFromLabel(nextLabel, optionIndex);
      onCommit({ label: nextLabel, value: v });
    },
    [onCommit, optionIndex]
  );

  const schedule = (nextLabel: string) => {
    if (readOnly) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      pushCommit(nextLabel);
    }, DEBOUNCE_MS);
  };

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return (
    <div className="flex gap-2 rounded-lg border border-slate-100 p-2">
      <input
        value={label}
        onChange={(e) => {
          const v = e.target.value;
          setLabel(v);
          schedule(v);
        }}
        onBlur={() => {
          if (readOnly) return;
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = null;
          pushCommit(label);
        }}
        disabled={readOnly}
        className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:bg-slate-50"
        placeholder="Label opsi"
      />
      {!readOnly ? (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded p-1 text-red-600 hover:bg-red-50"
          aria-label="Remove option"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
