-- =============================================================
-- Feature: Forms Seed
-- Table:
--   - form_channels
-- =============================================================

INSERT INTO form_channels (name, code, is_active)
SELECT 'Instagram', 'INSTAGRAM', 1
WHERE NOT EXISTS (
  SELECT 1 FROM form_channels WHERE code = 'INSTAGRAM'
);

INSERT INTO form_channels (name, code, is_active)
SELECT 'LinkedIn', 'LINKEDIN', 1
WHERE NOT EXISTS (
  SELECT 1 FROM form_channels WHERE code = 'LINKEDIN'
);

INSERT INTO form_channels (name, code, is_active)
SELECT 'TikTok', 'TIKTOK', 1
WHERE NOT EXISTS (
  SELECT 1 FROM form_channels WHERE code = 'TIKTOK'
);

INSERT INTO form_channels (name, code, is_active)
SELECT 'Website', 'WEBSITE', 1
WHERE NOT EXISTS (
  SELECT 1 FROM form_channels WHERE code = 'WEBSITE'
);