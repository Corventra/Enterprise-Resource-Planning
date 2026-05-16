-- =============================================================
-- Feature: Proposal
-- Tables:
--   - service_classes
--   - services
--   - proposals
--   - approvals
--   - documents
--
-- Catatan:
--   - service_classes dan services adalah master data
--   - UI tetap menampilkan semua class/service, tetapi item inactive di-disable
--   - proposal bisa draft
--   - submit proposal akan membuat approval CEO dengan decision = PENDING
--   - documents dipakai lintas fitur: proposal, EL, handover, project
-- =============================================================

CREATE TABLE service_classes (
  service_class_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(64) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uk_service_classes_code UNIQUE (code),
  INDEX idx_service_classes_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE services (
  service_id INT PRIMARY KEY AUTO_INCREMENT,
  service_class_id INT NOT NULL,
  department_id INT NOT NULL,

  name VARCHAR(200) NOT NULL,
  code VARCHAR(64) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_services_service_class
    FOREIGN KEY (service_class_id) REFERENCES service_classes(service_class_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_services_department
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT uk_services_code UNIQUE (code),

  INDEX idx_services_service_class_id (service_class_id),
  INDEX idx_services_department_id (department_id),
  INDEX idx_services_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE proposals (
  proposal_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  lead_id INT NOT NULL,
  service_id INT NOT NULL,

  issuer_company ENUM('DSK', 'DTAX') NOT NULL,

  is_sub_contract TINYINT(1) NOT NULL DEFAULT 0,
  partner_name VARCHAR(200) NULL,
  payer_party ENUM('PARTNER', 'CLIENT') NULL,

  proposal_fee DECIMAL(18,2) NOT NULL,
  discount_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,

  proposal_status ENUM(
    'DRAFT',
    'WAITING_CEO_APPROVAL',
    'NEED_REVISION',
    'APPROVED',
    'SENT',
    'RESPONDED'
  ) NOT NULL DEFAULT 'DRAFT',

  revision_note TEXT NULL,

  approved_by INT NULL,
  approved_at DATETIME NULL,

  sent_to_client_at DATETIME NULL,
  client_responded_at DATETIME NULL,

  submitted_by INT NULL,
  submitted_at DATETIME NULL,

  created_by INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_proposals_lead
    FOREIGN KEY (lead_id) REFERENCES leads(lead_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_proposals_service
    FOREIGN KEY (service_id) REFERENCES services(service_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_proposals_approved_by
    FOREIGN KEY (approved_by) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT fk_proposals_submitted_by
    FOREIGN KEY (submitted_by) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT fk_proposals_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  INDEX idx_proposals_lead_id (lead_id),
  INDEX idx_proposals_service_id (service_id),
  INDEX idx_proposals_status (proposal_status),
  INDEX idx_proposals_created_by (created_by),
  INDEX idx_proposals_submitted_by (submitted_by),
  INDEX idx_proposals_approved_by (approved_by),
  INDEX idx_proposals_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE approvals (
  approval_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  proposal_id BIGINT NULL,
  engagement_id BIGINT NULL,
  handover_id BIGINT NULL,
  invoice_id BIGINT NULL,

  approval_role ENUM('CEO') NOT NULL,
  sequence_no INT NOT NULL DEFAULT 1,

  decision ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  note TEXT NULL,
  decided_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_approvals_proposal
    FOREIGN KEY (proposal_id) REFERENCES proposals(proposal_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  INDEX idx_approvals_proposal_id (proposal_id),
  INDEX idx_approvals_engagement_id (engagement_id),
  INDEX idx_approvals_handover_id (handover_id),
  INDEX idx_approvals_invoice_id (invoice_id),
  INDEX idx_approvals_role (approval_role),
  INDEX idx_approvals_decision (decision),
  INDEX idx_approvals_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE documents (
  document_id BIGINT PRIMARY KEY AUTO_INCREMENT,

  lead_id INT NOT NULL,
  proposal_id BIGINT NULL,
  engagement_id BIGINT NULL,
  handover_id BIGINT NULL,
  project_id BIGINT NULL,

  document_category ENUM(
    'PROPOSAL',
    'ENGAGEMENT_LETTER',
    'HANDOVER',
    'PROJECT',
    'OTHER'
  ) NOT NULL,

  document_name VARCHAR(255) NOT NULL,
  version_no INT NOT NULL DEFAULT 1,
  is_latest TINYINT(1) NOT NULL DEFAULT 1,

  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(150) NULL,
  file_size_bytes BIGINT NULL,

  uploaded_by INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_documents_lead
    FOREIGN KEY (lead_id) REFERENCES leads(lead_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_documents_proposal
    FOREIGN KEY (proposal_id) REFERENCES proposals(proposal_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_documents_uploaded_by
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  INDEX idx_documents_lead_id (lead_id),
  INDEX idx_documents_proposal_id (proposal_id),
  INDEX idx_documents_engagement_id (engagement_id),
  INDEX idx_documents_handover_id (handover_id),
  INDEX idx_documents_project_id (project_id),
  INDEX idx_documents_category (document_category),
  INDEX idx_documents_is_latest (is_latest),
  INDEX idx_documents_uploaded_by (uploaded_by),
  INDEX idx_documents_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;