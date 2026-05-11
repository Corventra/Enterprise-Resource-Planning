import type { FileUploadCategory, FileUploadSettings } from '../types/form-builder.types';
import { fileUploadCategories } from './file-upload-categories';

const DEFAULT_MAX_SIZE_MB = 5;
const DEFAULT_CATEGORY: FileUploadCategory = 'document';

const CATEGORY_EXTENSIONS: Record<FileUploadCategory, readonly string[]> = {
  document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
  image: ['.jpg', '.jpeg', '.png', '.webp'],
  video: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
  audio: ['.mp3', '.wav', '.m4a', '.aac', '.ogg'],
  any: []
};

const CATEGORY_MIMES: Record<FileUploadCategory, readonly string[]> = {
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ],
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/ogg'],
  any: []
};

const LEGACY_CATEGORY_MAP: Record<string, FileUploadCategory> = {
  'identity-document': 'document',
  'financial-document': 'document',
  'legal-document': 'document',
  'supporting-document': 'document',
  other: 'any'
};

const KNOWN_CATEGORIES = new Set<FileUploadCategory>(fileUploadCategories.map((category) => category.value));

const SYSTEM_ALLOWED_EXTENSIONS = [
  ...CATEGORY_EXTENSIONS.document,
  ...CATEGORY_EXTENSIONS.image,
  ...CATEGORY_EXTENSIONS.video,
  ...CATEGORY_EXTENSIONS.audio
];

const SYSTEM_ALLOWED_MIMES = [
  ...CATEGORY_MIMES.document,
  ...CATEGORY_MIMES.image,
  ...CATEGORY_MIMES.video,
  ...CATEGORY_MIMES.audio
];

const extFromName = (name: string): string => {
  const idx = name.lastIndexOf('.');
  if (idx < 0) return '';
  return name.slice(idx).toLowerCase();
};

const normalizeCategory = (value: string): FileUploadCategory | null => {
  if (KNOWN_CATEGORIES.has(value as FileUploadCategory)) {
    return value as FileUploadCategory;
  }
  const mapped = LEGACY_CATEGORY_MAP[value];
  return mapped && KNOWN_CATEGORIES.has(mapped) ? mapped : null;
};

const normalizeCategories = (values: unknown): FileUploadCategory[] => {
  if (!Array.isArray(values)) return [];
  const normalized = values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => normalizeCategory(value))
    .filter((value): value is FileUploadCategory => value != null);
  return [...new Set(normalized)];
};

const allowedExtensionsForCategories = (categories: FileUploadCategory[]): Set<string> => {
  const extensions = new Set<string>();
  for (const category of categories) {
    if (category === 'any') {
      for (const ext of SYSTEM_ALLOWED_EXTENSIONS) extensions.add(ext);
      continue;
    }
    for (const ext of CATEGORY_EXTENSIONS[category]) extensions.add(ext);
  }
  return extensions;
};

const allowedMimesForCategories = (categories: FileUploadCategory[]): Set<string> => {
  const mimes = new Set<string>();
  for (const category of categories) {
    if (category === 'any') {
      for (const mime of SYSTEM_ALLOWED_MIMES) mimes.add(mime);
      continue;
    }
    for (const mime of CATEGORY_MIMES[category]) mimes.add(mime);
  }
  return mimes;
};

export const defaultFileUploadSettings = (): FileUploadSettings => ({
  allowedCategories: [DEFAULT_CATEGORY],
  maxFiles: 1,
  maxSizeMb: DEFAULT_MAX_SIZE_MB
});

export const parseFileUploadSettings = (settingsJson: unknown): FileUploadSettings => {
  const raw = settingsJson && typeof settingsJson === 'object' && !Array.isArray(settingsJson)
    ? (settingsJson as Record<string, unknown>)
    : {};
  const categories = normalizeCategories(raw.allowedCategories);
  const maxSizeMbRaw = Number(raw.maxSizeMb);
  const maxSizeMb =
    Number.isFinite(maxSizeMbRaw) && maxSizeMbRaw > 0 ? Math.min(maxSizeMbRaw, 50) : DEFAULT_MAX_SIZE_MB;
  const primaryCategory = categories.length > 0 ? categories[0] : DEFAULT_CATEGORY;
  return {
    allowedCategories: [primaryCategory],
    maxFiles: 1,
    maxSizeMb
  };
};

export const fileUploadSettingsToJson = (settings: FileUploadSettings): Record<string, unknown> => ({
  allowedCategories: [settings.allowedCategories[0] ?? DEFAULT_CATEGORY],
  maxSizeMb: settings.maxSizeMb,
  maxFiles: 1
});

export const buildFileAcceptAttribute = (settings: FileUploadSettings): string => {
  return [...allowedExtensionsForCategories(settings.allowedCategories)].join(',');
};

export const validateSelectedFile = (file: File, settings: FileUploadSettings): string | null => {
  const maxBytes = settings.maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return `Ukuran file maksimal ${settings.maxSizeMb} MB.`;
  }

  const allowedExtensions = allowedExtensionsForCategories(settings.allowedCategories);
  const allowedMimes = allowedMimesForCategories(settings.allowedCategories);
  const ext = extFromName(file.name);
  const mime = (file.type || '').toLowerCase();

  if ((ext && allowedExtensions.has(ext)) || (mime && allowedMimes.has(mime))) {
    return null;
  }

  return 'Tipe file tidak diizinkan untuk field ini.';
};
