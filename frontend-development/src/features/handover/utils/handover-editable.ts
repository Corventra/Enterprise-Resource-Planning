export const HANDOVER_EDITABLE_DB_STATUSES = ['DRAFT', 'NEED_REVISION'] as const;

export const isHandoverEditableDbStatus = (dbStatus?: string | null): boolean =>
  dbStatus != null && (HANDOVER_EDITABLE_DB_STATUSES as readonly string[]).includes(dbStatus);

/** Catatan revisi CEO hanya relevan saat handover menunggu perbaikan BD. */
export const shouldShowCeoRevisionNote = (dbStatus?: string | null): boolean => dbStatus === 'NEED_REVISION';
