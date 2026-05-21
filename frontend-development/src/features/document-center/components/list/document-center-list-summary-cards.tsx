import { FileCheck2, FileSignature, FileText, FolderKanban, Handshake, Receipt } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CeoSummaryCard } from '../../../dashboard/components/ceo/ceo-dashboard-ui';
import { formatDashboardNumber } from '../../../dashboard/utils/format-dashboard';
import type { DocumentCenterListSummary } from '../../types/document-center.types';

interface DocumentCenterListSummaryCardsProps {
  summary: DocumentCenterListSummary;
}

const cards: Array<{
  label: string;
  valueKey: keyof DocumentCenterListSummary;
  hint: string;
  icon: LucideIcon;
  accent: string;
}> = [
  {
    label: 'Total Dokumen',
    valueKey: 'totalDocuments',
    hint: 'Jumlah seluruh dokumen dari semua kategori',
    icon: FileCheck2,
    accent: 'from-[#003c90] to-[#0f52ba]'
  },
  {
    label: 'Proposal',
    valueKey: 'proposal',
    hint: 'Jumlah dokumen proposal',
    icon: FileText,
    accent: 'from-[#0f52ba] to-[#2d6fd4]'
  },
  {
    label: 'Engagement Letter',
    valueKey: 'engagementLetter',
    hint: 'Jumlah dokumen engagement letter',
    icon: FileSignature,
    accent: 'from-[#006544] to-[#2ea87a]'
  },
  {
    label: 'Dokumen Client',
    valueKey: 'clientDocuments',
    hint: 'Client provided documents dari handover',
    icon: Handshake,
    accent: 'from-[#a16207] to-[#c49a00]'
  },
  {
    label: 'Bukti Invoice',
    valueKey: 'invoiceProof',
    hint: 'File invoice / payment proof',
    icon: Receipt,
    accent: 'from-[#434653] to-[#5c6070]'
  },
  {
    label: 'Dokumen Project',
    valueKey: 'project',
    hint: 'Jumlah dokumen project',
    icon: FolderKanban,
    accent: 'from-[#1d59c1] to-[#4a8fd4]'
  }
];

export const DocumentCenterListSummaryCards = ({ summary }: DocumentCenterListSummaryCardsProps) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
    {cards.map(({ label, valueKey, hint, icon, accent }) => (
      <CeoSummaryCard
        key={valueKey}
        title={label}
        value={formatDashboardNumber(summary[valueKey])}
        icon={icon}
        accent={accent}
        footer={<p className="text-xs text-[#737784]">{hint}</p>}
      />
    ))}
  </div>
);
