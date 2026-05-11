import { getFormChannelLabel } from '../constants/form-channels';

export const formatSubmissionSourceLabel = (input: {
  link_type: 'PRIMARY' | 'CHANNEL';
  channel_code?: string | null;
  channel_name?: string | null;
}): string => {
  if (input.link_type === 'CHANNEL') {
    return (
      getFormChannelLabel(input.channel_code ?? undefined) ??
      input.channel_name?.trim() ??
      input.channel_code?.trim() ??
      'Channel'
    );
  }
  return 'Link utama';
};
