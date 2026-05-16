import type { FormBuilderField } from '../types/form-builder.types';
import type { PublicFormField, PublicFormFieldType } from '../types/public-form.types';
import { uiFieldTypeToApi } from '../services/forms-api';

export const mapBuilderFieldToPublicField = (field: FormBuilderField, index: number): PublicFormField => {
  const fieldId = field.backendFieldId ?? index + 1;
  return {
    field_id: fieldId,
    field_key: field.fieldKey ?? `field_${fieldId}`,
    label: field.label,
    field_type: uiFieldTypeToApi(field.type) as PublicFormFieldType,
    placeholder: field.placeholder || null,
    help_text: field.note || null,
    is_required: field.required,
    sort_order: field.sortOrder ?? index + 1,
    options: (field.options ?? []).map((option, optionIndex) => ({
      option_id: option.backendOptionId ?? optionIndex + 1,
      label: option.label,
      value: option.value,
      sort_order: option.sortOrder ?? optionIndex + 1
    })),
    settings_json: field.settingsJson ?? null
  };
};

export const mapBuilderFieldsToPublicFields = (fields: FormBuilderField[]): PublicFormField[] => {
  const sorted = [...fields].sort((a, b) => {
    if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    return (a.backendFieldId ?? 0) - (b.backendFieldId ?? 0);
  });
  return sorted.map((field, index) => mapBuilderFieldToPublicField(field, index));
};
