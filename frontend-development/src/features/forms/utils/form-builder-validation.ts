import { FORM_TOAST } from '../constants/form-toast';
import type { FormBuilderDocument, FormBuilderMetadataErrors } from '../types/form-builder.types';

/** True when rich-text HTML has no visible text (tags / &nbsp; stripped). */
export const isRichTextEmpty = (html: string): boolean => {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length === 0;
};

export const validateFormBuilderMetadata = (
  form: Pick<FormBuilderDocument, 'title' | 'description' | 'successMessage'>
): FormBuilderMetadataErrors => {
  const errors: FormBuilderMetadataErrors = {};

  if (!form.title.trim()) {
    errors.title = FORM_TOAST.titleRequired;
  }
  if (isRichTextEmpty(form.description)) {
    errors.description = FORM_TOAST.descriptionRequired;
  }
  if (isRichTextEmpty(form.successMessage)) {
    errors.successMessage = FORM_TOAST.successMessageRequired;
  }

  return errors;
};

export const hasFormBuilderMetadataErrors = (errors: FormBuilderMetadataErrors): boolean =>
  Boolean(errors.title || errors.description || errors.successMessage);

export const firstFormBuilderMetadataError = (errors: FormBuilderMetadataErrors): string | undefined =>
  errors.title ?? errors.description ?? errors.successMessage;
