import { useCallback, useState } from 'react';
import { downloadDocumentCenterFile } from '../services/document-center-api';
import type { DocumentCenterFileItem } from '../types/document-center.types';

export const useDocumentCenterDownload = (onError?: (message: string) => void) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const download = useCallback(
    async (item: DocumentCenterFileItem) => {
      const id =
        item.source === 'DOCUMENT' ? item.documentId : item.source === 'INVOICE_PAYMENT' ? item.paymentId : null;
      if (id == null) {
        onError?.('File tidak dapat diidentifikasi.');
        return;
      }
      setDownloadingId(item.id);
      try {
        await downloadDocumentCenterFile(
          item.source,
          id,
          item.fileName ?? item.documentName ?? 'document'
        );
      } catch (e) {
        onError?.(e instanceof Error ? e.message : 'Gagal mengunduh file.');
      } finally {
        setDownloadingId(null);
      }
    },
    [onError]
  );

  return { download, downloadingId };
};
