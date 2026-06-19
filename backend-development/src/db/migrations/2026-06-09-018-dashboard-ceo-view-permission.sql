-- Migration 018 — Tambah permission DASHBOARD_CEO_VIEW
-- Background: TC-25 mendefinisikan gating Dashboard CEO sebagai permission-based,
-- bukan role-based. Migration ini menambah permission baru dan grant ke CEO + SUPERADMIN.
-- Route /api/dashboard/ceo di-update dari requireRole(['CEO','SUPERADMIN']) ke
-- requirePermission('DASHBOARD_CEO_VIEW') (di dashboard.routes.js).
--
-- Idempotent: ON DUPLICATE KEY UPDATE supaya aman re-run.

INSERT INTO permissions (code, description)
VALUES ('DASHBOARD_CEO_VIEW', 'Akses dashboard ringkasan organisasi (executive view)')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
 WHERE r.code = 'CEO' AND p.code = 'DASHBOARD_CEO_VIEW'
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
 WHERE r.code = 'SUPERADMIN' AND p.code = 'DASHBOARD_CEO_VIEW'
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);
