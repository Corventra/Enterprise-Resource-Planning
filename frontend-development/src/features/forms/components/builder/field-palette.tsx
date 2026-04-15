import { Plus } from 'lucide-react';
import type { FormFieldType } from '../../types/form-builder.types';

interface FieldPaletteProps {
  onAddField: (type: FormFieldType) => void;
}

const fieldItems: Array<{ type: FormFieldType; label: string }> = [
  { type: 'short-text', label: 'Short Text' },
  { type: 'long-text', label: 'Long Text' },
  { type: 'dropdown', label: 'Dropdown' },
  { type: 'radio', label: 'Radio' },
  { type: 'checkbox', label: 'Checkbox' },
  { type: 'date', label: 'Date' },
  { type: 'file-upload', label: 'File Upload' }
];

export const FieldPalette = ({ onAddField }: FieldPaletteProps) => {
  return (
    <section className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-6">
      <h3 className="text-sm font-semibold text-gray-700">Add Field:</h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {fieldItems.map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => onAddField(item.type)}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            <Plus className="h-3.5 w-3.5" />
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
};
