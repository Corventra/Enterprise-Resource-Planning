const { ValidationError } = require('./validation');

const DEFAULT_MAX_SIZE_MB = 5;
const DEFAULT_CATEGORIES = ['document'];

const CATEGORY_EXTENSIONS = {
  document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
  image: ['.jpg', '.jpeg', '.png', '.webp'],
  video: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
  audio: ['.mp3', '.wav', '.m4a', '.aac', '.ogg'],
  any: []
};

const CATEGORY_MIMES = {
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

const LEGACY_CATEGORY_MAP = {
  'identity-document': 'document',
  'financial-document': 'document',
  'legal-document': 'document',
  'supporting-document': 'document',
  other: 'any'
};

const KNOWN_CATEGORIES = new Set(['document', 'image', 'video', 'audio', 'any']);

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

const extFromName = (name) => {
  if (!name || typeof name !== 'string') return '';
  const idx = name.lastIndexOf('.');
  if (idx < 0) return '';
  return name.slice(idx).toLowerCase();
};

const normalizeCategory = (value) => {
  if (KNOWN_CATEGORIES.has(value)) return value;
  const mapped = LEGACY_CATEGORY_MAP[value];
  return mapped && KNOWN_CATEGORIES.has(mapped) ? mapped : null;
};

const normalizeCategories = (values) => {
  if (!Array.isArray(values)) return [];
  const normalized = values
    .filter((value) => typeof value === 'string')
    .map((value) => normalizeCategory(value))
    .filter(Boolean);
  return [...new Set(normalized)];
};

const allowedExtensionsForCategories = (categories) => {
  const extensions = new Set();
  for (const category of categories) {
    if (category === 'any') {
      for (const ext of SYSTEM_ALLOWED_EXTENSIONS) extensions.add(ext);
      continue;
    }
    for (const ext of CATEGORY_EXTENSIONS[category] || []) extensions.add(ext);
  }
  return extensions;
};

const allowedMimesForCategories = (categories) => {
  const mimes = new Set();
  for (const category of categories) {
    if (category === 'any') {
      for (const mime of SYSTEM_ALLOWED_MIMES) mimes.add(mime);
      continue;
    }
    for (const mime of CATEGORY_MIMES[category] || []) mimes.add(mime);
  }
  return mimes;
};

const parseFormFileSettings = (settingsJson) => {
  const raw = settingsJson && typeof settingsJson === 'object' && !Array.isArray(settingsJson) ? settingsJson : {};
  const categories = normalizeCategories(raw.allowedCategories);
  const primaryCategory = categories.length > 0 ? categories[0] : DEFAULT_CATEGORIES[0];
  const maxSizeMbRaw = Number(raw.maxSizeMb);
  const maxSizeMb =
    Number.isFinite(maxSizeMbRaw) && maxSizeMbRaw > 0 ? Math.min(maxSizeMbRaw, 50) : DEFAULT_MAX_SIZE_MB;
  return {
    allowedCategories: [primaryCategory],
    maxSizeMb,
    maxFiles: 1
  };
};

const isFileAllowedByCategories = (mimetype, originalname, allowedCategories) => {
  const ext = extFromName(originalname);
  const mime = (mimetype || '').toLowerCase();
  const allowedExtensions = allowedExtensionsForCategories(allowedCategories);
  const allowedMimes = allowedMimesForCategories(allowedCategories);
  if (ext && allowedExtensions.has(ext)) return true;
  if (mime && allowedMimes.has(mime)) return true;
  return false;
};

const validateUploadedSubmissionFile = (field, file) => {
  if (!file) {
    throw new ValidationError(`Field "${field.label}" membutuhkan file.`);
  }
  const settings = parseFormFileSettings(field.settings_json);
  const maxBytes = settings.maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new ValidationError(
      `File untuk field "${field.label}" melebihi ukuran maksimum ${settings.maxSizeMb} MB.`
    );
  }
  if (!isFileAllowedByCategories(file.mimetype, file.originalname, settings.allowedCategories)) {
    throw new ValidationError(`Tipe file tidak diizinkan untuk field "${field.label}".`);
  }
  return settings;
};

module.exports = {
  parseFormFileSettings,
  validateUploadedSubmissionFile,
  isFileAllowedByCategories
};
