const publicFormsRepo = require('../repositories/public-forms.repo');
const { ValidationError } = require('../utils/validation');
const { safeUnlinkOldUploadFile } = require('../utils/file');
const { validateUploadedSubmissionFile } = require('../utils/form-file-settings');

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const sendError = (res, e) => {
  if (e instanceof ValidationError) {
    return res.status(400).json({ success: false, message: e.message });
  }
  // eslint-disable-next-line no-console
  console.error('[public-forms.controller] error:', e);
  return res.status(500).json({ success: false, message: 'Internal server error' });
};

/**
 * @param {{ status: string, is_accepting_responses: boolean }} form
 * @returns {'DRAFT'|'INACTIVE'|'PAUSED'|'AVAILABLE'}
 */
const resolveAvailability = (form) => {
  if (form.status === 'DRAFT') return 'DRAFT';
  if (form.status === 'INACTIVE') return 'INACTIVE';
  if (form.status === 'PUBLISHED' && !form.is_accepting_responses) return 'PAUSED';
  if (form.status === 'PUBLISHED' && form.is_accepting_responses) return 'AVAILABLE';
  return 'INACTIVE';
};

const mapPublicField = (field) => {
  const mapped = {
    field_id: field.field_id,
    field_key: field.field_key,
    label: field.label,
    field_type: field.field_type,
    placeholder: field.placeholder,
    help_text: field.help_text,
    is_required: field.is_required,
    sort_order: field.sort_order,
    options: (field.options || []).map((o) => ({
      option_id: o.option_id,
      label: o.label,
      value: o.value,
      sort_order: o.sort_order
    }))
  };
  if (field.field_type === 'file') {
    mapped.settings_json = field.settings_json ?? null;
  }
  return mapped;
};

const normalizeLinkCodeParam = (raw) => {
  if (raw == null || typeof raw !== 'string') return '';
  return decodeURIComponent(raw).trim();
};

const requirePositiveIntId = (value, label) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ValidationError(`${label} tidak valid.`);
  }
  return n;
};

const isEmptyRaw = (raw) => {
  if (raw === undefined || raw === null) return true;
  if (Array.isArray(raw)) return raw.length === 0;
  if (typeof raw === 'string') return raw.trim() === '';
  return false;
};

const parseCheckboxRaw = (raw) => {
  if (Array.isArray(raw)) return raw.map((v) => String(v));
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t.startsWith('[')) {
      try {
        const p = JSON.parse(t);
        if (Array.isArray(p)) return p.map((v) => String(v));
      } catch {
        /* fallthrough */
      }
    }
    return [t];
  }
  if (raw === undefined || raw === null) return [];
  return [String(raw)];
};

const validateFormatByField = (field, storedString) => {
  if (storedString === null || storedString === '') return;

  if (field.field_key === 'contact_email') {
    if (!EMAIL_RE.test(storedString) || storedString.length > 190) {
      throw new ValidationError('Email kontak tidak valid.');
    }
    return;
  }

  if (field.field_key === 'contact_phone') {
    const cleaned = storedString.replace(/[\s-]/g, '');
    const digitCount = cleaned.replace(/\D/g, '').length;
    if (!/^\+?[0-9]+$/.test(cleaned) || digitCount < 7 || digitCount > 13) {
      throw new ValidationError('Nomor telepon kontak harus 7–13 digit.');
    }
    return;
  }

  if (field.field_type === 'date') {
    const t = Date.parse(storedString);
    if (Number.isNaN(t)) {
      throw new ValidationError('Tanggal tidak valid.');
    }
  }
};

