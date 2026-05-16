import type { ComponentProps } from 'react';
import { ApproveProposalDialog } from './approve-proposal-dialog';

type BaseProps = ComponentProps<typeof ApproveProposalDialog>;
type Props = Omit<BaseProps, 'title' | 'description'> & Partial<Pick<BaseProps, 'title' | 'description'>>;

export const ApproveHandoverDialog = ({
  title = 'Approve handover ini?',
  description = 'Handover yang disetujui akan selesai di tahap CEO dan siap diteruskan ke proses berikutnya.',
  ...rest
}: Props) => <ApproveProposalDialog title={title} description={description} {...rest} />;
