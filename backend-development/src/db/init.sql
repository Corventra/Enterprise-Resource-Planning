-- ============================================================
-- DSK Global Konsultama — ERP Auth/RBAC init script
-- Generated: 2026-05-10T19:34:31.308Z
-- Source   : scripts/seed-data.json + src/db/schema.sql
-- Pakai    : paste seluruh file ini ke phpMyAdmin → SQL tab → Run
--            (atau import sebagai SQL file)
-- ============================================================

-- =============== 1. SCHEMA ===============
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

-- =============== 2. SEED: roles ===============
INSERT INTO roles (code, name, is_department_scoped) VALUES ('CEO', 'Chief Executive Officer', 0);
INSERT INTO roles (code, name, is_department_scoped) VALUES ('COO', 'Chief Operating Officer', 1);
INSERT INTO roles (code, name, is_department_scoped) VALUES ('PM', 'Project Manager', 1);
INSERT INTO roles (code, name, is_department_scoped) VALUES ('CONSULTANT', 'Consultant', 1);
INSERT INTO roles (code, name, is_department_scoped) VALUES ('BD', 'Business Development', 1);
INSERT INTO roles (code, name, is_department_scoped) VALUES ('STAFF_ADMIN', 'Staff Admin', 0);
INSERT INTO roles (code, name, is_department_scoped) VALUES ('MEO', 'Marketing & Engagement Officer', 0);
INSERT INTO roles (code, name, is_department_scoped) VALUES ('SUPERADMIN', 'Superadmin', 0);

-- =============== 3. SEED: departments ===============
INSERT INTO departments (code, name) VALUES ('TAX', 'Tax');
INSERT INTO departments (code, name) VALUES ('AUDIT', 'Audit');
INSERT INTO departments (code, name) VALUES ('TP_DOC', 'Transfer Pricing');
INSERT INTO departments (code, name) VALUES ('SR', 'Sustainability Report');
INSERT INTO departments (code, name) VALUES ('LEGAL', 'Legal');
INSERT INTO departments (code, name) VALUES ('WEBDEV', 'Web Development');
INSERT INTO departments (code, name) VALUES ('MEO', 'Marketing & Engagement');
INSERT INTO departments (code, name) VALUES ('EXECUTIVE', 'Executive');

