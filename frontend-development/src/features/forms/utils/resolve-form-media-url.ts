import { getApiOrigin } from '../../../services/api-client';
import publicFormDefaultHeader from '../../../assets/branding/corventra-logo.svg';

/** Banner header publik saat `header_image_path` kosong / null. */
export const PUBLIC_FORM_DEFAULT_HEADER_URL = publicFormDefaultHeader;

/** Path relatif upload dari API (mis. /uploads/...) → URL absolut. */
export const resolveFormMediaUrl = (path: string | null | undefined): string | null => {
  if (!path || !path.trim()) return null;
  const trimmed = path.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const origin = getApiOrigin();
  if (!origin) return trimmed;
  return `${origin}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
};

/** Header publik: upload form jika ada, selain itu aset default. */
export const resolvePublicFormHeaderImageUrl = (path: string | null | undefined): string =>
  resolveFormMediaUrl(path) ?? PUBLIC_FORM_DEFAULT_HEADER_URL;
