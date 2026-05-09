-- =============================================================
-- Feature: Campaign Seed
-- Tables:
--   - campaign_types
--   - topics
-- Catatan:
--   - Aman dijalankan ulang karena pakai WHERE NOT EXISTS
-- =============================================================

INSERT INTO campaign_types (name, code, is_active)
SELECT 'Webinar', 'WEBINAR', 1
WHERE NOT EXISTS (
  SELECT 1 FROM campaign_types WHERE code = 'WEBINAR'
);

INSERT INTO campaign_types (name, code, is_active)
SELECT 'Seminar', 'SEMINAR', 1
WHERE NOT EXISTS (
  SELECT 1 FROM campaign_types WHERE code = 'SEMINAR'
);

INSERT INTO campaign_types (name, code, is_active)
SELECT 'Freebie', 'FREEBIE', 1
WHERE NOT EXISTS (
  SELECT 1 FROM campaign_types WHERE code = 'FREEBIE'
);

INSERT INTO campaign_types (name, code, is_active)
SELECT 'Social Media Campaign', 'SOCIAL_MEDIA', 1
WHERE NOT EXISTS (
  SELECT 1 FROM campaign_types WHERE code = 'SOCIAL_MEDIA'
);

INSERT INTO topics (name, code, is_active)
SELECT 'Transfer Pricing', 'TRANSFER_PRICING', 1
WHERE NOT EXISTS (
  SELECT 1 FROM topics WHERE code = 'TRANSFER_PRICING'
);

INSERT INTO topics (name, code, is_active)
SELECT 'Tax', 'TAX', 1
WHERE NOT EXISTS (
  SELECT 1 FROM topics WHERE code = 'TAX'
);

INSERT INTO topics (name, code, is_active)
SELECT 'Legal', 'LEGAL', 1
WHERE NOT EXISTS (
  SELECT 1 FROM topics WHERE code = 'LEGAL'
);

INSERT INTO topics (name, code, is_active)
SELECT 'Sustainability Report', 'SR', 1
WHERE NOT EXISTS (
  SELECT 1 FROM topics WHERE code = 'SR'
);

INSERT INTO topics (name, code, is_active)
SELECT 'Web Development', 'WEBDEV', 1
WHERE NOT EXISTS (
  SELECT 1 FROM topics WHERE code = 'WEBDEV'
);