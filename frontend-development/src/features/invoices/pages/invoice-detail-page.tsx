import { useNavigate, useParams } from 'react-router';
import { InvoiceDetailHeader } from '../components/detail/invoice-detail-header';
import { InvoiceDocumentsCard } from '../components/detail/invoice-documents-card';
import { InvoiceFinancialOverview } from '../components/detail/invoice-financial-overview';
import { InvoiceInstallmentsTable } from '../components/detail/invoice-installments-table';
import { InvoicePaymentHistoryTable } from '../components/detail/invoice-payment-history-table';
import { useInvoiceDetail } from '../hooks/use-invoice-detail';

export const InvoiceDetailPage = () => {
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  const { detail, isLoading, loadError, applyDetail } = useInvoiceDetail(invoiceId);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
        Loading invoice detail...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">{loadError}</div>
    );
  }

  if (!detail) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 shadow-sm">
        <h1 className="text-base font-semibold text-[#191c1e]">Invoice not found</h1>
        <button
          type="button"
          onClick={() => navigate('/invoice')}
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
      <InvoiceInstallmentsTable
        invoiceDetail={detail}
        installments={detail.installments}
        onDetailUpdated={applyDetail}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <InvoicePaymentHistoryTable
          paymentHistory={detail.paymentHistory}
          activityLogs={detail.activityLogs}
        />

        <aside className="space-y-6 lg:col-span-4">
          <InvoiceDocumentsCard documents={detail.relatedDocuments} />
        </aside>
      </div>
    </div>
  );
};
