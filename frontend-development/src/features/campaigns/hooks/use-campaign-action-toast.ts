export { useToast as useCampaignActionToast } from '../../../hooks/use-toast';

export const CAMPAIGN_TOAST = {
  created: 'Campaign telah berhasil dibuat.',
  updated: 'Campaign berhasil diperbarui.',
  archived: 'Campaign berhasil diarsipkan.'
} as const;
