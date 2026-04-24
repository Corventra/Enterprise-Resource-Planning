import { useMemo } from 'react';
import { invoicesService } from '../services/invoices-service';

export const useInvoicesList = () => {
  const invoices = useMemo(() => invoicesService.getAllSync(), []);
  const isLoading = false;

  const summary = useMemo(() => {
    const totalOutstanding = invoices.reduce((sum, item) => sum + item.outstandingValue, 0);
    const dueSoonCount = invoices.filter((item) => item.nextDueDate !== null && item.paymentStatus !== 'Overdue').length;
    const overdueCount = invoices.filter((item) => item.paymentStatus === 'Overdue').length;
    const paidThisMonth = invoices.reduce((sum, item) => sum + item.settledValue, 0);
    const pendingVerification = invoices.filter((item) => item.paymentStatus === 'Pending Verification').length;
    const readyToInvoice = invoices.filter(
      (item) => item.paymentStatus === 'Draft' || item.paymentStatus === 'Ready to Send'
    ).length;
    const needsFinalBilling = invoices.filter(
      (item) => item.paymentStatus === 'Partially Paid' && item.outstandingValue > 0
    ).length;

    return {
      totalOutstanding,
      dueSoonCount,
      overdueCount,
      paidThisMonth,
      pendingVerification,
      readyToInvoice,
      needsFinalBilling
    };
  }, [invoices]);

  return {
    invoices,
    isLoading,
    summary
  };
};
