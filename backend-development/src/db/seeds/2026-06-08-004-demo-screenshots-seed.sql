-- =============================================================================
-- DEMO SEED untuk 5 Screenshot Skripsi Faried (Sub-bab 4.3.5)
-- =============================================================================
-- Target: populate DB supaya 5 halaman ini punya data realistis untuk screenshot:
--   1. Project Detail Page         (/projects/:id/overview)
--   2. Dashboard CEO               (/dashboard/ceo)
--   3. KPI Snapshot per Consultant (/kpi/consultant/:id)
--   4. KPI Configuration           (default seed migration 013 — sudah ada)
--   5. Task Templates Management   (default seed migration 014 — sudah ada)
--
-- IDEMPOTENT: pakai INSERT ... ON DUPLICATE KEY UPDATE + INSERT IGNORE +
-- lookup via marker code/email — safe di-run berulang.
--
-- PREREQUISITE:
--   - init.sql + migrations 001..017 sudah di-apply
--   - Default user seed (Galih CEO, Ferry COO, Girang PM, Sausan/Hanin CONSULTANT) sudah ada
--   - Default kpi_period_config (config_id=1) sudah ada
--   - Default task_templates (4 service line) sudah ada
--
-- CARA RUN:
--   mysql -h nc136.idcloudhosting.cloud -u dskgloba_admin -p dskgloba_newerp \
--     < backend-development/src/db/seeds/2026-06-08-004-demo-screenshots-seed.sql
--
-- ROLLBACK (kalau ada masalah, jalankan section paling bawah):
--   Lihat -- SECTION ROLLBACK di bagian akhir file (uncomment baris DELETE).
-- =============================================================================

SET @demo_marker = 'DEMO-SKRIPSI-FARIED';

-- -----------------------------------------------------------------------------
-- STEP 1: Lookup existing users → simpan ke session variables
-- -----------------------------------------------------------------------------

SELECT id INTO @ceo_id      FROM users WHERE email = 'galihgumilang@dsk-global.id'    LIMIT 1;
SELECT id INTO @coo_id      FROM users WHERE email = 'ferry.irawan@dsk-global.id'     LIMIT 1;
SELECT id INTO @pm_id       FROM users WHERE email = 'girang.adipura@dsk-global.id'   LIMIT 1;
SELECT id INTO @cons1_id    FROM users WHERE email = 'sausan.qunayta@dsk-global.id'   LIMIT 1;
SELECT id INTO @cons2_id    FROM users WHERE email = 'hanin.febriana@dsk-global.id'   LIMIT 1;
SELECT id INTO @cons3_id    FROM users WHERE email = 'matthew.rafael@dsk-global.id'   LIMIT 1;
SELECT id INTO @bd_id       FROM users WHERE email = 'bd.executive@dsk-global.id'     LIMIT 1;

SELECT name INTO @ceo_name      FROM users WHERE id = @ceo_id;
SELECT name INTO @coo_name      FROM users WHERE id = @coo_id;
SELECT name INTO @pm_name       FROM users WHERE id = @pm_id;
SELECT name INTO @cons1_name    FROM users WHERE id = @cons1_id;
SELECT name INTO @cons2_name    FROM users WHERE id = @cons2_id;
SELECT name INTO @cons3_name    FROM users WHERE id = @cons3_id;

-- Lookup service + department
SELECT service_id INTO @service_tp_id FROM services
  WHERE name LIKE '%Transfer Pricing%' OR code LIKE 'TP%' LIMIT 1;
SELECT service_id INTO @service_audit_id FROM services
  WHERE name LIKE '%Audit%' OR code LIKE 'AUDIT%' LIMIT 1;
SELECT id INTO @dept_tpdoc_id FROM departments WHERE code = 'TP_DOC' LIMIT 1;
SELECT id INTO @dept_audit_id FROM departments WHERE code = 'AUDIT' LIMIT 1;

-- Lookup default KPI config
SELECT MAX(config_id) INTO @config_id FROM kpi_period_config;

-- Safety: kalau salah satu prerequisite NULL, hentikan dengan error
-- (MySQL tidak punya RAISE EXCEPTION, jadi pakai trick INSERT ke tabel non-existent)
-- Comment dulu kalau tidak butuh strict check.
-- INSERT INTO _seed_error_if_user_missing SELECT 1 WHERE @ceo_id IS NULL OR @pm_id IS NULL;


-- =============================================================================
-- PROJECT #1: PT Demo Skripsi TP (In Progress — SHOWCASE untuk Screenshot 1)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1.1 Lead
-- -----------------------------------------------------------------------------
INSERT INTO leads
  (source_type, company_name, company_address, pic_name, email, phone_number,
   desired_services, bank_data_status, lead_status, current_stage,
   processed_by, processed_at, created_at)
