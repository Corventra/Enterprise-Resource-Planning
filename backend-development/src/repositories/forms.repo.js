const { pool } = require('../config/db');
const { formatFormCode } = require('../utils/form-code');
const { titleToLinkSlug } = require('../utils/form-link');

const FIELD_TYPES = new Set([
  'text',
  'textarea',
  'select',
  'radio',
  'checkbox',
  'date',
  'file'
]);

const OPTION_FIELD_TYPES = new Set(['select', 'radio', 'checkbox']);

/** 5 field wajib LEAD_CAPTURE — dibuat saat POST create draft. */
const LEAD_CAPTURE_SYSTEM_FIELDS = [
  {
    field_key: 'company_name',
    label: 'Nama perusahaan',
    field_type: 'text',
    sort_order: 1,
    placeholder: 'Masukkan nama perusahaan',
    help_text: 'Isi sesuai nama perusahaan atau badan usaha'
  },
  {
    field_key: 'company_address',
    label: 'Alamat perusahaan',
    field_type: 'textarea',
    sort_order: 2,
    placeholder: 'Masukkan alamat perusahaan lengkap',
    help_text: 'Cantumkan alamat domisili atau kantor utama'
  },
  {
    field_key: 'contact_name',
    label: 'Nama kontak',
    field_type: 'text',
    sort_order: 3,
    placeholder: 'Masukkan nama kontak utama',
    help_text: 'PIC yang dapat dihubungi untuk tindak lanjut'
  },
  {
    field_key: 'contact_email',
    label: 'Email kontak',
    field_type: 'text',
    sort_order: 4,
    placeholder: 'contoh@perusahaan.com',
    help_text: 'Gunakan email aktif yang dapat dihubungi'
  },
  {
    field_key: 'contact_phone',
    label: 'Nomor telepon kontak',
    field_type: 'text',
    sort_order: 5,
    placeholder: '08xxxxxxxxxx',
    help_text: 'Gunakan nomor aktif WhatsApp atau telepon (7–13 digit)'
  }
];

const mapFormRow = (row) => ({
  form_id: row.form_id,
  form_code: row.form_code,
  campaign_id: row.campaign_id,
  form_category: row.form_category,
  title: row.title,
  description: row.description,
  header_image_path: row.header_image_path,
  success_message: row.success_message,
  success_link_url: row.success_link_url,
  success_link_label: row.success_link_label,
  status: row.status,
  is_accepting_responses: Boolean(row.is_accepting_responses),
  created_by: row.created_by,
  created_at: row.created_at,
  updated_at: row.updated_at,
  published_at: row.published_at
});

const mapFieldRow = (row) => ({
  field_id: row.field_id,
  form_id: row.form_id,
  field_key: row.field_key,
  label: row.label,
  field_type: row.field_type,
  placeholder: row.placeholder,
  help_text: row.help_text,
  is_required: Boolean(row.is_required),
  is_system: Boolean(row.is_system),
  is_locked: Boolean(row.is_locked),
  sort_order: row.sort_order,
  settings_json: row.settings_json ?? null,
  created_at: row.created_at,
  updated_at: row.updated_at
});

const mapOptionRow = (row) => ({
  option_id: row.option_id,
  field_id: row.field_id,
  label: row.label,
  value: row.value,
  sort_order: row.sort_order
});

const listByCampaignId = async (campaignId) => {
  const [rows] = await pool.execute(
    `SELECT
        form_id,
        form_code,
        campaign_id,
        form_category,
        title,
        description,
        header_image_path,
        success_message,
        success_link_url,
        success_link_label,
        status,
        is_accepting_responses,
        created_by,
        created_at,
        updated_at,
        published_at
      FROM forms
     WHERE campaign_id = ?
  ORDER BY created_at DESC, form_id DESC`,
    [campaignId]
  );
  return rows.map(mapFormRow);
};

const findById = async (formId) => {
  const [rows] = await pool.execute(`SELECT * FROM forms WHERE form_id = ? LIMIT 1`, [formId]);
  return rows.length === 0 ? null : mapFormRow(rows[0]);
};

/**
 * Form + campaign.created_by untuk ownership.
 */
