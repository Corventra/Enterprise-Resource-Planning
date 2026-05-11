import type { FormBuilderField, FormFieldType } from '../types/form-builder.types';
import { fileUploadCategories } from './file-upload-categories';

const generateFieldId = () => `field-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

const createDefaultOptions = () => [
  { id: `${Date.now()}-1`, label: 'Option 1', value: 'option_1' },
  { id: `${Date.now()}-2`, label: 'Option 2', value: 'option_2' }
];

/** Hanya untuk UI sebelum persist — backend akan mengabaikan id lokal. */
export const createFieldByType = (type: FormFieldType): FormBuilderField => {
  const common = {
    id: generateFieldId(),
    type,
    label: 'Untitled Field',
    note: '',
    placeholder: '',
    required: false,
    isCore: false,
    isLocked: false,
    isSystem: false
  } satisfies Omit<FormBuilderField, 'options' | 'fileUpload'>;

  if (type === 'dropdown' || type === 'radio' || type === 'checkbox') {
    return {
      ...common,
      options: createDefaultOptions()
    };
  }

  if (type === 'file-upload') {
    return {
      ...common,
      placeholder: 'Upload file',
      fileUpload: {
        allowedCategories: [fileUploadCategories[0].value],
        maxFiles: 1,
        maxSizeMb: 5
      }
    };
  }

  if (type === 'date') {
    return {
      ...common,
      placeholder: 'Select date'
    };
  }

  if (type === 'long-text') {
    return {
      ...common,
      placeholder: 'Type your answer'
    };
  }

  return {
    ...common,
    placeholder: 'Type your answer'
  };
};