SELECT 'MANUAL', 'PT Demo Skripsi TP', 'Jl. Demo Thesis No. 1, Jakarta Selatan',
       'Bpk. Demo PIC', 'pic.demotp@example.com', '+628123456001',
       'Transfer Pricing Documentation untuk FY 2025',
       'PROCESSED', 'WON', 'ENGAGEMENT_LETTER',
       @bd_id, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM leads WHERE company_name = 'PT Demo Skripsi TP');

SELECT lead_id INTO @lead1_id FROM leads WHERE company_name = 'PT Demo Skripsi TP' LIMIT 1;

-- -----------------------------------------------------------------------------
-- 1.2 Proposal
-- -----------------------------------------------------------------------------
INSERT INTO proposals
  (lead_id, service_id, issuer_company, is_sub_contract,
   proposal_fee, discount_amount, status, approved_by, approved_at,
   sent_to_client_at, client_responded_at, submitted_by, submitted_at,
   created_by, created_at)
SELECT @lead1_id, @service_tp_id, 'DSK', 0,
       250000000.00, 0.00, 'APPROVED', @ceo_id, '2026-03-10 09:00:00',
       '2026-03-11 09:00:00', '2026-03-15 09:00:00', @bd_id, '2026-03-09 09:00:00',
       @bd_id, '2026-03-09 09:00:00'
WHERE NOT EXISTS (SELECT 1 FROM proposals WHERE lead_id = @lead1_id);

SELECT proposal_id INTO @proposal1_id FROM proposals WHERE lead_id = @lead1_id LIMIT 1;

-- -----------------------------------------------------------------------------
-- 1.3 Engagement Letter (TERMIN payment)
-- -----------------------------------------------------------------------------
INSERT INTO engagement_letters
  (lead_id, proposal_id, issuer_company, agreed_fee, payment_method,
   status, approved_by, approved_at, signed_at, submitted_by, submitted_at,
   created_by, created_at)
SELECT @lead1_id, @proposal1_id, 'DSK', 250000000.00, 'TERMIN',
       'APPROVED', @ceo_id, '2026-03-18 09:00:00', '2026-03-20 14:00:00',
       @bd_id, '2026-03-17 09:00:00', @bd_id, '2026-03-17 09:00:00'
WHERE NOT EXISTS (SELECT 1 FROM engagement_letters WHERE proposal_id = @proposal1_id);

SELECT engagement_id INTO @engagement1_id FROM engagement_letters
  WHERE proposal_id = @proposal1_id LIMIT 1;

-- -----------------------------------------------------------------------------
-- 1.4 Handover (status = ASSIGNED_TO_PM, dp_payment_status = PAID)
-- -----------------------------------------------------------------------------
INSERT INTO handovers
  (lead_id, proposal_id, engagement_id, service_id, department_id,
   handover_code, project_title, company_group,
   project_start_date, project_end_date,
   background_summary, status,
   routed_coo_id, submitted_by, submitted_at, approved_by, approved_at,
   dp_payment_status, dp_paid_at, created_by, created_at)
SELECT @lead1_id, @proposal1_id, @engagement1_id, @service_tp_id, @dept_tpdoc_id,
       'HO-DEMO-001', 'TP Documentation FY2025 - PT Demo Skripsi TP', 'Demo Group',
       '2026-04-01', '2026-09-30',
       'Klien membutuhkan TP Documentation komprehensif untuk FY 2025 dengan analisis benchmarking dan local file.',
       'ASSIGNED_TO_PM',
       @coo_id, @bd_id, '2026-03-22 09:00:00', @ceo_id, '2026-03-24 10:00:00',
       'PAID', '2026-03-28 14:00:00', @bd_id, '2026-03-22 09:00:00'
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  dp_payment_status = VALUES(dp_payment_status),
  dp_paid_at = VALUES(dp_paid_at);

SELECT handover_id INTO @handover1_id FROM handovers WHERE handover_code = 'HO-DEMO-001' LIMIT 1;

-- -----------------------------------------------------------------------------
-- 1.5 Project (status = In Progress)
-- -----------------------------------------------------------------------------
INSERT INTO projects
  (project_code, handover_id, client, project_name, service_line, status,
   pm_user_id, pm_name_snapshot, start_date, end_date, created_by, created_at)
SELECT 'PRJ-DEMO-001', @handover1_id, 'PT Demo Skripsi TP',
       'TP Documentation FY2025', 'Transfer Pricing', 'In Progress',
       @pm_id, @pm_name, '2026-04-01', '2026-09-30', @coo_id, '2026-04-01 09:00:00'
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  pm_user_id = VALUES(pm_user_id);

