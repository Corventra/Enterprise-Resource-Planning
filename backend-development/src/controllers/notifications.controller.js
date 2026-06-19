const notificationsService = require('../services/notifications');

/**
 * GET /api/notifications
 * Query: ?unread=1 (filter unread saja), ?limit=N (default 50), ?scan=1 (trigger overdue scan dulu)
 *
 * KF-08: kalau ?scan=1, auto-detect overdue milestone untuk user ini sebelum return list.
 * Ini lazy alternative untuk cron job — bell icon tinggal call GET dengan scan=1
 * setiap kali user buka header.
 */
const list = async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const role = req.user?.role || null;

  let scanResult = null;
  if (req.query.scan === '1' && role) {
    try {
      scanResult = await notificationsService.scanOverdueForUser(userId, role);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[notifications] scan failed:', e.message);
    }
  }

  const onlyUnread = req.query.unread === '1';
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const items = await notificationsService.listForUser(userId, { onlyUnread, limit });
  const unreadCount = await notificationsService.countUnread(userId);

  return res.json({
    success: true,
    data: { items, unreadCount, scan: scanResult }
  });
};

const unreadCount = async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const cnt = await notificationsService.countUnread(userId);
  return res.json({ success: true, data: { unreadCount: cnt } });
};

const read = async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: 'ID tidak valid.' });
  }
  const ok = await notificationsService.markRead(userId, id);
  if (!ok) return res.status(404).json({ success: false, message: 'Notification tidak ditemukan.' });
  return res.json({ success: true });
};

const readAll = async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const affected = await notificationsService.markAllRead(userId);
  return res.json({ success: true, data: { markedRead: affected } });
};

module.exports = { list, unreadCount, read, readAll };