const findByIdWithCampaignCreator = async (formId) => {
  const [rows] = await pool.execute(
    `SELECT
        f.form_id,
        f.form_code,
        f.campaign_id,
        f.form_category,
        f.title,
        f.description,
        f.header_image_path,
        f.success_message,
        f.success_link_url,
        f.success_link_label,
        f.status,
        f.is_accepting_responses,
        f.created_by,
        f.created_at,
        f.updated_at,
        f.published_at,
        c.created_by AS campaign_created_by
      FROM forms f
      INNER JOIN campaigns c ON c.campaign_id = f.campaign_id
     WHERE f.form_id = ?
     LIMIT 1`,
    [formId]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    ...mapFormRow(r),
    campaign_created_by: r.campaign_created_by
  };
};

const fetchFieldsForForm = async (formId) => {
  const [fields] = await pool.execute(
    `SELECT * FROM form_fields WHERE form_id = ? ORDER BY sort_order ASC, field_id ASC`,
    [formId]
  );
  if (fields.length === 0) return [];
  const fieldIds = fields.map((f) => f.field_id);
  const placeholders = fieldIds.map(() => '?').join(',');
  const [options] = await pool.execute(
    `SELECT * FROM form_field_options WHERE field_id IN (${placeholders}) ORDER BY sort_order ASC, option_id ASC`,
    fieldIds
  );
  const optionsByField = new Map();
  for (const o of options) {
    const list = optionsByField.get(o.field_id) || [];
    list.push(mapOptionRow(o));
    optionsByField.set(o.field_id, list);
  }
  return fields.map((f) => {
    const m = mapFieldRow(f);
    return { ...m, options: optionsByField.get(f.field_id) || [] };
  });
};

const getBuilderDetail = async (formId) => {
  const form = await findById(formId);
  if (!form) return null;
  const fields = await fetchFieldsForForm(formId);
  return { form, fields };
};

const createDraftInTransaction = async ({
  campaignId,
  formCategory,
  title,
  description,
  headerImagePath,
  successMessage,
  successLinkUrl,
  successLinkLabel,
  createdBy
}) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [insertResult] = await connection.execute(
      `INSERT INTO forms (
        campaign_id, form_category, title, description, header_image_path,
        success_message, success_link_url, success_link_label,
        status, is_accepting_responses, created_by, form_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', 0, ?, NULL)`,
      [
        campaignId,
        formCategory,
        title,
        description,
        headerImagePath,
        successMessage,
        successLinkUrl,
        successLinkLabel,
        createdBy
      ]
    );
    const formId = insertResult.insertId;
    const formCode = formatFormCode(formId);
    await connection.execute(`UPDATE forms SET form_code = ? WHERE form_id = ?`, [formCode, formId]);

    if (formCategory === 'LEAD_CAPTURE') {
      for (const sf of LEAD_CAPTURE_SYSTEM_FIELDS) {
        await connection.execute(
          `INSERT INTO form_fields (
            form_id, field_key, label, field_type, placeholder, help_text,
            is_required, is_system, is_locked, sort_order, settings_json
          ) VALUES (?, ?, ?, ?, ?, ?, 1, 1, 1, ?, NULL)`,
          [
            formId,
            sf.field_key,
            sf.label,
            sf.field_type,
            sf.placeholder,
            sf.help_text,
            sf.sort_order
          ]
        );
      }
    }

    await connection.commit();
    return formId;
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
};

const updateFormMetadata = async (formId, patch) => {
  const fields = [];
  const params = [];
  if (patch.title !== undefined) {
    fields.push('title = ?');
    params.push(patch.title);
  }
  if (patch.description !== undefined) {
    fields.push('description = ?');
    params.push(patch.description);
  }
  if (patch.header_image_path !== undefined) {
    fields.push('header_image_path = ?');
    params.push(patch.header_image_path);
  }
  if (patch.success_message !== undefined) {
    fields.push('success_message = ?');
    params.push(patch.success_message);
  }
  if (patch.success_link_url !== undefined) {
    fields.push('success_link_url = ?');
    params.push(patch.success_link_url);
  }
  if (patch.success_link_label !== undefined) {
    fields.push('success_link_label = ?');
    params.push(patch.success_link_label);
  }
  if (fields.length === 0) return 0;
  params.push(formId);
  const [result] = await pool.execute(`UPDATE forms SET ${fields.join(', ')} WHERE form_id = ?`, params);
  return result.affectedRows;
};

