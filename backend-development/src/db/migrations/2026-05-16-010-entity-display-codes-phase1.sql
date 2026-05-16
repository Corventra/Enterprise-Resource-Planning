-- =============================================================
-- Entity display codes (phase 1): kolom nullable
-- Lead: LD-001 | Proposal: BD-PRO-001 | EL: BD-EL-001
-- Jalankan backfill, lalu migration phase 2 (NOT NULL + UNIQUE).
-- =============================================================

ALTER TABLE leads
  ADD COLUMN lead_code VARCHAR(20) NULL AFTER lead_id;

ALTER TABLE proposals
  ADD COLUMN proposal_code VARCHAR(32) NULL AFTER proposal_id;

ALTER TABLE engagement_letters
  ADD COLUMN engagement_code VARCHAR(32) NULL AFTER engagement_id;
