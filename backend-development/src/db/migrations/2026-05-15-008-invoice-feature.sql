-- =============================================================
-- Feature: Invoice
-- Tables:
--   - invoice_accounts
--   - invoice_terms
--   - invoice_payments
--
-- Catatan:
--   - Satu engagement letter menghasilkan satu invoice account
--   - invoice_accounts = header / ringkasan akun invoice
--   - invoice_terms = daftar termin / billing row yang ditagihkan
--   - invoice_payments = riwayat pembayaran per invoice term
--   - Tidak ada status PARTIALLY_PAID pada invoice_terms
--     Partial payment dibaca dari invoice_payments + outstanding amount
-- =============================================================

CREATE TABLE invoice_accounts (
  account_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  lead_id INT NOT NULL,
  proposal_id BIGINT NULL,
  engagement_id BIGINT NOT NULL,
  service_id INT NOT NULL,

  issuer_company ENUM('DSK', 'DTAX') NOT NULL,
  payment_method ENUM('TERMIN', 'RETAINER') NOT NULL,

  contract_value_dpp DECIMAL(18,2) NOT NULL,

  total_bill_net DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  total_paid_net DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  total_outstanding_net DECIMAL(18,2) NOT NULL DEFAULT 0.00,

  next_due_date DATE NULL,

  status ENUM(
    'READY_TO_BILL',
    'AWAITING_PAYMENT',
    'OVERDUE',
    'SETTLED'
  ) NOT NULL DEFAULT 'READY_TO_BILL',

  progress_summary VARCHAR(64) NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_invoice_accounts_lead
    FOREIGN KEY (lead_id) REFERENCES leads(lead_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_invoice_accounts_proposal
    FOREIGN KEY (proposal_id) REFERENCES proposals(proposal_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT fk_invoice_accounts_engagement
    FOREIGN KEY (engagement_id) REFERENCES engagement_letters(engagement_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_invoice_accounts_service
    FOREIGN KEY (service_id) REFERENCES services(service_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT uk_invoice_accounts_engagement_id UNIQUE (engagement_id),

  INDEX idx_invoice_accounts_lead_id (lead_id),
  INDEX idx_invoice_accounts_proposal_id (proposal_id),
  INDEX idx_invoice_accounts_service_id (service_id),
  INDEX idx_invoice_accounts_status (status),
  INDEX idx_invoice_accounts_next_due_date (next_due_date),
  INDEX idx_invoice_accounts_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE invoice_terms (
  invoice_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  account_id BIGINT NOT NULL,
  engagement_id BIGINT NOT NULL,
  project_id BIGINT NULL,

  term_name VARCHAR(150) NOT NULL,
  term_type ENUM('DOWN_PAYMENT', 'INSTALLMENT', 'FINAL', 'RETAINER') NOT NULL,
  term_order INT NOT NULL DEFAULT 1,
  percentage DECIMAL(5,2) NOT NULL,

  billing_trigger_type ENUM(
    'IMMEDIATE',
    'SCHEDULE_DATE',
    'PROJECT_COMPLETION',
    'PERIOD_START',
    'PERIOD_END'
  ) NOT NULL,

  billing_schedule_date DATE NULL,

  trigger_reference_value VARCHAR(100) NULL,
  trigger_confirmed_by INT NULL,
  trigger_confirmed_at DATETIME NULL,

  invoice_number VARCHAR(100) NULL,
  invoice_sequence_no INT NULL,

  department_code VARCHAR(32) NULL,

  issue_date DATE NULL,
  sent_to_client_at DATETIME NULL,
  due_date DATE NULL,

  dpp_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  ppn_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  ppn_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  pph23_rate DECIMAL(5,2) NOT NULL DEFAULT 2.00,
  pph23_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  gross_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  net_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,

  sent_by INT NULL,

  status ENUM(
    'DRAFT',
    'READY_TO_ISSUE',
    'ISSUED',
    'SENT',
    'PAID',
    'OVERDUE'
  ) NOT NULL DEFAULT 'DRAFT',

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_invoice_terms_account
    FOREIGN KEY (account_id) REFERENCES invoice_accounts(account_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_invoice_terms_engagement
    FOREIGN KEY (engagement_id) REFERENCES engagement_letters(engagement_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_invoice_terms_trigger_confirmed_by
    FOREIGN KEY (trigger_confirmed_by) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT fk_invoice_terms_sent_by
    FOREIGN KEY (sent_by) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT uk_invoice_terms_invoice_number UNIQUE (invoice_number),
  CONSTRAINT uk_invoice_terms_account_term_order UNIQUE (account_id, term_order),

  INDEX idx_invoice_terms_account_id (account_id),
  INDEX idx_invoice_terms_engagement_id (engagement_id),
  INDEX idx_invoice_terms_project_id (project_id),
  INDEX idx_invoice_terms_term_type (term_type),
  INDEX idx_invoice_terms_billing_trigger_type (billing_trigger_type),
  INDEX idx_invoice_terms_billing_schedule_date (billing_schedule_date),
  INDEX idx_invoice_terms_issue_date (issue_date),
  INDEX idx_invoice_terms_due_date (due_date),
  INDEX idx_invoice_terms_status (status),
  INDEX idx_invoice_terms_department_code (department_code),
  INDEX idx_invoice_terms_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE invoice_payments (
  payment_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  invoice_id BIGINT NOT NULL,

  transaction_date DATE NOT NULL,
  amount_received_net DECIMAL(18,2) NOT NULL,
  tax_withheld_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,

  payment_method ENUM(
    'BANK_TRANSFER',
    'CASH',
    'GIRO',
    'CHEQUE',
    'OTHER'
  ) NOT NULL,

  payment_channel VARCHAR(100) NULL,

  proof_file_name VARCHAR(255) NULL,
  proof_file_path VARCHAR(500) NULL,

  verified_by INT NULL,
  verified_at DATETIME NULL,

  status ENUM(
    'PENDING_VERIFICATION',
    'VERIFIED',
    'REJECTED'
  ) NOT NULL DEFAULT 'PENDING_VERIFICATION',

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_invoice_payments_invoice
    FOREIGN KEY (invoice_id) REFERENCES invoice_terms(invoice_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_invoice_payments_verified_by
    FOREIGN KEY (verified_by) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  INDEX idx_invoice_payments_invoice_id (invoice_id),
  INDEX idx_invoice_payments_transaction_date (transaction_date),
  INDEX idx_invoice_payments_status (status),
  INDEX idx_invoice_payments_verified_by (verified_by),
  INDEX idx_invoice_payments_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;