const insertCustomField = async ({
  formId,
  field_key,
  label,
  field_type,
  placeholder,
  help_text,
  is_required,
  sort_order,
  settings_json
}) => {
  const [result] = await pool.execute(
    `INSERT INTO form_fields (
      form_id, field_key, label, field_type, placeholder, help_text,
      is_required, is_system, is_locked, sort_order, settings_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`,
    [
      formId,
      field_key,
      label,
      field_type,
      placeholder,
      help_text,
      is_required ? 1 : 0,
      sort_order,
      settings_json === undefined ? null : settings_json
    ]
  );
  return result.insertId;
};

const findFieldById = async (fieldId) => {
  const [rows] = await pool.execute(`SELECT * FROM form_fields WHERE field_id = ? LIMIT 1`, [fieldId]);
  return rows.length === 0 ? null : mapFieldRow(rows[0]);
};

const findFieldWithFormCampaign = async (fieldId) => {
  const [rows] = await pool.execute(
    `SELECT
        ff.*,
        f.form_id AS _form_id,
        f.campaign_id,
        f.status AS form_status,
        c.created_by AS campaign_created_by
      FROM form_fields ff
      INNER JOIN forms f ON f.form_id = ff.form_id
      INNER JOIN campaigns c ON c.campaign_id = f.campaign_id
     WHERE ff.field_id = ?
     LIMIT 1`,
    [fieldId]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  const field = mapFieldRow(r);
  return {
    ...field,
    form_status: r.form_status,
    campaign_created_by: r.campaign_created_by
  };
};

const updateField = async (fieldId, patch) => {
  const fields = [];
  const params = [];
  if (patch.field_key !== undefined) {
    fields.push('field_key = ?');
    params.push(patch.field_key);
  }
  if (patch.label !== undefined) {
    fields.push('label = ?');
    params.push(patch.label);
  }
  if (patch.field_type !== undefined) {
    fields.push('field_type = ?');
    params.push(patch.field_type);
  }
  if (patch.placeholder !== undefined) {
    fields.push('placeholder = ?');
    params.push(patch.placeholder);
  }
  if (patch.help_text !== undefined) {
    fields.push('help_text = ?');
    params.push(patch.help_text);
  }
  if (patch.is_required !== undefined) {
    fields.push('is_required = ?');
    params.push(patch.is_required ? 1 : 0);
  }
  if (patch.sort_order !== undefined) {
    fields.push('sort_order = ?');
    params.push(patch.sort_order);
  }
  if (patch.settings_json !== undefined) {
    fields.push('settings_json = ?');
    params.push(patch.settings_json);
  }
  if (fields.length === 0) return 0;
  params.push(fieldId);
  const [result] = await pool.execute(`UPDATE form_fields SET ${fields.join(', ')} WHERE field_id = ?`, params);
  return result.affectedRows;
};

const deleteFieldById = async (fieldId) => {
  const [result] = await pool.execute(`DELETE FROM form_fields WHERE field_id = ?`, [fieldId]);
  return result.affectedRows;
};

const insertOption = async ({ fieldId, label, value, sort_order }) => {
  const [result] = await pool.execute(
    `INSERT INTO form_field_options (field_id, label, value, sort_order) VALUES (?, ?, ?, ?)`,
    [fieldId, label, value, sort_order]
  );
  return result.insertId;
};

const findOptionById = async (optionId) => {
  const [rows] = await pool.execute(
    `SELECT * FROM form_field_options WHERE option_id = ? LIMIT 1`,
    [optionId]
  );
  return rows.length === 0 ? null : mapOptionRow(rows[0]);
};

const updateOption = async (optionId, patch) => {
  const fields = [];
  const params = [];
  if (patch.label !== undefined) {
    fields.push('label = ?');
    params.push(patch.label);
  }
  if (patch.value !== undefined) {
    fields.push('value = ?');
    params.push(patch.value);
  }
  if (patch.sort_order !== undefined) {
    fields.push('sort_order = ?');
    params.push(patch.sort_order);
  }
  if (fields.length === 0) return 0;
  params.push(optionId);
  const [result] = await pool.execute(
    `UPDATE form_field_options SET ${fields.join(', ')} WHERE option_id = ?`,
    params
  );
  return result.affectedRows;
};

const deleteOptionById = async (optionId) => {
  const [result] = await pool.execute(`DELETE FROM form_field_options WHERE option_id = ?`, [optionId]);
  return result.affectedRows;
};

const LEAD_CAPTURE_SYSTEM_KEYS = LEAD_CAPTURE_SYSTEM_FIELDS.map((f) => f.field_key);

const countFieldsByFormId = async (formId) => {
  const [rows] = await pool.execute(`SELECT COUNT(*) AS c FROM form_fields WHERE form_id = ?`, [formId]);
  return Number(rows[0].c);
};

const formHasAllLeadCaptureSystemKeys = async (formId) => {
  const placeholders = LEAD_CAPTURE_SYSTEM_KEYS.map(() => '?').join(',');
  const [rows] = await pool.execute(
    `SELECT field_key FROM form_fields WHERE form_id = ? AND field_key IN (${placeholders})`,
    [formId, ...LEAD_CAPTURE_SYSTEM_KEYS]
  );
  const have = new Set(rows.map((r) => r.field_key));
  return LEAD_CAPTURE_SYSTEM_KEYS.every((k) => have.has(k));
};

/** LEAD_CAPTURE: auto channel links (suffix = segment link_code setelah slug). */
const LEAD_CAPTURE_AUTO_CHANNELS = [
  { code: 'INSTAGRAM', suffix: 'instagram' },
  { code: 'LINKEDIN', suffix: 'linkedin' },
  { code: 'TIKTOK', suffix: 'tiktok' },
  { code: 'WEBSITE', suffix: 'website' }
];

const insertPrimaryLinkIfMissing = async (connection, formId, formCode, title) => {
  const [existingPrimary] = await connection.execute(
    `SELECT distribution_link_id FROM form_distribution_links
     WHERE form_id = ? AND link_type = 'PRIMARY' LIMIT 1`,
    [formId]
  );
  if (existingPrimary.length > 0) return;
  const slug = titleToLinkSlug(title);
  let linkCode = `${formCode}-${slug}-main`;
  try {
    await connection.execute(
      `INSERT INTO form_distribution_links (form_id, channel_id, link_type, link_code)
       VALUES (?, NULL, 'PRIMARY', ?)`,
      [formId, linkCode]
    );
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      linkCode = `${formCode}-${slug}-main-${formId}`;
      await connection.execute(
        `INSERT INTO form_distribution_links (form_id, channel_id, link_type, link_code)
         VALUES (?, NULL, 'PRIMARY', ?)`,
        [formId, linkCode]
      );
    } else {
      throw e;
    }
  }
};

