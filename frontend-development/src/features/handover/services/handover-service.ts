import { handoverDetailMock } from '../mocks/handover-detail.mock';
import { handoverMock } from '../mocks/handover.mock';
import type { HandoverDetail, HandoverItem } from '../types/handover.types';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const handoverStore: HandoverItem[] = clone(handoverMock);
const handoverDetailStore: HandoverDetail = clone(handoverDetailMock);

export const handoverService = {
  async getAll(): Promise<HandoverItem[]> {
    return clone(handoverStore);
  },
  async getById(id: string): Promise<HandoverDetail | undefined> {
    if (id === handoverDetailStore.id) {
      return clone(handoverDetailStore);
    }
    const fallback = handoverStore.find((item) => item.id === id);
    if (!fallback) return undefined;
    return {
      ...clone(handoverDetailStore),
      id: fallback.id,
      docCode: fallback.docCode,
      projectStatus: fallback.status === 'Submitted' ? 'Submitted Project' : 'Draft Project',
      projectInformation: handoverDetailStore.projectInformation.map((info) => {
        if (info.label === 'Client Name') return { ...info, value: fallback.client };
        if (info.label === 'Project Title') return { ...info, value: fallback.project };
        if (info.label === 'Service Line') return { ...info, value: fallback.serviceLine };
        if (info.label === 'Project Period') return { ...info, value: fallback.period };
        if (info.label === 'Engagement Letter Status')
          return { ...info, value: `${fallback.engagementStatus} - ${fallback.engagementStatusDate}` };
        return info;
      })
    };
  }
};
