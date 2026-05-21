import type { ReactNode } from 'react';
import type { DocumentCenterListItem } from '../../types/document-center.types';
import { DocumentCenterTableRowActions } from './document-center-table-row-actions';

interface DocumentCenterListTableProps {
  items: DocumentCenterListItem[];
  onOpen: (item: DocumentCenterListItem) => void;
  footer?: ReactNode;
}

const thBase =
  'border-none px-4 py-3 align-middle text-[11px] font-bold uppercase tracking-wider text-[#737784] first:pl-5 last:pr-5';

const formatDateTime = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');

export const DocumentCenterListTable = ({ items, onOpen, footer }: DocumentCenterListTableProps) => (
  <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]/80">
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-none bg-[#eceef0]">
            <th className={`${thBase} text-left`}>Code</th>
            <th className={`${thBase} text-left`}>Company</th>
            <th className={`${thBase} text-left`}>Service</th>
            <th className={`${thBase} text-left`}>Handled By</th>
            <th className={`${thBase} text-center`}>Total Dokumen</th>
            <th className={`${thBase} text-left`}>Last Updated</th>
            <th className={`${thBase} text-center`}>Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eceef0]">
          {items.map((item) => (
            <tr key={item.leadId} className="group transition-colors hover:bg-[#eceef0]/30">
              <td className="py-3.5 pl-5 pr-4">
                <p className="font-mono text-xs font-bold text-[#003c90]">{item.leadCode ?? '—'}</p>
              </td>
              <td className="py-3.5 pr-4">
                <p className="text-sm font-bold text-[#191c1e] transition-colors group-hover:text-[#003c90]">
                  {item.companyName}
                </p>
              </td>
              <td className="px-4 py-3.5 text-sm font-semibold text-[#191c1e]">
                {item.serviceName ?? '—'}
              </td>
              <td className="px-4 py-3.5 text-xs text-[#434653]">
                {item.handledByName ? (
                  <div className="inline-flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#d9e2ff] text-[10px] font-bold text-[#00419c]">
                      {getInitials(item.handledByName)}
                    </span>
                    <span>{item.handledByName}</span>
                  </div>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-4 py-3.5 text-center text-sm font-bold tabular-nums text-[#191c1e]">
                {item.totalDocuments}
              </td>
              <td className="px-4 py-3.5 text-xs font-medium text-[#434653]">
                {formatDateTime(item.lastUpdatedAt)}
              </td>
              <td className="py-3.5 pl-4 pr-5 align-middle">
                <DocumentCenterTableRowActions onOpen={() => onOpen(item)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {footer}
  </div>
);
