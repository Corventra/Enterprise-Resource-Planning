import { useNavigate, useParams, useSearchParams } from 'react-router';
import { FormBuilderCanvas } from '../components/builder/form-builder-canvas';
import { FormBuilderSettingsPanel } from '../components/builder/form-builder-settings-panel';
import { FormBuilderTopBar } from '../components/builder/form-builder-top-bar';
import { useFormBuilder } from '../hooks/use-form-builder';
import { useFormBuilderDnd } from '../hooks/use-form-builder-dnd';
import type { FormBuilderField } from '../types/form-builder.types';

export const FormBuilderPage = () => {
  const navigate = useNavigate();
  const { formId } = useParams();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaignId') || undefined;
  const campaignName = searchParams.get('campaignName') || undefined;

  const {
    form,
    mode,
    isLoading,
    isSaving,
    isPublishing,
    selectedField,
    selectedFieldId,
    publicLink,
    setMode,
    setSelectedFieldId,
    setMetadata,
    addField,
    updateField,
    deleteField,
    reorderFields,
    saveDraft,
    publishForm,
    uploadHeaderImage,
    removeHeaderImage
  } = useFormBuilder({ formId, campaignId, campaignName });

  const { sensors, collisionDetection, activeFieldId, handleDragStart, handleDragOver, handleDragEnd } =
    useFormBuilderDnd({
      fieldIds: form?.fields.map((field) => field.id) || [],
      onReorder: reorderFields
    });

  if (isLoading || !form) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Loading form builder...
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg">
      <FormBuilderTopBar
        title={form.title}
        campaignName={form.campaignName}
        mode={mode}
        isSaving={isSaving}
        isPublishing={isPublishing}
        onBack={() => navigate(-1)}
        onToggleMode={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
        onSaveDraft={() => void saveDraft()}
        onPublish={() => void publishForm()}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <FormBuilderCanvas
          form={form}
          mode={mode}
          selectedFieldId={selectedFieldId}
          publicLink={publicLink}
          activeFieldId={activeFieldId}
          sensors={sensors}
          collisionDetection={collisionDetection}
          onSetMetadata={setMetadata}
          onSelectField={setSelectedFieldId}
          onAddField={addField}
          onDeleteField={deleteField}
          onUploadHeaderImage={(fileName) => void uploadHeaderImage(fileName)}
          onRemoveHeaderImage={() => void removeHeaderImage()}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        />

        <FormBuilderSettingsPanel
          selectedField={selectedField}
          onUpdateField={(fieldId: string, payload: Partial<FormBuilderField>) => updateField(fieldId, payload)}
        />
      </div>
    </div>
  );
};
