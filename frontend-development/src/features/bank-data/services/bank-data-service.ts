import { mapBankDataDetailRow, mapBankDataListRow } from '../utils/bank-data-mappers';
import type { BankDataEntry } from '../types/bank-data.types';
import {
  archiveBankDataEntry,
  getBankDataEntries,
  getBankDataEntryById,
  processBankDataEntry
} from './bank-data-api';

export const bankDataService = {
  async getAll(): Promise<BankDataEntry[]> {
    const rows = await getBankDataEntries();
    return rows.map(mapBankDataListRow);
  },

  async getById(entryId: string): Promise<BankDataEntry> {
    const row = await getBankDataEntryById(entryId);
    return mapBankDataDetailRow(row);
  },

  async process(entryId: string): Promise<BankDataEntry> {
    const row = await processBankDataEntry(entryId);
    return mapBankDataDetailRow(row);
  },

  async archive(entryId: string): Promise<BankDataEntry> {
    const row = await archiveBankDataEntry(entryId);
    return mapBankDataDetailRow(row);
  }
};