SELECT project_id INTO @project1_id FROM projects WHERE project_code = 'PRJ-DEMO-001' LIMIT 1;

-- -----------------------------------------------------------------------------
-- 1.6 Project Consultants — 2 consultants assigned
-- -----------------------------------------------------------------------------
INSERT INTO project_consultants
  (project_id, consultant_user_id, consultant_name_snapshot, level, assigned_at, assigned_by)
VALUES
  (@project1_id, @cons1_id, @cons1_name, 'Lead',   '2026-04-02 10:00:00', @pm_id),
  (@project1_id, @cons2_id, @cons2_name, 'Senior', '2026-04-02 10:00:00', @pm_id)
ON DUPLICATE KEY UPDATE level = VALUES(level);

-- -----------------------------------------------------------------------------
-- 1.7 Milestones — 5 milestone mixed status untuk demo state machine
-- -----------------------------------------------------------------------------
-- Idempotent trick: delete-then-insert kalau project_id+title combo sama.
-- Tapi karena project_milestones tidak punya unique constraint, kita pakai
-- NOT EXISTS check per row.

INSERT INTO project_milestones
  (project_id, title, notes, target_date, status, owner_user_id, owner_name_snapshot,
   weight, phase, sequence_no, completed_at, quality_rating, revision_count, created_at)
SELECT @project1_id, 'Kickoff & Document Request',
       'Meeting kickoff dengan klien + request dokumen FY 2025 (FS, ledger, intercompany agreement).',
       '2026-04-10', 'Done', @cons1_id, @cons1_name,
       10, 'Initiation', 1, '2026-04-09 16:30:00', 5, 0, '2026-04-01 10:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM project_milestones WHERE project_id = @project1_id AND title = 'Kickoff & Document Request'
);

INSERT INTO project_milestones
  (project_id, title, notes, target_date, status, owner_user_id, owner_name_snapshot,
   weight, phase, sequence_no, completed_at, quality_rating, revision_count, created_at)
SELECT @project1_id, 'Functional Analysis & Industry Review',
       'Analisis fungsi-aset-risiko + industry benchmarking awal.',
       '2026-05-05', 'Done', @cons1_id, @cons1_name,
       20, 'Analysis', 2, '2026-05-04 17:00:00', 4, 1, '2026-04-15 09:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM project_milestones WHERE project_id = @project1_id AND title = 'Functional Analysis & Industry Review'
);

INSERT INTO project_milestones
  (project_id, title, notes, target_date, status, owner_user_id, owner_name_snapshot,
   weight, phase, sequence_no, completed_at, quality_rating, revision_count, created_at)
SELECT @project1_id, 'Comparable Search & Benchmarking',
       'Database search (OneSource/RoyaltyStat) + computation arm''s length range.',
       '2026-06-20', 'In Progress', @cons2_id, @cons2_name,
       30, 'Core Work', 3, NULL, NULL, NULL, '2026-05-10 09:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM project_milestones WHERE project_id = @project1_id AND title = 'Comparable Search & Benchmarking'
);

INSERT INTO project_milestones
  (project_id, title, notes, target_date, status, owner_user_id, owner_name_snapshot,
   weight, phase, sequence_no, completed_at, quality_rating, revision_count, created_at)
SELECT @project1_id, 'Draft Local File Report',
       'Drafting Local File + Master File reference.',
       '2026-08-15', 'Pending', @cons2_id, @cons2_name,
       25, 'Core Work', 4, NULL, NULL, NULL, '2026-05-10 09:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM project_milestones WHERE project_id = @project1_id AND title = 'Draft Local File Report'
);

INSERT INTO project_milestones
  (project_id, title, notes, target_date, status, owner_user_id, owner_name_snapshot,
   weight, phase, sequence_no, completed_at, quality_rating, revision_count, created_at)
SELECT @project1_id, 'QC Review & Client Discussion',
       'Internal QC + meeting pembahasan dengan klien (BLOCKED — menunggu konfirmasi klien soal scope adjustment).',
       '2026-09-10', 'Blocked', @cons1_id, @cons1_name,
       15, 'QC', 5, NULL, NULL, NULL, '2026-05-10 09:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM project_milestones WHERE project_id = @project1_id AND title = 'QC Review & Client Discussion'
);

-- -----------------------------------------------------------------------------
-- 1.8 Milestone Updates (audit trail untuk Timeline tab)
-- -----------------------------------------------------------------------------
-- Pakai marker: hanya insert kalau belum ada update untuk milestone+from+to combo

-- Milestone 1: Pending → In Progress → Done
SELECT milestone_id INTO @ms1_id FROM project_milestones
  WHERE project_id = @project1_id AND title = 'Kickoff & Document Request' LIMIT 1;