-- =============== 4. SEED: users (password sudah bcrypt-hashed) ===============
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('galihgumilang@dsk-global.id', 'Galih Gumilang', '$2b$10$0bpYrhYqKuT442S8NoyIOOEUHHKVl2b.ahbr9ugf5ILXpt6MQIunG', (SELECT id FROM roles WHERE code = 'CEO'), 1);
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('suparnawijaya@dsk-global.id', 'Suparna Wijaya', '$2b$10$ARCy5n.FnAvZSji45IC4fuAXYTrjym3zunUetZ1iMKAfyaTwqXHYu', (SELECT id FROM roles WHERE code = 'COO'), 1);
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('ferry.irawan@dsk-global.id', 'Ferry Irawan', '$2b$10$t0mFH4U7vmsaE8DihNXDl.W3C9tlCKk5PWRwmfjo2rtb2U/RqA6yy', (SELECT id FROM roles WHERE code = 'COO'), 1);
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('amrie.firmansyah@dsk-global.id', 'Amrie Firmansyah', '$2b$10$1jgQzxKfdMrmoEUvEzsbaueHMOflCWC092rVOAYnG5EOpItwOImpu', (SELECT id FROM roles WHERE code = 'COO'), 1);
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('girang.adipura@dsk-global.id', 'Ahmad Girang Adipura', '$2b$10$l5hXhTIkE1F8NzbEhFHYhuTwDYd7039EIo4kgpBPAH1fBNrK.SZTa', (SELECT id FROM roles WHERE code = 'PM'), 1);
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('panji.ega@dsk-global.id', 'Panji Ega Saputra', '$2b$10$DpUP/X/iHF/R7L5Lr/4/3uYjPB.aoofid.pF0FQPxeUGxrXvYUeaq', (SELECT id FROM roles WHERE code = 'PM'), 1);
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('fadilla.arfikriyana@dsk-global.id', 'Fadilla Arfikriyana', '$2b$10$6iPDynGqaH/pi7qGpdG8a.lGLADZ0SmcmBPxoLEoNsxGIWqJ78EjK', (SELECT id FROM roles WHERE code = 'PM'), 1);
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('revy.oktafiano@dsk-global.id', 'Muhammad Revy Oktafiano', '$2b$10$XcvK3jdTtQwPfKpRqVUdKuzrOUaWYtHtnQ3KitCy4vqcYkyWt8JlW', (SELECT id FROM roles WHERE code = 'CONSULTANT'), 1);
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('sausan.qunayta@dsk-global.id', 'Sausan Zhafir Qunayta', '$2b$10$n2Txxo.QJYtIWG2e1gtOZ.XTjHb6xqfwxBJPyFed3jp/CnFRhdfMC', (SELECT id FROM roles WHERE code = 'CONSULTANT'), 1);
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('hanin.febriana@dsk-global.id', 'Hanin Febriana', '$2b$10$YOul3YwdO4YJxZo/g3KE.uNi6lk3Q9cS8oL1mWOLbpqHZdF/1wLGq', (SELECT id FROM roles WHERE code = 'CONSULTANT'), 1);
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('matthew.rafael@dsk-global.id', 'Matthew Rafael Rajagukguk', '$2b$10$2YOveNp5/mTS6cuavs95LOmSaVkUTmi6IHZ4Z.NUxZ3o8kE/grBMm', (SELECT id FROM roles WHERE code = 'CONSULTANT'), 1);
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('silvania.annisa@dsk-global.id', 'Silvania Annisa', '$2b$10$XtAega8Ea9IaGtH4R.gurOi7g0FHC9OHek7e3.ud.hcLKrpI9lMh.', (SELECT id FROM roles WHERE code = 'CONSULTANT'), 1);
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('adam.satria@dsk-global.id', 'Adam Muhammad Satria', '$2b$10$fazOWlER7/qMWPcYBeCEBuEEzwvLheSopZafxYxiwmQSGti463jqa', (SELECT id FROM roles WHERE code = 'CONSULTANT'), 1);
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('balqis.yessa@dsk-global.id', 'Balqis Yessa Nurlanda', '$2b$10$eIU8Mh8OaZA7CEe/N.eWR.KWfthVdoWYufInV0jOou9MufFAvOiAC', (SELECT id FROM roles WHERE code = 'CONSULTANT'), 1);
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('safira.maulidia@dsk-global.id', 'Safira Maulidia Alami', '$2b$10$0R4zeSVZ11P/A9SEwZNxPO7IftF3EgaAiMpP4FYI5xdeRHjxrABYK', (SELECT id FROM roles WHERE code = 'CONSULTANT'), 1);
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('indah.tri@dsk-global.id', 'Indah Tri Resticendani', '$2b$10$aSKOlXkSV8CaxZ4HmA4b2.eTm/IqMTpPlxaisGHe3kmhqdNA3ruoK', (SELECT id FROM roles WHERE code = 'CONSULTANT'), 1);
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('kinanti.puput@dsk-global.id', 'Kinanti Puput Septiana', '$2b$10$Gf/T9dA8Vu8Ixla13TieDuFjHPC6GnPM59Ci4p2OMuU9RtM6A7QCC', (SELECT id FROM roles WHERE code = 'CONSULTANT'), 1);
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('tata.adela@dsk-global.id', 'Tata Adela Juniawaty', '$2b$10$hjremQsuI3O52c0RELh8J.Sb1BywiuoakXMziRGGJ51F1sh4bFAW.', (SELECT id FROM roles WHERE code = 'CONSULTANT'), 1);
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('ahmad.zaky@dsk-global.id', 'Ahmad Zaky Taqiyuddin', '$2b$10$W0.14L6vIT85NRusf.7zIeBNsqQLRybqtnYLrLXrhAj5HEmk9Y4wy', (SELECT id FROM roles WHERE code = 'CONSULTANT'), 1);
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('bd.meo@dsk-global.id', 'BD MEO', '$2b$10$wJE1vQWuLNmCqQ19fpfO3O4R5ldlE/THdD/2deCWhD8SHkMMl0jzC', (SELECT id FROM roles WHERE code = 'BD'), 1);
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('bd.executive@dsk-global.id', 'BD Executive', '$2b$10$oH4kRwkE2YukJaUpMgaydO9R7k1dUGy5QULjhZMOmsPfi5Pf4uWBK', (SELECT id FROM roles WHERE code = 'BD'), 1);
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('muhamad.faried@dsk-global.id', 'Muhamad Faried', '$2b$10$gz3HGxT79GLGAMSMXTKIFOGnKL8I4yN4b47.rw/s4lqMTuAwN1PrS', (SELECT id FROM roles WHERE code = 'SUPERADMIN'), 1);
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('izhhar.farhan@dsk-global.id', 'Muhammad Izhhar Farhan', '$2b$10$A.qhHrPFiODKZ3vc1O8zAekVZfSU/fsDUydBr5h3jcARgnMCsgQXO', (SELECT id FROM roles WHERE code = 'SUPERADMIN'), 1);
INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES ('dyah.sumarwanti@dsk-global.id', 'Dyah Sumarwanti', '$2b$10$R9UaMDhwj83pv5VezH97Re0OnEQq93W5fs97ROxW1Bjx3sucGnRZu', (SELECT id FROM roles WHERE code = 'STAFF_ADMIN'), 1);

