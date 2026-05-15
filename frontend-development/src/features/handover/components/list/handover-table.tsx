import type { ReactNode } from 'react';
import type { HandoverItem } from '../../types/handover.types';
import { handoverItemToMemoTableRow } from '../../utils/handover-memo-table-row';
import { HandoverMemoTable } from './handover-memo-table';

interface HandoverTableProps {
  items: HandoverItem[];
  onView: (item: HandoverItem) => void;
  footer?: ReactNode;
}

export const HandoverTable = ({ items, onView, footer }: HandoverTableProps) => {
  const rows = items.map(handoverItemToMemoTableRow);

  return (
    <HandoverMemoTable
      actorColumn="created"
      rows={rows}
      footer={footer}
      onView={(row) => {
        const item = items.find((entry) => entry.id === row.id);
        if (item) onView(item);
      }}
    />
  );
};