INSERT INTO project_milestone_updates
  (milestone_id, by_user_id, by_name_snapshot, from_status, to_status, note, at)
SELECT @ms1_id, @cons1_id, @cons1_name, 'Pending', 'In Progress',
       'Memulai kickoff meeting dengan klien.', '2026-04-02 10:30:00'
WHERE NOT EXISTS (
  SELECT 1 FROM project_milestone_updates
  WHERE milestone_id = @ms1_id AND from_status = 'Pending' AND to_status = 'In Progress'
);
INSERT INTO project_milestone_updates
  (milestone_id, by_user_id, by_name_snapshot, from_status, to_status, note, at)
SELECT @ms1_id, @cons1_id, @cons1_name, 'In Progress', 'Done',
       'Dokumen lengkap diterima dari klien.', '2026-04-09 16:30:00'
WHERE NOT EXISTS (
  SELECT 1 FROM project_milestone_updates
  WHERE milestone_id = @ms1_id AND from_status = 'In Progress' AND to_status = 'Done'
);

-- Milestone 2: Pending → In Progress → Done (dengan 1 revisi)
SELECT milestone_id INTO @ms2_id FROM project_milestones
  WHERE project_id = @project1_id AND title = 'Functional Analysis & Industry Review' LIMIT 1;
INSERT INTO project_milestone_updates
  (milestone_id, by_user_id, by_name_snapshot, from_status, to_status, note, at)
SELECT @ms2_id, @cons1_id, @cons1_name, 'Pending', 'In Progress',
       'Mulai analisis FAR dan industry research.', '2026-04-15 09:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM project_milestone_updates
  WHERE milestone_id = @ms2_id AND from_status = 'Pending' AND to_status = 'In Progress'
);
INSERT INTO project_milestone_updates
  (milestone_id, by_user_id, by_name_snapshot, from_status, to_status, note, at)
SELECT @ms2_id, @cons1_id, @cons1_name, 'In Progress', 'Done',
       'Selesai draft FAR + industry overview, revisi minor dari PM.', '2026-05-04 17:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM project_milestone_updates
  WHERE milestone_id = @ms2_id AND from_status = 'In Progress' AND to_status = 'Done'
);

-- Milestone 3: Pending → In Progress
SELECT milestone_id INTO @ms3_id FROM project_milestones
  WHERE project_id = @project1_id AND title = 'Comparable Search & Benchmarking' LIMIT 1;
INSERT INTO project_milestone_updates
  (milestone_id, by_user_id, by_name_snapshot, from_status, to_status, note, at)
SELECT @ms3_id, @cons2_id, @cons2_name, 'Pending', 'In Progress',
       'Mulai database search untuk comparable companies.', '2026-05-10 09:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM project_milestone_updates
  WHERE milestone_id = @ms3_id AND from_status = 'Pending' AND to_status = 'In Progress'
);

-- Milestone 5: Pending → Blocked
SELECT milestone_id INTO @ms5_id FROM project_milestones
  WHERE project_id = @project1_id AND title = 'QC Review & Client Discussion' LIMIT 1;
INSERT INTO project_milestone_updates
  (milestone_id, by_user_id, by_name_snapshot, from_status, to_status, note, at)
SELECT @ms5_id, @cons1_id, @cons1_name, 'Pending', 'Blocked',
       'Diblokir: menunggu konfirmasi klien terkait scope adjustment intercompany.',
       '2026-05-25 14:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM project_milestone_updates
  WHERE milestone_id = @ms5_id AND from_status = 'Pending' AND to_status = 'Blocked'
);

-- -----------------------------------------------------------------------------
-- 1.9 Project Status Transitions (audit untuk header timeline)
-- -----------------------------------------------------------------------------
INSERT INTO project_status_transitions
  (project_id, from_status, to_status, triggered_by_user_id, triggered_by_name_snapshot,
   trigger_source, reason, triggered_at)
SELECT @project1_id, NULL, 'Awaiting Consultant', @coo_id, @coo_name,
       'USER', 'Project dibuat dari handover yang sudah ASSIGNED_TO_PM.', '2026-04-01 09:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM project_status_transitions
  WHERE project_id = @project1_id AND from_status IS NULL AND to_status = 'Awaiting Consultant'
);
INSERT INTO project_status_transitions
  (project_id, from_status, to_status, triggered_by_user_id, triggered_by_name_snapshot,
   trigger_source, reason, triggered_at)
SELECT @project1_id, 'Awaiting Consultant', 'In Progress', @pm_id, @pm_name,
       'USER', 'Consultant sudah di-assign dan DP sudah dibayar.', '2026-04-02 10:30:00'
WHERE NOT EXISTS (
  SELECT 1 FROM project_status_transitions
  WHERE project_id = @project1_id AND from_status = 'Awaiting Consultant' AND to_status = 'In Progress'
);


