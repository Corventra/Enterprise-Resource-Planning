import type { FileUploadCategory, FileUploadSettings } from '../types/form-builder.types';

export const fileUploadCategories: Array<{
  value: FileUploadCategory;
  label: string;
  formatHint: string;
}> = [
  {
    value: 'document',
    label: 'Dokumen',
    formatHint: 'pdf, doc/docx, xls/xlsx, ppt/pptx, txt'
  },
  {
    value: 'image',
    label: 'Gambar',
    formatHint: 'jpg/jpeg, png, webp'
  },
  {
    value: 'video',
    label: 'Video',
    formatHint: 'mp4, mov, avi, mkv, webm'
  },
  {
    value: 'audio',
    label: 'Audio',
    formatHint: 'mp3, wav, m4a, aac, ogg'
  },
  {
    value: 'any',
    label: 'Bebas',
    formatHint: 'semua tipe yang diizinkan sistem (dokumen, gambar, video, audio)'
  }
];

export const getFileUploadCategoryFormatHint = (category: FileUploadCategory): string => {
  const match = fileUploadCategories.find((item) => item.value === category);
  return match?.formatHint ?? '';
};

export const formatFileUploadCategoryLabel = (category: FileUploadCategory): string => {
  const match = fileUploadCategories.find((item) => item.value === category);
  if (!match) return category;
  return `${match.label} (${match.formatHint})`;
};

export const buildFileUploadAllowedTypesHint = (settings: FileUploadSettings): string => {
  return settings.allowedCategories.map((category) => formatFileUploadCategoryLabel(category)).join(' · ');
};
