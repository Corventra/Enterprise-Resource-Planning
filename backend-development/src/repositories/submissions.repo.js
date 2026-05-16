const { pool } = require('../config/db');
const { buildSummaryFromOrderedAnswers, formatAnswerDisplayValue } = require('../utils/submission-summary');

const mapSubmissionRow = (row) => ({
  submission_id: row.submission_id,
  response_number: Number(row.response_number),
  submitted_at: row.submitted_at,
  distribution_link_id: row.distribution_link_id,
  link_type: row.link_type,
  link_code: row.link_code,
  channel_id: row.channel_id,
  channel_code: row.channel_code,
  channel_name: row.channel_name
});

const fetchOptionsByFieldIds = async (fieldIds) => {
  if (fieldIds.length === 0) return new Map();
  const placeholders = fieldIds.map(() => '?').join(',');
  const [options] = await pool.execute(
    `SELECT option_id, field_id, label, value, sort_order
       FROM form_field_options
      WHERE field_id IN (${placeholders})
      ORDER BY sort_order ASC, option_id ASC`,
    fieldIds
  );
  const byField = new Map();
  for (const o of options) {
    const list = byField.get(o.field_id) || [];
    list.push({ option_id: o.option_id, label: o.label, value: o.value, sort_order: o.sort_order });
    byField.set(o.field_id, list);
  }
  return byField;
};

const fetchAnswersGroupedBySubmission = async (submissionIds, formId) => {
  if (submissionIds.length === 0) return new Map();
  const placeholders = submissionIds.map(() => '?').join(',');
  const [rows] = await pool.execute(
    `SELECT
        a.submission_id,
        a.answer_value,
        a.answer_file_path,
        f.field_id,
        f.field_key,
        f.label,
        f.field_type,
        f.sort_order
      FROM form_submission_answers a
      INNER JOIN form_fields f ON f.field_id = a.field_id
     WHERE a.submission_id IN (${placeholders})
       AND f.form_id = ?
     ORDER BY a.submission_id ASC, f.sort_order ASC, f.field_id ASC`,
    [...submissionIds, formId]
  );
  const fieldIds = [...new Set(rows.map((r) => r.field_id))];
  const optionsByField = await fetchOptionsByFieldIds(fieldIds);
  const grouped = new Map();
  for (const row of rows) {
    const list = grouped.get(row.submission_id) || [];
    list.push({
      field_id: row.field_id,
      field_key: row.field_key,
      label: row.label,
      field_type: row.field_type,
      sort_order: row.sort_order,
      answer_value: row.answer_value,
      answer_file_path: row.answer_file_path,
      options: optionsByField.get(row.field_id) || []
    });
    grouped.set(row.submission_id, list);
  }
  return grouped;
};

const listSubmissionsByFormId = async (formId) => {
  const [rows] = await pool.execute(
    `SELECT
        fs.submission_id,
        fs.submitted_at,
        fs.distribution_link_id,
        fdl.link_type,
        fdl.link_code,
        fdl.channel_id,
        ch.code AS channel_code,
        ch.name AS channel_name,
        ROW_NUMBER() OVER (
          ORDER BY fs.submitted_at ASC, fs.submission_id ASC
        ) AS response_number
      FROM form_submissions fs
      INNER JOIN form_distribution_links fdl
        ON fdl.distribution_link_id = fs.distribution_link_id
      LEFT JOIN form_channels ch ON ch.channel_id = fdl.channel_id
     WHERE fs.form_id = ?
     ORDER BY fs.submitted_at DESC, fs.submission_id DESC`,
    [formId]
  );
  if (rows.length === 0) return [];
  const submissionIds = rows.map((r) => r.submission_id);
  const answersBySubmission = await fetchAnswersGroupedBySubmission(submissionIds, formId);
  return rows.map((row) => {
    const base = mapSubmissionRow(row);
    const orderedAnswers = answersBySubmission.get(row.submission_id) || [];
    return {
      ...base,
      summary_text: buildSummaryFromOrderedAnswers(orderedAnswers)
    };
  });
};

const findSubmissionByIdForForm = async (formId, submissionId) => {
  const [rows] = await pool.execute(
    `SELECT
        fs.submission_id,
        fs.submitted_at,
        fs.distribution_link_id,
        fdl.link_type,
        fdl.link_code,
        fdl.channel_id,
        ch.code AS channel_code,
        ch.name AS channel_name,
        ROW_NUMBER() OVER (
          ORDER BY fs.submitted_at ASC, fs.submission_id ASC
        ) AS response_number
      FROM form_submissions fs
      INNER JOIN form_distribution_links fdl
        ON fdl.distribution_link_id = fs.distribution_link_id
      LEFT JOIN form_channels ch ON ch.channel_id = fdl.channel_id
     WHERE fs.form_id = ?`,
    [formId]
  );
  const match = rows.find((r) => Number(r.submission_id) === Number(submissionId));
  if (!match) return null;

  const [formRows] = await pool.execute(
    `SELECT form_id, form_code, form_category, title, campaign_id
       FROM forms
      WHERE form_id = ?
      LIMIT 1`,
    [formId]
  );
  if (formRows.length === 0) return null;

  const [fieldRows] = await pool.execute(
    `SELECT field_id, field_key, label, field_type, sort_order
       FROM form_fields
      WHERE form_id = ?
      ORDER BY sort_order ASC, field_id ASC`,
    [formId]
  );
  const fieldIds = fieldRows.map((f) => f.field_id);
  const optionsByField = await fetchOptionsByFieldIds(fieldIds);

  const [answerRows] = await pool.execute(
    `SELECT field_id, answer_value, answer_file_path
       FROM form_submission_answers
      WHERE submission_id = ?`,
    [submissionId]
  );
  const answerByField = new Map(answerRows.map((a) => [a.field_id, a]));

  const answers = fieldRows.map((field) => {
    const answer = answerByField.get(field.field_id);
    const options = optionsByField.get(field.field_id) || [];
    const answerValue = answer?.answer_value ?? null;
    const answerFilePath = answer?.answer_file_path ?? null;
    return {
      field_id: field.field_id,
      field_key: field.field_key,
      label: field.label,
      field_type: field.field_type,
      sort_order: field.sort_order,
      answer_value: answerValue,
      answer_display_value: formatAnswerDisplayValue(field.field_type, answerValue, options),
      answer_file_path: answerFilePath,
      options
    };
  });

  return {
    submission: mapSubmissionRow(match),
    form: {
      form_id: formRows[0].form_id,
      form_code: formRows[0].form_code,
      form_category: formRows[0].form_category,
      title: formRows[0].title,
      campaign_id: formRows[0].campaign_id
    },
    answers
  };
};

const countSubmissionsByCampaignId = async (campaignId) => {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
       FROM form_submissions fs
       INNER JOIN forms f ON f.form_id = fs.form_id
      WHERE f.campaign_id = ?`,
    [campaignId]
  );
  return Number(rows[0]?.total ?? 0);
};

module.exports = {
  listSubmissionsByFormId,
  findSubmissionByIdForForm,
  countSubmissionsByCampaignId
};