-- =============================================================================
-- PROJECT #2: PT Demo Skripsi Audit (Completed — untuk Dashboard CEO + KPI Finalized)
-- =============================================================================

-- 2.1 Lead
INSERT INTO leads
  (source_type, company_name, company_address, pic_name, email, phone_number,
   desired_services, bank_data_status, lead_status, current_stage,
   processed_by, processed_at, created_at)
SELECT 'MANUAL', 'PT Demo Skripsi Audit', 'Jl. Demo Thesis No. 2, Jakarta Pusat',
       'Ibu Demo PIC2', 'pic.demoaudit@example.com', '+628123456002',
       'Annual Audit FY 2025',
       'PROCESSED', 'WON', 'ENGAGEMENT_LETTER',
       @bd_id, '2026-01-15 09:00:00', '2026-01-15 09:00:00'
WHERE NOT EXISTS (SELECT 1 FROM leads WHERE company_name = 'PT Demo Skripsi Audit');

SELECT lead_id INTO @lead2_id FROM leads WHERE company_name = 'PT Demo Skripsi Audit' LIMIT 1;

-- 2.2 Proposal
INSERT INTO proposals
  (lead_id, service_id, issuer_company, is_sub_contract,
   proposal_fee, discount_amount, status, approved_by, approved_at,
   sent_to_client_at, client_responded_at, submitted_by, submitted_at,
   created_by, created_at)
SELECT @lead2_id, COALESCE(@service_audit_id, @service_tp_id), 'DSK', 0,
       180000000.00, 0.00, 'APPROVED', @ceo_id, '2026-01-20 09:00:00',
       '2026-01-21 09:00:00', '2026-01-23 09:00:00', @bd_id, '2026-01-18 09:00:00',
       @bd_id, '2026-01-18 09:00:00'
WHERE NOT EXISTS (SELECT 1 FROM proposals WHERE lead_id = @lead2_id);

SELECT proposal_id INTO @proposal2_id FROM proposals WHERE lead_id = @lead2_id LIMIT 1;

-- 2.3 Engagement Letter
INSERT INTO engagement_letters
  (lead_id, proposal_id, issuer_company, agreed_fee, payment_method,
   status, approved_by, approved_at, signed_at, submitted_by, submitted_at,
   created_by, created_at)
SELECT @lead2_id, @proposal2_id, 'DSK', 180000000.00, 'TERMIN',
       'APPROVED', @ceo_id, '2026-01-26 09:00:00', '2026-01-27 14:00:00',
       @bd_id, '2026-01-25 09:00:00', @bd_id, '2026-01-25 09:00:00'
WHERE NOT EXISTS (SELECT 1 FROM engagement_letters WHERE proposal_id = @proposal2_id);

SELECT engagement_id INTO @engagement2_id FROM engagement_letters
  WHERE proposal_id = @proposal2_id LIMIT 1;

-- 2.4 Handover
INSERT INTO handovers
  (lead_id, proposal_id, engagement_id, service_id, department_id,
   handover_code, project_title, company_group,
   project_start_date, project_end_date,
   background_summary, status,
   routed_coo_id, submitted_by, submitted_at, approved_by, approved_at,
   dp_payment_status, dp_paid_at, created_by, created_at)
SELECT @lead2_id, @proposal2_id, @engagement2_id, COALESCE(@service_audit_id, @service_tp_id),
       COALESCE(@dept_audit_id, @dept_tpdoc_id),
       'HO-DEMO-002', 'Annual Audit FY2025 - PT Demo Skripsi Audit', 'Demo Group',
       '2026-02-01', '2026-05-31',
       'Annual audit untuk laporan keuangan FY 2025.',
       'ASSIGNED_TO_PM',
       @coo_id, @bd_id, '2026-01-28 09:00:00', @ceo_id, '2026-01-29 10:00:00',
       'PAID', '2026-01-30 14:00:00', @bd_id, '2026-01-28 09:00:00'
ON DUPLICATE KEY UPDATE status = VALUES(status), dp_payment_status = VALUES(dp_payment_status);

SELECT handover_id INTO @handover2_id FROM handovers WHERE handover_code = 'HO-DEMO-002' LIMIT 1;

-- 2.5 Project
INSERT INTO projects
  (project_code, handover_id, client, project_name, service_line, status,
   pm_user_id, pm_name_snapshot, start_date, end_date, created_by, created_at)
SELECT 'PRJ-DEMO-002', @handover2_id, 'PT Demo Skripsi Audit',
       'Annual Audit FY2025', 'Audit', 'Completed',
       @pm_id, @pm_name, '2026-02-01', '2026-05-25', @coo_id, '2026-02-01 09:00:00'
