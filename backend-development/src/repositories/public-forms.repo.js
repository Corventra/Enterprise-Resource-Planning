const { pool } = require('../config/db');

const mapFormPublicRow = (row) => ({
  form_id: row.form_id,
  form_code: row.form_code,
  form_category: row.form_category,
  title: row.title,
  description: row.description,
  header_image_path: row.header_image_path,
  success_message: row.success_message,
  success_link_url: row.success_link_url,
  success_link_label: row.success_link_label,
  status: row.status,
  is_accepting_responses: Boolean(row.is_accepting_responses)
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
  settings_json: row.settings_json ?? null
});

const mapOptionRow = (row) => ({
  option_id: row.option_id,
  field_id: row.field_id,
  label: row.label,
  value: row.value,
  sort_order: row.sort_order
});

/**
 * Lookup distribusi + form + channel untuk satu link_code.
 */
const findByLinkCode = async (linkCode) => {
  const [rows] = await pool.execute(
    `SELECT
        dl.distribution_link_id,
        dl.form_id,
        dl.channel_id,
        dl.link_type,
        dl.link_code,
        f.form_code AS f_form_code,
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
        ch.name AS channel_name,
        ch.code AS channel_code
      FROM form_distribution_links dl
      INNER JOIN forms f ON f.form_id = dl.form_id
      LEFT JOIN form_channels ch ON ch.channel_id = dl.channel_id
     WHERE dl.link_code = ?
     LIMIT 1`,
    [linkCode]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    distribution_link_id: r.distribution_link_id,
    form_id: r.form_id,
    channel_id: r.channel_id,
    link_type: r.link_type,
    link_code: r.link_code,
    channel_name: r.channel_name ?? null,
    channel_code: r.channel_code ?? null,
    campaign_id: r.campaign_id,
    form: mapFormPublicRow({
      form_id: r.form_id,
      form_code: r.f_form_code,
      form_category: r.form_category,
      title: r.title,
      description: r.description,
      header_image_path: r.header_image_path,
      success_message: r.success_message,
      success_link_url: r.success_link_url,
      success_link_label: r.success_link_label,
      status: r.status,
      is_accepting_responses: r.is_accepting_responses
    })
  };
};

const fetchFieldsWithOptions = async (formId) => {
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

/**
 * Satu transaksi: submission + answers + optional lead (LEAD_CAPTURE).
 * @param {{ formId: number, distributionLinkId: number, campaignId: number, formCategory: string, answerRows: { field_id: number, answer_value: string|null, answer_file_path: string|null }[], leadPayload: object|null }} params
 */
const insertSubmissionAnswersAndOptionalLead = async ({
  formId,
  distributionLinkId,
  campaignId,
  formCategory,
  answerRows,
  leadPayload
}) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [insSub] = await conn.execute(
      `INSERT INTO form_submissions (form_id, distribution_link_id) VALUES (?, ?)`,
      [formId, distributionLinkId]
    );
    const submissionId = insSub.insertId;
    for (const row of answerRows) {
      await conn.execute(
        `INSERT INTO form_submission_answers (submission_id, field_id, answer_value, answer_file_path)
         VALUES (?, ?, ?, ?)`,
        [submissionId, row.field_id, row.answer_value, row.answer_file_path]
      );
    }
    if (leadPayload && formCategory === 'LEAD_CAPTURE') {
      await conn.execute(
        `INSERT INTO leads (
          campaign_id, form_id, submission_id, distribution_link_id, source_type,
          company_name, company_address, pic_name, email, phone_number, desired_services,
          bank_data_status
        ) VALUES (?,?,?,?, 'FORM_LEAD_CAPTURE',?,?,?,?,?, NULL, 'NEW')`,
        [
          campaignId,
          formId,
          submissionId,
          distributionLinkId,
          leadPayload.company_name,
          leadPayload.company_address,
          leadPayload.pic_name,
          leadPayload.email,
          leadPayload.phone_number
        ]
      );
    }
    await conn.commit();
    return submissionId;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

module.exports = {
  findByLinkCode,
  fetchFieldsWithOptions,
  insertSubmissionAnswersAndOptionalLead
};