const insertChannelLinkIfMissing = async (connection, formId, formCode, title, channelId, suffix) => {
  const [exists] = await connection.execute(
    `SELECT 1 FROM form_distribution_links
     WHERE form_id = ? AND link_type = 'CHANNEL' AND channel_id = ? LIMIT 1`,
    [formId, channelId]
  );
  if (exists.length > 0) return;
  const slug = titleToLinkSlug(title);
  let linkCode = `${formCode}-${slug}-${suffix}`;
  try {
    await connection.execute(
      `INSERT INTO form_distribution_links (form_id, channel_id, link_type, link_code)
       VALUES (?, ?, 'CHANNEL', ?)`,
      [formId, channelId, linkCode]
    );
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      linkCode = `${formCode}-${slug}-${suffix}-${formId}`;
      await connection.execute(
        `INSERT INTO form_distribution_links (form_id, channel_id, link_type, link_code)
         VALUES (?, ?, 'CHANNEL', ?)`,
        [formId, channelId, linkCode]
      );
    } else {
      throw e;
    }
  }
};

const ensureAutoDistributionLinks = async (connection, formId, formCode, title, formCategory) => {
  await insertPrimaryLinkIfMissing(connection, formId, formCode, title);
  if (formCategory !== 'LEAD_CAPTURE') return;
  const codes = LEAD_CAPTURE_AUTO_CHANNELS.map((c) => c.code);
  const placeholders = codes.map(() => '?').join(',');
  const [chRows] = await connection.execute(
    `SELECT channel_id, code FROM form_channels WHERE code IN (${placeholders}) AND is_active = 1`,
    codes
  );
  const byCode = new Map(chRows.map((r) => [r.code, r.channel_id]));
  for (const { code, suffix } of LEAD_CAPTURE_AUTO_CHANNELS) {
    const channelId = byCode.get(code);
    if (!channelId) continue;
    await insertChannelLinkIfMissing(connection, formId, formCode, title, channelId, suffix);
  }
};

/**
 * Publish: DRAFT → PUBLISHED, accepting + published_at, auto-generate distribution links (no manual CRUD).
 */