ON DUPLICATE KEY UPDATE status = VALUES(status), end_date = VALUES(end_date);

SELECT project_id INTO @project2_id FROM projects WHERE project_code = 'PRJ-DEMO-002' LIMIT 1;

-- 2.6 Consultants
INSERT INTO project_consultants
  (project_id, consultant_user_id, consultant_name_snapshot, level, assigned_at, assigned_by)
VALUES
  (@project2_id, @cons1_id, @cons1_name, 'Lead',   '2026-02-02 10:00:00', @pm_id),
  (@project2_id, @cons3_id, @cons3_name, 'Senior', '2026-02-02 10:00:00', @pm_id)
ON DUPLICATE KEY UPDATE level = VALUES(level);

-- 2.7 Milestones (semua Done dengan quality_rating untuk KPI calculation)
INSERT INTO project_milestones
  (project_id, title, target_date, status, owner_user_id, owner_name_snapshot,
   weight, phase, sequence_no, completed_at, quality_rating, revision_count, created_at)
SELECT @project2_id, 'Engagement Planning', '2026-02-10', 'Done', @cons1_id, @cons1_name,
       15, 'Initiation', 1, '2026-02-09 17:00:00', 5, 0, '2026-02-01 10:00:00'
WHERE NOT EXISTS (SELECT 1 FROM project_milestones WHERE project_id = @project2_id AND title = 'Engagement Planning');

INSERT INTO project_milestones
  (project_id, title, target_date, status, owner_user_id, owner_name_snapshot,
   weight, phase, sequence_no, completed_at, quality_rating, revision_count, created_at)
SELECT @project2_id, 'Risk Assessment & Materiality', '2026-02-28', 'Done', @cons1_id, @cons1_name,
       20, 'Analysis', 2, '2026-02-27 16:00:00', 4, 1, '2026-02-15 09:00:00'
WHERE NOT EXISTS (SELECT 1 FROM project_milestones WHERE project_id = @project2_id AND title = 'Risk Assessment & Materiality');

INSERT INTO project_milestones
  (project_id, title, target_date, status, owner_user_id, owner_name_snapshot,
   weight, phase, sequence_no, completed_at, quality_rating, revision_count, created_at)
SELECT @project2_id, 'Substantive Testing', '2026-04-15', 'Done', @cons3_id, @cons3_name,
       30, 'Core Work', 3, '2026-04-14 17:30:00', 4, 0, '2026-03-01 09:00:00'
WHERE NOT EXISTS (SELECT 1 FROM project_milestones WHERE project_id = @project2_id AND title = 'Substantive Testing');

INSERT INTO project_milestones
  (project_id, title, target_date, status, owner_user_id, owner_name_snapshot,
   weight, phase, sequence_no, completed_at, quality_rating, revision_count, created_at)
SELECT @project2_id, 'Draft Audit Report', '2026-05-10', 'Done', @cons1_id, @cons1_name,
       20, 'QC', 4, '2026-05-09 18:00:00', 5, 1, '2026-04-15 09:00:00'
WHERE NOT EXISTS (SELECT 1 FROM project_milestones WHERE project_id = @project2_id AND title = 'Draft Audit Report');

INSERT INTO project_milestones
  (project_id, title, target_date, status, owner_user_id, owner_name_snapshot,
   weight, phase, sequence_no, completed_at, quality_rating, revision_count, created_at)
SELECT @project2_id, 'Final Report & Sign-off', '2026-05-25', 'Done', @cons1_id, @cons1_name,
       15, 'Delivery', 5, '2026-05-24 16:00:00', 5, 0, '2026-05-10 09:00:00'
WHERE NOT EXISTS (SELECT 1 FROM project_milestones WHERE project_id = @project2_id AND title = 'Final Report & Sign-off');

-- 2.8 Project Status Transitions (full lifecycle)
INSERT INTO project_status_transitions
  (project_id, from_status, to_status, triggered_by_user_id, triggered_by_name_snapshot,
   trigger_source, reason, triggered_at)
SELECT @project2_id, NULL, 'Awaiting Consultant', @coo_id, @coo_name,
       'USER', 'Project dibuat dari handover.', '2026-02-01 09:00:00'
WHERE NOT EXISTS (SELECT 1 FROM project_status_transitions
                  WHERE project_id = @project2_id AND from_status IS NULL);
INSERT INTO project_status_transitions
  (project_id, from_status, to_status, triggered_by_user_id, triggered_by_name_snapshot,
   trigger_source, reason, triggered_at)
SELECT @project2_id, 'Awaiting Consultant', 'In Progress', @pm_id, @pm_name,
       'USER', 'Consultant assigned, project dimulai.', '2026-02-02 10:00:00'
