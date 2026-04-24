import { Save } from 'lucide-react';
import { formatDate } from './invoice-detail-formatters';

interface InvoiceInternalNotesCardProps {
  note: string;
  updatedAt: string;
}

export const InvoiceInternalNotesCard = ({ note, updatedAt }: InvoiceInternalNotesCardProps) => {
  return (
    <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-[#eceef0]">
      <h3 className="mb-3 font-bold text-[#191c1e]">Catatan Internal</h3>
      <textarea
        className="h-28 w-full rounded-md border-none bg-[#f2f4f6] p-3 text-sm text-[#191c1e] focus:ring-2 focus:ring-[#1d59c1]/20"
        defaultValue={note}
      />
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[10px] italic text-[#737784]">Terakhir diperbarui: {formatDate(updatedAt)}</p>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md bg-[#003c90] px-3 py-2 text-xs font-bold text-white hover:bg-[#0f52ba]"
        >
          <Save className="h-3.5 w-3.5" />
          Simpan
        </button>
      </div>
    </section>
  );
};
