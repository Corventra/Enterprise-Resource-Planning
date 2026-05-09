-- =============================================================
-- Feature: Campaign
-- Tables:
--   - campaign_types
--   - topics
--   - campaigns
-- Catatan:
--   - Jalankan manual di phpMyAdmin
--   - Jangan pakai DROP TABLE di DB shared/prod
-- =============================================================

CREATE TABLE campaign_types (
  campaign_type_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  code VARCHAR(32) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE topics (
  topic_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  code VARCHAR(32) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE campaigns (
  campaign_id INT PRIMARY KEY AUTO_INCREMENT,
  campaign_type_id INT NOT NULL,
  topic_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  status ENUM('ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  start_date DATE NOT NULL,
  end_date DATE NULL,
  notes TEXT NULL,
  image_path VARCHAR(255) NULL,
  created_by INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_campaigns_campaign_type
    FOREIGN KEY (campaign_type_id) REFERENCES campaign_types(campaign_type_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_campaigns_topic
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_campaigns_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  INDEX idx_campaigns_campaign_type (campaign_type_id),
  INDEX idx_campaigns_topic (topic_id),
  INDEX idx_campaigns_created_by (created_by),
  INDEX idx_campaigns_status (status),
  INDEX idx_campaigns_start_date (start_date),
  INDEX idx_campaigns_end_date (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;