-- =============== 5. SEED: user_departments ===============
INSERT INTO user_departments (user_id, department_id, is_primary) VALUES ((SELECT id FROM users WHERE email = 'suparnawijaya@dsk-global.id'), (SELECT id FROM departments WHERE code = 'TAX'), 1);
INSERT INTO user_departments (user_id, department_id, is_primary) VALUES ((SELECT id FROM users WHERE email = 'suparnawijaya@dsk-global.id'), (SELECT id FROM departments WHERE code = 'AUDIT'), 0);
INSERT INTO user_departments (user_id, department_id, is_primary) VALUES ((SELECT id FROM users WHERE email = 'ferry.irawan@dsk-global.id'), (SELECT id FROM departments WHERE code = 'TP_DOC'), 1);
INSERT INTO user_departments (user_id, department_id, is_primary) VALUES ((SELECT id FROM users WHERE email = 'ferry.irawan@dsk-global.id'), (SELECT id FROM departments WHERE code = 'LEGAL'), 0);
INSERT INTO user_departments (user_id, department_id, is_primary) VALUES ((SELECT id FROM users WHERE email = 'amrie.firmansyah@dsk-global.id'), (SELECT id FROM departments WHERE code = 'SR'), 1);
INSERT INTO user_departments (user_id, department_id, is_primary) VALUES ((SELECT id FROM users WHERE email = 'girang.adipura@dsk-global.id'), (SELECT id FROM departments WHERE code = 'TP_DOC'), 1);
INSERT INTO user_departments (user_id, department_id, is_primary) VALUES ((SELECT id FROM users WHERE email = 'panji.ega@dsk-global.id'), (SELECT id FROM departments WHERE code = 'TP_DOC'), 1);
INSERT INTO user_departments (user_id, department_id, is_primary) VALUES ((SELECT id FROM users WHERE email = 'fadilla.arfikriyana@dsk-global.id'), (SELECT id FROM departments WHERE code = 'TP_DOC'), 1);
INSERT INTO user_departments (user_id, department_id, is_primary) VALUES ((SELECT id FROM users WHERE email = 'revy.oktafiano@dsk-global.id'), (SELECT id FROM departments WHERE code = 'TP_DOC'), 1);
INSERT INTO user_departments (user_id, department_id, is_primary) VALUES ((SELECT id FROM users WHERE email = 'sausan.qunayta@dsk-global.id'), (SELECT id FROM departments WHERE code = 'TP_DOC'), 1);
INSERT INTO user_departments (user_id, department_id, is_primary) VALUES ((SELECT id FROM users WHERE email = 'hanin.febriana@dsk-global.id'), (SELECT id FROM departments WHERE code = 'TP_DOC'), 1);
INSERT INTO user_departments (user_id, department_id, is_primary) VALUES ((SELECT id FROM users WHERE email = 'matthew.rafael@dsk-global.id'), (SELECT id FROM departments WHERE code = 'TP_DOC'), 1);
INSERT INTO user_departments (user_id, department_id, is_primary) VALUES ((SELECT id FROM users WHERE email = 'silvania.annisa@dsk-global.id'), (SELECT id FROM departments WHERE code = 'TP_DOC'), 1);
INSERT INTO user_departments (user_id, department_id, is_primary) VALUES ((SELECT id FROM users WHERE email = 'adam.satria@dsk-global.id'), (SELECT id FROM departments WHERE code = 'AUDIT'), 1);
INSERT INTO user_departments (user_id, department_id, is_primary) VALUES ((SELECT id FROM users WHERE email = 'balqis.yessa@dsk-global.id'), (SELECT id FROM departments WHERE code = 'AUDIT'), 1);
INSERT INTO user_departments (user_id, department_id, is_primary) VALUES ((SELECT id FROM users WHERE email = 'safira.maulidia@dsk-global.id'), (SELECT id FROM departments WHERE code = 'AUDIT'), 1);
INSERT INTO user_departments (user_id, department_id, is_primary) VALUES ((SELECT id FROM users WHERE email = 'indah.tri@dsk-global.id'), (SELECT id FROM departments WHERE code = 'TAX'), 1);
INSERT INTO user_departments (user_id, department_id, is_primary) VALUES ((SELECT id FROM users WHERE email = 'kinanti.puput@dsk-global.id'), (SELECT id FROM departments WHERE code = 'LEGAL'), 1);
INSERT INTO user_departments (user_id, department_id, is_primary) VALUES ((SELECT id FROM users WHERE email = 'tata.adela@dsk-global.id'), (SELECT id FROM departments WHERE code = 'LEGAL'), 1);
INSERT INTO user_departments (user_id, department_id, is_primary) VALUES ((SELECT id FROM users WHERE email = 'ahmad.zaky@dsk-global.id'), (SELECT id FROM departments WHERE code = 'LEGAL'), 1);
INSERT INTO user_departments (user_id, department_id, is_primary) VALUES ((SELECT id FROM users WHERE email = 'bd.meo@dsk-global.id'), (SELECT id FROM departments WHERE code = 'MEO'), 1);
INSERT INTO user_departments (user_id, department_id, is_primary) VALUES ((SELECT id FROM users WHERE email = 'bd.executive@dsk-global.id'), (SELECT id FROM departments WHERE code = 'EXECUTIVE'), 1);

