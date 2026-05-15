import type { ComponentProps } from 'react';
import { RejectProposalDialog } from './reject-proposal-dialog';

type BaseProps = ComponentProps<typeof RejectProposalDialog>;
type Props = Omit<BaseProps, 'title' | 'description'> & Partial<Pick<BaseProps, 'title' | 'description'>>;

export const RejectHandoverDialog = ({
  title = 'Tolak handover ini?',
  description = 'Handover akan dikembalikan ke BD untuk direvisi.',
  ...rest
}: Props) => <RejectProposalDialog title={title} description={description} {...rest} />;
