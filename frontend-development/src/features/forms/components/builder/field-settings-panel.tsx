import type { FileUploadCategory, FormBuilderField, FormFieldType } from '../../types/form-builder.types';
import { fileUploadCategories } from '../../utils/file-upload-categories';
import { RichTextEditor } from '../editors/rich-text-editor';

interface FieldSettingsPanelProps {
  field: FormBuilderField;
  onUpdateField: (fieldId: string, payload: Partial<FormBuilderField>) => void;
}

const supportsOptions = (type: FormFieldType) =>
  type === 'dropdown' || type === 'radio' || type === 'checkbox';

export const FieldSettingsPanel = ({ field, onUpdateField }: FieldSettingsPanelProps) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Label</label>
        <input
          value={field.label}
          onChange={(event) => onUpdateField(field.id, { label: event.target.value })}
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Placeholder</label>
        <input
          value={field.placeholder}
          onChange={(event) => onUpdateField(field.id, { placeholder: event.target.value })}
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Note</label>
        <RichTextEditor
          value={field.note}
          onChange={(value) => onUpdateField(field.id, { note: value })}
          placeholder="Add helper note for this field..."
          rows={3}
        />
      </div>

      <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={field.required}
          onChange={(event) => onUpdateField(field.id, { required: event.target.checked })}
          className="h-4 w-4"
        />
        Required field
      </label>

      {supportsOptions(field.type) && (
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Options</label>
          <div className="space-y-2">
            {(field.options || []).map((option) => (
              <input
                key={option.id}
                value={option.label}
                onChange={(event) => {
                  const nextOptions = (field.options || []).map((item) =>
                    item.id === option.id ? { ...item, label: event.target.value, value: event.target.value } : item
                  );
                  onUpdateField(field.id, { options: nextOptions });
                }}
                className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
              />
            ))}
          </div>
        </div>
      )}

      {field.type === 'file-upload' && field.fileUpload && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">File Upload Settings</p>

          <div>
            <label className="mb-1 block text-xs text-slate-500">Allowed Categories</label>
            <select
              multiple
              value={field.fileUpload.allowedCategories}
              onChange={(event) => {
                const values = Array.from(event.target.selectedOptions).map((option) => option.value);
                onUpdateField(field.id, {
                  fileUpload: {
                    ...field.fileUpload,
                    allowedCategories: values as FileUploadCategory[]
                  }
                });
              }}
              className="min-h-24 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
            >
              {fileUploadCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Max Files</label>
              <input
                type="number"
                min={1}
                value={field.fileUpload.maxFiles}
                onChange={(event) =>
                  onUpdateField(field.id, {
                    fileUpload: { ...field.fileUpload, maxFiles: Number(event.target.value) || 1 }
                  })
                }
                className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Max Size (MB)</label>
              <input
                type="number"
                min={1}
                value={field.fileUpload.maxSizeMb}
                onChange={(event) =>
                  onUpdateField(field.id, {
                    fileUpload: { ...field.fileUpload, maxSizeMb: Number(event.target.value) || 1 }
                  })
                }
                className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