-- =============== 6. SEED: permissions ===============
INSERT INTO permissions (code, description) VALUES ('BANK_DATA_VIEW', 'Lihat Bank Data');
INSERT INTO permissions (code, description) VALUES ('BANK_DATA_PROCESS', 'Proses Bank Data jadi Lead');
INSERT INTO permissions (code, description) VALUES ('CAMPAIGN_MANAGE', 'Kelola campaign marketing');
INSERT INTO permissions (code, description) VALUES ('FORM_MANAGE', 'Kelola form builder');
INSERT INTO permissions (code, description) VALUES ('LEAD_VIEW', 'Lihat lead detail');
INSERT INTO permissions (code, description) VALUES ('LEAD_TRACKER_VIEW', 'Lihat lead pipeline');
INSERT INTO permissions (code, description) VALUES ('LEAD_MANAGE', 'Edit lead workspace (meeting, proposal, EL)');
INSERT INTO permissions (code, description) VALUES ('PROPOSAL_APPROVE', 'Approve proposal (CEO)');
INSERT INTO permissions (code, description) VALUES ('ENGAGEMENT_LETTER_APPROVE', 'Approve engagement letter (CEO)');
INSERT INTO permissions (code, description) VALUES ('HANDOVER_APPROVE', 'Approve handover memo (CEO)');
INSERT INTO permissions (code, description) VALUES ('HANDOVER_MANAGE', 'Submit/edit handover memo');
INSERT INTO permissions (code, description) VALUES ('PROJECT_VIEW', 'Lihat project (tanpa harga)');
INSERT INTO permissions (code, description) VALUES ('PROJECT_VIEW_FINANCIALS', 'Lihat data finansial project');
INSERT INTO permissions (code, description) VALUES ('PROJECT_ASSIGN_PM', 'Assign PM ke project (COO action)');
INSERT INTO permissions (code, description) VALUES ('PROJECT_ASSIGN_CONSULTANT', 'Assign Consultant ke project (PM action)');
INSERT INTO permissions (code, description) VALUES ('PROJECT_UPDATE_PROGRESS', 'Update milestone status & progres');
INSERT INTO permissions (code, description) VALUES ('DOCUMENT_VIEW', 'Akses Document Center');
INSERT INTO permissions (code, description) VALUES ('INVOICE_MANAGE', 'Kelola invoice klien');
INSERT INTO permissions (code, description) VALUES ('KPI_VIEW_OWN', 'Lihat KPI sendiri');
INSERT INTO permissions (code, description) VALUES ('KPI_VIEW_TEAM', 'Lihat KPI tim (PM)');
INSERT INTO permissions (code, description) VALUES ('KPI_VIEW_ALL', 'Lihat KPI semua consultant');
INSERT INTO permissions (code, description) VALUES ('KPI_RATE_TASK', 'Beri rating quality task (PM)');
INSERT INTO permissions (code, description) VALUES ('KPI_CONFIGURE', 'Configure bobot dimensi & threshold KPI');
INSERT INTO permissions (code, description) VALUES ('KPI_FINALIZE_PERIOD', 'Finalize period KPI (lock snapshot)');
INSERT INTO permissions (code, description) VALUES ('KPI_RECOMPUTE', 'Manual recompute KPI (audit-logged)');
INSERT INTO permissions (code, description) VALUES ('KPI_EXPORT', 'Export laporan KPI (CSV/PDF)');
INSERT INTO permissions (code, description) VALUES ('TASK_TEMPLATE_MANAGE', 'Kelola task template per service line');
INSERT INTO permissions (code, description) VALUES ('USER_MANAGE', 'CRUD akun pengguna sistem');
INSERT INTO permissions (code, description) VALUES ('SYSTEM_CONFIG', 'Konfigurasi sistem (org, session, audit)');
INSERT INTO permissions (code, description) VALUES ('DEPARTMENT_MANAGE', 'CRUD service line / department');

