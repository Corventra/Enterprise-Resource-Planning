-- =============================================================
-- Migration: Lead cardinality constraints (0..1 per lead)
-- Date: 2026-05-20
--
-- Enforces:
--   Lead ||--o| Proposal
--   Lead ||--o| Engagement Letter
--   Lead ||--o| Handover
--
-- Apply order:
--   1. Deploy backend guards first (pre-check in repos)
--   2. Run duplicate verification queries below (expect 0 rows)
--   3. Apply this migration
--
-- Rollback (if needed):
--   ALTER TABLE proposals DROP INDEX uk_proposals_lead_id;
--   ALTER TABLE engagement_letters DROP INDEX uk_engagement_letters_lead_id;
--   ALTER TABLE handovers DROP INDEX uk_handovers_lead_id;
-- =============================================================

-- -------------------------------------------------------------
-- Step 0: Pre-check duplicates (must return 0 rows before apply)
-- -------------------------------------------------------------
-- SELECT lead_id, COUNT(*) AS row_count
--   FROM proposals
--  GROUP BY lead_id
-- HAVING row_count > 1;
--
-- SELECT lead_id, COUNT(*) AS row_count
--   FROM engagement_letters
--  GROUP BY lead_id
-- HAVING row_count > 1;
--
-- SELECT lead_id, COUNT(*) AS row_count
--   FROM handovers
--  GROUP BY lead_id
-- HAVING row_count > 1;

-- -------------------------------------------------------------
-- Step 1: proposals — one proposal per lead
-- -------------------------------------------------------------
ALTER TABLE proposals
  ADD CONSTRAINT uk_proposals_lead_id UNIQUE (lead_id);

-- -------------------------------------------------------------
-- Step 2: engagement_letters — one engagement letter per lead
-- (proposal_id already unique via uk_engagement_letters_proposal_id)
-- -------------------------------------------------------------
ALTER TABLE engagement_letters
  ADD CONSTRAINT uk_engagement_letters_lead_id UNIQUE (lead_id);

-- -------------------------------------------------------------
-- Step 3: handovers — one handover per lead
-- (engagement_id already unique via uk_handovers_engagement_id)
-- -------------------------------------------------------------
ALTER TABLE handovers
  ADD CONSTRAINT uk_handovers_lead_id UNIQUE (lead_id);
