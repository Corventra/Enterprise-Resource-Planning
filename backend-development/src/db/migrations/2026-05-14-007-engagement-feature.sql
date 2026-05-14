-- =============================================================
-- Feature: Engagement Letter
-- Tables:
--   - engagement_letters
--   - engagement_letter_termins
--   - engagement_letter_retainers
--
-- Catatan:
--   - Satu proposal maksimal punya satu engagement letter
--   - payment_method hanya:
--       TERMIN / RETAINER
--   - TERMIN:
--       minimal 2 termin
--       wajib ada DOWN_PAYMENT dan FINAL
--       boleh ada INSTALLMENT di tengah
--   - RETAINER:
--       pakai contract period + billing timing
--   - Dokumen EL disimpan di tabel documents
--     melalui engagement_id
-- =============================================================

CREATE TABLE engagement_letters (
  engagement_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  lead_id INT NOT NULL,
  proposal_id BIGINT NOT NULL,

  issuer_company ENUM('DSK', 'DTAX') NOT NULL,

  agreed_fee DECIMAL(18,2) NOT NULL,
  payment_method ENUM('TERMIN', 'RETAINER') NOT NULL,

  engagement_status ENUM(
    'DRAFT',
    'WAITING_CEO_APPROVAL',
    'NEED_REVISION',
    'APPROVED',
    'SENT',
    'SIGNED'
  ) NOT NULL DEFAULT 'DRAFT',

  revision_note TEXT NULL,

  approved_by INT NULL,
  approved_at DATETIME NULL,

  sent_to_client_at DATETIME NULL,
  signed_at DATETIME NULL,

  submitted_by INT NULL,
  submitted_at DATETIME NULL,

  created_by INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_engagement_letters_lead
    FOREIGN KEY (lead_id) REFERENCES leads(lead_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_engagement_letters_proposal
    FOREIGN KEY (proposal_id) REFERENCES proposals(proposal_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_engagement_letters_approved_by
    FOREIGN KEY (approved_by) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT fk_engagement_letters_submitted_by
    FOREIGN KEY (submitted_by) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT fk_engagement_letters_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT uk_engagement_letters_proposal_id UNIQUE (proposal_id),

  INDEX idx_engagement_letters_lead_id (lead_id),
  INDEX idx_engagement_letters_status (engagement_status),
  INDEX idx_engagement_letters_payment_method (payment_method),
  INDEX idx_engagement_letters_created_by (created_by),
  INDEX idx_engagement_letters_submitted_by (submitted_by),
  INDEX idx_engagement_letters_approved_by (approved_by),
  INDEX idx_engagement_letters_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE engagement_letter_termins (
  termin_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  engagement_id BIGINT NOT NULL,

  term_name VARCHAR(150) NOT NULL,
  term_type ENUM('DOWN_PAYMENT', 'INSTALLMENT', 'FINAL') NOT NULL,

  percentage DECIMAL(5,2) NOT NULL,
  description TEXT NULL,
  billing_schedule_date DATE NULL,

  sort_order INT NOT NULL DEFAULT 1,

  CONSTRAINT fk_engagement_letter_termins_engagement
    FOREIGN KEY (engagement_id) REFERENCES engagement_letters(engagement_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  INDEX idx_engagement_letter_termins_engagement_id (engagement_id),
  INDEX idx_engagement_letter_termins_term_type (term_type),
  INDEX idx_engagement_letter_termins_billing_schedule_date (billing_schedule_date),
  INDEX idx_engagement_letter_termins_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE engagement_letter_retainers (
  retainer_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  engagement_id BIGINT NOT NULL,

  contract_start_date DATE NOT NULL,
  contract_end_date DATE NOT NULL,

  billing_timing ENUM('BEGINNING_OF_MONTH', 'END_OF_MONTH') NOT NULL,

  CONSTRAINT fk_engagement_letter_retainers_engagement
    FOREIGN KEY (engagement_id) REFERENCES engagement_letters(engagement_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT uk_engagement_letter_retainers_engagement_id UNIQUE (engagement_id),

  INDEX idx_engagement_letter_retainers_contract_start_date (contract_start_date),
  INDEX idx_engagement_letter_retainers_contract_end_date (contract_end_date),
  INDEX idx_engagement_letter_retainers_billing_timing (billing_timing)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;