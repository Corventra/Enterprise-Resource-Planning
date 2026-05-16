import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  createCampaignForm,
  createField as apiCreateField,
  createOption as apiCreateOption,
  deleteField as apiDeleteField,
  deleteOption as apiDeleteOption,
  fieldTypeSupportsOptions,
  getFormById,
  publishForm,
  uiFieldTypeToApi,
  updateField as apiUpdateField,
  updateForm as apiUpdateFormMetadata,
  updateOption as apiUpdateOption
} from '../services/forms-api';
import type { FormBuilderDocument, FormBuilderField, FormFieldType } from '../types/form-builder.types';
import { createFieldByType } from '../utils/field-factory';
import { fileUploadSettingsToJson } from '../utils/file-upload-rules';
import { optionValueFromLabel } from '../utils/lead-capture-field-fallbacks';
import { getInitialFieldsForCategory, isFieldPinnedForDnD } from '../utils/local-draft-fields';

const emptyDocument = (campaignId: string, campaignName?: string): FormBuilderDocument => ({
  id: '',
  campaignId,
  campaignName,
  formCategory: 'GENERAL',
  title: '',
  description: '',
  successMessage: '',
  successLinkUrl: '',
  successLinkLabel: '',
  headerImageUrl: '',
  publicSlug: '',
  status: 'draft',
  backendStatus: 'DRAFT',
  isAcceptingResponses: false,
  publishedAt: null,
  fields: getInitialFieldsForCategory('GENERAL'),
  updatedAt: new Date().toISOString()
});

interface UseFormBuilderInput {
  campaignId: string;
  campaignName?: string;
  initialFormId?: string;
  isCreateMode: boolean;
  canManageBuilder: boolean;
  onError: (message: string) => void;
}

