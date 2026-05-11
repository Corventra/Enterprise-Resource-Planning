import { apiDelete, apiGet, apiPatch, apiPatchFormData, apiPost, apiPostFormData } from '../../../services/api-client';
import { fileUploadSettingsToJson, parseFileUploadSettings } from '../utils/file-upload-rules';
import { mergeLeadCaptureSystemFieldDisplay } from '../utils/lead-capture-field-fallbacks';
import type {
  FormBuilderDocument,
  FormBuilderField,
  FormDistributionLink,
  FormFieldType
} from '../types/form-builder.types';

/** Response baris form dari GET list / nested */
export interface ApiFormRow {
  form_id: number;
  form_code: string | null;
  campaign_id: number;
  form_category: 'LEAD_CAPTURE' | 'GENERAL';
  title: string;
  description: string | null;
  header_image_path: string | null;
  success_message: string | null;
  success_link_url: string | null;
  success_link_label: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'INACTIVE';
  is_accepting_responses: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface ApiFieldOptionRow {
  option_id: number;
  field_id: number;
  label: string;
  value: string;
  sort_order: number;
}

export interface ApiFieldRow {
  field_id: number;
  form_id: number;
  field_key: string;
  label: string;
  field_type: string;
  placeholder: string | null;
  help_text: string | null;
  is_required: boolean;
  is_system: boolean;
  is_locked: boolean;
  sort_order: number;
  settings_json: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  options?: ApiFieldOptionRow[];
}

interface ApiSuccessDetail {
  success: boolean;
  message?: string;
  data: { form: ApiFormRow; fields: ApiFieldRow[] };
}

export interface ApiFormDistributionLinkRow {
  distribution_link_id: number;
  form_id: number;
  channel_id: number | null;
  channel_name: string | null;
  channel_code: string | null;
  link_type: 'PRIMARY' | 'CHANNEL';
  link_code: string;
  public_url: string;
  created_at: string;
}

interface ApiSuccessDetailWithLinks extends ApiSuccessDetail {
  data: ApiSuccessDetail['data'] & { links?: ApiFormDistributionLinkRow[] };
}

interface ApiSuccessLinks {
  success: boolean;
  message?: string;
  data: { links: ApiFormDistributionLinkRow[] };
}

interface ApiSuccessMessage {
  success: boolean;
  message?: string;
}

interface ApiSuccessList {
  success: boolean;
  data: { forms: ApiFormRow[] };
}

export const API_FIELD_TYPES = [
  'text',
  'textarea',
  'select',
  'radio',
  'checkbox',
  'date',
  'file'
] as const;

export type ApiFieldType = (typeof API_FIELD_TYPES)[number];

const OPTION_API_TYPES = new Set(['select', 'radio', 'checkbox']);

export const fieldTypeSupportsOptions = (apiType: string) => OPTION_API_TYPES.has(apiType);

const UI_TO_API: Record<FormFieldType, ApiFieldType> = {
  'short-text': 'text',
  'long-text': 'textarea',
  dropdown: 'select',
  radio: 'radio',
  checkbox: 'checkbox',
  date: 'date',
  'file-upload': 'file'
};

const API_TO_UI: Record<string, FormFieldType> = {
  text: 'short-text',
  textarea: 'long-text',
  select: 'dropdown',
  radio: 'radio',
  checkbox: 'checkbox',
  date: 'date',
  file: 'file-upload'
};

export const uiFieldTypeToApi = (t: FormFieldType): ApiFieldType => UI_TO_API[t];

export const apiFieldTypeToUi = (t: string): FormFieldType => API_TO_UI[t] ?? 'short-text';

export function mapApiFieldToBuilder(f: ApiFieldRow): FormBuilderField {
  const options = (f.options || []).map((o) => ({
    id: `opt-${o.option_id}`,
    backendOptionId: o.option_id,
    label: o.label,
    value: o.value,
    sortOrder: o.sort_order
  }));
  const rawPh = f.placeholder ?? '';
  const rawNote = f.help_text ?? '';
  const merged = mergeLeadCaptureSystemFieldDisplay(f.field_key, rawPh, rawNote);
  const uiType = apiFieldTypeToUi(f.field_type);
  const field: FormBuilderField = {
    id: `field-${f.field_id}`,
    backendFieldId: f.field_id,
    fieldKey: f.field_key,
    type: uiType,
    label: f.label,
    note: merged.note,
    placeholder: merged.placeholder,
    required: Boolean(f.is_required),
    isCore: Boolean(f.is_system),
    isLocked: Boolean(f.is_locked),
    isSystem: Boolean(f.is_system),
    settingsJson: f.settings_json ?? undefined,
    sortOrder: f.sort_order,
    options: options.length ? options : undefined
  };
  if (uiType === 'file-upload') {
    field.fileUpload = parseFileUploadSettings(f.settings_json);
    field.settingsJson = fileUploadSettingsToJson(field.fileUpload);
  }
  return field;
}

export function mapApiLinkRowToDistributionLink(row: ApiFormDistributionLinkRow): FormDistributionLink {
  return {
    distributionLinkId: row.distribution_link_id,
    formId: row.form_id,
    channelId: row.channel_id,
    channelName: row.channel_name,
    channelCode: row.channel_code,
    linkType: row.link_type,
    linkCode: row.link_code,
    publicUrl: row.public_url,
    createdAt: row.created_at
  };
}

export function mapApiDetailToDocument(
  form: ApiFormRow,
  fields: ApiFieldRow[],
  campaignName?: string
): FormBuilderDocument {
  const sorted = [...fields].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.field_id - b.field_id;
  });
  const status: FormBuilderDocument['status'] =
    form.status === 'PUBLISHED' ? 'published' : form.status === 'INACTIVE' ? 'inactive' : 'draft';
  return {
    id: String(form.form_id),
    campaignId: String(form.campaign_id),
    campaignName,
    formCategory: form.form_category,
    title: form.title,
    description: form.description ?? '',
    successMessage: form.success_message ?? '',
    successLinkUrl: form.success_link_url ?? '',
    successLinkLabel: form.success_link_label ?? '',
    headerImageUrl: form.header_image_path ?? '',
    publicSlug: form.form_code || '',
    status,
    backendStatus: form.status,
    isAcceptingResponses: form.is_accepting_responses,
    publishedAt: form.published_at,
    fields: sorted.map(mapApiFieldToBuilder),
    updatedAt: form.updated_at
  };
}

