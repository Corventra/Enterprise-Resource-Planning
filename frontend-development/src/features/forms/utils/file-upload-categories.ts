import type { FileUploadCategory } from '../types/form-builder.types';

export const fileUploadCategories: Array<{ value: FileUploadCategory; label: string }> = [
  { value: 'identity-document', label: 'Identity Document' },
  { value: 'financial-document', label: 'Financial Document' },
  { value: 'legal-document', label: 'Legal Document' },
  { value: 'supporting-document', label: 'Supporting Document' },
  { value: 'other', label: 'Other' }
];
