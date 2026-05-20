import { Download, FileText } from 'lucide-react';
import type { InvoiceRelatedDocument } from '../../types/invoice.types';

interface InvoiceDocumentsCardProps {
  documents: InvoiceRelatedDocument[];
}

export const InvoiceDocumentsCard = ({ documents }: InvoiceDocumentsCardProps) => {
  return (
    <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-[#eceef0] sm:p-6">
      <h3 className="mb-3 text-sm font-bold text-[#191c1e] sm:text-base">Dokumen Terkait</h3>
      {documents.length === 0 ? (
        <p className="text-sm text-[#737784]">Belum ada dokumen terkait.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const content = (
              <>
                <span className="inline-flex min-w-0 flex-1 items-center gap-2 text-xs font-medium text-[#191c1e]">
                  <FileText className="h-4 w-4 text-[#003c90]" />
                  <span className="truncate">{doc.name}</span>
                </span>
                <Download className="h-4 w-4 shrink-0 text-[#737784]" />
              </>
            );

            if (doc.url) {
              return (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full min-w-0 items-center justify-between gap-2 rounded-md border border-[#e0e3e5] p-3 text-left hover:bg-[#f7f9fb]"
                >
                  {content}
                </a>
              );
            }

            return (
              <div
                key={doc.id}
                className="flex w-full items-center justify-between rounded-md border border-[#e0e3e5] p-3 text-left opacity-60"
              >
                {content}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