export const useFormBuilder = ({
  campaignId,
  campaignName,
  initialFormId,
  isCreateMode,
  canManageBuilder,
  onError
}: UseFormBuilderInput) => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormBuilderDocument | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [phaseBBusy, setPhaseBBusy] = useState(false);
  const [headerImageFile, setHeaderImageFile] = useState<File | null>(null);

  const withCampaignName = useCallback(
    (doc: FormBuilderDocument) => (campaignName ? { ...doc, campaignName } : doc),
    [campaignName]
  );

  const loadForm = useCallback(async () => {
    if (!campaignId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setHeaderImageFile(null);
    try {
      if (isCreateMode) {
        const base = emptyDocument(campaignId, campaignName);
        setForm(withCampaignName(base));
        setSelectedFieldId(base.fields[0]?.id ?? null);
        return;
      }
      if (!initialFormId) {
        const base = emptyDocument(campaignId, campaignName);
        setForm(withCampaignName(base));
        setSelectedFieldId(null);
        return;
      }
      const doc = await getFormById(initialFormId);
      setForm(withCampaignName(doc));
      setSelectedFieldId(doc.fields[0]?.id ?? null);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Gagal memuat form');
      setForm(null);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, campaignName, initialFormId, isCreateMode, onError, withCampaignName]);

  useEffect(() => {
    void loadForm();
  }, [loadForm]);

  const selectedField = useMemo(
    () => form?.fields.find((f) => f.id === selectedFieldId),
    [form, selectedFieldId]
  );

  const formPersisted = Boolean(form?.id);

  const sortableFieldIds = useMemo(
    () => form?.fields.filter((f) => !isFieldPinnedForDnD(f)).map((f) => f.id) ?? [],
    [form?.fields]
  );

  const setMetadata = <K extends keyof FormBuilderDocument>(key: K, value: FormBuilderDocument[K]) => {
    setForm((prev) => {
      if (!prev) return prev;
      if (key === 'formCategory' && !prev.id) {
        const cat = value as FormBuilderDocument['formCategory'];
        const nextFields = getInitialFieldsForCategory(cat);
        return {
          ...prev,
          formCategory: cat,
          fields: nextFields
        };
      }
      return { ...prev, [key]: value };
    });
  };

  const persistCustomFieldsAfterCreate = useCallback(
    async (doc: FormBuilderDocument, customLocals: FormBuilderField[]) => {
      let current = doc;
      for (const cf of customLocals) {
        const maxSort = Math.max(0, ...current.fields.map((f) => f.sortOrder ?? 0));
        const fieldKey = (cf.fieldKey && cf.fieldKey.trim()) || `custom_${Date.now()}`;
        current = withCampaignName(
          await apiCreateField(current.id, {
            field_key: fieldKey,
            label: cf.label,
            field_type: uiFieldTypeToApi(cf.type),
            placeholder: cf.placeholder || null,
            help_text: cf.note || null,
            is_required: cf.required,
            sort_order: maxSort + 1,
            settings_json: cf.fileUpload
              ? fileUploadSettingsToJson(cf.fileUpload)
              : (cf.settingsJson ?? null)
          })
        );
        const createdF = current.fields.find((x) => x.fieldKey === fieldKey);
        if (!createdF?.backendFieldId) continue;
        let ord = 1;
        for (const opt of cf.options || []) {
          current = withCampaignName(
            await apiCreateOption(createdF.backendFieldId, {
              label: opt.label,
              value: opt.value,
              sort_order: opt.sortOrder ?? ord
            })
          );
          ord += 1;
        }
      }
      const fresh = await getFormById(current.id);
      return withCampaignName(fresh);
    },
    [withCampaignName]
  );

  /** POST campaign form + persist field/opsi kustom lokal (bukan publish). */
  const createFormAndPersistCustomFields = useCallback(
    async (
      localForm: FormBuilderDocument,
      campId: string,
      pendingHeaderImageFile: File | null
    ): Promise<FormBuilderDocument> => {
      const title = localForm.title.trim();
      const customLocals = localForm.fields.filter((f) => !isFieldPinnedForDnD(f));
      const created = await createCampaignForm(
        campId,
        {
          form_category: localForm.formCategory,
          title,
          description: localForm.description || null,
          header_image_path: pendingHeaderImageFile ? null : localForm.headerImageUrl || null,
          success_message: localForm.successMessage || null,
          success_link_url: localForm.successLinkUrl || null,
          success_link_label: localForm.successLinkLabel || null
        },
        { headerImageFile: pendingHeaderImageFile }
      );
      let doc = withCampaignName(created);
      if (customLocals.length > 0) {
        doc = await persistCustomFieldsAfterCreate(doc, customLocals);
      }
      return doc;
    },
    [withCampaignName, persistCustomFieldsAfterCreate]
  );

  const saveDraft = useCallback(async (): Promise<boolean> => {
    if (!form || !campaignId) return false;
    const title = form.title.trim();
    if (!title) {
      onError('Judul form wajib diisi sebelum menyimpan.');
      return false;
    }
    if (form.id && form.backendStatus !== 'DRAFT') {
      return false;
    }
    setIsSaving(true);
    try {
      if (!form.id) {
        const doc = await createFormAndPersistCustomFields(form, campaignId, headerImageFile);
        setForm(doc);
        setHeaderImageFile(null);
        setSelectedFieldId(doc.fields[0]?.id ?? null);
        navigate(`/campaigns/${campaignId}/forms/${doc.id}`, { replace: true });
        return true;
      }
      const updated = await apiUpdateFormMetadata(
        form.id,
        {
          title,
          description: form.description || null,
          header_image_path: headerImageFile ? null : form.headerImageUrl || null,
          success_message: form.successMessage || null,
          success_link_url: form.successLinkUrl || null,
          success_link_label: form.successLinkLabel || null
        },
        { headerImageFile }
      );
      setForm(withCampaignName(updated));
      setHeaderImageFile(null);
      return true;
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Gagal menyimpan draft');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [form, campaignId, headerImageFile, navigate, onError, withCampaignName, createFormAndPersistCustomFields]);

  /**
   * Tanpa id: buat draft + persist kustom + publish + navigasi.
   * Dengan id + DRAFT: sync metadata + publish.
   */
  const saveAndPublish = useCallback(async (): Promise<boolean> => {
    if (!form || !campaignId) return false;
    const title = form.title.trim();
    if (!title) {
      onError('Judul form wajib diisi sebelum publish.');
      return false;
    }
    setPhaseBBusy(true);
    try {
      if (!form.id) {
        const doc = await createFormAndPersistCustomFields(form, campaignId, headerImageFile);
        const { document } = await publishForm(doc.id);
        const merged = withCampaignName(document);
        setForm(merged);
        setHeaderImageFile(null);
        setSelectedFieldId(merged.fields[0]?.id ?? null);
        navigate(`/campaigns/${campaignId}?tab=forms&focusForm=${merged.id}`, { replace: true });
        return true;
      }
      if (form.backendStatus !== 'DRAFT') {
        onError('Hanya form DRAFT yang dapat dipublish.');
        return false;
      }
      await apiUpdateFormMetadata(
        form.id,
        {
          title,
          description: form.description || null,
          header_image_path: headerImageFile ? null : form.headerImageUrl || null,
          success_message: form.successMessage || null,
          success_link_url: form.successLinkUrl || null,
          success_link_label: form.successLinkLabel || null
        },
        { headerImageFile }
      );
      const { document } = await publishForm(form.id);
      setForm(withCampaignName(document));
      setHeaderImageFile(null);
      return true;
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Gagal menyimpan dan mempublish form');
      return false;
    } finally {
      setPhaseBBusy(false);
    }
  }, [form, campaignId, headerImageFile, navigate, onError, withCampaignName, createFormAndPersistCustomFields]);

  const clearHeaderImage = useCallback(() => {
    setHeaderImageFile(null);
    setForm((prev) => (prev ? { ...prev, headerImageUrl: '' } : prev));
  }, []);

  const nextSortOrder = useCallback(() => {
    if (!form?.fields.length) return 1;
    const max = Math.max(...form.fields.map((f) => f.sortOrder ?? 0));
    return max + 1;
  }, [form?.fields]);

  const addField = useCallback(
    async (type: FormFieldType) => {
      if (!canManageBuilder || !form) return;
      const draft = createFieldByType(type);
      draft.fieldKey = `custom_${Date.now()}`;
      draft.sortOrder = nextSortOrder();

      if (!form.id) {
        setForm({ ...form, fields: [...form.fields, draft] });
        setSelectedFieldId(draft.id);
        return;
      }

      try {
        const next = await apiCreateField(form.id, {
          field_key: draft.fieldKey,
          label: draft.label,
          field_type: uiFieldTypeToApi(type),
          placeholder: draft.placeholder || null,
          help_text: null,
          is_required: draft.required,
          sort_order: nextSortOrder(),
          settings_json: draft.fileUpload ? fileUploadSettingsToJson(draft.fileUpload) : null
        });
        const merged = withCampaignName(next);
        setForm(merged);
        const prevIds = new Set(form.fields.map((x) => x.backendFieldId).filter(Boolean));
        const created = merged.fields.find((f) => f.backendFieldId && !prevIds.has(f.backendFieldId));
        if (created) setSelectedFieldId(created.id);
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Gagal menambah field');
      }
    },
    [form, canManageBuilder, nextSortOrder, onError, withCampaignName]
  );

  const deleteField = useCallback(
    async (fieldId: string) => {
      if (!canManageBuilder || !form) return;
      const f = form.fields.find((x) => x.id === fieldId);
      if (!f || isFieldPinnedForDnD(f)) return;

      if (!form.id) {
        const nextFields = form.fields.filter((x) => x.id !== fieldId);
        setForm({ ...form, fields: nextFields });
        setSelectedFieldId((prev) => (prev === fieldId ? nextFields[0]?.id ?? null : prev));
        return;
      }

      if (!f.backendFieldId) return;
      try {
        const next = await apiDeleteField(form.id, f.backendFieldId);
        setForm(withCampaignName(next));
        setSelectedFieldId((prev) => (prev === fieldId ? next.fields[0]?.id ?? null : prev));
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Gagal menghapus field');
      }
    },
    [form, canManageBuilder, onError, withCampaignName]
  );

  const reorderFields = useCallback(
    async (orderedSortableIds: string[]) => {
      if (!canManageBuilder || !form) return;
      const pinned = form.fields.filter((f) => isFieldPinnedForDnD(f));
      const sortable = form.fields.filter((f) => !isFieldPinnedForDnD(f));
      const map = new Map(sortable.map((f) => [f.id, f]));
      const reordered = orderedSortableIds.map((id) => map.get(id)).filter(Boolean) as typeof sortable;
      if (reordered.length !== sortable.length) return;

      const merged = [...pinned, ...reordered];

      if (!form.id) {
        setForm({ ...form, fields: merged.map((f, i) => ({ ...f, sortOrder: i + 1 })) });
        return;
      }

      try {
        let latest = form;
        for (let i = 0; i < merged.length; i++) {
          const fld = merged[i];
          if (fld.backendFieldId) {
            latest = await apiUpdateField(form.id, fld.backendFieldId, { sort_order: i + 1 });
          }
        }
        setForm(withCampaignName(latest));
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Gagal mengurutkan field');
      }
    },
    [form, canManageBuilder, onError, withCampaignName]
  );

  const applyFieldSettings = useCallback(
    async (
      fieldId: string,
      patch: {
        label?: string;
        placeholder?: string;
        note?: string;
        required?: boolean;
        type?: FormFieldType;
        fieldKey?: string;
        fileUpload?: FormBuilderField['fileUpload'];
      }
    ) => {
      if (!canManageBuilder || !form) return;
      const f = form.fields.find((x) => x.id === fieldId);
      if (!f || f.isLocked) return;

      if (!form.id) {
        setForm({
          ...form,
          fields: form.fields.map((x) =>
            x.id === fieldId
              ? {
                  ...x,
                  ...(patch.label !== undefined ? { label: patch.label } : {}),
                  ...(patch.placeholder !== undefined ? { placeholder: patch.placeholder } : {}),
                  ...(patch.note !== undefined ? { note: patch.note } : {}),
                  ...(patch.required !== undefined ? { required: patch.required } : {}),
                  ...(patch.type !== undefined ? { type: patch.type } : {}),
                  ...(patch.fieldKey !== undefined ? { fieldKey: patch.fieldKey } : {}),
                  ...(patch.fileUpload !== undefined ? { fileUpload: patch.fileUpload } : {})
                }
              : x
          )
        });
        return;
      }

      if (!f.backendFieldId) return;
      const body: Record<string, unknown> = {};
      if (patch.label !== undefined) body.label = patch.label;
      if (patch.placeholder !== undefined) body.placeholder = patch.placeholder || null;
      if (patch.note !== undefined) body.help_text = patch.note || null;
      if (patch.required !== undefined) body.is_required = patch.required;
      if (patch.type !== undefined) body.field_type = uiFieldTypeToApi(patch.type);
      if (patch.fieldKey !== undefined) body.field_key = patch.fieldKey;
      if (patch.fileUpload !== undefined) {
        body.settings_json = fileUploadSettingsToJson({ ...patch.fileUpload, maxFiles: 1 });
      }
      if (Object.keys(body).length === 0) return;
      try {
        const next = await apiUpdateField(form.id, f.backendFieldId, body);
        setForm(withCampaignName(next));
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Gagal memperbarui field');
      }
    },
    [form, canManageBuilder, onError, withCampaignName]
  );

  const addOption = useCallback(
    async (fieldId: string) => {
      if (!canManageBuilder || !form) return;
      const f = form.fields.find((x) => x.id === fieldId);
      if (!f) return;
      const apiType = uiFieldTypeToApi(f.type);
      if (!fieldTypeSupportsOptions(apiType)) return;
      const n = (f.options?.length ?? 0) + 1;
      const optLabel = `Option ${n}`;
      const newOpt = {
        id: `opt-local-${Date.now()}-${n}`,
        label: optLabel,
        value: optionValueFromLabel(optLabel, n),
        sortOrder: n
      };

      if (!form.id) {
        setForm({
          ...form,
          fields: form.fields.map((x) =>
            x.id === fieldId ? { ...x, options: [...(x.options || []), newOpt] } : x
          )
        });
        return;
      }

      if (!f.backendFieldId) return;
      try {
        const next = await apiCreateOption(f.backendFieldId, {
          label: newOpt.label,
          value: newOpt.value,
          sort_order: n
        });
        setForm(withCampaignName(next));
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Gagal menambah opsi');
      }
    },
    [form, canManageBuilder, onError, withCampaignName]
  );

  const updateOptionRow = useCallback(
    async (fieldId: string, optionLocalId: string, patch: { label?: string; value?: string; sort_order?: number }) => {
      if (!canManageBuilder || !form) return;
      const f = form.fields.find((x) => x.id === fieldId);
      const opt = f?.options?.find((o) => o.id === optionLocalId);
      if (!f || !opt) return;

      let patchOut = { ...patch };
      if (patchOut.label !== undefined && patchOut.value === undefined) {
        const ord = opt.sortOrder ?? f.options?.indexOf(opt) ?? 1;
        patchOut = { ...patchOut, value: optionValueFromLabel(patchOut.label, ord + 1) };
      }

      if (!form.id) {
        setForm({
          ...form,
          fields: form.fields.map((x) =>
            x.id === fieldId
              ? {
                  ...x,
                  options: (x.options || []).map((o) =>
                    o.id === optionLocalId
                      ? {
                          ...o,
                          ...patchOut,
                          label: patchOut.label ?? o.label,
                          value: patchOut.value ?? o.value
                        }
                      : o
                  )
                }
              : x
          )
        });
        return;
      }

      if (!f.backendFieldId || !opt.backendOptionId) return;
      try {
        const next = await apiUpdateOption(f.backendFieldId, opt.backendOptionId, patchOut);
        setForm(withCampaignName(next));
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Gagal memperbarui opsi');
      }
    },
    [form, canManageBuilder, onError, withCampaignName]
  );

  const removeOption = useCallback(
    async (fieldId: string, optionLocalId: string) => {
      if (!canManageBuilder || !form) return;
      const f = form.fields.find((x) => x.id === fieldId);
      const opt = f?.options?.find((o) => o.id === optionLocalId);
      if (!f || !opt) return;

      if (!form.id) {
        setForm({
          ...form,
          fields: form.fields.map((x) =>
            x.id === fieldId
              ? { ...x, options: (x.options || []).filter((o) => o.id !== optionLocalId) }
              : x
          )
        });
        return;
      }

      if (!f.backendFieldId || !opt.backendOptionId) return;
      try {
        const next = await apiDeleteOption(f.backendFieldId, opt.backendOptionId);
        setForm(withCampaignName(next));
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Gagal menghapus opsi');
      }
    },
    [form, canManageBuilder, onError, withCampaignName]
  );

  return {
    form,
    isLoading,
    isSaving,
    selectedField,
    selectedFieldId,
    formPersisted,
    sortableFieldIds,
    phaseBBusy,
    setSelectedFieldId,
    setMetadata,
    headerImageFile,
    setHeaderImageFile,
    clearHeaderImage,
    addField,
    deleteField,
    reorderFields,
    saveDraft,
    saveAndPublish,
    applyFieldSettings,
    addOption,
    updateOptionRow,
    removeOption,
    reloadForm: loadForm
  };
};