const validateOptionValues = (field, storedString) => {
  const allowed = new Set((field.options || []).map((o) => o.value));
  if (allowed.size === 0) {
    throw new ValidationError(`Field "${field.label}" tidak memiliki opsi yang valid.`);
  }
  if (field.field_type === 'checkbox') {
    let values;
    try {
      values = JSON.parse(storedString);
    } catch {
      throw new ValidationError(`Field "${field.label}" format jawaban tidak valid.`);
    }
    if (!Array.isArray(values)) {
      throw new ValidationError(`Field "${field.label}" format jawaban tidak valid.`);
    }
    for (const v of values) {
      if (!allowed.has(String(v))) {
        throw new ValidationError(`Nilai opsi tidak valid untuk field "${field.label}".`);
      }
    }
    return;
  }
  if (!allowed.has(storedString)) {
    throw new ValidationError(`Nilai opsi tidak valid untuk field "${field.label}".`);
  }
};

/**
 * Normalisasi nilai ke string untuk disimpan di answer_value.
 * Checkbox multi -> JSON string array of values.
 */
const coerceAnswerToStoredString = (field, raw) => {
  const { field_type: fieldType, options } = field;
  if (fieldType === 'file') {
    return null;
  }
  if (isEmptyRaw(raw)) {
    if (fieldType === 'checkbox') return null;
    return null;
  }
  if (fieldType === 'checkbox') {
    const parts = parseCheckboxRaw(raw).map((s) => s.trim()).filter(Boolean);
    const allowed = new Set((options || []).map((o) => o.value));
    for (const p of parts) {
      if (!allowed.has(p)) {
        throw new ValidationError(`Nilai opsi tidak valid untuk field "${field.label}".`);
      }
    }
    const unique = [...new Set(parts)].sort();
    return unique.length === 0 ? null : JSON.stringify(unique);
  }
  let s;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    s = String(raw);
  } else if (typeof raw !== 'string') {
    throw new ValidationError(`Field "${field.label}" harus berupa teks.`);
  } else {
    s = raw.trim();
  }
  if (fieldType === 'textarea' || fieldType === 'text') {
    if (s.length > 65535) {
      throw new ValidationError(`Field "${field.label}" terlalu panjang.`);
    }
  }
  if (fieldType === 'select' || fieldType === 'radio') {
    validateOptionValues(field, s);
  }
  validateFormatByField(field, s);
  return s;
};

const parseAnswersArray = (answers, label) => {
  if (!Array.isArray(answers)) {
    throw new ValidationError(`${label} harus berupa array.`);
  }
  const map = new Map();
  for (let i = 0; i < answers.length; i += 1) {
    const item = answers[i];
    if (!item || typeof item !== 'object') {
      throw new ValidationError(`${label}[${i}] tidak valid.`);
    }
    const fieldId = requirePositiveIntId(item.field_id, 'field_id');
    if (map.has(fieldId)) {
      throw new ValidationError(`field_id ${fieldId} duplikat dalam ${label}.`);
    }
    map.set(fieldId, item.value);
  }
  return map;
};

const parseAnswersInput = (req) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    const raw = req.body?.answers_json;
    if (typeof raw !== 'string' || raw.trim() === '') {
      throw new ValidationError('answers_json wajib untuk submit multipart.');
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new ValidationError('answers_json tidak valid.');
    }
    return parseAnswersArray(parsed, 'answers_json');
  }
  const b = req.body || {};
  if (!Array.isArray(b.answers)) {
    throw new ValidationError('Body harus memiliki array "answers".');
  }
  return parseAnswersArray(b.answers, 'answers');
};

const dbPathFromUploadedFile = (file) => {
  if (!file || !file.filename) return null;
  return `/uploads/form-submissions/${file.filename}`;
};

const parseUploadedFilesByFieldId = (files) => {
  const map = new Map();
  for (const file of files || []) {
    const match = /^file_(\d+)$/.exec(file.fieldname || '');
    if (!match) {
      throw new ValidationError(`Field upload "${file.fieldname}" tidak valid.`);
    }
    const fieldId = requirePositiveIntId(match[1], 'field_id');
    if (map.has(fieldId)) {
      throw new ValidationError(`Hanya satu file yang diizinkan per field (field_id ${fieldId}).`);
    }
    map.set(fieldId, file);
  }
  return map;
};

