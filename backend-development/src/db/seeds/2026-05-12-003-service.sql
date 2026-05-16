INSERT INTO service_classes (name, code, is_active) VALUES
('Strategic Retainer', 'STRATEGIC_RETAINER', 1),
('Premium Modular Services', 'PREMIUM_MODULAR', 1),
('Standardized Modular Services', 'STANDARDIZED_MODULAR', 1);

INSERT INTO services (service_class_id, department_id, name, code, is_active)
VALUES
(
  (SELECT service_class_id FROM service_classes WHERE code = 'STRATEGIC_RETAINER'),
  (SELECT id FROM departments WHERE code = 'TAX'),
  'Strategic Tax Advisory',
  'STRATEGIC_TAX_ADVISORY',
  0
),

(
  (SELECT service_class_id FROM service_classes WHERE code = 'PREMIUM_MODULAR'),
  (SELECT id FROM departments WHERE code = 'TP_DOC'),
  'Transfer Pricing Advisory',
  'TRANSFER_PRICING_ADVISORY',
  0
),
(
  (SELECT service_class_id FROM service_classes WHERE code = 'PREMIUM_MODULAR'),
  (SELECT id FROM departments WHERE code = 'TP_DOC'),
  'Transfer Pricing Documentation (MF/LF/CbCR)',
  'TP_DOCUMENTATION_MF_LF_CBCR',
  1
),
(
  (SELECT service_class_id FROM service_classes WHERE code = 'PREMIUM_MODULAR'),
  (SELECT id FROM departments WHERE code = 'TAX'),
  'Pendampingan Pemeriksaan Pajak',
  'PENDAMPINGAN_PEMERIKSAAN_PAJAK',
  0
),
(
  (SELECT service_class_id FROM service_classes WHERE code = 'PREMIUM_MODULAR'),
  (SELECT id FROM departments WHERE code = 'TAX'),
  'Tax Litigation (Banding, Keberatan, Peninjauan Kembali, Kasasi, Gugatan)',
  'TAX_LITIGATION',
  0
),
(
  (SELECT service_class_id FROM service_classes WHERE code = 'PREMIUM_MODULAR'),
  (SELECT id FROM departments WHERE code = 'LEGAL'),
  'Business Structuring & Legal Engineering',
  'BUSINESS_STRUCTURING_LEGAL_ENGINEERING',
  0
),
(
  (SELECT service_class_id FROM service_classes WHERE code = 'PREMIUM_MODULAR'),
  (SELECT id FROM departments WHERE code = 'SR'),
  'Sustainability Reporting (GRI/SRG Full)',
  'SUSTAINABILITY_REPORTING_FULL',
  0
),
(
  (SELECT service_class_id FROM service_classes WHERE code = 'PREMIUM_MODULAR'),
  (SELECT id FROM departments WHERE code = 'TAX'),
  'Tax Due Diligence (Akuisisi / Ekspansi)',
  'TAX_DUE_DILIGENCE',
  0
),
(
  (SELECT service_class_id FROM service_classes WHERE code = 'PREMIUM_MODULAR'),
  (SELECT id FROM departments WHERE code = 'LEGAL'),
  'Legal Risk Mapping & Strategic Contract Review',
  'LEGAL_RISK_MAPPING_CONTRACT_REVIEW',
  0
),

(
  (SELECT service_class_id FROM service_classes WHERE code = 'STANDARDIZED_MODULAR'),
  (SELECT id FROM departments WHERE code = 'TP_DOC'),
  'Dokumentasi TP Template (MF/LF Basic Format)',
  'TP_TEMPLATE_MF_LF_BASIC',
  0
),
(
  (SELECT service_class_id FROM service_classes WHERE code = 'STANDARDIZED_MODULAR'),
  (SELECT id FROM departments WHERE code = 'LEGAL'),
  'Pendirian Badan Usaha (PT/PMDN/PMA)',
  'PENDIRIAN_BADAN_USAHA',
  0
),
(
  (SELECT service_class_id FROM service_classes WHERE code = 'STANDARDIZED_MODULAR'),
  (SELECT id FROM departments WHERE code = 'LEGAL'),
  'Virtual Office & Domisili Hukum',
  'VIRTUAL_OFFICE_DOMISILI_HUKUM',
  0
),
(
  (SELECT service_class_id FROM service_classes WHERE code = 'STANDARDIZED_MODULAR'),
  (SELECT id FROM departments WHERE code = 'SR'),
  'Laporan Keberlanjutan Dasar (GRI/SRG Basic)',
  'SUSTAINABILITY_REPORTING_BASIC',
  0
),
(
  (SELECT service_class_id FROM service_classes WHERE code = 'STANDARDIZED_MODULAR'),
  (SELECT id FROM departments WHERE code = 'WEBDEV'),
  'Website Company Profile (Basic WebDev)',
  'WEBSITE_COMPANY_PROFILE_BASIC',
  0
);