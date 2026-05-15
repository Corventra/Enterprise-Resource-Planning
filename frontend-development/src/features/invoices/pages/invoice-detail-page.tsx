import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { InvoiceDetailHeader } from '../components/detail/invoice-detail-header';
import { InvoiceDocumentsCard } from '../components/detail/invoice-documents-card';
import { InvoiceFinancialOverview } from '../components/detail/invoice-financial-overview';
import { InvoiceInstallmentsTable } from '../components/detail/invoice-installments-table';
import { InvoicePaymentHistoryTable } from '../components/detail/invoice-payment-history-table';
import { invoicesService } from '../services/invoices-service';

export const InvoiceDetailPage = () => {
  const navigate = useNavigate();
  const { invoiceId } = useParams();

  const detail = useMemo(
    () => (invoiceId ? invoicesService.getDetailByIdSync(invoiceId) : undefined),
    [invoiceId]
  );

  if (!detail) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 shadow-sm">
        <h1 className="text-base font-semibold text-[#191c1e]">Invoice not found</h1>
        <button
          type="button"
          onClick={() => navigate('/invoices')}
          className="mt-3 rounded-lg border border-[#c3c6d5] px-3 py-1.5 text-xs font-medium text-[#191c1e] hover:bg-[#eceef0] sm:text-sm"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <InvoiceDetailHeader detail={detail} onBack={() => navigate('/invoice')} />
      <InvoiceFinancialOverview detail={detail} />
      <InvoiceInstallmentsTable invoiceDetail={detail} installments={detail.installments} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <InvoicePaymentHistoryTable paymentHistory={detail.paymentHistory} timeline={detail.timeline} />

        <aside className="space-y-6 lg:col-span-4">
          <InvoiceDocumentsCard documents={detail.relatedDocuments} />
        </aside>
      </div>
    </div>
  );
};
