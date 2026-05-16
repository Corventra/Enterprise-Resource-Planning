import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { InvoiceDetail } from '../types/invoice.types';
import { buildInvoicePdfViewModel } from './invoice-pdf-build-payload';
import { InvoicePdfDocument } from './invoice-pdf-document';
import type { InvoicePdfViewModel } from './invoice-pdf-types';

const HTML_CANVAS_SCALE = 2;
const PDF_ROOT_SELECTOR = '[data-invoice-pdf-root]';
const DEFAULT_MOUNT_TIMEOUT_MS = 12_000;

function sanitizeFilename(s: string) {
  return s.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_');
}

function canvasPxToMm(px: number) {
  return (px / HTML_CANVAS_SCALE) * (25.4 / 96);
}

/** Poll until PDF root exists inside container (React commit + paint). */
export async function waitForPdfRoot(
  container: HTMLElement,
  timeoutMs = DEFAULT_MOUNT_TIMEOUT_MS
): Promise<HTMLElement> {
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    const tick = () => {
      const el = container.querySelector(PDF_ROOT_SELECTOR);
      if (el instanceof HTMLElement) {
        resolve(el);
        return;
      }
      if (Date.now() >= deadline) {
        reject(new Error('PDF root not mounted'));
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

async function waitForImages(el: HTMLElement): Promise<void> {
  const imgs = Array.from(el.querySelectorAll('img'));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        })
    )
  );
}

async function waitForLayoutPaint(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/** Capture mounted PDF root and save file (caller must ensure root is mounted). */
export async function captureAndDownloadPdf(el: HTMLElement, model: InvoicePdfViewModel): Promise<void> {
  await waitForLayoutPaint();
  await waitForImages(el);

  const canvas = await html2canvas(el, {
    scale: HTML_CANVAS_SCALE,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false
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
}

export function buildInvoicePdfModel(detail: InvoiceDetail, installmentId: string): InvoicePdfViewModel {
  const term = detail.installments.find((i) => i.id === installmentId);
  if (!term) throw new Error('Invoice term not found');
  return buildInvoicePdfViewModel(detail, term);
}

/** Manual download: mount off-screen tree, wait for root, capture, cleanup. */
export async function downloadInvoiceTermPdf(detail: InvoiceDetail, installmentId: string): Promise<void> {
  const model = buildInvoicePdfModel(detail, installmentId);

  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-12000px';
  host.style.top = '0';
  host.style.zIndex = '-1';
  host.style.pointerEvents = 'none';
  document.body.appendChild(host);

  const root = createRoot(host);

  try {
    root.render(createElement(InvoicePdfDocument, { data: model }));
    const el = await waitForPdfRoot(host);
    await captureAndDownloadPdf(el, model);
  } finally {
    root.unmount();
    document.body.removeChild(host);
  }
}
