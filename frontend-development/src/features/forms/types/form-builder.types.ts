export type FormBuilderMode = 'edit' | 'preview';

export type FormSaveStatus = 'draft' | 'published';

export type FormFieldType =
  | 'short-text'
  | 'long-text'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'file-upload';

export type FileUploadCategory =
  | 'identity-document'
  | 'financial-document'
  | 'legal-document'
  | 'supporting-document'
  | 'other';

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
  label: string;
  value: string;
}

export interface FormBuilderField {
  id: string;
  type: FormFieldType;
  label: string;
  note: string;
  placeholder: string;
  required: boolean;
  isCore: boolean;
  options?: FormFieldOption[];
  fileUpload?: FileUploadSettings;
}

export interface FormBuilderDocument {
  id: string;
  campaignId: string;
  campaignName?: string;
  title: string;
  description: string;
  successMessage: string;
  headerImageUrl?: string;
  publicSlug: string;
  status: FormSaveStatus;
  fields: FormBuilderField[];
  updatedAt: string;
}
