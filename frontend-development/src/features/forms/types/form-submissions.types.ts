export interface FormSubmissionListItem {
  submission_id: number;
  response_number: number;
  submitted_at: string;
  distribution_link_id: number;
  link_type: 'PRIMARY' | 'CHANNEL';
  channel_id: number | null;
  channel_code: string | null;
  channel_name: string | null;
  summary_text: string;
}

export interface FormSubmissionAnswerDetail {
  field_id: number;
  field_key: string;
  label: string;
  field_type: string;
  sort_order: number;
  answer_value: string | null;
  answer_display_value: string | null;
  answer_file_path: string | null;
  options: Array<{
    option_id: number;
    label: string;
    value: string;
    sort_order: number;
  }>;
}

export interface FormSubmissionDetail {
  submission: FormSubmissionListItem & { link_code: string };
  form: {
    form_id: number;
    form_code: string | null;
    form_category: 'LEAD_CAPTURE' | 'GENERAL';
    title: string;
    campaign_id: number;
  };
  answers: FormSubmissionAnswerDetail[];
}