const cleanupUploadedSubmissionFiles = async (paths) => {
  for (const dbPath of paths) {
    await safeUnlinkOldUploadFile(dbPath);
  }
};

const buildLeadPayloadFromAnswers = (fields, answerByFieldId) => {
  const byKey = {};
  for (const f of fields) {
    const v = answerByFieldId.get(f.field_id);
    if (v != null && v !== '') {
      byKey[f.field_key] = typeof v === 'string' ? v : String(v);
    } else {
      byKey[f.field_key] = '';
    }
  }
  const keys = ['company_name', 'company_address', 'contact_name', 'contact_email', 'contact_phone'];
  for (const k of keys) {
    const t = (byKey[k] || '').trim();
    if (!t) {
      throw new ValidationError(`Field wajib lead (${k}) harus diisi.`);
    }
    byKey[k] = t;
  }
  if (!EMAIL_RE.test(byKey.contact_email) || byKey.contact_email.length > 190) {
    throw new ValidationError('Email kontak tidak valid.');
  }
  const phoneCleaned = byKey.contact_phone.replace(/[\s-]/g, '');
  const phoneDigitCount = phoneCleaned.replace(/\D/g, '').length;
  if (!/^\+?[0-9]+$/.test(phoneCleaned) || phoneDigitCount < 7 || phoneDigitCount > 13) {
    throw new ValidationError('Nomor telepon kontak harus 7–13 digit.');
  }
  if (byKey.company_name.length > 200 || byKey.company_address.length > 255 || byKey.contact_name.length > 150) {
    throw new ValidationError('Satu atau lebih field lead melebihi panjang yang diizinkan.');
  }
  return {
    company_name: byKey.company_name.slice(0, 200),
    company_address: byKey.company_address.slice(0, 255),
    pic_name: byKey.contact_name.slice(0, 150),
    email: byKey.contact_email.toLowerCase().slice(0, 190),
    phone_number: byKey.contact_phone.slice(0, 50)
  };
};

const getSubmitBlockedMessage = (availability) => {
  if (availability === 'DRAFT') return 'Form belum dipublikasi.';
  if (availability === 'PAUSED') return 'Form sedang dijeda dan tidak menerima respons.';
  if (availability === 'INACTIVE') return 'Form tidak aktif.';
  return 'Form tidak dapat menerima respons saat ini.';
};

const getPublicForm = async (req, res) => {
  try {
    const linkCode = normalizeLinkCodeParam(req.params.linkCode);
    if (!linkCode) {
      return res.status(404).json({
        success: false,
        message: 'Tautan form tidak ditemukan.',
        data: { availability: 'NOT_FOUND' }
      });
    }
    const row = await publicFormsRepo.findByLinkCode(linkCode);
    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Tautan form tidak ditemukan.',
        data: { availability: 'NOT_FOUND' }
      });
    }
    const fields = await publicFormsRepo.fetchFieldsWithOptions(row.form_id);
    const availability = resolveAvailability(row.form);
    return res.json({
      success: true,
      data: {
        availability,
        form: row.form,
        link: {
          distribution_link_id: row.distribution_link_id,
          link_code: row.link_code,
          link_type: row.link_type,
          channel_id: row.channel_id,
          channel_code: row.channel_code,
          channel_name: row.channel_name
        },
        fields: fields.map(mapPublicField)
      }
    });
  } catch (e) {
    return sendError(res, e);
  }
};

