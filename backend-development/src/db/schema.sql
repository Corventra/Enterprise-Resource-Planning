-- =============================================================
-- Skripsi DSK Global Konsultama — Backend Schema
-- Phase 1 : roles, departments, users, user_departments, login_logs
-- Phase 3 : permissions, role_permissions
-- Phase 4a: handovers, handover_approval_trail  ← NEW
-- =============================================================
-- Catatan: dijalankan di MySQL 8.0+. Idempoten via DROP IF EXISTS
-- supaya bisa di-rerun saat development. JANGAN dipakai di prod.

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS handover_approval_trail;
DROP TABLE IF EXISTS handovers;
DROP TABLE IF EXISTS login_logs;
DROP TABLE IF EXISTS user_departments;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS roles;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------
-- roles : posisi fungsional (CEO, COO, PM, ...)
-- is_department_scoped = 1 berarti user dengan role ini WAJIB
-- punya minimal 1 entry di user_departments (validasi di app layer).
-- ---------------------------------------------------------------
CREATE TABLE roles (
  id                    INT             PRIMARY KEY AUTO_INCREMENT,
  code                  VARCHAR(32)     NOT NULL UNIQUE,
  name                  VARCHAR(128)    NOT NULL,
  is_department_scoped  BOOLEAN         NOT NULL DEFAULT 0,
  created_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- departments : service line + BD sub-unit
-- TAX, AUDIT, TP_DOC, SR, LEGAL, WEBDEV, MEO, EXECUTIVE
-- ---------------------------------------------------------------
CREATE TABLE departments (
  id          INT          PRIMARY KEY AUTO_INCREMENT,
  code        VARCHAR(32)  NOT NULL UNIQUE,
  name        VARCHAR(128) NOT NULL,
  is_active   BOOLEAN      NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- users : akun pengguna sistem
-- password_hash = bcrypt (cost 10)
-- ---------------------------------------------------------------
CREATE TABLE users (
  id              INT           PRIMARY KEY AUTO_INCREMENT,
  email           VARCHAR(190)  NOT NULL UNIQUE,
  name            VARCHAR(128)  NOT NULL,
  password_hash   VARCHAR(255)  NOT NULL,
  role_id         INT           NOT NULL,
  is_active       BOOLEAN       NOT NULL DEFAULT 1,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_users_role (role_id),
  INDEX idx_users_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- user_departments : M:N user ↔ department
-- is_primary = 1 untuk home dept (consultant)
-- ---------------------------------------------------------------
CREATE TABLE user_departments (
  user_id        INT     NOT NULL,
  department_id  INT     NOT NULL,
  is_primary     BOOLEAN NOT NULL DEFAULT 0,
  assigned_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, department_id),
  CONSTRAINT fk_ud_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_ud_dept
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_ud_dept (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- permissions : daftar permission code (mirror frontend permission-map)
-- Code dipakai sebagai source of truth — backend re-validate setiap request.
-- ---------------------------------------------------------------
CREATE TABLE permissions (
  id           INT          PRIMARY KEY AUTO_INCREMENT,
  code         VARCHAR(64)  NOT NULL UNIQUE,
  description  VARCHAR(255),
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- role_permissions : M:N role ↔ permission
-- Permissions di-grant per role. User inherit permissions via role.
-- ---------------------------------------------------------------
CREATE TABLE role_permissions (
  role_id        INT NOT NULL,
  permission_id  INT NOT NULL,
  granted_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_rp_role
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_rp_perm
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_rp_perm (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- login_logs : audit trail attempt login
-- user_id NULL kalau email tidak match user manapun
-- ---------------------------------------------------------------
CREATE TABLE login_logs (
  id           BIGINT        PRIMARY KEY AUTO_INCREMENT,
  user_id      INT           NULL,
  email_tried  VARCHAR(190)  NOT NULL,
  ip           VARCHAR(45),
  user_agent   VARCHAR(255),
  success      BOOLEAN       NOT NULL,
  at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_log_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_log_email (email_tried),
  INDEX idx_log_at (at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
