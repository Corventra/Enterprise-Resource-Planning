-- =============================================================
-- Feature: WFMS Project Status Transitions (audit trail level project)
--
-- Konteks:
--   - Project audit trail untuk perubahan status project (Awaiting Consultant,
--     In Progress, On Hold, Completed, Cancelled).
--   - Komplemen dari `project_milestone_updates` yang sudah ada (audit
--     milestone-level).
--   - Bersifat append-only — tidak ada endpoint UPDATE/DELETE.
--
-- Design notes:
--   - `from_status` NULLABLE untuk log creation event (initial transition dari
--     "tidak ada" ke 'Awaiting Consultant'). Mengikuti konvensi state machine
--     umum (Camunda, AASM) yang mengakui initial transition sebagai transisi
--     resmi.
--   - `trigger_source` ENUM('USER','SYSTEM'): USER untuk transisi yang
--     dipicu user, SYSTEM untuk yang dipicu otomatis (creation, future cron).
--   - Backfill creation row untuk existing projects (FROM_STATUS=NULL).
-- =============================================================

CREATE TABLE project_status_transitions (
  transition_id    BIGINT        PRIMARY KEY AUTO_INCREMENT,
  project_id       BIGINT        NOT NULL,

  from_status      ENUM(
    'Awaiting Consultant',
    'In Progress',
    'On Hold',
    'Completed',
    'Cancelled'
  ) NULL,
  to_status        ENUM(
    'Awaiting Consultant',
    'In Progress',
    'On Hold',
    'Completed',
    'Cancelled'
  ) NOT NULL,

  triggered_by_user_id INT       NULL,
  triggered_by_name_snapshot VARCHAR(128) NULL,
  trigger_source   ENUM('USER', 'SYSTEM') NOT NULL DEFAULT 'USER',
  reason           TEXT          NULL,

  triggered_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_project_status_transitions_project
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_project_status_transitions_user
    FOREIGN KEY (triggered_by_user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,

  INDEX idx_project_status_transitions_project (project_id),
  INDEX idx_project_status_transitions_at (triggered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Backfill: insert 1 creation-row per existing project agar audit trail
-- lengkap dari hari pertama setelah migration. Pakai created_at + created_by
-- dari row projects yang sudah ada.
INSERT INTO project_status_transitions
  (project_id, from_status, to_status, triggered_by_user_id, triggered_by_name_snapshot,
   trigger_source, reason, triggered_at)
SELECT
  p.project_id,
  NULL                                        AS from_status,
  'Awaiting Consultant'                       AS to_status,
  p.created_by                                AS triggered_by_user_id,
  u.name                                      AS triggered_by_name_snapshot,
  'SYSTEM'                                    AS trigger_source,
  'Backfill dari migration 016 — creation event existing project'  AS reason,
  p.created_at                                AS triggered_at
FROM projects p
LEFT JOIN users u ON u.id = p.created_by;
