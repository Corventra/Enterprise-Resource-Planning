-- =============================================================
-- Feature: Lead Workspace - Meeting & Minutes
-- Tables:
--   - meetings
--   - minutes
--   - minute_participants
--   - minute_agreements
--
-- Catatan:
--   - Satu lead bisa punya banyak meeting
--   - Satu meeting hanya punya satu minutes/notulensi
--   - Minutes tidak punya draft/status terpisah
--     Jika row minutes sudah ada, dianggap "DONE"
--   - Meeting tambahan setelah stage Proposal / Engagement Letter tetap boleh
--     dibuat, tetapi tidak boleh mengembalikan current_stage lead ke MEETING
-- =============================================================

CREATE TABLE meetings (
  meeting_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  lead_id INT NOT NULL,

  title VARCHAR(200) NOT NULL,
  meeting_datetime DATETIME NOT NULL,

  meeting_mode ENUM('ONLINE', 'OFFLINE') NOT NULL,
  meeting_access VARCHAR(500) NULL,

  notes TEXT NULL,

  status ENUM('SCHEDULED', 'DONE', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',

  created_by INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_meetings_lead
    FOREIGN KEY (lead_id) REFERENCES leads(lead_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_meetings_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  INDEX idx_meetings_lead_id (lead_id),
  INDEX idx_meetings_status (status),
  INDEX idx_meetings_meeting_datetime (meeting_datetime),
  INDEX idx_meetings_created_by (created_by),
  INDEX idx_meetings_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE minutes (
  minute_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  meeting_id BIGINT NOT NULL,
  lead_id INT NOT NULL,

  meeting_objectives TEXT NULL,

  background_summary TEXT NULL,
  issues_discussed TEXT NULL,
  info_client TEXT NULL,
  info_firm TEXT NULL,
  risk_concerns TEXT NULL,

  next_steps TEXT NULL,
  notes_follow_up TEXT NULL,

  created_by INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_minutes_meeting
    FOREIGN KEY (meeting_id) REFERENCES meetings(meeting_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_minutes_lead
    FOREIGN KEY (lead_id) REFERENCES leads(lead_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_minutes_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT uk_minutes_meeting_id UNIQUE (meeting_id),

  INDEX idx_minutes_lead_id (lead_id),
  INDEX idx_minutes_created_by (created_by),
  INDEX idx_minutes_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE minute_participants (
  participant_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  minute_id BIGINT NOT NULL,

  participant_type ENUM('INTERNAL', 'CLIENT') NOT NULL,
  participant_name VARCHAR(150) NOT NULL,
  sort_order INT NOT NULL DEFAULT 1,

  CONSTRAINT fk_minute_participants_minute
    FOREIGN KEY (minute_id) REFERENCES minutes(minute_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  INDEX idx_minute_participants_minute_id (minute_id),
  INDEX idx_minute_participants_type (participant_type),
  INDEX idx_minute_participants_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE minute_agreements (
  agreement_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  minute_id BIGINT NOT NULL,

  item VARCHAR(255) NOT NULL,
  details TEXT NULL,
  sort_order INT NOT NULL DEFAULT 1,

  CONSTRAINT fk_minute_agreements_minute
    FOREIGN KEY (minute_id) REFERENCES minutes(minute_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  INDEX idx_minute_agreements_minute_id (minute_id),
  INDEX idx_minute_agreements_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;