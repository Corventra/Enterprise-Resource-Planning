import { bankDataMock } from '../mocks/bank-data.mock';
import type { BankDataEntry } from '../types/bank-data.types';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

let bankDataStore: BankDataEntry[] = clone(bankDataMock);

export const bankDataService = {
  async getAll(): Promise<BankDataEntry[]> {
    return clone(bankDataStore);
  },

  async updateStatus(entryId: string, status: BankDataEntry['status']): Promise<BankDataEntry> {
    const target = bankDataStore.find((entry) => entry.id === entryId);
    if (!target) {
      throw new Error('Bank data entry not found');
    }

    const updated: BankDataEntry = {
      ...target,
      status
    };

    bankDataStore = bankDataStore.map((entry) => (entry.id === entryId ? updated : entry));
    return clone(updated);
  }
};