-- =============== 7. SEED: role_permissions ===============
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'MEO'), (SELECT id FROM permissions WHERE code = 'BANK_DATA_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'MEO'), (SELECT id FROM permissions WHERE code = 'CAMPAIGN_MANAGE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'MEO'), (SELECT id FROM permissions WHERE code = 'FORM_MANAGE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'MEO'), (SELECT id FROM permissions WHERE code = 'LEAD_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'BD'), (SELECT id FROM permissions WHERE code = 'BANK_DATA_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'BD'), (SELECT id FROM permissions WHERE code = 'BANK_DATA_PROCESS'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'BD'), (SELECT id FROM permissions WHERE code = 'LEAD_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'BD'), (SELECT id FROM permissions WHERE code = 'LEAD_TRACKER_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'BD'), (SELECT id FROM permissions WHERE code = 'LEAD_MANAGE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'BD'), (SELECT id FROM permissions WHERE code = 'HANDOVER_MANAGE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'BD'), (SELECT id FROM permissions WHERE code = 'DOCUMENT_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'CEO'), (SELECT id FROM permissions WHERE code = 'BANK_DATA_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'CEO'), (SELECT id FROM permissions WHERE code = 'LEAD_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'CEO'), (SELECT id FROM permissions WHERE code = 'LEAD_TRACKER_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'CEO'), (SELECT id FROM permissions WHERE code = 'PROPOSAL_APPROVE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'CEO'), (SELECT id FROM permissions WHERE code = 'ENGAGEMENT_LETTER_APPROVE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'CEO'), (SELECT id FROM permissions WHERE code = 'HANDOVER_APPROVE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'CEO'), (SELECT id FROM permissions WHERE code = 'PROJECT_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'CEO'), (SELECT id FROM permissions WHERE code = 'PROJECT_VIEW_FINANCIALS'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'CEO'), (SELECT id FROM permissions WHERE code = 'DOCUMENT_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'CEO'), (SELECT id FROM permissions WHERE code = 'KPI_VIEW_OWN'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'CEO'), (SELECT id FROM permissions WHERE code = 'KPI_VIEW_ALL'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'CEO'), (SELECT id FROM permissions WHERE code = 'KPI_FINALIZE_PERIOD'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'CEO'), (SELECT id FROM permissions WHERE code = 'KPI_CONFIGURE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'CEO'), (SELECT id FROM permissions WHERE code = 'KPI_RECOMPUTE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'CEO'), (SELECT id FROM permissions WHERE code = 'KPI_EXPORT'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'CEO'), (SELECT id FROM permissions WHERE code = 'TASK_TEMPLATE_MANAGE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'COO'), (SELECT id FROM permissions WHERE code = 'LEAD_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'COO'), (SELECT id FROM permissions WHERE code = 'LEAD_TRACKER_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'COO'), (SELECT id FROM permissions WHERE code = 'HANDOVER_MANAGE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'COO'), (SELECT id FROM permissions WHERE code = 'PROJECT_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'COO'), (SELECT id FROM permissions WHERE code = 'PROJECT_VIEW_FINANCIALS'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'COO'), (SELECT id FROM permissions WHERE code = 'PROJECT_ASSIGN_PM'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'COO'), (SELECT id FROM permissions WHERE code = 'DOCUMENT_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'COO'), (SELECT id FROM permissions WHERE code = 'KPI_VIEW_OWN'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'COO'), (SELECT id FROM permissions WHERE code = 'KPI_VIEW_ALL'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'COO'), (SELECT id FROM permissions WHERE code = 'KPI_RECOMPUTE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'COO'), (SELECT id FROM permissions WHERE code = 'TASK_TEMPLATE_MANAGE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'PM'), (SELECT id FROM permissions WHERE code = 'PROJECT_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'PM'), (SELECT id FROM permissions WHERE code = 'PROJECT_ASSIGN_CONSULTANT'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'PM'), (SELECT id FROM permissions WHERE code = 'PROJECT_UPDATE_PROGRESS'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'PM'), (SELECT id FROM permissions WHERE code = 'DOCUMENT_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'PM'), (SELECT id FROM permissions WHERE code = 'KPI_VIEW_OWN'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'PM'), (SELECT id FROM permissions WHERE code = 'KPI_VIEW_TEAM'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'PM'), (SELECT id FROM permissions WHERE code = 'KPI_RATE_TASK'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'CONSULTANT'), (SELECT id FROM permissions WHERE code = 'PROJECT_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'CONSULTANT'), (SELECT id FROM permissions WHERE code = 'PROJECT_UPDATE_PROGRESS'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'CONSULTANT'), (SELECT id FROM permissions WHERE code = 'DOCUMENT_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'CONSULTANT'), (SELECT id FROM permissions WHERE code = 'KPI_VIEW_OWN'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'STAFF_ADMIN'), (SELECT id FROM permissions WHERE code = 'DOCUMENT_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'STAFF_ADMIN'), (SELECT id FROM permissions WHERE code = 'INVOICE_MANAGE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'BANK_DATA_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'BANK_DATA_PROCESS'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'CAMPAIGN_MANAGE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'FORM_MANAGE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'LEAD_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'LEAD_TRACKER_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'LEAD_MANAGE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'PROPOSAL_APPROVE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'ENGAGEMENT_LETTER_APPROVE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'HANDOVER_APPROVE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'HANDOVER_MANAGE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'PROJECT_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'PROJECT_VIEW_FINANCIALS'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'PROJECT_ASSIGN_PM'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'PROJECT_ASSIGN_CONSULTANT'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'PROJECT_UPDATE_PROGRESS'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'DOCUMENT_VIEW'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'INVOICE_MANAGE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'KPI_VIEW_OWN'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'KPI_VIEW_TEAM'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'KPI_VIEW_ALL'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'KPI_RATE_TASK'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'KPI_CONFIGURE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'KPI_FINALIZE_PERIOD'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'KPI_RECOMPUTE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'KPI_EXPORT'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'TASK_TEMPLATE_MANAGE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'USER_MANAGE'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'SYSTEM_CONFIG'));
INSERT INTO role_permissions (role_id, permission_id) VALUES ((SELECT id FROM roles WHERE code = 'SUPERADMIN'), (SELECT id FROM permissions WHERE code = 'DEPARTMENT_MANAGE'));

-- =============== Done ===============