export async function getCampaignForms(campaignId: string): Promise<ApiFormRow[]> {
  const res = await apiGet<ApiSuccessList>(`/campaigns/${campaignId}/forms`);
  return res.data?.forms ?? [];
}

export type FormMetadataWriteBody = {
  form_category?: 'LEAD_CAPTURE' | 'GENERAL';
  title: string;
  description?: string | null;
  header_image_path?: string | null;
  success_message?: string | null;
  success_link_url?: string | null;
  success_link_label?: string | null;
};

const appendNullableFormField = (fd: FormData, key: string, value: string | null | undefined) => {
  if (value === undefined) return;
  fd.append(key, value ?? '');
};

const buildFormMetadataFormData = (body: FormMetadataWriteBody, headerImageFile?: File | null): FormData => {
  const fd = new FormData();
  if (body.form_category) {
    fd.append('form_category', body.form_category);
  }
  fd.append('title', body.title.trim());
  appendNullableFormField(fd, 'description', body.description);
  appendNullableFormField(fd, 'header_image_path', body.header_image_path);
  appendNullableFormField(fd, 'success_message', body.success_message);
  appendNullableFormField(fd, 'success_link_url', body.success_link_url);
  appendNullableFormField(fd, 'success_link_label', body.success_link_label);
  if (headerImageFile) {
    fd.append('image', headerImageFile);
  }
  return fd;
};

export async function createCampaignForm(
  campaignId: string,
  body: FormMetadataWriteBody & { form_category: 'LEAD_CAPTURE' | 'GENERAL' },
  options?: { headerImageFile?: File | null }
): Promise<FormBuilderDocument> {
  const headerImageFile = options?.headerImageFile ?? null;
  const res = headerImageFile
    ? await apiPostFormData<ApiSuccessDetail>(
        `/campaigns/${campaignId}/forms`,
        buildFormMetadataFormData(body, headerImageFile)
      )
    : await apiPost<ApiSuccessDetail>(`/campaigns/${campaignId}/forms`, body);
  const { form, fields } = res.data;
  return mapApiDetailToDocument(form, fields);
}

export async function getFormById(formId: string): Promise<FormBuilderDocument> {
  const res = await apiGet<ApiSuccessDetail>(`/forms/${formId}`);
  const { form, fields } = res.data;
  return mapApiDetailToDocument(form, fields);
}

