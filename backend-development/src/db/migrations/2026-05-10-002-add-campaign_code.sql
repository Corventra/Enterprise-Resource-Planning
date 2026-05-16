ALTER TABLE campaigns
ADD COLUMN campaign_code VARCHAR(20) NULL UNIQUE AFTER campaign_id;

UPDATE campaigns
SET campaign_code = CONCAT('cmp-', LPAD(campaign_id, 3, '0'))
WHERE campaign_code IS NULL;