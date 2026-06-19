import { AlertTriangle, Bell, Check, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { notificationsService, type NotificationItem } from '../../../../services/notifications-service';

/**
 * KF-08: Bell icon di header dengan unread badge + dropdown panel.
 * Lazy scan overdue milestones saat user buka dropdown (scan=1 ke BE).
 */
export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async (withScan: boolean) => {
    setIsLoading(true);
    try {
      const data = await notificationsService.list({ limit: 20, scan: withScan });
      setItems(data.items);
      setUnread(data.unreadCount);
    } catch {
      // silently ignore — bell is non-critical
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch unread count only (no scan to keep header light)
  useEffect(() => {
    notificationsService.unreadCount().then(setUnread).catch(() => undefined);
    // Re-poll setiap 60 detik
    const t = setInterval(() => {
      notificationsService.unreadCount().then(setUnread).catch(() => undefined);
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  // Trigger scan + refresh saat dropdown dibuka
  useEffect(() => {
    if (isOpen) {
      void refresh(true);
    }
  }, [isOpen, refresh]);

  // Click outside untuk close
  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [isOpen]);

  const handleMarkRead = async (id: number) => {
    await notificationsService.markRead(id);
    setItems((prev) => prev.map((n) => (n.notification_id === id ? { ...n, is_read: 1, read_at: new Date().toISOString() } : n)));
    setUnread((u) => Math.max(0, u - 1));
  };

  const handleMarkAllRead = async () => {
    const n = await notificationsService.markAllRead();
    setItems((prev) => prev.map((it) => ({ ...it, is_read: 1, read_at: new Date().toISOString() })));
    setUnread(0);
    if (n > 0) void refresh(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" strokeWidth={2} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#c2410c] px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-[360px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-bold text-[#191c1e]">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#003c90] hover:underline"
              >
                <Check className="h-3 w-3" /> Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-[480px] overflow-y-auto">
            {isLoading && items.length === 0 ? (
              <div className="flex items-center justify-center px-4 py-8 text-xs text-slate-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memeriksa keterlambatan...
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-slate-500">
                Tidak ada notifikasi. Sistem akan otomatis alert saat ada milestone overdue.
              </div>
            ) : (
              <ul>
                {items.map((n) => (
                  <li
                    key={n.notification_id}
                    className={`border-b border-slate-100 px-4 py-3 last:border-b-0 ${n.is_read === 0 ? 'bg-[#003c90]/5' : 'bg-white'}`}
                  >
                    <div className="flex items-start gap-2">
                      {n.severity === 'CRITICAL' ? (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#c2410c]" />
                      ) : n.severity === 'WARNING' ? (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#a16207]" />
                      ) : (
                        <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#003c90]" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#191c1e]">{n.title}</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-[#434653]">{n.message}</p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.created_at).toLocaleString('id-ID', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                          {n.is_read === 0 && (
                            <button
                              type="button"
                              onClick={() => handleMarkRead(n.notification_id)}
                              className="text-[10px] font-semibold text-[#003c90] hover:underline"
                            >
                              Tandai dibaca
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
