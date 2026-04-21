import { handoverMock } from '../mocks/handover.mock';
import type { HandoverItem } from '../types/handover.types';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const handoverStore: HandoverItem[] = clone(handoverMock);

export const handoverService = {
  async getAll(): Promise<HandoverItem[]> {
    return clone(handoverStore);
  }
};
