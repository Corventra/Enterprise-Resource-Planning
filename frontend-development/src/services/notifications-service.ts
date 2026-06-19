import { apiGet, apiPatch } from './api-client';

export type NotificationType =
  | 'MILESTONE_OVERDUE'
  | 'MILESTONE_LATE_COMPLETED'
  | 'PROJECT_STATUS_CHANGED'
  | 'SYSTEM_INFO';

export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface NotificationItem {
  notification_id: number;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  related_entity_type: string | null;
  related_entity_id: number | null;
  is_read: 0 | 1;
  read_at: string | null;
  created_at: string;
}

interface ListResponse {
  success: boolean;
  data: {
    items: NotificationItem[];
    unreadCount: number;
    scan: { triggered: number; scanned?: number } | null;
  };
}

interface CountResponse {
  success: boolean;
  data: { unreadCount: number };
}

export const notificationsService = {
  /** Fetch list + lazy scan overdue milestones (default scan=true). */
  async list(opts: { onlyUnread?: boolean; limit?: number; scan?: boolean } = {}): Promise<ListResponse['data']> {
    const params = new URLSearchParams();
    if (opts.onlyUnread) params.set('unread', '1');
    if (opts.limit) params.set('limit', String(opts.limit));
    if (opts.scan !== false) params.set('scan', '1');
    const res = await apiGet<ListResponse>(`/notifications?${params.toString()}`);
    return res.data;
  },

  async unreadCount(): Promise<number> {
    const res = await apiGet<CountResponse>('/notifications/unread-count');
    return res.data.unreadCount;
  },

  async markRead(id: number): Promise<void> {
    await apiPatch<{ success: boolean }>(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<number> {
    const res = await apiPatch<{ success: boolean; data: { markedRead: number } }>('/notifications/read-all');
    return res.data.markedRead;
  }
};