WHERE NOT EXISTS (SELECT 1 FROM project_status_transitions
                  WHERE project_id = @project2_id AND from_status = 'Awaiting Consultant');
INSERT INTO project_status_transitions
  (project_id, from_status, to_status, triggered_by_user_id, triggered_by_name_snapshot,
   trigger_source, reason, triggered_at)
SELECT @project2_id, 'In Progress', 'Completed', @pm_id, @pm_name,
       'USER', 'Semua milestone done, final report sudah di-sign off.', '2026-05-25 16:30:00'
WHERE NOT EXISTS (SELECT 1 FROM project_status_transitions
                  WHERE project_id = @project2_id AND to_status = 'Completed');


-- =============================================================================
-- KPI SNAPSHOTS (untuk Screenshot 3 — KPI Consultant Page)
-- =============================================================================
-- Untuk demo, kita generate snapshot hardcoded yang representatif:
-- - Consultant 1 (Sausan): periode 2026-05 FINALIZED, periode 2026-06 PRELIMINARY
-- - Consultant 2 (Hanin): periode 2026-06 PRELIMINARY
-- - Consultant 3 (Matthew): periode 2026-05 FINALIZED
--
-- Catatan: real-world ini di-compute via kpiService.computeFullKpi.
-- Untuk demo screenshot, kita hardcode angka yang masuk akal supaya:
--   - total_score realistic (75-90)
--   - 4 dimensi terisi semua
--   - Σ(w × c) = total_score (matematis konsisten)
-- Default weights: TC=0.35, TM=0.25, UC=0.15, OQ=0.25

-- ---- Sausan (Consultant Lead Project Audit Completed) — FINALIZED 2026-05 ----
-- Capaian: TC=90, TM=85, UC=80, OQ=92 → total = 0.35*90 + 0.25*85 + 0.15*80 + 0.25*92 = 87.75
INSERT INTO kpi_snapshots
  (consultant_user_id, consultant_name_snapshot, period, config_id_used,
   capaian_task_completion, capaian_timeliness, capaian_update_compliance, capaian_output_quality,
   total_score, computed_at, finalized_at, finalized_by_user_id)
VALUES
  (@cons1_id, @cons1_name, '2026-05', @config_id,
   90.00, 85.00, 80.00, 92.00, 87.75,
   '2026-05-26 09:00:00', '2026-05-30 14:00:00', @ceo_id)
ON DUPLICATE KEY UPDATE
  capaian_task_completion = VALUES(capaian_task_completion),
  capaian_timeliness = VALUES(capaian_timeliness),
  capaian_update_compliance = VALUES(capaian_update_compliance),
  capaian_output_quality = VALUES(capaian_output_quality),
  total_score = VALUES(total_score),
  finalized_at = VALUES(finalized_at),
  finalized_by_user_id = VALUES(finalized_by_user_id);

-- ---- Sausan — PRELIMINARY 2026-06 (current ongoing) ----
-- Capaian: TC=40 (5 ms, 2 done), TM=100, UC=85, OQ=90 → total = 0.35*40 + 0.25*100 + 0.15*85 + 0.25*90 = 73.50
INSERT INTO kpi_snapshots
  (consultant_user_id, consultant_name_snapshot, period, config_id_used,
   capaian_task_completion, capaian_timeliness, capaian_update_compliance, capaian_output_quality,
   total_score, computed_at, finalized_at, finalized_by_user_id)
VALUES
  (@cons1_id, @cons1_name, '2026-06', @config_id,
   40.00, 100.00, 85.00, 90.00, 73.50,
   '2026-06-05 09:00:00', NULL, NULL)
ON DUPLICATE KEY UPDATE
  capaian_task_completion = VALUES(capaian_task_completion),
  capaian_timeliness = VALUES(capaian_timeliness),
  capaian_update_compliance = VALUES(capaian_update_compliance),
  capaian_output_quality = VALUES(capaian_output_quality),
  total_score = VALUES(total_score);

-- ---- Hanin — PRELIMINARY 2026-06 ----
-- Capaian: TC=30, TM=75, UC=70, OQ=80 → total = 0.35*30 + 0.25*75 + 0.15*70 + 0.25*80 = 60.25
INSERT INTO kpi_snapshots
  (consultant_user_id, consultant_name_snapshot, period, config_id_used,
   capaian_task_completion, capaian_timeliness, capaian_update_compliance, capaian_output_quality,
   total_score, computed_at, finalized_at, finalized_by_user_id)
VALUES
  (@cons2_id, @cons2_name, '2026-06', @config_id,
   30.00, 75.00, 70.00, 80.00, 60.25,
   '2026-06-05 09:00:00', NULL, NULL)
