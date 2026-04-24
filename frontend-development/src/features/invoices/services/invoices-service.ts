import { invoiceDetailsMock, invoicesMock } from '../mocks/invoices.mock';
import type { InvoiceDetail, InvoiceItem } from '../types/invoice.types';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const invoicesStore: InvoiceItem[] = clone(invoicesMock);
const invoiceDetailsStore: InvoiceDetail[] = clone(invoiceDetailsMock);

export const invoicesService = {
  getAllSync(): InvoiceItem[] {
    return clone(invoicesStore);
  },

  async getAll(): Promise<InvoiceItem[]> {
    return clone(invoicesStore);
  },

  getDetailByIdSync(invoiceId: string): InvoiceDetail | undefined {
    const detail = invoiceDetailsStore.find((item) => item.invoice.id === invoiceId);
    return detail ? clone(detail) : undefined;
  }
};
