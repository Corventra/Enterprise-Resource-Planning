-- =============================================================
-- Feature: KPI (Performance Management)
-- Tables:
--   - kpi_period_config       (CEO-managed config: bobot dimensi, threshold)
--   - kpi_snapshots           (finalized KPI snapshot per consultant per period)
--
-- Catatan:
--   - kpi_period_config: insert-only history. Latest row = active config.
--     Default seed di-insert sebagai initial. CEO update via PUT yang
--     INSERT row baru (history preserved).
--   - kpi_snapshots: hanya snapshot FINALIZED (locked by CEO).
--     Snapshot preliminary di-compute on-the-fly oleh backend dari raw
--     project data (project_milestones + project_milestone_updates).
--     Total snapshot = w_TC*c_TC + w_TM*c_TM + w_UC*c_UC + w_OQ*c_OQ.
-- =============================================================

CREATE TABLE kpi_period_config (
  config_id                  INT           PRIMARY KEY AUTO_INCREMENT,
  effective_from             DATE          NOT NULL,
  weight_task_completion     DECIMAL(4,3)  NOT NULL,
  weight_timeliness          DECIMAL(4,3)  NOT NULL,
  weight_update_compliance   DECIMAL(4,3)  NOT NULL,
  weight_output_quality      DECIMAL(4,3)  NOT NULL,
  on_time_tolerance_days     INT           NOT NULL DEFAULT 2,
  update_gap_target_days     INT           NOT NULL DEFAULT 3,
  quality_rating_scale       TINYINT       NOT NULL DEFAULT 5,
  period_kind                ENUM('monthly', 'quarterly') NOT NULL DEFAULT 'monthly',

  approved_by_user_id        INT           NULL,
  approved_at                DATETIME      NULL,

  created_at                 DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                 DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_kpi_period_config_approved_by
    FOREIGN KEY (approved_by_user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,

  CONSTRAINT chk_weights_sum CHECK (
    (weight_task_completion + weight_timeliness + weight_update_compliance + weight_output_quality)
    BETWEEN 0.99 AND 1.01
  ),
  CONSTRAINT chk_weights_range CHECK (
    weight_task_completion BETWEEN 0 AND 1
    AND weight_timeliness BETWEEN 0 AND 1
    AND weight_update_compliance BETWEEN 0 AND 1
    AND weight_output_quality BETWEEN 0 AND 1
  ),

  INDEX idx_kpi_period_config_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE kpi_snapshots (
  snapshot_id           BIGINT        PRIMARY KEY AUTO_INCREMENT,

  consultant_user_id    INT           NOT NULL,
  consultant_name_snapshot VARCHAR(128) NOT NULL,
  period                VARCHAR(16)   NOT NULL,   -- 'YYYY-MM' atau 'YYYY-QN'
  config_id_used        INT           NOT NULL,

  -- 4 dimensi (capaian 0-100)
  capaian_task_completion   DECIMAL(6,2)  NOT NULL,
  capaian_timeliness        DECIMAL(6,2)  NOT NULL,
  capaian_update_compliance DECIMAL(6,2)  NOT NULL,
  capaian_output_quality    DECIMAL(6,2)  NOT NULL,

  -- KPI total = Σ(w_i × c_i) — denormalized untuk fast read
  total_score           DECIMAL(6,2)  NOT NULL,

  -- Audit
  computed_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finalized_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finalized_by_user_id  INT           NULL,

  CONSTRAINT fk_kpi_snapshots_user
    FOREIGN KEY (consultant_user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk_kpi_snapshots_config
    FOREIGN KEY (config_id_used) REFERENCES kpi_period_config(config_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk_kpi_snapshots_finalized_by
    FOREIGN KEY (finalized_by_user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,

  UNIQUE KEY uniq_consultant_period (consultant_user_id, period),

  INDEX idx_kpi_snapshots_period (period),
  INDEX idx_kpi_snapshots_user (consultant_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Initial seed: default config sesuai PRD Section 9.2 + 9.8.
-- approved_by_user_id NULL = system default, belum di-approve oleh CEO real.
-- CEO bisa override via PUT /api/kpi/config nanti.
INSERT INTO kpi_period_config (
  effective_from,
  weight_task_completion, weight_timeliness, weight_update_compliance, weight_output_quality,
  on_time_tolerance_days, update_gap_target_days, quality_rating_scale, period_kind,
  approved_by_user_id, approved_at
) VALUES (
  '2026-01-01',
  0.350, 0.250, 0.150, 0.250,
  2, 3, 5, 'monthly',
  NULL, NULL
);
