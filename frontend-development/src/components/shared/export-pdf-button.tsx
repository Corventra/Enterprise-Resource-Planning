import { Download, Loader2 } from 'lucide-react';
import { useState, type RefObject } from 'react';
import { exportElementToPdf } from '../../utils/element-to-pdf';

interface ExportPdfButtonProps {
  /** Ref ke DOM element yang mau di-capture. */
  targetRef: RefObject<HTMLElement | null>;
  /** Filename (tanpa .pdf). */
  filename: string;
  /** Optional header line di tiap halaman PDF. */
  headerText?: string;
  label?: string;
  className?: string;
}

/**
 * KF-13 / KF-14: Tombol Export PDF generik untuk dashboard + KPI snapshot.
 * Klik → html2canvas + jspdf → save file.
 */
export const ExportPdfButton = ({
  targetRef,
  filename,
  headerText,
  label = 'Export PDF',
  className = ''
}: ExportPdfButtonProps) => {
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleClick = async () => {
    if (!targetRef.current) {
      setError('Konten tidak tersedia.');
      return;
    }
    setIsBusy(true);
    setError(undefined);
    try {
      await exportElementToPdf(targetRef.current, { filename, headerText });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal generate PDF.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isBusy}
        className={
          className ||
          'inline-flex items-center gap-2 rounded-lg border border-[#003c90]/30 bg-white px-3 py-2 text-xs font-bold text-[#003c90] shadow-sm transition-colors hover:bg-[#d5e3fc]/40 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm'
        }
      >
        {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {isBusy ? 'Generating...' : label}
      </button>
      {error && <p className="text-[10px] text-[#c2410c]">{error}</p>}
    </div>
  );
};
