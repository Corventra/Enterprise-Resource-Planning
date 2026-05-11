/**
 * Master channel Phase B — selaras seed backend `form_channels` (id + code).
 * Ganti jika backend menyediakan endpoint list channel.
 */
export interface FormChannelOption {
  channelId: number;
  code: string;
  label: string;
}

export const FORM_CHANNEL_OPTIONS: FormChannelOption[] = [
  { channelId: 1, code: 'INSTAGRAM', label: 'Instagram' },
  { channelId: 2, code: 'LINKEDIN', label: 'LinkedIn' },
  { channelId: 3, code: 'TIKTOK', label: 'TikTok' },
  { channelId: 4, code: 'WEBSITE', label: 'Website' }
];

export const getFormChannelLabel = (code: string | null | undefined): string | null => {
  if (!code) return null;
  const found = FORM_CHANNEL_OPTIONS.find((c) => c.code === code);
  return found?.label ?? code;
};
