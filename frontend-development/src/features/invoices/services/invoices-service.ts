import { invoicesMock } from '../mocks/invoices.mock';
import type { InvoiceItem } from '../types/invoice.types';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const invoicesStore: InvoiceItem[] = clone(invoicesMock);

export const invoicesService = {
  getAllSync(): InvoiceItem[] {
    return clone(invoicesStore);
  },

  async getAll(): Promise<InvoiceItem[]> {
    return clone(invoicesStore);
  }
};
