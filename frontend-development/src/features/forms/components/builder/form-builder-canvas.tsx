import { DndContext, DragOverlay } from '@dnd-kit/core';
import type {
  CollisionDetection,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  SensorDescriptor
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { ReactNode } from 'react';
import type { FormBuilderDocument, FormBuilderMetadataErrors, FormFieldType } from '../../types/form-builder.types';
import { getFormDisplayBadge } from '../../utils/form-display-status';
import { isFieldPinnedForDnD } from '../../utils/local-draft-fields';
import { FieldPalette } from './field-palette';
import { FormHeaderImageField } from './form-header-image-field';
import { SortableFieldCard, StaticFormFieldCard } from './sortable-field-card';
import { HtmlRichTextEditor } from '../editors/html-rich-text-editor';

const labelClassName = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

const RequiredMark = () => (
  <span className="ml-0.5 text-red-600" aria-hidden="true">
    *
  </span>
);

const FieldLabel = ({ children, required }: { children: ReactNode; required?: boolean }) => (
  <label className={labelClassName}>
    {children}
    {required ? <RequiredMark /> : null}
  </label>
);

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;

interface FormBuilderCanvasProps {
  form: FormBuilderDocument;
  metadataErrors?: FormBuilderMetadataErrors;
  selectedFieldId: string | null;
  /** View-only / non-owner */
  readOnly?: boolean;
  /** Konten read-only (PUBLISHED / INACTIVE, atau kombinasi readOnly parent) */
  canvasLocked?: boolean;
  isCreateMode: boolean;
  formPersisted: boolean;
  sortableFieldIds: string[];
  activeFieldId: string | null;
  sensors: SensorDescriptor<any>[];
  collisionDetection: CollisionDetection;
  onSetMetadata: <K extends keyof FormBuilderDocument>(key: K, value: FormBuilderDocument[K]) => void;
  headerImageFile: File | null;
  onHeaderImageSelect: (file: File | null) => void;
  onHeaderImageClear: () => void;
  onSelectField: (fieldId: string) => void;
  onAddField: (type: FormFieldType) => void;
  onDeleteField: (fieldId: string) => void;
  onDragStart: (event: DragStartEvent) => void;
  onDragOver: (event: DragOverEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export const FormBuilderCanvas = ({
  form,
  metadataErrors = {},
  selectedFieldId,
  readOnly,
  canvasLocked = false,
  isCreateMode,
  formPersisted,
  sortableFieldIds,
  activeFieldId,
  sensors,
  collisionDetection,
  onSetMetadata,
  headerImageFile,
  onHeaderImageSelect,
  onHeaderImageClear,
  onSelectField,
  onAddField,
  onDeleteField,
  onDragStart,
  onDragOver,
  onDragEnd
}: FormBuilderCanvasProps) => {
  const metaLocked = Boolean(readOnly) || canvasLocked;
  const categoryLocked = formPersisted || metaLocked;
  const pinnedFields = form.fields.filter((f) => isFieldPinnedForDnD(f));
  const sortableFields = form.fields.filter((f) => !isFieldPinnedForDnD(f));
  const activeField = form.fields.find((field) => field.id === activeFieldId);
  const interactionLocked = Boolean(readOnly) || canvasLocked;
  const showFieldPalette = !interactionLocked;

  return (
    <section className="space-y-4">
      <FormHeaderImageField
        headerImagePath={form.headerImageUrl || ''}
        pendingFile={headerImageFile}
        disabled={metaLocked}
        onSelectFile={onHeaderImageSelect}
        onClear={onHeaderImageClear}
      />

      <article className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid gap-4">
          {formPersisted ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
              {(() => {
                const b = getFormDisplayBadge(form.backendStatus, form.isAcceptingResponses);
                const cls =
                  b.tone === 'inactive'
                    ? 'bg-slate-200 text-slate-800'
                    : b.tone === 'draft'
                      ? 'bg-sky-100 text-sky-900'
                      : b.tone === 'paused'
                        ? 'bg-amber-100 text-amber-950 ring-1 ring-amber-200'
                        : 'bg-emerald-100 text-emerald-900';
                return (
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${cls}`}>{b.label}</span>
                );
              })()}
              {form.publicSlug ? (
                <span className="text-xs text-slate-500">
                  Kode: <span className="font-mono text-slate-700">{form.publicSlug}</span>
                </span>
              ) : null}
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Form category
            </label>
            <select
              value={form.formCategory}
              onChange={(event) =>
                onSetMetadata('formCategory', event.target.value as FormBuilderDocument['formCategory'])
              }
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm disabled:bg-slate-50 disabled:text-slate-600"
              disabled={categoryLocked}
            >
              <option value="GENERAL">General</option>
              <option value="LEAD_CAPTURE">Lead capture</option>
            </select>
            {formPersisted ? (
              <p className="mt-1 text-xs text-slate-500">Kategori tidak dapat diubah setelah form dibuat.</p>
            ) : isCreateMode ? (
              <p className="mt-1 text-xs text-slate-500">
                Pilih kategori sebelum menyimpan. Lead capture menampilkan 5 field wajib di atas; Anda bisa
                menambah field kustom di bawahnya.
              </p>
            ) : null}
          </div>

          <div>
            <FieldLabel required>Form Title</FieldLabel>
            <input
              value={form.title}
              onChange={(event) => onSetMetadata('title', event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm placeholder:text-slate-400"
              disabled={metaLocked}
              placeholder="Contoh: Form Konsultasi Pajak Gratis"
            />
            <FieldError message={metadataErrors.title} />
          </div>
          <div>
            <FieldLabel required>Form Description</FieldLabel>
            <HtmlRichTextEditor
              value={form.description}
              onChange={(html) => onSetMetadata('description', html)}
              placeholder="Jelaskan tujuan atau konteks formulir ini…"
              readOnly={metaLocked}
            />
            <FieldError message={metadataErrors.description} />
          </div>
          <div>
            <FieldLabel required>Success Message</FieldLabel>
            <HtmlRichTextEditor
              value={form.successMessage}
              onChange={(html) => onSetMetadata('successMessage', html)}
              placeholder="Pesan yang ditampilkan setelah pengisi mengirim formulir…"
              readOnly={metaLocked}
            />
            <FieldError message={metadataErrors.successMessage} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Success link URL
              </label>
              <input
                value={form.successLinkUrl}
                onChange={(event) => onSetMetadata('successLinkUrl', event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                disabled={metaLocked}
                placeholder="https://"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Success link label
              </label>
              <input
                value={form.successLinkLabel}
                onChange={(event) => onSetMetadata('successLinkLabel', event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                disabled={metaLocked}
                placeholder="Tombol / teks tautan"
              />
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
          <div className="mt-3 space-y-2">
            {pinnedFields.map((field) => (
              <StaticFormFieldCard
                key={field.id}
                field={field}
                isSelected={selectedFieldId === field.id}
                readOnly={interactionLocked}
                onSelect={onSelectField}
                onDelete={onDeleteField}
              />
            ))}
          </div>
          <SortableContext items={sortableFieldIds} strategy={verticalListSortingStrategy}>
            <div className="mt-2 space-y-2">
              {sortableFields.map((field) => (
                <SortableFieldCard
                  key={field.id}
                  field={field}
                  isSelected={selectedFieldId === field.id}
                  readOnly={interactionLocked}
                  dragDisabled={interactionLocked}
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

      {showFieldPalette ? <FieldPalette onAddField={onAddField} /> : null}
    </section>
  );
};
