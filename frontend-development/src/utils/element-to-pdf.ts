import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * KF-13 / KF-14: Generic util untuk capture sebuah DOM element jadi PDF A4.
 *
 * Pattern: html2canvas → bagi jadi multi-halaman A4 → save.
 * Cocok untuk dashboard / KPI snapshot. Untuk dokumen formal (invoice),
 * pakai invoice-pdf-service.ts yang punya document layout sendiri.
 */

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 10;
const CANVAS_SCALE = 2;

const sanitize = (s: string) => s.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_');

export interface ExportOptions {
  /** Filename tanpa extension; .pdf akan di-append. */
  filename: string;
  /** Header text di tiap halaman PDF. Default: filename. */
  headerText?: string;
  /** Footer text di tiap halaman. Default: "Generated YYYY-MM-DD HH:mm — Corventra WFMS". */
  footerText?: string;
}

export async function exportElementToPdf(
  element: HTMLElement,
  opts: ExportOptions
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: CANVAS_SCALE,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false
  });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const imgData = canvas.toDataURL('image/png');

  const contentWidth = A4_WIDTH_MM - MARGIN_MM * 2;
  const contentHeightPerPage = A4_HEIGHT_MM - MARGIN_MM * 2 - 15; // reserve 15mm for header+footer
  const imgHeightMm = (canvas.height * contentWidth) / canvas.width;
  const pageCount = Math.max(1, Math.ceil(imgHeightMm / contentHeightPerPage));

  const headerText = opts.headerText || opts.filename;
  const footerText = opts.footerText
    || `Generated ${new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })} — Corventra WFMS`;

  for (let page = 0; page < pageCount; page++) {
    if (page > 0) pdf.addPage();

    // Header
    pdf.setFontSize(9);
    pdf.setTextColor('#737784');
    pdf.text(headerText, MARGIN_MM, MARGIN_MM + 2);
    pdf.text(`Hal. ${page + 1} / ${pageCount}`, A4_WIDTH_MM - MARGIN_MM, MARGIN_MM + 2, { align: 'right' });

    // Image slice (multi-page handling)
    const yOffsetInImage = -(page * contentHeightPerPage);
    pdf.addImage(
      imgData, 'PNG',
      MARGIN_MM,
      MARGIN_MM + 8 + yOffsetInImage,
      contentWidth,
      imgHeightMm
    );

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor('#9ca3af');
    pdf.text(footerText, MARGIN_MM, A4_HEIGHT_MM - MARGIN_MM + 2);
  }

  pdf.save(`${sanitize(opts.filename)}.pdf`);
}
