import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import type { DocumentCenterLeadHeader } from '../../types/document-center.types';

interface DocumentCenterLeadPageHeaderProps {
  header: DocumentCenterLeadHeader;
}

export const DocumentCenterLeadPageHeader = ({ header }: DocumentCenterLeadPageHeaderProps) => (
  <header className="flex flex-wrap items-start justify-between gap-3">
    <div className="flex flex-col items-start">
      <Link
        to="/document-center"
        className="group inline-flex items-center text-xs font-medium text-[#434653] transition-colors hover:text-[#003c90] sm:text-sm"
      >
        <ArrowLeft className="mr-1 h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 sm:h-4 sm:w-4" />
        Back to Document Center List
      </Link>
      {header.leadCode ? (
        <div className="mt-2 mb-2 inline-flex rounded-full bg-[#d5e3fc] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#57657a] sm:text-[11px]">
          {header.leadCode}
        </div>
      ) : null}
      <h1 className="text-2xl font-bold tracking-tight text-[#191c1e] sm:text-3xl">{header.companyName}</h1>
    </div>
  </header>
);
