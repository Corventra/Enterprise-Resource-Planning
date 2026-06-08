-- Migration 017 — Konsolidasi pause/resume/cancel jadi satu UC
-- "Mengelola Status Project" dengan aktor COO + PM (+ SUPERADMIN override).
--
-- Sebelum migration ini:
--   - /pause + /resume pakai PROJECT_UPDATE_PROGRESS  (PM, CONSULTANT, SUPERADMIN)
--   - /cancel pakai PROJECT_ASSIGN_PM                  (COO, SUPERADMIN)
--   - Effective: PM bisa pause/resume saja, COO bisa cancel saja
--
-- Sesudah migration ini:
--   - Permission baru PROJECT_MANAGE_STATUS dipakai ketiganya
--   - Granted ke COO + PM + SUPERADMIN
--   - Both COO dan PM bisa pause/resume/cancel
--
-- Idempotent: pakai INSERT ... ON DUPLICATE KEY UPDATE supaya aman re-run.

-- 1. Tambah permission baru
INSERT INTO permissions (code, description)
VALUES ('PROJECT_MANAGE_STATUS', 'Mengelola status project (pause/resume/cancel)')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 2. Grant ke COO
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'COO' AND p.code = 'PROJECT_MANAGE_STATUS'
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

-- 3. Grant ke PM
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'PM' AND p.code = 'PROJECT_MANAGE_STATUS'
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

-- 4. Grant ke SUPERADMIN (override)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'SUPERADMIN' AND p.code = 'PROJECT_MANAGE_STATUS'
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);
