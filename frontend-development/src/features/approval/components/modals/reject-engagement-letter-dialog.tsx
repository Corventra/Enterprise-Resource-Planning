import type { ComponentProps } from 'react';
import { RejectProposalDialog } from './reject-proposal-dialog';

type BaseProps = ComponentProps<typeof RejectProposalDialog>;
type Props = Omit<BaseProps, 'title' | 'description'> & Partial<Pick<BaseProps, 'title' | 'description'>>;

/** Modal reject / minta revisi EL — teks default sesuai Approval Center Engagement Letter. */
export const RejectEngagementLetterDialog = ({
  title = 'Tolak engagement letter ini?',
  description = 'Engagement letter akan dikembalikan ke BD untuk direvisi.',
  ...rest
}: Props) => <RejectProposalDialog title={title} description={description} {...rest} />;
