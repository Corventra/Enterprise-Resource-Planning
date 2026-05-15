import {
  createInvoiceTermPayment as createInvoiceTermPaymentApi,
  generateInvoiceTerm as generateInvoiceTermApi,
  getInvoiceById,
  getInvoices,
  markInvoiceTermSent as markInvoiceTermSentApi,
  confirmInvoiceTermTrigger as confirmInvoiceTermTriggerApi
} from './invoices-api';
import { mapApiInvoiceDetailToDetail, mapApiInvoiceListRowToItem } from '../utils/map-api-invoice';
import type { InvoiceDetail, InvoiceItem } from '../types/invoice.types';

export const invoicesService = {
  async getAll(): Promise<InvoiceItem[]> {
    const rows = await getInvoices();
    return rows.map(mapApiInvoiceListRowToItem);
  },

  async getById(accountId: string): Promise<InvoiceDetail | undefined> {
    try {
      const data = await getInvoiceById(accountId);
      return mapApiInvoiceDetailToDetail(data);
    } catch {
      return undefined;
    }
  },

  async generateTerm(invoiceTermId: string): Promise<InvoiceDetail> {
    const data = await generateInvoiceTermApi(invoiceTermId);
    return mapApiInvoiceDetailToDetail(data);
  },

  async markTermSent(invoiceTermId: string): Promise<InvoiceDetail> {
    const data = await markInvoiceTermSentApi(invoiceTermId);
    return mapApiInvoiceDetailToDetail(data);
  },

  async recordTermPayment(invoiceTermId: string, formData: FormData): Promise<InvoiceDetail> {
    const data = await createInvoiceTermPaymentApi(invoiceTermId, formData);
    return mapApiInvoiceDetailToDetail(data);
  },

  async confirmTermTrigger(
    invoiceTermId: string,
    triggerReferenceValue?: string
  ): Promise<InvoiceDetail> {
    const data = await confirmInvoiceTermTriggerApi(invoiceTermId, triggerReferenceValue);
    return mapApiInvoiceDetailToDetail(data);
  }
};
