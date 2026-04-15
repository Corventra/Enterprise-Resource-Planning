import { GripVertical, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FormBuilderField } from '../../types/form-builder.types';

interface SortableFieldCardProps {
  field: FormBuilderField;
  isSelected: boolean;
  onSelect: (fieldId: string) => void;
  onDelete: (fieldId: string) => void;
}

export const SortableFieldCard = ({
  field,
  isSelected,
  onSelect,
  onDelete
}: SortableFieldCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    disabled: field.isCore
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(field.id)}
      className={`cursor-pointer rounded-lg border-2 p-4 transition ${
        isSelected ? 'border-blue-500 shadow-sm' : 'border-gray-200 hover:border-gray-300'
      } ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={(event) => event.stopPropagation()}
            className={`rounded p-0.5 ${
              field.isCore ? 'cursor-not-allowed text-gray-300' : 'cursor-grab text-gray-400 active:cursor-grabbing'
            }`}
            aria-label={`Drag ${field.label}`}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {field.label}
              {field.required && <span className="ml-1 text-red-500">*</span>}
            </p>
            <p className="text-xs text-slate-500">
              {field.type}
              {field.isCore && (
                <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                  CORE
                </span>
              )}
            </p>
          </div>
        </div>
        {!field.isCore && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(field.id);
            }}
            className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {field.placeholder && <p className="mt-2 text-xs italic text-gray-500">Placeholder: {field.placeholder}</p>}
      {field.note && <p className="mt-1 text-xs text-slate-500">{field.note}</p>}
    </article>
  );
};
