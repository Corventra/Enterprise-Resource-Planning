-- =============================================================
-- Entity display codes (phase 2): NOT NULL + UNIQUE
-- Prasyarat: semua baris ter-backfill; tidak ada duplikat/NULL.
-- =============================================================

ALTER TABLE leads
  MODIFY COLUMN lead_code VARCHAR(20) NOT NULL,
  ADD CONSTRAINT uk_leads_lead_code UNIQUE (lead_code);

ALTER TABLE proposals
  MODIFY COLUMN proposal_code VARCHAR(32) NOT NULL,
  ADD CONSTRAINT uk_proposals_proposal_code UNIQUE (proposal_code);

ALTER TABLE engagement_letters
  MODIFY COLUMN engagement_code VARCHAR(32) NOT NULL,
  ADD CONSTRAINT uk_engagement_letters_engagement_code UNIQUE (engagement_code);
