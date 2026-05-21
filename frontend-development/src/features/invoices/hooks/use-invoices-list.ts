import { useEffect, useMemo, useState } from 'react';
import { invoicesService } from '../services/invoices-service';
import type { InvoiceItem } from '../types/invoice.types';

export const useInvoicesList = () => {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    invoicesService
      .getAll()
      .then((items) => {
        if (!cancelled) setInvoices(items);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('Gagal memuat daftar invoice.');
          setInvoices([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inSevenDays = new Date(today);
    inSevenDays.setDate(inSevenDays.getDate() + 7);

    let dueSoonCount = 0;
    let overdueCount = 0;
    let readyToInvoice = 0;

    for (const item of invoices) {
      if (item.statusDb === 'OVERDUE') overdueCount += 1;
      if (item.statusDb === 'READY_TO_BILL') readyToInvoice += 1;
      if (item.nextAction.toLowerCase().includes('generate invoice')) readyToInvoice += 0;

      if (item.nextDueDate) {
        const due = new Date(`${item.nextDueDate}T00:00:00`);
        if (item.statusDb !== 'SETTLED' && due >= today && due <= inSevenDays) {
          dueSoonCount += 1;
        }
      }
    }

    return {
      dueSoonCount,
      overdueCount,
      readyToInvoice,
      needsFinalBilling: invoices.filter((i) => i.statusDb === 'AWAITING_PAYMENT' && i.paymentProgress > 0 && i.paymentProgress < 100)
        .length
    };
  }, [invoices]);

  return {
    invoices,
    isLoading,
    loadError,
    summary
  };
};
