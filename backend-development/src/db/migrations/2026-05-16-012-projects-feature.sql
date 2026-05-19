-- =============================================================
-- Feature: Projects (post-handover monitoring + KPI source)
-- Tables:
--   - projects
--   - project_consultants
--   - project_milestones
--   - project_milestone_updates
--
-- Catatan:
--   - Project lahir dari handover yang sudah APPROVED (COO assign PM).
--   - Milestones di-spawn dari task template per service line, atau
--     fallback ke handover.timelineMilestones kalau template tidak ada.
--   - project_milestone_updates = append-only audit log; feed KPI
--     "Update Compliance" dimension (gap antar entry).
--   - quality_rating + revision_count diisi PM saat approve task ke 'Done';
--     feed KPI "Output Quality" dimension.
-- =============================================================

CREATE TABLE projects (
  project_id       BIGINT        PRIMARY KEY AUTO_INCREMENT,
  project_code     VARCHAR(64)   NOT NULL UNIQUE,
  handover_id      BIGINT        NOT NULL UNIQUE,

  client           VARCHAR(255)  NOT NULL,
  project_name     VARCHAR(255)  NOT NULL,

  service_line     ENUM('Transfer Pricing', 'Tax', 'Advisory', 'Audit') NOT NULL,
  status           ENUM(
    'Awaiting Consultant',
    'In Progress',
    'On Hold',
    'Completed',
    'Cancelled'
  ) NOT NULL DEFAULT 'Awaiting Consultant',

  pm_user_id       INT           NULL,
  pm_name_snapshot VARCHAR(128)  NULL,

  start_date       DATE          NULL,
  end_date         DATE          NULL,

  created_by       INT           NULL,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_projects_handover
    FOREIGN KEY (handover_id) REFERENCES handovers(handover_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk_projects_pm
    FOREIGN KEY (pm_user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,

  CONSTRAINT fk_projects_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,

  INDEX idx_projects_status (status),
  INDEX idx_projects_service_line (service_line),
  INDEX idx_projects_pm (pm_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE project_consultants (
  project_id        BIGINT        NOT NULL,
  consultant_user_id INT          NOT NULL,
  consultant_name_snapshot VARCHAR(128) NOT NULL,
  level             ENUM('Lead', 'Senior', 'Junior') NOT NULL,
  assigned_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assigned_by       INT           NULL,

  PRIMARY KEY (project_id, consultant_user_id),

  CONSTRAINT fk_project_consultants_project
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_project_consultants_user
    FOREIGN KEY (consultant_user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk_project_consultants_assigned_by
    FOREIGN KEY (assigned_by) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,

  INDEX idx_project_consultants_user (consultant_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE project_milestones (
  milestone_id     BIGINT        PRIMARY KEY AUTO_INCREMENT,
  project_id       BIGINT        NOT NULL,

  title            VARCHAR(255)  NOT NULL,
  notes            TEXT          NULL,
  target_date      DATE          NOT NULL,
  status           ENUM('Pending', 'In Progress', 'Done', 'Blocked') NOT NULL DEFAULT 'Pending',

  owner_user_id    INT           NULL,
  owner_name_snapshot VARCHAR(128) NULL,

  weight           INT           NOT NULL DEFAULT 10,
  phase            ENUM('Initiation', 'Analysis', 'Core Work', 'QC', 'Delivery') NULL,
  sequence_no      INT           NOT NULL DEFAULT 1,

  completed_at     DATETIME      NULL,
  quality_rating   TINYINT       NULL,
  revision_count   INT           NULL,

  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_project_milestones_project
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_project_milestones_owner
    FOREIGN KEY (owner_user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,

  CONSTRAINT chk_quality_rating
    CHECK (quality_rating IS NULL OR (quality_rating BETWEEN 1 AND 5)),

  INDEX idx_project_milestones_project (project_id),
  INDEX idx_project_milestones_status (status),
  INDEX idx_project_milestones_owner (owner_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE project_milestone_updates (
  update_id        BIGINT        PRIMARY KEY AUTO_INCREMENT,
  milestone_id     BIGINT        NOT NULL,

  by_user_id       INT           NULL,
  by_name_snapshot VARCHAR(128)  NULL,

  from_status      ENUM('Pending', 'In Progress', 'Done', 'Blocked') NOT NULL,
  to_status        ENUM('Pending', 'In Progress', 'Done', 'Blocked') NOT NULL,
  note             TEXT          NULL,

  at               DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_project_milestone_updates_milestone
    FOREIGN KEY (milestone_id) REFERENCES project_milestones(milestone_id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_project_milestone_updates_user
    FOREIGN KEY (by_user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,

  INDEX idx_project_milestone_updates_milestone (milestone_id),
  INDEX idx_project_milestone_updates_at (at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
