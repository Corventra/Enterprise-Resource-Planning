import { systemConfigMock } from '../mocks/system-config.mock';
import type { SystemConfig } from '../types/admin.types';

const STORAGE_KEY = 'erp_system_config';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const loadFromStorage = (): SystemConfig => {
  try {
    if (typeof window === 'undefined') return clone(systemConfigMock);
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(systemConfigMock);
    const parsed = JSON.parse(raw) as SystemConfig;
    return { ...clone(systemConfigMock), ...parsed };
  } catch {
    return clone(systemConfigMock);
  }
};

const persist = (data: SystemConfig) => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    /* ignore */
  }
};

let configStore: SystemConfig = loadFromStorage();

export const systemConfigService = {
  async get(): Promise<SystemConfig> {
    return clone(configStore);
  },

  async update(patch: Partial<Omit<SystemConfig, 'updatedAt'>>): Promise<SystemConfig> {
    configStore = {
      ...configStore,
      ...patch,
      updatedAt: new Date().toISOString()
    };
    persist(configStore);
    return clone(configStore);
  },

  async resetToMock(): Promise<SystemConfig> {
    configStore = clone(systemConfigMock);
    persist(configStore);
    return clone(configStore);
  }
};
