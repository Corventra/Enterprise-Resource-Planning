import { FileCheck2, FileSignature, FileText, FolderKanban, Handshake, Receipt } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CeoSummaryCard } from '../../../dashboard/components/ceo/ceo-dashboard-ui';
import { formatDashboardNumber } from '../../../dashboard/utils/format-dashboard';
import {
  DOCUMENT_CENTER_CATEGORY_ORDER,
  documentCenterCategoryLabel
} from '../../constants/document-center-categories';
import type { DocumentCenterCategory } from '../../types/document-center.types';

const categoryIcons: Record<DocumentCenterCategory, LucideIcon> = {
  PROPOSAL: FileText,
  ENGAGEMENT_LETTER: FileSignature,
  CLIENT_PROVIDED: Handshake,
  INVOICE_PAYMENT: Receipt,
  PROJECT: FolderKanban
};

const accents: Record<DocumentCenterCategory, string> = {
  PROPOSAL: 'from-[#003c90] to-[#0f52ba]',
  ENGAGEMENT_LETTER: 'from-[#0f52ba] to-[#2d6fd4]',
  CLIENT_PROVIDED: 'from-[#a16207] to-[#c49a00]',
  INVOICE_PAYMENT: 'from-[#006544] to-[#2ea87a]',
  PROJECT: 'from-[#434653] to-[#5c6070]'
};

interface DocumentCenterDetailSummaryCardsProps {
  totalDocuments: number;
  categorySummary: Record<DocumentCenterCategory, number>;
}

export const DocumentCenterDetailSummaryCards = ({
  totalDocuments,
  categorySummary
}: DocumentCenterDetailSummaryCardsProps) => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
    <CeoSummaryCard
      title="Total Dokumen"
      value={formatDashboardNumber(totalDocuments)}
      icon={FileCheck2}
      accent="from-[#003c90] to-[#0f52ba]"
      footer={<p className="text-xs text-[#737784]">Semua kategori</p>}
    />
    {DOCUMENT_CENTER_CATEGORY_ORDER.map((key) => (
      <CeoSummaryCard
        key={key}
        title={documentCenterCategoryLabel[key]}
        value={formatDashboardNumber(categorySummary[key] ?? 0)}
        icon={categoryIcons[key]}
        accent={accents[key]}
        footer={<p className="text-xs text-[#737784]">Dalam lead ini</p>}
      />
    ))}
  </div>
);