export async function updateForm(
  formId: string,
  body: FormMetadataWriteBody,
  options?: { headerImageFile?: File | null }
): Promise<FormBuilderDocument> {
  const headerImageFile = options?.headerImageFile ?? null;
  const res = headerImageFile
    ? await apiPatchFormData<ApiSuccessDetail>(
        `/forms/${formId}`,
        buildFormMetadataFormData(body, headerImageFile)
      )
    : await apiPatch<ApiSuccessDetail>(`/forms/${formId}`, body);
  const { form, fields } = res.data;
  return mapApiDetailToDocument(form, fields);
}

export async function createField(
  formId: string,
  body: {
    field_key: string;
    label: string;
    field_type: ApiFieldType;
    placeholder?: string | null;
    help_text?: string | null;
    is_required: boolean;
    sort_order: number;
    settings_json?: Record<string, unknown> | null;
  }
): Promise<FormBuilderDocument> {
  const res = await apiPost<ApiSuccessDetail>(`/forms/${formId}/fields`, body);
  const { form, fields } = res.data;
  return mapApiDetailToDocument(form, fields);
}

export async function updateField(
  formId: string,
  fieldId: number,
  body: Record<string, unknown>
): Promise<FormBuilderDocument> {
  const res = await apiPatch<ApiSuccessDetail>(`/forms/${formId}/fields/${fieldId}`, body);
  const { form, fields } = res.data;
  return mapApiDetailToDocument(form, fields);
}

export async function deleteField(formId: string, fieldId: number): Promise<FormBuilderDocument> {
  const res = await apiDelete<ApiSuccessDetail>(`/forms/${formId}/fields/${fieldId}`);
  const { form, fields } = res.data;
  return mapApiDetailToDocument(form, fields);
}

export async function createOption(
  fieldId: number,
  body: { label: string; value: string; sort_order?: number }
): Promise<FormBuilderDocument> {
  const res = await apiPost<ApiSuccessDetail>(`/fields/${fieldId}/options`, body);
  const { form, fields } = res.data;
  return mapApiDetailToDocument(form, fields);
}

export async function updateOption(
  fieldId: number,
  optionId: number,
  body: { label?: string; value?: string; sort_order?: number }
): Promise<FormBuilderDocument> {
  const res = await apiPatch<ApiSuccessDetail>(`/fields/${fieldId}/options/${optionId}`, body);
  const { form, fields } = res.data;
  return mapApiDetailToDocument(form, fields);
}

export async function deleteOption(fieldId: number, optionId: number): Promise<FormBuilderDocument> {
  const res = await apiDelete<ApiSuccessDetail>(`/fields/${fieldId}/options/${optionId}`);
  const { form, fields } = res.data;
  return mapApiDetailToDocument(form, fields);
}

export async function publishForm(formId: string): Promise<{
  document: FormBuilderDocument;
  links: FormDistributionLink[];
}> {
  const res = await apiPost<ApiSuccessDetailWithLinks>(`/forms/${formId}/publish`);
  const { form, fields, links } = res.data;
  return {
    document: mapApiDetailToDocument(form, fields),
    links: (links ?? []).map(mapApiLinkRowToDistributionLink)
  };
}

export async function getFormLinks(formId: string): Promise<FormDistributionLink[]> {
  const res = await apiGet<ApiSuccessLinks>(`/forms/${formId}/links`);
  return (res.data?.links ?? []).map(mapApiLinkRowToDistributionLink);
}

export async function deactivateForm(formId: string): Promise<FormBuilderDocument> {
  const res = await apiPost<ApiSuccessDetail>(`/forms/${formId}/deactivate`);
  const { form, fields } = res.data;
  return mapApiDetailToDocument(form, fields);
}

export async function pauseFormResponses(formId: string): Promise<FormBuilderDocument> {
  const res = await apiPost<ApiSuccessDetail>(`/forms/${formId}/pause-responses`);
  const { form, fields } = res.data;
  return mapApiDetailToDocument(form, fields);
}

export async function resumeFormResponses(formId: string): Promise<FormBuilderDocument> {
  const res = await apiPost<ApiSuccessDetail>(`/forms/${formId}/resume-responses`);
  const { form, fields } = res.data;
  return mapApiDetailToDocument(form, fields);
}

/** Hanya DRAFT; backend menolak jika bukan draft atau ada submission. */
export async function deleteDraftForm(formId: string): Promise<void> {
  await apiDelete<ApiSuccessMessage>(`/forms/${formId}`);
}
