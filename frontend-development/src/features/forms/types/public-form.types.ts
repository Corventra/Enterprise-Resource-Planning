import type { FormCategory } from './form-builder.types';

export type PublicFormAvailability =
  | 'AVAILABLE'
  | 'PAUSED'
  | 'INACTIVE'
  | 'DRAFT'
  | 'NOT_FOUND';

export type PublicFormFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'file';

export interface PublicFormFieldOption {
  option_id: number;
  label: string;
  value: string;
  sort_order: number;
}

export interface PublicFormField {
  field_id: number;
  field_key: string;
  label: string;
  field_type: PublicFormFieldType;
  placeholder: string | null;
  help_text: string | null;
  is_required: boolean;
  sort_order: number;
  options: PublicFormFieldOption[];
  settings_json?: Record<string, unknown> | null;
}

export interface PublicFormMeta {
  form_id: number;
  form_code: string | null;
  form_category: FormCategory;
  title: string;
  description: string | null;
  header_image_path: string | null;
  success_message: string | null;
  success_link_url: string | null;
  success_link_label: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'INACTIVE';
  is_accepting_responses: boolean;
}

export interface PublicFormPayload {
  availability: PublicFormAvailability;
  form: PublicFormMeta;
  link: {
    distribution_link_id: number;
    link_code: string;
    link_type: string;
    channel_id: number | null;
    channel_code: string | null;
    channel_name: string | null;
  };
  fields: PublicFormField[];
}

export type PublicFormAnswerValue = string | string[];

export interface PublicFormSubmitAnswer {
  field_id: number;
  value: PublicFormAnswerValue;
}

export interface PublicFormSubmitPayload {
  answers: PublicFormSubmitAnswer[];
}

export interface PublicFormSubmitResult {
  submission_id: number;
  success_message: string | null;
  success_link_url: string | null;
  success_link_label: string | null;
}
