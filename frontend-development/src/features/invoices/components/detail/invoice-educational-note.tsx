import { Info } from 'lucide-react';

export const InvoiceEducationalNote = () => {
  return (
    <div className="flex items-start gap-3 rounded-md border-l-4 border-[#003c90] bg-[#003c90]/5 p-4">
      <Info className="mt-0.5 h-4 w-4 text-[#003c90]" />
      <p className="text-sm text-[#434653]">
        <strong>Note Edukatif:</strong> PPN menambah total tagihan invoice, sedangkan PPh 23 memengaruhi nominal yang
        diterima perusahaan.
      </p>
    </div>
  );
};
