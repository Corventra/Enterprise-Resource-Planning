-- =============================================================
-- Migration: Unique campaign start_date
-- Date: 2026-07-13
--
-- Enforces one campaign per start_date (no duplicate start dates).
--
-- Apply order:
--   1. Deploy backend guard (existsByStartDate in campaigns controller)
--   2. Run pre-check below (expect 0 rows)
--   3. Apply this migration
--
-- Pre-check duplicates (must return 0 rows before apply):
--   SELECT start_date, COUNT(*) AS row_count
--     FROM campaigns
--    GROUP BY start_date
--   HAVING row_count > 1;
--
-- Rollback (if needed):
--   ALTER TABLE campaigns DROP INDEX uq_campaigns_start_date;
-- =============================================================

ALTER TABLE campaigns
  ADD UNIQUE INDEX uq_campaigns_start_date (start_date);
