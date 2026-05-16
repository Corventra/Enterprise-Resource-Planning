-- =============================================================
-- Feature: Leads
-- Table:
--   - leads
--   - lead_activity_logs
-- Catatan:
--   - Dipakai untuk Bank Data + Lead Tracker
--   - bank_data_status:
--       NEW / PROCESSED / ARCHIVED / NULL
--     NULL dipakai untuk manual lead yang langsung dibuat di Lead Tracker
--   - lead_status:
--       ACTIVE / WON / LOST / NULL
--   - lost_reason_* dipakai hanya ketika lead yang sudah masuk tracker
--     ditandai LOST
--   - bank_data_archived_* dipakai hanya untuk archive dari Bank Data
-- =============================================================

CREATE TABLE leads (
  lead_id INT PRIMARY KEY AUTO_INCREMENT,

  campaign_id INT NULL,
  form_id INT NULL,
  submission_id BIGINT NULL,
  distribution_link_id INT NULL,

  source_type ENUM('FORM_LEAD_CAPTURE', 'MANUAL') NOT NULL,

  company_name VARCHAR(200) NOT NULL,
  company_address VARCHAR(255) NOT NULL,
  pic_name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  desired_services TEXT NULL,

  bank_data_status ENUM('NEW', 'PROCESSED', 'ARCHIVED') NULL,
  lead_status ENUM('ACTIVE', 'WON', 'LOST') NULL,
  current_stage ENUM('MEETING', 'MINUTES', 'PROPOSAL', 'ENGAGEMENT_LETTER') NULL,
  stage_progress VARCHAR(64) NULL,
  next_action VARCHAR(255) NULL,
  due_date DATETIME NULL,

  processed_by INT NULL,
  processed_at DATETIME NULL,

  bank_data_archived_by INT NULL,
  bank_data_archived_at DATETIME NULL,

  lost_reason_code ENUM(
    'NO_RESPONSE',
    'NOT_INTERESTED',
    'BUDGET_ISSUE',
    'LOST_TO_COMPETITOR',
    'TIMING_NOT_RIGHT',
    'NOT_QUALIFIED',
    'INTERNAL_DECISION',
    'OTHER'
  ) NULL,
  lost_reason_note TEXT NULL,
  lost_at DATETIME NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_leads_campaign
    FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_leads_form
    FOREIGN KEY (form_id) REFERENCES forms(form_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_leads_submission
    FOREIGN KEY (submission_id) REFERENCES form_submissions(submission_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_leads_distribution_link
    FOREIGN KEY (distribution_link_id) REFERENCES form_distribution_links(distribution_link_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_leads_processed_by
    FOREIGN KEY (processed_by) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT fk_leads_bank_data_archived_by
    FOREIGN KEY (bank_data_archived_by) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  INDEX idx_leads_campaign_id (campaign_id),
  INDEX idx_leads_form_id (form_id),
  INDEX idx_leads_submission_id (submission_id),
  INDEX idx_leads_distribution_link_id (distribution_link_id),
  INDEX idx_leads_source_type (source_type),
  INDEX idx_leads_bank_data_status (bank_data_status),
  INDEX idx_leads_lead_status (lead_status),
  INDEX idx_leads_current_stage (current_stage),
  INDEX idx_leads_processed_by (processed_by),
  INDEX idx_leads_bank_data_archived_by (bank_data_archived_by),
  INDEX idx_leads_due_date (due_date),
  INDEX idx_leads_lost_at (lost_at),
  INDEX idx_leads_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lead_activity_logs (
  activity_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  lead_id INT NOT NULL,
  activity_type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,

  created_by INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_lead_activity_logs_lead
    FOREIGN KEY (lead_id) REFERENCES leads(lead_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_lead_activity_logs_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  INDEX idx_lead_activity_logs_lead_id (lead_id),
  INDEX idx_lead_activity_logs_activity_type (activity_type),
  INDEX idx_lead_activity_logs_created_at (created_at),
  INDEX idx_lead_activity_logs_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;