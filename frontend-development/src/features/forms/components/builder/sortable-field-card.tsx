import { GripVertical, Lock, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FormBuilderField } from '../../types/form-builder.types';

interface FieldCardContentProps {
  field: FormBuilderField;
  isSelected: boolean;
  readOnly?: boolean;
  showDragHandle: boolean;
  dragAttributes?: Record<string, unknown>;
  dragListeners?: Record<string, unknown>;
  setNodeRef?: (node: HTMLElement | null) => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
  onSelect: (fieldId: string) => void;
  onDelete: (fieldId: string) => void;
}

const FieldCardContent = ({
  field,
  isSelected,
  readOnly,
  showDragHandle,
  dragAttributes,
  dragListeners,
  setNodeRef,
  style,
  isDragging,
  onSelect,
  onDelete
}: FieldCardContentProps) => {
  const isProtected = Boolean(field.isCore || field.isLocked || field.isSystem);

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
          {showDragHandle && dragAttributes && dragListeners ? (
            <button
              type="button"
              {...dragAttributes}
              {...dragListeners}
              onClick={(event) => event.stopPropagation()}
              className={`rounded p-0.5 ${
                isProtected ? 'cursor-not-allowed text-gray-300' : 'cursor-grab text-gray-400 active:cursor-grabbing'
              }`}
              aria-label={`Drag ${field.label}`}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          ) : null}
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {field.label}
              {field.required && <span className="ml-1 text-red-500">*</span>}
            </p>
            <p className="text-xs text-slate-500">
              {field.type}
              {isProtected ? (
                <span className="ml-2 inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                  <Lock className="h-3 w-3" />
                  System
                </span>
              ) : null}
            </p>
          </div>
        </div>
        {!isProtected && !readOnly ? (
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
        ) : null}
      </div>
      {field.placeholder ? (
        <p className="mt-2 text-xs italic text-gray-500">Placeholder: {field.placeholder}</p>
      ) : null}
      {field.note ? <p className="mt-1 text-xs text-slate-500">{field.note}</p> : null}
    </article>
  );
};

/** Field sistem / pinned: tidak ikut sortable context. */
export const StaticFormFieldCard = ({
  field,
  isSelected,
  readOnly,
  onSelect,
  onDelete
}: Omit<SortableFieldCardProps, 'dragDisabled'>) => {
  return (
    <FieldCardContent
      field={field}
      isSelected={isSelected}
      readOnly={readOnly}
      showDragHandle={false}
      onSelect={onSelect}
      onDelete={onDelete}
      isDragging={false}
    />
  );
};

interface SortableFieldCardProps {
  field: FormBuilderField;
  isSelected: boolean;
  readOnly?: boolean;
  dragDisabled?: boolean;
  onSelect: (fieldId: string) => void;
  onDelete: (fieldId: string) => void;
}

export const SortableFieldCard = ({
  field,
  isSelected,
  readOnly,
  dragDisabled,
  onSelect,
  onDelete
}: SortableFieldCardProps) => {
  const isProtected = Boolean(field.isCore || field.isLocked || field.isSystem);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    disabled: isProtected || readOnly || dragDisabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const showHandle = !readOnly && !dragDisabled && !isProtected;

  return (
    <FieldCardContent
      field={field}
      isSelected={isSelected}
      readOnly={readOnly}
      showDragHandle={showHandle}
      dragAttributes={showHandle ? (attributes as unknown as Record<string, unknown>) : undefined}
      dragListeners={showHandle ? (listeners as unknown as Record<string, unknown>) : undefined}
      setNodeRef={setNodeRef}
      style={style}
      isDragging={isDragging}
      onSelect={onSelect}
      onDelete={onDelete}
    />
  );
};
