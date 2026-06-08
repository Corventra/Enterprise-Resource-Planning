-- =============================================================
-- Feature: Task Templates (referensi task list per Service Line)
-- Tables:
--   - task_templates
--   - task_template_tasks
--
-- Catatan:
--   - Template ditampilkan di Settings → Task Templates, dikelola
--     CEO + COO (permission TASK_TEMPLATE_MANAGE).
--   - 1 default template per service_line dijaga via convention (bukan
--     unique constraint; backend yang validate saat update).
--   - Sum(weight) per template diharapkan = 100 — backend tidak hard-enforce
--     supaya draft tetap bisa di-save, frontend yang warn user.
--   - Project NOT auto-spawn dari template ini di Phase 1 — handover_milestones
--     yang di-copy. Template dipakai sebagai REFERENSI / preview di UI.
-- =============================================================

CREATE TABLE task_templates (
  template_id   BIGINT        PRIMARY KEY AUTO_INCREMENT,
  service_line  ENUM('Transfer Pricing', 'Tax', 'Advisory', 'Audit') NOT NULL,
  name          VARCHAR(255)  NOT NULL,
  is_default    TINYINT(1)    NOT NULL DEFAULT 0,

  created_by    INT           NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_task_templates_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,

  INDEX idx_task_templates_service_line (service_line),
  INDEX idx_task_templates_default (service_line, is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE task_template_tasks (
  task_id                 BIGINT        PRIMARY KEY AUTO_INCREMENT,
  template_id             BIGINT        NOT NULL,

  title                   VARCHAR(255)  NOT NULL,
  weight                  INT           NOT NULL DEFAULT 10,
  phase                   ENUM('Initiation', 'Analysis', 'Core Work', 'QC', 'Delivery') NULL,
  expected_duration_days  INT           NOT NULL DEFAULT 5,
  sequence_no             INT           NOT NULL DEFAULT 1,

  CONSTRAINT fk_task_template_tasks_template
    FOREIGN KEY (template_id) REFERENCES task_templates(template_id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT chk_task_template_weight CHECK (weight BETWEEN 0 AND 100),
  CONSTRAINT chk_task_template_duration CHECK (expected_duration_days >= 1),

  INDEX idx_task_template_tasks_template (template_id),
  INDEX idx_task_template_tasks_sequence (template_id, sequence_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============ SEED: 4 default templates (sama dengan mock lama) ============

INSERT INTO task_templates (service_line, name, is_default) VALUES
  ('Transfer Pricing', 'TP Standard 2026', 1),
  ('Tax', 'Tax Compliance Standard', 1),
  ('Advisory', 'Advisory Engagement Standard', 1),
  ('Audit', 'Audit Engagement Standard', 1);

-- Transfer Pricing (10 tasks)
INSERT INTO task_template_tasks (template_id, title, weight, phase, expected_duration_days, sequence_no)
SELECT t.template_id, x.title, x.weight, x.phase, x.duration, x.seq
FROM task_templates t
JOIN (
  SELECT 'Permintaan Dokumen' AS title, 5 AS weight, 'Initiation' AS phase, 3 AS duration, 1 AS seq UNION ALL
  SELECT 'Kelengkapan Dokumen', 8, 'Initiation', 7, 2 UNION ALL
  SELECT 'Gambaran Perusahaan', 8, 'Analysis', 5, 3 UNION ALL
  SELECT 'Informasi Transaksi Afiliasi', 10, 'Analysis', 7, 4 UNION ALL
  SELECT 'Analisis FAR', 15, 'Core Work', 14, 5 UNION ALL
  SELECT 'Pemilihan Metode', 12, 'Core Work', 7, 6 UNION ALL
  SELECT 'Penerapan ALP', 12, 'Core Work', 14, 7 UNION ALL
  SELECT 'Quality Control', 15, 'QC', 7, 8 UNION ALL
  SELECT 'Kirim Draft ke Klien', 8, 'Delivery', 3, 9 UNION ALL
  SELECT 'Kirim Net ke Klien', 7, 'Delivery', 7, 10
) x
WHERE t.service_line = 'Transfer Pricing' AND t.is_default = 1;

-- Tax (8 tasks)
INSERT INTO task_template_tasks (template_id, title, weight, phase, expected_duration_days, sequence_no)
SELECT t.template_id, x.title, x.weight, x.phase, x.duration, x.seq
FROM task_templates t
JOIN (
  SELECT 'Document Collection' AS title, 5 AS weight, 'Initiation' AS phase, 5 AS duration, 1 AS seq UNION ALL
  SELECT 'Tax Position Review', 10, 'Analysis', 7, 2 UNION ALL
  SELECT 'Compliance Calculation', 20, 'Core Work', 14, 3 UNION ALL
  SELECT 'Form Preparation', 15, 'Core Work', 7, 4 UNION ALL
  SELECT 'Internal Review', 10, 'QC', 5, 5 UNION ALL
  SELECT 'Quality Control', 10, 'QC', 5, 6 UNION ALL
  SELECT 'Client Review', 15, 'Delivery', 7, 7 UNION ALL
  SELECT 'Final Filing', 15, 'Delivery', 5, 8
) x
WHERE t.service_line = 'Tax' AND t.is_default = 1;

-- Advisory (7 tasks)
INSERT INTO task_template_tasks (template_id, title, weight, phase, expected_duration_days, sequence_no)
SELECT t.template_id, x.title, x.weight, x.phase, x.duration, x.seq
FROM task_templates t
JOIN (
  SELECT 'Discovery & Scoping' AS title, 10 AS weight, 'Initiation' AS phase, 7 AS duration, 1 AS seq UNION ALL
  SELECT 'Stakeholder Interviews', 15, 'Analysis', 7, 2 UNION ALL
  SELECT 'Issue Identification', 15, 'Analysis', 7, 3 UNION ALL
  SELECT 'Solution Design', 20, 'Core Work', 10, 4 UNION ALL
  SELECT 'Recommendation Drafting', 15, 'Core Work', 10, 5 UNION ALL
  SELECT 'Internal Review', 10, 'QC', 5, 6 UNION ALL
  SELECT 'Final Presentation', 15, 'Delivery', 7, 7
) x
WHERE t.service_line = 'Advisory' AND t.is_default = 1;

-- Audit (8 tasks)
INSERT INTO task_template_tasks (template_id, title, weight, phase, expected_duration_days, sequence_no)
SELECT t.template_id, x.title, x.weight, x.phase, x.duration, x.seq
FROM task_templates t
JOIN (
  SELECT 'Engagement Acceptance' AS title, 5 AS weight, 'Initiation' AS phase, 3 AS duration, 1 AS seq UNION ALL
  SELECT 'Audit Planning', 10, 'Initiation', 5, 2 UNION ALL
  SELECT 'Risk Assessment', 10, 'Analysis', 7, 3 UNION ALL
  SELECT 'Substantive Testing', 25, 'Core Work', 21, 4 UNION ALL
  SELECT 'Working Paper Review', 15, 'Core Work', 7, 5 UNION ALL
  SELECT 'Quality Control', 15, 'QC', 7, 6 UNION ALL
  SELECT 'Audit Report Drafting', 10, 'Delivery', 7, 7 UNION ALL
  SELECT 'Final Report', 10, 'Delivery', 3, 8
) x
WHERE t.service_line = 'Audit' AND t.is_default = 1;
