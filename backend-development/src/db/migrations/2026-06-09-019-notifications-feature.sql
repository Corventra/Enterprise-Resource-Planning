-- Migration 019 — KF-08: Notification system (alert keterlambatan + event)
--
-- Scope minimal viable:
--   - In-app notification feed (bell icon di header)
--   - Auto-trigger oleh service backend saat detect overdue milestone
--   - Lazy scan: dipanggil saat user fetch /api/notifications atau saat
--     listProjects, supaya tidak perlu cron job terpisah
--
-- Deduplication: UNIQUE (user_id, type, related_entity_type, related_entity_id, period_key)
-- mencegah notifikasi duplikat untuk milestone yang sama dalam periode harian yang sama.
--
-- Idempotent: pakai CREATE TABLE IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS notifications (
  notification_id       BIGINT        PRIMARY KEY AUTO_INCREMENT,
  user_id               INT           NOT NULL,

  type                  ENUM(
    'MILESTONE_OVERDUE',
    'MILESTONE_LATE_COMPLETED',
    'PROJECT_STATUS_CHANGED',
    'SYSTEM_INFO'
  ) NOT NULL,
  severity              ENUM('INFO','WARNING','CRITICAL') NOT NULL DEFAULT 'INFO',

  title                 VARCHAR(255)  NOT NULL,
  message               TEXT          NOT NULL,

  -- Reference ke entitas asal (optional, untuk deep-link UI)
  related_entity_type   VARCHAR(64)   NULL,    -- e.g. 'milestone', 'project'
  related_entity_id     BIGINT        NULL,
  -- period_key untuk dedupe — biasanya 'YYYY-MM-DD' (notifikasi sehari sekali per milestone)
  period_key            VARCHAR(16)   NULL,

  is_read               TINYINT(1)    NOT NULL DEFAULT 0,
  read_at               DATETIME      NULL,
  created_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  UNIQUE KEY uniq_dedupe (user_id, type, related_entity_type, related_entity_id, period_key),

  INDEX idx_notifications_user_unread (user_id, is_read, created_at),
  INDEX idx_notifications_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
