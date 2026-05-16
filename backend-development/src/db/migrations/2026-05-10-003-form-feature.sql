-- =============================================================
-- Feature: Forms
-- Tables:
--   - forms
--   - form_fields
--   - form_field_options
--   - form_channels
--   - form_distribution_links
--   - form_submissions
--   - form_submission_answers
-- =============================================================

CREATE TABLE forms (
  form_id INT PRIMARY KEY AUTO_INCREMENT,
  form_code VARCHAR(20) NULL UNIQUE,
  campaign_id INT NOT NULL,
  form_category ENUM('LEAD_CAPTURE', 'GENERAL') NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  header_image_path VARCHAR(255) NULL,
  success_message TEXT NULL,
  success_link_url VARCHAR(255) NULL,
  success_link_label VARCHAR(100) NULL,
  status ENUM('DRAFT', 'PUBLISHED', 'INACTIVE') NOT NULL DEFAULT 'DRAFT',
  is_accepting_responses BOOLEAN NOT NULL DEFAULT 0,
  created_by INT NOT NULL,
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_forms_campaign
    FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_forms_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  INDEX idx_forms_campaign_id (campaign_id),
  INDEX idx_forms_form_category (form_category),
  INDEX idx_forms_status (status),
  INDEX idx_forms_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE form_fields (
  field_id INT PRIMARY KEY AUTO_INCREMENT,
  form_id INT NOT NULL,
  field_key VARCHAR(64) NOT NULL,
  label VARCHAR(150) NOT NULL,
  field_type ENUM(
    'text',
    'textarea',
    'select',
    'radio',
    'checkbox',
    'date',
    'file'
  ) NOT NULL,
  placeholder VARCHAR(255) NULL,
  help_text VARCHAR(255) NULL,
  is_required BOOLEAN NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT 0,
  is_locked BOOLEAN NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 1,
  settings_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_form_fields_form
    FOREIGN KEY (form_id) REFERENCES forms(form_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT uq_form_fields_form_id_field_key
    UNIQUE (form_id, field_key),

  INDEX idx_form_fields_form_id (form_id),
  INDEX idx_form_fields_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE form_field_options (
  option_id INT PRIMARY KEY AUTO_INCREMENT,
  field_id INT NOT NULL,
  label VARCHAR(150) NOT NULL,
  value VARCHAR(150) NOT NULL,
  sort_order INT NOT NULL DEFAULT 1,

  CONSTRAINT fk_form_field_options_field
    FOREIGN KEY (field_id) REFERENCES form_fields(field_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  INDEX idx_form_field_options_field_id (field_id),
  INDEX idx_form_field_options_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE form_channels (
  channel_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(32) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE form_distribution_links (
  distribution_link_id INT PRIMARY KEY AUTO_INCREMENT,
  form_id INT NOT NULL,
  channel_id INT NULL,
  link_type ENUM('PRIMARY', 'CHANNEL') NOT NULL,
  link_code VARCHAR(255) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_form_distribution_links_form
    FOREIGN KEY (form_id) REFERENCES forms(form_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_form_distribution_links_channel
    FOREIGN KEY (channel_id) REFERENCES form_channels(channel_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  INDEX idx_form_distribution_links_form_id (form_id),
  INDEX idx_form_distribution_links_channel_id (channel_id),
  INDEX idx_form_distribution_links_link_type (link_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE form_submissions (
  submission_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  form_id INT NOT NULL,
  distribution_link_id INT NOT NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_form_submissions_form
    FOREIGN KEY (form_id) REFERENCES forms(form_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_form_submissions_distribution_link
    FOREIGN KEY (distribution_link_id) REFERENCES form_distribution_links(distribution_link_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  INDEX idx_form_submissions_form_id (form_id),
  INDEX idx_form_submissions_distribution_link_id (distribution_link_id),
  INDEX idx_form_submissions_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE form_submission_answers (
  answer_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  submission_id BIGINT NOT NULL,
  field_id INT NOT NULL,
  answer_value LONGTEXT NULL,
  answer_file_path VARCHAR(255) NULL,

  CONSTRAINT fk_form_submission_answers_submission
    FOREIGN KEY (submission_id) REFERENCES form_submissions(submission_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_form_submission_answers_field
    FOREIGN KEY (field_id) REFERENCES form_fields(field_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  INDEX idx_form_submission_answers_submission_id (submission_id),
  INDEX idx_form_submission_answers_field_id (field_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;