ON DUPLICATE KEY UPDATE
  capaian_task_completion = VALUES(capaian_task_completion),
  capaian_timeliness = VALUES(capaian_timeliness),
  capaian_update_compliance = VALUES(capaian_update_compliance),
  capaian_output_quality = VALUES(capaian_output_quality),
  total_score = VALUES(total_score);

-- ---- Matthew — FINALIZED 2026-05 ----
-- Capaian: TC=85, TM=80, UC=75, OQ=85 → total = 0.35*85 + 0.25*80 + 0.15*75 + 0.25*85 = 82.25
INSERT INTO kpi_snapshots
  (consultant_user_id, consultant_name_snapshot, period, config_id_used,
   capaian_task_completion, capaian_timeliness, capaian_update_compliance, capaian_output_quality,
   total_score, computed_at, finalized_at, finalized_by_user_id)
VALUES
  (@cons3_id, @cons3_name, '2026-05', @config_id,
   85.00, 80.00, 75.00, 85.00, 82.25,
   '2026-05-26 09:00:00', '2026-05-30 14:00:00', @ceo_id)
ON DUPLICATE KEY UPDATE
  capaian_task_completion = VALUES(capaian_task_completion),
  capaian_timeliness = VALUES(capaian_timeliness),
  capaian_update_compliance = VALUES(capaian_update_compliance),
  capaian_output_quality = VALUES(capaian_output_quality),
  total_score = VALUES(total_score),
  finalized_at = VALUES(finalized_at),
  finalized_by_user_id = VALUES(finalized_by_user_id);


-- =============================================================================
-- VERIFICATION QUERIES — uncomment + run untuk cek hasilnya
-- =============================================================================
-- SELECT 'PROJECTS' AS section, project_code, client, status, start_date, end_date
--   FROM projects WHERE project_code LIKE 'PRJ-DEMO-%';
-- SELECT 'MILESTONES P1' AS section, title, status, quality_rating, completed_at
--   FROM project_milestones WHERE project_id = @project1_id ORDER BY sequence_no;
-- SELECT 'CONSULTANTS P1' AS section, consultant_name_snapshot, level
--   FROM project_consultants WHERE project_id = @project1_id;
-- SELECT 'TRANSITIONS P1' AS section, from_status, to_status, triggered_by_name_snapshot, reason, triggered_at
--   FROM project_status_transitions WHERE project_id = @project1_id ORDER BY triggered_at;
-- SELECT 'KPI SNAPSHOTS' AS section, consultant_name_snapshot, period, total_score,
--        capaian_task_completion AS tc, capaian_timeliness AS tm,
--        capaian_update_compliance AS uc, capaian_output_quality AS oq,
--        IF(finalized_at IS NULL, 'PRELIMINARY', 'FINALIZED') AS status_label
--   FROM kpi_snapshots
--   WHERE consultant_user_id IN (@cons1_id, @cons2_id, @cons3_id)
--   ORDER BY period DESC, consultant_user_id;


-- =============================================================================
-- SECTION ROLLBACK — uncomment + run kalau mau hapus semua data demo
-- =============================================================================
-- DELETE FROM kpi_snapshots
--   WHERE consultant_user_id IN (
--     SELECT id FROM users WHERE email IN (
--       'sausan.qunayta@dsk-global.id', 'hanin.febriana@dsk-global.id', 'matthew.rafael@dsk-global.id'
--     )
--   ) AND period IN ('2026-05', '2026-06');
-- DELETE FROM project_milestone_updates
--   WHERE milestone_id IN (SELECT milestone_id FROM project_milestones
--                          WHERE project_id IN (SELECT project_id FROM projects WHERE project_code LIKE 'PRJ-DEMO-%'));
-- DELETE FROM project_milestones WHERE project_id IN (SELECT project_id FROM projects WHERE project_code LIKE 'PRJ-DEMO-%');
-- DELETE FROM project_consultants WHERE project_id IN (SELECT project_id FROM projects WHERE project_code LIKE 'PRJ-DEMO-%');
-- DELETE FROM project_status_transitions WHERE project_id IN (SELECT project_id FROM projects WHERE project_code LIKE 'PRJ-DEMO-%');
-- DELETE FROM projects WHERE project_code LIKE 'PRJ-DEMO-%';
-- DELETE FROM handovers WHERE handover_code LIKE 'HO-DEMO-%';
-- DELETE FROM engagement_letters WHERE lead_id IN (SELECT lead_id FROM leads WHERE company_name LIKE 'PT Demo Skripsi%');
-- DELETE FROM proposals WHERE lead_id IN (SELECT lead_id FROM leads WHERE company_name LIKE 'PT Demo Skripsi%');
-- DELETE FROM leads WHERE company_name LIKE 'PT Demo Skripsi%';
