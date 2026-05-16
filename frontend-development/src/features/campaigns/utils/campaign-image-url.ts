import { getApiOrigin } from '../../../services/api-client';

/** Gabungkan origin API dengan `image_path` backend (mis. `/uploads/campaigns/...`). */
export const buildCampaignImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath || typeof imagePath !== 'string') return null;
  const trimmed = imagePath.trim();
  if (!trimmed) return null;
  const origin = getApiOrigin();
  if (!origin) return null;
  const pathPart = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${origin}${pathPart}`;
};
