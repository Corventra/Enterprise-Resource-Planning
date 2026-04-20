import { leadTrackerMock } from '../mocks/lead-tracker.mock';
import type { LeadTrackerItem } from '../types/lead-tracker.types';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const leadTrackerStore: LeadTrackerItem[] = clone(leadTrackerMock);

export const leadTrackerService = {
  async getAll(): Promise<LeadTrackerItem[]> {
    return clone(leadTrackerStore);
  }
};
