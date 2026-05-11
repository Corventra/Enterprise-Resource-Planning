-- =============================================================
-- Feature: Leads
-- Table:
--   - leads
-- Catatan:
--   - Dipakai untuk Bank Data + Lead Tracker
--   - bank_data_status:
--       NEW / PROCESSED / ARCHIVED / NULL
--     NULL dipakai untuk manual lead yang langsung dibuat di Lead Tracker
--   - lead_status:
--       ACTIVE / WON / LOST / NULL
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

  archived_reason_code ENUM('LOST', 'NO_RESPONSE', 'NOT_QUALIFIED', 'DUPLICATE', 'INVALID_DATA', 'OTHER') NULL,
  archived_reason_note TEXT NULL,
  archived_at DATETIME NULL,

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

  INDEX idx_leads_campaign_id (campaign_id),
  INDEX idx_leads_form_id (form_id),
  INDEX idx_leads_submission_id (submission_id),
  INDEX idx_leads_distribution_link_id (distribution_link_id),
  INDEX idx_leads_source_type (source_type),
  INDEX idx_leads_bank_data_status (bank_data_status),
  INDEX idx_leads_lead_status (lead_status),
  INDEX idx_leads_current_stage (current_stage),
  INDEX idx_leads_processed_by (processed_by),
  INDEX idx_leads_due_date (due_date),
  INDEX idx_leads_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;