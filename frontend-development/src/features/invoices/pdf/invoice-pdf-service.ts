import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { InvoiceDetail } from '../types/invoice.types';
import { buildInvoicePdfViewModel } from './invoice-pdf-build-payload';
import { InvoicePdfDocument } from './invoice-pdf-document';

const HTML_CANVAS_SCALE = 2;

function sanitizeFilename(s: string) {
  return s.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_');
}

/** Convert canvas pixels (from html2canvas) to mm at 96dpi, undoing capture scale. */
function canvasPxToMm(px: number) {
  return (px / HTML_CANVAS_SCALE) * (25.4 / 96);
}

export async function downloadInvoiceTermPdf(detail: InvoiceDetail, installmentId: string): Promise<void> {
  const term = detail.installments.find((i) => i.id === installmentId);
  if (!term) throw new Error('Invoice term not found');

  const model = buildInvoicePdfViewModel(detail, term);

  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-12000px';
  host.style.top = '0';
  host.style.zIndex = '-1';
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(createElement(InvoicePdfDocument, { data: model }));

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

  const el = host.querySelector('[data-invoice-pdf-root]');
  if (!el || !(el instanceof HTMLElement)) {
    root.unmount();
    document.body.removeChild(host);
    throw new Error('PDF root not mounted');
  }

  const canvas = await html2canvas(el, {
    scale: HTML_CANVAS_SCALE,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png', 1.0);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;

  let imgWmm = canvasPxToMm(canvas.width);
  let imgHmm = canvasPxToMm(canvas.height);
  const maxW = pageWidth - margin * 2;
  const maxH = pageHeight - margin * 2;
  const fit = Math.min(maxW / imgWmm, maxH / imgHmm, 1);
  imgWmm *= fit;
  imgHmm *= fit;
  const x = (pageWidth - imgWmm) / 2;
  const y = (pageHeight - imgHmm) / 2;

  pdf.addImage(imgData, 'PNG', x, y, imgWmm, imgHmm);

  const name = sanitizeFilename(`Invoice-${model.invoiceNumber}`);
  pdf.save(`${name}.pdf`);

  root.unmount();
  document.body.removeChild(host);
}