const submitPublicForm = async (req, res) => {
  try {
    const linkCode = normalizeLinkCodeParam(req.params.linkCode);
    if (!linkCode) {
      return res.status(404).json({
        success: false,
        message: 'Tautan form tidak ditemukan.',
        data: { availability: 'NOT_FOUND' }
      });
    }
    const row = await publicFormsRepo.findByLinkCode(linkCode);
    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Tautan form tidak ditemukan.',
        data: { availability: 'NOT_FOUND' }
      });
    }
    const availability = resolveAvailability(row.form);
    if (availability !== 'AVAILABLE') {
      return res.status(403).json({
        success: false,
        message: getSubmitBlockedMessage(availability),
        data: { availability }
      });
    }

    const answerMap = parseAnswersInput(req);
    const filesByFieldId = parseUploadedFilesByFieldId(req.files);
    const fields = await publicFormsRepo.fetchFieldsWithOptions(row.form_id);
    const fieldById = new Map(fields.map((f) => [f.field_id, f]));
    const uploadedDbPaths = [];

    const answerRows = [];
    const normalizedByFieldId = new Map();

    try {
      for (const field of fields) {
        if (field.field_type === 'file') {
          const uploaded = filesByFieldId.get(field.field_id);
          if (!uploaded) {
            if (field.is_required) {
              throw new ValidationError(`Field wajib "${field.label}" membutuhkan file.`);
            }
            continue;
          }
          validateUploadedSubmissionFile(field, uploaded);
          const answerFilePath = dbPathFromUploadedFile(uploaded);
          uploadedDbPaths.push(answerFilePath);
          answerRows.push({
            field_id: field.field_id,
            answer_value: null,
            answer_file_path: answerFilePath
          });
          continue;
        }

        const raw = answerMap.get(field.field_id);
        const stored = coerceAnswerToStoredString(field, raw);
        if (field.is_required && (stored === null || stored === '')) {
          throw new ValidationError(`Field wajib "${field.label}" harus diisi.`);
        }
        if (stored !== null && stored !== '') {
          answerRows.push({
            field_id: field.field_id,
            answer_value: stored,
            answer_file_path: null
          });
          normalizedByFieldId.set(field.field_id, stored);
        } else if (!field.is_required) {
          /* optional kosong: tidak simpan baris answer */
        } else {
          throw new ValidationError(`Field wajib "${field.label}" harus diisi.`);
        }
      }

      for (const [fid] of answerMap.entries()) {
        const field = fieldById.get(fid);
        if (!field) {
          throw new ValidationError(`field_id ${fid} bukan milik form ini.`);
        }
        if (field.field_type === 'file') {
          throw new ValidationError(`Field file "${field.label}" harus dikirim sebagai file upload.`);
        }
      }

      for (const [fid, file] of filesByFieldId.entries()) {
        const field = fieldById.get(fid);
        if (!field) {
          throw new ValidationError(`field_id ${fid} bukan milik form ini.`);
        }
        if (field.field_type !== 'file') {
          throw new ValidationError(`Field "${field.label}" bukan field file.`);
        }
        if (!uploadedDbPaths.includes(dbPathFromUploadedFile(file))) {
          throw new ValidationError(`File untuk field "${field.label}" tidak valid.`);
        }
      }

      let leadPayload = null;
      if (row.form.form_category === 'LEAD_CAPTURE') {
        leadPayload = buildLeadPayloadFromAnswers(fields, normalizedByFieldId);
      }

      const submissionId = await publicFormsRepo.insertSubmissionAnswersAndOptionalLead({
        formId: row.form_id,
        distributionLinkId: row.distribution_link_id,
        campaignId: row.campaign_id,
        formCategory: row.form.form_category,
        answerRows,
        leadPayload
      });

      return res.status(201).json({
        success: true,
        message: 'Form berhasil dikirim.',
        data: {
          submission_id: submissionId,
          success_message: row.form.success_message,
          success_link_url: row.form.success_link_url,
          success_link_label: row.form.success_link_label
        }
      });
    } catch (e) {
      await cleanupUploadedSubmissionFiles(uploadedDbPaths);
      throw e;
    }
  } catch (e) {
    return sendError(res, e);
  }
};

module.exports = {
  getPublicForm,
  submitPublicForm
};
