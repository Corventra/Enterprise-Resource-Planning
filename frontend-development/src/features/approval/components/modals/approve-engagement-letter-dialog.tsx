import type { ComponentProps } from 'react';
import { ApproveProposalDialog } from './approve-proposal-dialog';

type BaseProps = ComponentProps<typeof ApproveProposalDialog>;
type Props = Omit<BaseProps, 'title' | 'description'> & Partial<Pick<BaseProps, 'title' | 'description'>>;

/** Konfirmasi approve EL — teks default sesuai Approval Center Engagement Letter. */
export const ApproveEngagementLetterDialog = ({
  title = 'Approve engagement letter ini?',
  description = 'Engagement letter yang disetujui akan dilanjutkan ke tahap pengiriman ke client.',
  ...rest
}: Props) => <ApproveProposalDialog title={title} description={description} {...rest} />;
