-- =============================================================
-- Feature: Handover
-- Tables:
--   - handovers
--   - handover_scope_items
--   - handover_milestones
--   - outstanding_requirements
--   - handover_risks
--   - handover_internal_protocols
--   - handover_external_protocols
--   - handover_team_requirements
--   - handover_checklist
--   - handover_activity_logs
--
-- Catatan:
--   - Handover otomatis dibuat sebagai DRAFT saat Engagement Letter SIGNED
--   - Client provided documents menggunakan tabel generic `documents`
--     dengan document_category khusus, mis. HANDOVER_CLIENT_DOCUMENT
--   - Handover checklist bukan input manual user; row & status diisi/update sistem
-- =============================================================

CREATE TABLE handovers (
  handover_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  lead_id INT NOT NULL,
  proposal_id BIGINT NOT NULL,
  engagement_id BIGINT NOT NULL,
  service_id INT NOT NULL,
  department_id INT NOT NULL,

  handover_code VARCHAR(100) NOT NULL,

  project_title VARCHAR(255) NULL,
  company_group VARCHAR(255) NULL,
  project_start_date DATE NULL,
  project_end_date DATE NULL,

  background_summary TEXT NULL,
  risk_internal_note TEXT NULL,

  status ENUM(
    'DRAFT',
    'WAITING_CEO_APPROVAL',
    'NEED_REVISION',
    'APPROVED',
    'ROUTED_TO_COO',
    'ASSIGNED_TO_PM'
  ) NOT NULL DEFAULT 'DRAFT',

  ceo_revision_note TEXT NULL,
  coo_revision_note TEXT NULL,

  routed_coo_id INT NULL,

  submitted_by INT NULL,
  submitted_at DATETIME NULL,

  approved_by INT NULL,
  approved_at DATETIME NULL,

  dp_payment_status ENUM('UNPAID', 'PAID') NULL,
  dp_paid_at DATETIME NULL,

  created_by INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_handovers_lead
    FOREIGN KEY (lead_id) REFERENCES leads(lead_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_handovers_proposal
    FOREIGN KEY (proposal_id) REFERENCES proposals(proposal_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_handovers_engagement
    FOREIGN KEY (engagement_id) REFERENCES engagement_letters(engagement_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_handovers_service
    FOREIGN KEY (service_id) REFERENCES services(service_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_handovers_department
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_handovers_routed_coo
    FOREIGN KEY (routed_coo_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT fk_handovers_submitted_by
    FOREIGN KEY (submitted_by) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT fk_handovers_approved_by
    FOREIGN KEY (approved_by) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT fk_handovers_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT uk_handovers_handover_code UNIQUE (handover_code),
  CONSTRAINT uk_handovers_engagement_id UNIQUE (engagement_id),

  INDEX idx_handovers_lead_id (lead_id),
  INDEX idx_handovers_proposal_id (proposal_id),
  INDEX idx_handovers_service_id (service_id),
  INDEX idx_handovers_department_id (department_id),
  INDEX idx_handovers_status (status),
  INDEX idx_handovers_routed_coo_id (routed_coo_id),
  INDEX idx_handovers_project_start_date (project_start_date),
  INDEX idx_handovers_project_end_date (project_end_date),
  INDEX idx_handovers_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE handover_scope_items (
  scope_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  handover_id BIGINT NOT NULL,

  item_type ENUM('INCLUDED', 'EXCLUDED', 'DELIVERABLE') NOT NULL,
  item_text TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 1,

  CONSTRAINT fk_handover_scope_items_handover
    FOREIGN KEY (handover_id) REFERENCES handovers(handover_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  INDEX idx_handover_scope_items_handover_id (handover_id),
  INDEX idx_handover_scope_items_item_type (item_type),
  INDEX idx_handover_scope_items_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE handover_milestones (
  milestone_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  handover_id BIGINT NOT NULL,

  milestone_name VARCHAR(255) NOT NULL,
  target_date DATE NULL,
  notes TEXT NULL,
  sort_order INT NOT NULL DEFAULT 1,

  CONSTRAINT fk_handover_milestones_handover
    FOREIGN KEY (handover_id) REFERENCES handovers(handover_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  INDEX idx_handover_milestones_handover_id (handover_id),
  INDEX idx_handover_milestones_target_date (target_date),
  INDEX idx_handover_milestones_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE outstanding_requirements (
  outstanding_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  handover_id BIGINT NOT NULL,

  requirement_text TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 1,

  CONSTRAINT fk_outstanding_requirements_handover
    FOREIGN KEY (handover_id) REFERENCES handovers(handover_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  INDEX idx_outstanding_requirements_handover_id (handover_id),
  INDEX idx_outstanding_requirements_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE handover_risks (
  risk_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  handover_id BIGINT NOT NULL,

  risk_text TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 1,

  CONSTRAINT fk_handover_risks_handover
    FOREIGN KEY (handover_id) REFERENCES handovers(handover_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  INDEX idx_handover_risks_handover_id (handover_id),
  INDEX idx_handover_risks_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE handover_internal_protocols (
  internal_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  handover_id BIGINT NOT NULL,

  instruction_text TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 1,

  CONSTRAINT fk_handover_internal_protocols_handover
    FOREIGN KEY (handover_id) REFERENCES handovers(handover_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  INDEX idx_handover_internal_protocols_handover_id (handover_id),
  INDEX idx_handover_internal_protocols_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE handover_external_protocols (
  external_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  handover_id BIGINT NOT NULL,

  role_label VARCHAR(150) NOT NULL,
  contact_name VARCHAR(150) NOT NULL,
  contact_text VARCHAR(255) NOT NULL,
  instruction TEXT NULL,
  sort_order INT NOT NULL DEFAULT 1,

  CONSTRAINT fk_handover_external_protocols_handover
    FOREIGN KEY (handover_id) REFERENCES handovers(handover_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  INDEX idx_handover_external_protocols_handover_id (handover_id),
  INDEX idx_handover_external_protocols_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE handover_team_requirements (
  requirement_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  handover_id BIGINT NOT NULL,

  role_name VARCHAR(150) NOT NULL,
  needed VARCHAR(150) NOT NULL,
  responsibilities TEXT NOT NULL,
  notes TEXT NULL,
  sort_order INT NOT NULL DEFAULT 1,

  CONSTRAINT fk_handover_team_requirements_handover
    FOREIGN KEY (handover_id) REFERENCES handovers(handover_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  INDEX idx_handover_team_requirements_handover_id (handover_id),
  INDEX idx_handover_team_requirements_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE handover_checklist (
  checklist_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  handover_id BIGINT NOT NULL,

  item_code VARCHAR(100) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  item_group VARCHAR(100) NOT NULL,

  status ENUM('NO', 'PENDING', 'PARTIAL', 'YES') NOT NULL DEFAULT 'NO',

  is_required_for_submit TINYINT(1) NOT NULL DEFAULT 0,
  is_required_for_start TINYINT(1) NOT NULL DEFAULT 0,

  completed_by INT NULL,
  completed_at DATETIME NULL,

  sort_order INT NOT NULL DEFAULT 1,

  CONSTRAINT fk_handover_checklist_handover
    FOREIGN KEY (handover_id) REFERENCES handovers(handover_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_handover_checklist_completed_by
    FOREIGN KEY (completed_by) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT uk_handover_checklist_handover_item_code UNIQUE (handover_id, item_code),

  INDEX idx_handover_checklist_handover_id (handover_id),
  INDEX idx_handover_checklist_status (status),
  INDEX idx_handover_checklist_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE handover_activity_logs (
  handover_activity_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  handover_id BIGINT NOT NULL,

  activity_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,

  created_by INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_handover_activity_logs_handover
    FOREIGN KEY (handover_id) REFERENCES handovers(handover_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_handover_activity_logs_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  INDEX idx_handover_activity_logs_handover_id (handover_id),
  INDEX idx_handover_activity_logs_activity_type (activity_type),
  INDEX idx_handover_activity_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;