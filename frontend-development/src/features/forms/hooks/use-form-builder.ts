import { useCallback, useEffect, useMemo, useState } from 'react';
import { formsService } from '../services/forms-service';
import type { FormBuilderDocument, FormBuilderField, FormBuilderMode, FormFieldType } from '../types/form-builder.types';
import { createFieldByType } from '../utils/field-factory';
import { buildPublicFormLink, getEffectivePublicSlug } from '../utils/form-slug';

interface UseFormBuilderInput {
  formId?: string;
  campaignId?: string;
  campaignName?: string;
}

interface UpdateFieldPayload extends Partial<Omit<FormBuilderField, 'id' | 'type' | 'isCore'>> {
  options?: FormBuilderField['options'];
  fileUpload?: FormBuilderField['fileUpload'];
}

export const useFormBuilder = ({ formId, campaignId, campaignName }: UseFormBuilderInput) => {
  const [form, setForm] = useState<FormBuilderDocument | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [mode, setMode] = useState<FormBuilderMode>('edit');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const loadForm = useCallback(async () => {
    setIsLoading(true);
    if (formId) {
      const existing = await formsService.getFormById(formId);
      if (existing) {
        setForm(existing);
        setSelectedFieldId(existing.fields[0]?.id || null);
        setIsLoading(false);
        return;
      }
    }

    const created = await formsService.createForm({
      campaignId: campaignId || 'unassigned-campaign',
      campaignName,
      title: 'Untitled Form',
      description: '',
      successMessage: 'Thank you. Your response has been recorded.',
      status: 'draft'
    });
    setForm(created);
    setSelectedFieldId(created.fields[0]?.id || null);
    setIsLoading(false);
  }, [formId, campaignId, campaignName]);

  useEffect(() => {
    void loadForm();
  }, [loadForm]);

  const selectedField = useMemo(
    () => form?.fields.find((field) => field.id === selectedFieldId),
    [form, selectedFieldId]
  );

  const publicLink = useMemo(() => buildPublicFormLink(form?.publicSlug || ''), [form?.publicSlug]);

  const setMetadata = <K extends keyof FormBuilderDocument>(key: K, value: FormBuilderDocument[K]) => {
    setForm((prev) => {
      if (!prev) {
        return prev;
      }
      const next = { ...prev, [key]: value };
      if (key === 'title' || key === 'publicSlug') {
        next.publicSlug = getEffectivePublicSlug(
          key === 'title' ? String(value) : next.title,
          key === 'publicSlug' ? String(value) : next.publicSlug
        );
      }
      return next;
    });
  };

  const addField = (type: FormFieldType) => {
    setForm((prev) => {
      if (!prev) {
        return prev;
      }
      const newField = createFieldByType(type);
      setSelectedFieldId(newField.id);
      return {
        ...prev,
        fields: [...prev.fields, newField]
      };
    });
  };

  const updateField = (fieldId: string, payload: UpdateFieldPayload) => {
    setForm((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        fields: prev.fields.map((field) => (field.id === fieldId ? { ...field, ...payload } : field))
      };
    });
  };

  const deleteField = (fieldId: string) => {
    setForm((prev) => {
      if (!prev) {
        return prev;
      }
      const target = prev.fields.find((field) => field.id === fieldId);
      if (!target || target.isCore) {
        return prev;
      }
      const nextFields = prev.fields.filter((field) => field.id !== fieldId);
      if (selectedFieldId === fieldId) {
        setSelectedFieldId(nextFields[0]?.id || null);
      }
      return { ...prev, fields: nextFields };
    });
  };

  const reorderFields = (nextFieldIds: string[]) => {
    setForm((prev) => {
      if (!prev) {
        return prev;
      }
      if (nextFieldIds.length !== prev.fields.length) {
        return prev;
      }
      const fieldMap = new Map(prev.fields.map((field) => [field.id, field]));
      const nextFields = nextFieldIds
        .map((id) => fieldMap.get(id))
        .filter((field): field is FormBuilderField => Boolean(field));
      if (nextFields.length !== prev.fields.length) {
        return prev;
      }
      return { ...prev, fields: nextFields };
    });
  };

  const saveDraft = async () => {
    if (!form) {
      return;
    }
    setIsSaving(true);
    const updated = await formsService.updateForm(form.id, {
      ...form,
      status: 'draft'
    });
    setForm(updated);
    setIsSaving(false);
  };

  const publishForm = async () => {
    if (!form) {
      return;
    }
    setIsPublishing(true);
    const updated = await formsService.updateForm(form.id, {
      ...form,
      status: 'published'
    });
    setForm(updated);
    setIsPublishing(false);
  };

  const uploadHeaderImage = async (fileName: string) => {
    if (!form) {
      return;
    }
    const url = await formsService.uploadFormHeaderImage(form.id, fileName);
    setMetadata('headerImageUrl', url);
  };

  const removeHeaderImage = async () => {
    if (!form) {
      return;
    }
    await formsService.deleteFormHeaderImage(form.id);
    setMetadata('headerImageUrl', '');
  };

  return {
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
  };
};
