import { ImagePlus, Link2, X } from 'lucide-react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import type {
  CollisionDetection,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  SensorDescriptor
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { FormBuilderDocument, FormFieldType } from '../../types/form-builder.types';
import { markersToHtml } from '../../utils/form-rich-text';
import { FieldPalette } from './field-palette';
import { SortableFieldCard } from './sortable-field-card';
import { RichTextEditor } from '../editors/rich-text-editor';

interface FormBuilderCanvasProps {
  form: FormBuilderDocument;
  selectedFieldId: string | null;
  mode: 'edit' | 'preview';
  publicLink: string;
  activeFieldId: string | null;
  sensors: SensorDescriptor<any>[];
  collisionDetection: CollisionDetection;
  onSetMetadata: <K extends keyof FormBuilderDocument>(key: K, value: FormBuilderDocument[K]) => void;
  onSelectField: (fieldId: string) => void;
  onAddField: (type: FormFieldType) => void;
  onDeleteField: (fieldId: string) => void;
  onUploadHeaderImage: (fileName: string) => void;
  onRemoveHeaderImage: () => void;
  onDragStart: (event: DragStartEvent) => void;
  onDragOver: (event: DragOverEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export const FormBuilderCanvas = ({
  form,
  selectedFieldId,
  mode,
  publicLink,
  activeFieldId,
  sensors,
  collisionDetection,
  onSetMetadata,
  onSelectField,
  onAddField,
  onDeleteField,
  onUploadHeaderImage,
  onRemoveHeaderImage,
  onDragStart,
  onDragOver,
  onDragEnd
}: FormBuilderCanvasProps) => {
  const headerPreviewSrc = form.headerImageUrl || '';
  const activeField = form.fields.find((field) => field.id === activeFieldId);

  return (
    <section className="space-y-4">
      <article className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <ImagePlus className="h-4 w-4 text-gray-600" />
            Header Image
          </div>
          {form.headerImageUrl && (
            <button
              type="button"
              onClick={onRemoveHeaderImage}
              className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {headerPreviewSrc ? (
          <img
            src={headerPreviewSrc}
            alt="Form header"
            className="mb-3 max-h-56 w-full rounded-lg border border-gray-200 object-cover"
          />
        ) : (
          <p className="mb-3 text-sm text-gray-500">No header image selected.</p>
        )}
        <button
          type="button"
          onClick={() => onUploadHeaderImage('header-image.png')}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <ImagePlus className="h-4 w-4" />
          Upload
        </button>
      </article>

      <article className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Form Title</label>
            <input
              value={form.title}
              onChange={(event) => onSetMetadata('title', event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              disabled={mode === 'preview'}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Form Description
            </label>
            <RichTextEditor
              value={form.description}
              onChange={(value) => onSetMetadata('description', value)}
              placeholder="Describe the purpose of this form..."
              rows={4}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Success Message
            </label>
            <RichTextEditor
              value={form.successMessage}
              onChange={(value) => onSetMetadata('successMessage', value)}
              placeholder="Message shown after user submits form."
              rows={3}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Public Slug</label>
              <input
                value={form.publicSlug}
                onChange={(event) => onSetMetadata('publicSlug', event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                disabled={mode === 'preview'}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Public Link</label>
              <div className="inline-flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                <Link2 className="h-4 w-4" />
                {publicLink}
              </div>
            </div>
          </div>
        </div>
      </article>

      <article className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-900">Form Fields</h3>
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={form.fields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
            <div className="mt-3 space-y-2">
              {form.fields.map((field) => (
                <SortableFieldCard
                  key={field.id}
                  field={field}
                  isSelected={selectedFieldId === field.id}
                  onSelect={onSelectField}
                  onDelete={onDeleteField}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeField ? (
              <div className="rounded-lg border-2 border-blue-500 bg-white p-4 shadow-lg">
                <p className="text-sm font-semibold text-slate-900">{activeField.label}</p>
                <p className="text-xs text-slate-500">{activeField.type}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </article>

      {mode === 'edit' && <FieldPalette onAddField={onAddField} />}

      {mode === 'preview' && (
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Preview</h3>
          <div className="prose prose-sm mt-3 max-w-none text-slate-700">
            <h2>{form.title}</h2>
            <p dangerouslySetInnerHTML={{ __html: markersToHtml(form.description) }} />
          </div>
          <div className="mt-4 space-y-3">
            {form.fields.map((field) => (
              <div key={field.id} className="rounded-md border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-900">
                  {field.label}
                  {field.required ? ' *' : ''}
                </p>
                {field.placeholder && <p className="mt-1 text-xs text-slate-500">{field.placeholder}</p>}
              </div>
            ))}
          </div>
        </article>
      )}
    </section>
  );
};
