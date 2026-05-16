import { useCallback, useEffect, useState } from 'react';
import { invoicesService } from '../services/invoices-service';
import type { InvoiceDetail } from '../types/invoice.types';

export const useInvoiceDetail = (accountId: string | undefined) => {
  const [detail, setDetail] = useState<InvoiceDetail | undefined>();
  const [isLoading, setIsLoading] = useState(Boolean(accountId));
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!accountId) {
      setDetail(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await invoicesService.getById(accountId);
      setDetail(data);
      if (!data) {
        setLoadError('Invoice tidak ditemukan.');
      }
    } catch {
      setLoadError('Gagal memuat detail invoice.');
      setDetail(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const refreshDetail = useCallback(async (): Promise<InvoiceDetail | undefined> => {
    if (!accountId) return undefined;
    const data = await invoicesService.getById(accountId);
    setDetail(data);
    return data;
  }, [accountId]);

  const applyDetail = useCallback((next: InvoiceDetail) => {
    setDetail(next);
  }, []);

  return { detail, isLoading, loadError, refreshDetail, applyDetail, reload: loadDetail };
};
