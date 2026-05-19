export type FormBuilderMode = 'edit' | 'preview';

export type FormSaveStatus = 'draft' | 'published' | 'inactive';

export type FormCategory = 'LEAD_CAPTURE' | 'GENERAL';

export type FormBackendStatus = 'DRAFT' | 'PUBLISHED' | 'INACTIVE';

export type FormFieldType =
  | 'short-text'
  | 'long-text'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'file-upload';

export type FileUploadCategory = 'document' | 'image' | 'video' | 'audio' | 'any';

export interface RichTextFormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

export interface FileUploadSettings {
  allowedCategories: FileUploadCategory[];
  maxFiles: number;
  maxSizeMb: number;
}

export interface FormFieldOption {
  id: string;
  backendOptionId?: number;
  label: string;
  value: string;
  sortOrder?: number;
}

export interface FormBuilderField {
  id: string;
  /** ID field dari API setelah persist */
  backendFieldId?: number;
  fieldKey?: string;
  type: FormFieldType;
  label: string;
  note: string;
  placeholder: string;
  required: boolean;
  /** Field sistem LEAD_CAPTURE — kompat UI lama */
  isCore: boolean;
  isLocked?: boolean;
  isSystem?: boolean;
  settingsJson?: Record<string, unknown>;
  /** Urutan dari API (sort_order) */
  sortOrder?: number;
  /** 5 wajib LEAD_CAPTURE di canvas sebelum POST pertama */
  isPreSaveLocalSystem?: boolean;
  options?: FormFieldOption[];
  fileUpload?: FileUploadSettings;
}

export interface FormBuilderDocument {
  id: string;
  campaignId: string;
  campaignName?: string;
  formCategory: FormCategory;
  title: string;
  description: string;
  successMessage: string;
  successLinkUrl: string;
  successLinkLabel: string;
  headerImageUrl?: string;
  /** Legacy UI — Phase A pakai form_code dari backend di sini opsional */
  publicSlug: string;
  status: FormSaveStatus;
  backendStatus: FormBackendStatus;
  /** Phase B — dari API forms */
  isAcceptingResponses?: boolean;
  publishedAt?: string | null;
  fields: FormBuilderField[];
  updatedAt: string;
}

export interface FormBuilderMetadataErrors {
  title?: string;
  description?: string;
  successMessage?: string;
}

/** Link distribusi form (Phase B) — mirror response GET /forms/:id/links */
export interface FormDistributionLink {
  distributionLinkId: number;
  formId: number;
  channelId: number | null;
  channelName: string | null;
  channelCode: string | null;
  linkType: 'PRIMARY' | 'CHANNEL';
  linkCode: string;
  publicUrl: string;
  createdAt: string;
}
