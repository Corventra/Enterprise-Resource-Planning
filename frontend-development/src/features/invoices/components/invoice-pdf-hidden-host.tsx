import { useEffect, useRef } from 'react';
import { InvoicePdfDocument } from '../pdf/invoice-pdf-document';
import { captureAndDownloadPdf, waitForPdfRoot } from '../pdf/invoice-pdf-service';
import type { InvoicePdfViewModel } from '../pdf/invoice-pdf-types';

interface InvoicePdfHiddenHostProps {
  model: InvoicePdfViewModel | null;
  onComplete: () => void;
  onError: (error: unknown) => void;
}

export const InvoicePdfHiddenHost = ({ model, onComplete, onError }: InvoicePdfHiddenHostProps) => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!model || !hostRef.current) return undefined;

    let cancelled = false;
    const host = hostRef.current;

    const run = async () => {
      try {
        const el = await waitForPdfRoot(host);
        if (cancelled) return;
        await captureAndDownloadPdf(el, model);
        if (!cancelled) onComplete();
      } catch (error) {
        if (!cancelled) onError(error);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [model, onComplete, onError]);

  if (!model) return null;

  return (
    <div
      ref={hostRef}
      aria-hidden
      style={{
        position: 'fixed',
        left: '-12000px',
        top: 0,
        zIndex: -1,
        pointerEvents: 'none'
      }}
    >
      <InvoicePdfDocument data={model} />
    </div>
  );
};