const publishDraftForm = async (formId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT form_id, form_code, title, status, form_category FROM forms WHERE form_id = ? FOR UPDATE`,
      [formId]
    );
    if (rows.length === 0) {
      await connection.rollback();
      return { ok: false, code: 'NOT_FOUND' };
    }
    const row = rows[0];
    if (row.status !== 'DRAFT') {
      await connection.rollback();
      return { ok: false, code: 'NOT_DRAFT' };
    }
    if (!row.form_code) {
      await connection.rollback();
      return { ok: false, code: 'NO_FORM_CODE' };
    }
    const [upd] = await connection.execute(
      `UPDATE forms SET status = 'PUBLISHED', is_accepting_responses = 1, published_at = NOW()
       WHERE form_id = ? AND status = 'DRAFT'`,
      [formId]
    );
    if (upd.affectedRows === 0) {
      await connection.rollback();
      return { ok: false, code: 'CONFLICT' };
    }
    await ensureAutoDistributionLinks(connection, formId, row.form_code, row.title, row.form_category);
    await connection.commit();
    return { ok: true };
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
};

const deactivatePublishedForm = async (formId) => {
  const [result] = await pool.execute(
    `UPDATE forms SET status = 'INACTIVE', is_accepting_responses = 0
     WHERE form_id = ? AND status = 'PUBLISHED'`,
    [formId]
  );
  return result.affectedRows;
};

const setAcceptingResponsesIfPublished = async (formId, accepting) => {
  const [result] = await pool.execute(
    `UPDATE forms SET is_accepting_responses = ? WHERE form_id = ? AND status = 'PUBLISHED'`,
    [accepting ? 1 : 0, formId]
  );
  return result.affectedRows;
};

/**
 * Hapus draft beserta field/opsi/link distribusi. Gagal jika ada submission.
 */
const deleteDraftFormCascade = async (formId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [fr] = await connection.execute(`SELECT status FROM forms WHERE form_id = ? FOR UPDATE`, [formId]);
    if (fr.length === 0) {
      await connection.rollback();
      return { ok: false, code: 'NOT_FOUND' };
    }
    if (fr[0].status !== 'DRAFT') {
      await connection.rollback();
      return { ok: false, code: 'NOT_DRAFT' };
    }
    const [sub] = await connection.execute(
      `SELECT COUNT(*) AS c FROM form_submissions WHERE form_id = ?`,
      [formId]
    );
    if (Number(sub[0].c) > 0) {
      await connection.rollback();
      return { ok: false, code: 'HAS_SUBMISSIONS' };
    }
    const [fieldRows] = await connection.execute(`SELECT field_id FROM form_fields WHERE form_id = ?`, [formId]);
    for (const f of fieldRows) {
      await connection.execute(`DELETE FROM form_field_options WHERE field_id = ?`, [f.field_id]);
    }
    await connection.execute(`DELETE FROM form_fields WHERE form_id = ?`, [formId]);
    await connection.execute(`DELETE FROM form_distribution_links WHERE form_id = ?`, [formId]);
    await connection.execute(`DELETE FROM forms WHERE form_id = ?`, [formId]);
    await connection.commit();
    return { ok: true };
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
};

const listDistributionLinksEnriched = async (formId) => {
  const [rows] = await pool.execute(
    `SELECT
        dl.distribution_link_id,
        dl.form_id,
        dl.channel_id,
        dl.link_type,
        dl.link_code,
        dl.created_at,
        ch.name AS channel_name,
        ch.code AS channel_code
      FROM form_distribution_links dl
      LEFT JOIN form_channels ch ON ch.channel_id = dl.channel_id
     WHERE dl.form_id = ?
  ORDER BY
    CASE dl.link_type WHEN 'PRIMARY' THEN 0 ELSE 1 END,
    COALESCE(ch.name, '') ASC,
    dl.created_at ASC`,
    [formId]
  );
  return rows;
};

module.exports = {
  FIELD_TYPES,
  OPTION_FIELD_TYPES,
  listByCampaignId,
  findById,
  findByIdWithCampaignCreator,
  getBuilderDetail,
  createDraftInTransaction,
  updateFormMetadata,
  insertCustomField,
  findFieldById,
  findFieldWithFormCampaign,
  updateField,
  deleteFieldById,
  insertOption,
  findOptionById,
  updateOption,
  deleteOptionById,
  countFieldsByFormId,
  formHasAllLeadCaptureSystemKeys,
  publishDraftForm,
  listDistributionLinksEnriched,
  deactivatePublishedForm,
  setAcceptingResponsesIfPublished,
  deleteDraftFormCascade
};
