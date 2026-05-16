const campaignsRepo = require('../repositories/campaigns.repo');
const formsRepo = require('../repositories/forms.repo');
const { ValidationError, requireString } = require('../utils/validation');
const { buildPublicFormUrl } = require('../utils/form-link');
const { requireDraftForFormWrites } = require('../utils/form-status-guards');
const { safeUnlinkOldUploadFile } = require('../utils/file');

const FORM_CATEGORIES = new Set(['LEAD_CAPTURE', 'GENERAL']);

const imagePathFromUploadedFile = (file) => {
  if (!file || !file.filename) return null;
  return `/uploads/forms/${file.filename}`;
};

const sendError = (res, e) => {
  if (e instanceof ValidationError) {
    return res.status(400).json({ success: false, message: e.message });
  }
  // eslint-disable-next-line no-console
  console.error('[forms.controller] error:', e);
  return res.status(500).json({ success: false, message: 'Internal server error' });
};

const getUserIdFromRequest = (req, res) => {
  const id = Number(req.user?.sub);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(401).json({ success: false, message: 'Token tidak berisi user ID yang valid.' });
    return null;
  }
  return id;
};

const requirePositiveInt = (value, fieldName) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ValidationError(`${fieldName} harus bilangan bulat positif.`);
  }
  return n;
};

const assertCampaignOwnership = (campaign, userId) => Number(campaign.created_by) === Number(userId);

/** Batas panjang selaras kolom MySQL TEXT (~64KB). */
const MAX_RICH_TEXT_HTML_CHARS = 65535;

/**
 * Rich text HTML (description, success_message): simpan string apa adanya — tanpa trim/strip/sanitize.
 * Hanya cek tipe + panjang; null / string kosong / hanya whitespace → null.
 */
const optionalRichTextHtml = (value, fieldName, max = MAX_RICH_TEXT_HTML_CHARS) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} harus berupa string.`);
  }
  if (value.trim().length === 0) return null;
  if (value.length > max) {
    throw new ValidationError(`${fieldName} terlalu panjang (maksimal ${max} karakter).`);
  }
  return value;
};

const optionalNullableString = (value, fieldName, max) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} harus berupa string.`);
  }
  const t = value.trim();
  if (t.length === 0) return null;
  if (t.length > max) {
    throw new ValidationError(`${fieldName} maksimal ${max} karakter.`);
  }
  return t;
};

const parseCreateDraftBody = (body) => {
  const b = body || {};
  if (!FORM_CATEGORIES.has(b.form_category)) {
    throw new ValidationError('form_category wajib dan harus LEAD_CAPTURE atau GENERAL.');
  }
  const title = requireString(b.title, 'title', { min: 1, max: 200 });
  const description = optionalRichTextHtml(b.description, 'description');
  const header_image_path = optionalNullableString(b.header_image_path, 'header_image_path', 255);
  const success_message = optionalRichTextHtml(b.success_message, 'success_message');
  const success_link_url = optionalNullableString(b.success_link_url, 'success_link_url', 255);
  const success_link_label = optionalNullableString(b.success_link_label, 'success_link_label', 100);
  return {
    form_category: b.form_category,
    title,
    description: description === undefined ? null : description,
    header_image_path: header_image_path === undefined ? null : header_image_path,
    success_message: success_message === undefined ? null : success_message,
    success_link_url: success_link_url === undefined ? null : success_link_url,
    success_link_label: success_link_label === undefined ? null : success_link_label
  };
};

const parsePatchFormBody = (body, existingCategory) => {
  const b = body || {};
  if (Object.prototype.hasOwnProperty.call(b, 'form_category') && b.form_category !== existingCategory) {
    throw new ValidationError('form_category tidak boleh diubah setelah form dibuat.');
  }
  const patch = {};
  if (Object.prototype.hasOwnProperty.call(b, 'title')) {
    patch.title = requireString(b.title, 'title', { min: 1, max: 200 });
  }
  if (Object.prototype.hasOwnProperty.call(b, 'description')) {
    patch.description = optionalRichTextHtml(b.description, 'description');
    if (patch.description === undefined) patch.description = null;
  }
  if (Object.prototype.hasOwnProperty.call(b, 'header_image_path')) {
    patch.header_image_path = optionalNullableString(b.header_image_path, 'header_image_path', 255);
    if (patch.header_image_path === undefined) patch.header_image_path = null;
  }
  if (Object.prototype.hasOwnProperty.call(b, 'success_message')) {
    patch.success_message = optionalRichTextHtml(b.success_message, 'success_message');
    if (patch.success_message === undefined) patch.success_message = null;
  }
  if (Object.prototype.hasOwnProperty.call(b, 'success_link_url')) {
    patch.success_link_url = optionalNullableString(b.success_link_url, 'success_link_url', 255);
    if (patch.success_link_url === undefined) patch.success_link_url = null;
  }
  if (Object.prototype.hasOwnProperty.call(b, 'success_link_label')) {
    patch.success_link_label = optionalNullableString(b.success_link_label, 'success_link_label', 100);
    if (patch.success_link_label === undefined) patch.success_link_label = null;
  }
  return patch;
};

const manageFormOrThrow = async (formId, userId) => {
  const row = await formsRepo.findByIdWithCampaignCreator(formId);
  if (!row) {
    const err = new Error('NOT_FOUND');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (Number(row.campaign_created_by) !== Number(userId)) {
    const err = new Error('FORBIDDEN_MANAGE');
    err.code = 'FORBIDDEN_MANAGE';
    throw err;
  }
  return row;
};

const mapDistributionLinkRowToApi = (row) => ({
  distribution_link_id: row.distribution_link_id,
  form_id: row.form_id,
  channel_id: row.channel_id,
  channel_name: row.channel_name ?? null,
  channel_code: row.channel_code ?? null,
  link_type: row.link_type,
  link_code: row.link_code,
  public_url: buildPublicFormUrl(row.link_code),
  created_at: row.created_at
});

const buildDetailWithLinks = async (formId) => {
  const detail = await formsRepo.getBuilderDetail(formId);
  if (!detail) return null;
  let links = [];
  if (detail.form.status !== 'DRAFT') {
    const rows = await formsRepo.listDistributionLinksEnriched(formId);
    links = rows.map(mapDistributionLinkRowToApi);
  }
  return { form: detail.form, fields: detail.fields, links };
};

const assertPublishEligibility = async (formRow, formId) => {
  const title = (formRow.title || '').trim();
  if (!title) {
    throw new ValidationError('Judul form wajib diisi untuk publish.');
  }
  if (!FORM_CATEGORIES.has(formRow.form_category)) {
    throw new ValidationError('Kategori form tidak valid.');
  }
  const n = await formsRepo.countFieldsByFormId(formId);
  if (n < 1) {
    throw new ValidationError('Form harus memiliki minimal satu field sebelum dipublish.');
  }
  if (formRow.form_category === 'LEAD_CAPTURE') {
    const ok = await formsRepo.formHasAllLeadCaptureSystemKeys(formId);
    if (!ok) {
      throw new ValidationError(
        'Form lead capture harus memiliki kelima field sistem wajib (company_name, company_address, contact_name, contact_email, contact_phone).'
      );
    }
  }
};

const listByCampaign = async (req, res) => {
  try {
    const campaignId = requirePositiveInt(req.params.campaignId, 'campaign_id');
    const campaign = await campaignsRepo.findByIdWithJoins(campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign tidak ditemukan.' });
    }
    const forms = await formsRepo.listByCampaignId(campaignId);
    return res.json({ success: true, data: { forms } });
  } catch (e) {
    return sendError(res, e);
  }
};

const createDraft = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId === null) return;
    const campaignId = requirePositiveInt(req.params.campaignId, 'campaign_id');
    const campaign = await campaignsRepo.findByIdWithJoins(campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign tidak ditemukan.' });
    }
    if (!assertCampaignOwnership(campaign, userId)) {
      return res.status(403).json({
        success: false,
        message: 'Anda hanya dapat membuat form pada campaign yang Anda buat.'
      });
    }
    const payload = parseCreateDraftBody(req.body);
    const uploadedHeaderPath = imagePathFromUploadedFile(req.file);
    const formId = await formsRepo.createDraftInTransaction({
      campaignId,
      formCategory: payload.form_category,
      title: payload.title,
      description: payload.description,
      headerImagePath: uploadedHeaderPath ?? payload.header_image_path,
      successMessage: payload.success_message,
      successLinkUrl: payload.success_link_url,
      successLinkLabel: payload.success_link_label,
      createdBy: userId
    });
    const detail = await formsRepo.getBuilderDetail(formId);
    return res.status(201).json({ success: true, message: 'Draft form berhasil dibuat.', data: detail });
  } catch (e) {
    return sendError(res, e);
  }
};

const getDetail = async (req, res) => {
  try {
    const formId = requirePositiveInt(req.params.id, 'form_id');
    const detail = await formsRepo.getBuilderDetail(formId);
    if (!detail) {
      return res.status(404).json({ success: false, message: 'Form tidak ditemukan.' });
    }
    return res.json({ success: true, data: detail });
  } catch (e) {
    return sendError(res, e);
  }
};

const patchForm = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId === null) return;
    const formId = requirePositiveInt(req.params.id, 'form_id');
    let form;
    try {
      form = await manageFormOrThrow(formId, userId);
    } catch (e) {
      if (e.code === 'NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Form tidak ditemukan.' });
      }
      if (e.code === 'FORBIDDEN_MANAGE') {
        return res.status(403).json({
          success: false,
          message: 'Anda hanya dapat mengelola form pada campaign yang Anda buat.'
        });
      }
      throw e;
    }
    requireDraftForFormWrites(form);
    const patch = parsePatchFormBody(req.body, form.form_category);
    const uploadedHeaderPath = imagePathFromUploadedFile(req.file);
    if (uploadedHeaderPath) {
      patch.header_image_path = uploadedHeaderPath;
    }
    if (Object.keys(patch).length === 0) {
      const detail = await formsRepo.getBuilderDetail(formId);
      return res.json({
        success: true,
        message: 'Tidak ada perubahan.',
        data: detail
      });
    }
    const oldHeaderPath = form.header_image_path;
    await formsRepo.updateFormMetadata(formId, patch);
    if (oldHeaderPath) {
      const nextHeaderPath = Object.prototype.hasOwnProperty.call(patch, 'header_image_path')
        ? patch.header_image_path
        : oldHeaderPath;
      if (nextHeaderPath !== oldHeaderPath) {
        await safeUnlinkOldUploadFile(oldHeaderPath);
      }
    }
    const detail = await formsRepo.getBuilderDetail(formId);
    return res.json({ success: true, message: 'Form diperbarui.', data: detail });
  } catch (e) {
    return sendError(res, e);
  }
};

const parseCreateFieldBody = (body) => {
  const b = body || {};
  const field_key = requireString(b.field_key, 'field_key', { min: 1, max: 64 });
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field_key)) {
    throw new ValidationError('field_key harus diawali huruf dan hanya huruf, angka, atau underscore.');
  }
  const label = requireString(b.label, 'label', { min: 1, max: 150 });
  if (!formsRepo.FIELD_TYPES.has(b.field_type)) {
    throw new ValidationError('field_type tidak valid.');
  }
  const placeholder =
    b.placeholder === undefined || b.placeholder === null || b.placeholder === ''
      ? null
      : requireString(b.placeholder, 'placeholder', { min: 1, max: 255 });
  const help_text =
    b.help_text === undefined || b.help_text === null || b.help_text === ''
      ? null
      : requireString(b.help_text, 'help_text', { min: 1, max: 255 });
  let is_required = false;
  if (b.is_required !== undefined && b.is_required !== null) {
    if (typeof b.is_required !== 'boolean') {
      throw new ValidationError('is_required harus boolean.');
    }
    is_required = b.is_required;
  }
  const sort_order = requirePositiveInt(b.sort_order ?? 1, 'sort_order');
  let settings_json = null;
  if (b.settings_json !== undefined && b.settings_json !== null) {
    if (typeof b.settings_json !== 'object' || Array.isArray(b.settings_json)) {
      throw new ValidationError('settings_json harus berupa object JSON.');
    }
    settings_json = b.settings_json;
  }
  return {
    field_key,
    label,
    field_type: b.field_type,
    placeholder,
    help_text,
    is_required,
    sort_order,
    settings_json
  };
};

const addField = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId === null) return;
    const formId = requirePositiveInt(req.params.id, 'form_id');
    let form;
    try {
      form = await manageFormOrThrow(formId, userId);
    } catch (e) {
      if (e.code === 'NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Form tidak ditemukan.' });
      }
      if (e.code === 'FORBIDDEN_MANAGE') {
        return res.status(403).json({
          success: false,
          message: 'Anda hanya dapat mengelola form pada campaign yang Anda buat.'
        });
      }
      throw e;
    }
    requireDraftForFormWrites(form);
    const payload = parseCreateFieldBody(req.body);
    try {
      await formsRepo.insertCustomField({
        formId,
        ...payload
      });
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'field_key sudah digunakan pada form ini.' });
      }
      throw e;
    }
    const detail = await formsRepo.getBuilderDetail(formId);
    return res.status(201).json({ success: true, message: 'Field ditambahkan.', data: detail });
  } catch (e) {
    return sendError(res, e);
  }
};

const parsePatchFieldBody = (body) => {
  const b = body || {};
  const patch = {};
  if (Object.prototype.hasOwnProperty.call(b, 'field_key')) {
    patch.field_key = requireString(b.field_key, 'field_key', { min: 1, max: 64 });
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(patch.field_key)) {
      throw new ValidationError('field_key harus diawali huruf dan hanya huruf, angka, atau underscore.');
    }
  }
  if (Object.prototype.hasOwnProperty.call(b, 'label')) {
    patch.label = requireString(b.label, 'label', { min: 1, max: 150 });
  }
  if (Object.prototype.hasOwnProperty.call(b, 'field_type')) {
    if (!formsRepo.FIELD_TYPES.has(b.field_type)) {
      throw new ValidationError('field_type tidak valid.');
    }
    patch.field_type = b.field_type;
  }
  if (Object.prototype.hasOwnProperty.call(b, 'placeholder')) {
    patch.placeholder =
      b.placeholder === null || b.placeholder === ''
        ? null
        : requireString(b.placeholder, 'placeholder', { min: 1, max: 255 });
  }
  if (Object.prototype.hasOwnProperty.call(b, 'help_text')) {
    patch.help_text =
      b.help_text === null || b.help_text === ''
        ? null
        : requireString(b.help_text, 'help_text', { min: 1, max: 255 });
  }
  if (Object.prototype.hasOwnProperty.call(b, 'is_required')) {
    if (typeof b.is_required !== 'boolean') {
      throw new ValidationError('is_required harus boolean.');
    }
    patch.is_required = b.is_required;
  }
  if (Object.prototype.hasOwnProperty.call(b, 'sort_order')) {
    patch.sort_order = requirePositiveInt(b.sort_order, 'sort_order');
  }
  if (Object.prototype.hasOwnProperty.call(b, 'settings_json')) {
    if (b.settings_json === null) {
      patch.settings_json = null;
    } else if (typeof b.settings_json === 'object' && !Array.isArray(b.settings_json)) {
      patch.settings_json = b.settings_json;
    } else {
      throw new ValidationError('settings_json harus berupa object JSON atau null.');
    }
  }
  return patch;
};

const patchField = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId === null) return;
    const formId = requirePositiveInt(req.params.id, 'form_id');
    const fieldId = requirePositiveInt(req.params.fieldId, 'field_id');
    let form;
    try {
      form = await manageFormOrThrow(formId, userId);
    } catch (e) {
      if (e.code === 'NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Form tidak ditemukan.' });
      }
      if (e.code === 'FORBIDDEN_MANAGE') {
        return res.status(403).json({
          success: false,
          message: 'Anda hanya dapat mengelola form pada campaign yang Anda buat.'
        });
      }
      throw e;
    }
    requireDraftForFormWrites(form);
    const field = await formsRepo.findFieldById(fieldId);
    if (!field || field.form_id !== formId) {
      return res.status(404).json({ success: false, message: 'Field tidak ditemukan pada form ini.' });
    }
    if (field.is_locked || field.is_system) {
      return res.status(403).json({
        success: false,
        message: 'Field sistem terkunci tidak dapat diubah (Phase A).'
      });
    }
    const patch = parsePatchFieldBody(req.body);
    if (Object.keys(patch).length === 0) {
      const detail = await formsRepo.getBuilderDetail(formId);
      return res.json({ success: true, message: 'Tidak ada perubahan.', data: detail });
    }
    try {
      await formsRepo.updateField(fieldId, patch);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'field_key sudah digunakan pada form ini.' });
      }
      throw e;
    }
    const detail = await formsRepo.getBuilderDetail(formId);
    return res.json({ success: true, message: 'Field diperbarui.', data: detail });
  } catch (e) {
    return sendError(res, e);
  }
};

const deleteField = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId === null) return;
    const formId = requirePositiveInt(req.params.id, 'form_id');
    const fieldId = requirePositiveInt(req.params.fieldId, 'field_id');
    let form;
    try {
      form = await manageFormOrThrow(formId, userId);
    } catch (e) {
      if (e.code === 'NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Form tidak ditemukan.' });
      }
      if (e.code === 'FORBIDDEN_MANAGE') {
        return res.status(403).json({
          success: false,
          message: 'Anda hanya dapat mengelola form pada campaign yang Anda buat.'
        });
      }
      throw e;
    }
    requireDraftForFormWrites(form);
    const field = await formsRepo.findFieldById(fieldId);
    if (!field || field.form_id !== formId) {
      return res.status(404).json({ success: false, message: 'Field tidak ditemukan pada form ini.' });
    }
    if (field.is_system || field.is_locked) {
      return res.status(403).json({
        success: false,
        message: 'Field sistem atau terkunci tidak dapat dihapus.'
      });
    }
    await formsRepo.deleteFieldById(fieldId);
    const detail = await formsRepo.getBuilderDetail(formId);
    return res.json({ success: true, message: 'Field dihapus.', data: detail });
  } catch (e) {
    return sendError(res, e);
  }
};

const parseCreateOptionBody = (body) => {
  const b = body || {};
  const label = requireString(b.label, 'label', { min: 1, max: 150 });
  const value = requireString(b.value, 'value', { min: 1, max: 150 });
  let sort_order = 1;
  if (b.sort_order !== undefined && b.sort_order !== null) {
    sort_order = requirePositiveInt(b.sort_order, 'sort_order');
  }
  return { label, value, sort_order };
};

const parsePatchOptionBody = (body) => {
  const b = body || {};
  const patch = {};
  if (Object.prototype.hasOwnProperty.call(b, 'label')) {
    patch.label = requireString(b.label, 'label', { min: 1, max: 150 });
  }
  if (Object.prototype.hasOwnProperty.call(b, 'value')) {
    patch.value = requireString(b.value, 'value', { min: 1, max: 150 });
  }
  if (Object.prototype.hasOwnProperty.call(b, 'sort_order')) {
    patch.sort_order = requirePositiveInt(b.sort_order, 'sort_order');
  }
  return patch;
};

const assertOptionFieldManage = async (fieldId, userId) => {
  const field = await formsRepo.findFieldWithFormCampaign(fieldId);
  if (!field) {
    const err = new Error('FIELD_NOT_FOUND');
    err.code = 'FIELD_NOT_FOUND';
    throw err;
  }
  if (!formsRepo.OPTION_FIELD_TYPES.has(field.field_type)) {
    const err = new ValidationError('Tipe field ini tidak mendukung opsi (select, radio, checkbox).');
    err.code = 'BAD_FIELD_TYPE';
    throw err;
  }
  if (Number(field.campaign_created_by) !== Number(userId)) {
    const err = new Error('FORBIDDEN_MANAGE');
    err.code = 'FORBIDDEN_MANAGE';
    throw err;
  }
  requireDraftForFormWrites({ status: field.form_status });
  return field;
};

const addOption = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId === null) return;
    const fieldId = requirePositiveInt(req.params.fieldId, 'field_id');
    let field;
    try {
      field = await assertOptionFieldManage(fieldId, userId);
    } catch (e) {
      if (e.code === 'FIELD_NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Field tidak ditemukan.' });
      }
      if (e.code === 'FORBIDDEN_MANAGE') {
        return res.status(403).json({
          success: false,
          message: 'Anda hanya dapat mengelola form pada campaign yang Anda buat.'
        });
      }
      if (e instanceof ValidationError) {
        return res.status(400).json({ success: false, message: e.message });
      }
      throw e;
    }
    const payload = parseCreateOptionBody(req.body);
    await formsRepo.insertOption({ fieldId, ...payload });
    const detail = await formsRepo.getBuilderDetail(field.form_id);
    return res.status(201).json({ success: true, message: 'Opsi ditambahkan.', data: detail });
  } catch (e) {
    return sendError(res, e);
  }
};

const patchOption = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId === null) return;
    const fieldId = requirePositiveInt(req.params.fieldId, 'field_id');
    const optionId = requirePositiveInt(req.params.optionId, 'option_id');
    let field;
    try {
      field = await assertOptionFieldManage(fieldId, userId);
    } catch (e) {
      if (e.code === 'FIELD_NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Field tidak ditemukan.' });
      }
      if (e.code === 'FORBIDDEN_MANAGE') {
        return res.status(403).json({
          success: false,
          message: 'Anda hanya dapat mengelola form pada campaign yang Anda buat.'
        });
      }
      if (e instanceof ValidationError) {
        return res.status(400).json({ success: false, message: e.message });
      }
      throw e;
    }
    const existingOpt = await formsRepo.findOptionById(optionId);
    if (!existingOpt || existingOpt.field_id !== fieldId) {
      return res.status(404).json({ success: false, message: 'Opsi tidak ditemukan pada field ini.' });
    }
    const patch = parsePatchOptionBody(req.body);
    if (Object.keys(patch).length === 0) {
      const detail = await formsRepo.getBuilderDetail(field.form_id);
      return res.json({ success: true, message: 'Tidak ada perubahan.', data: detail });
    }
    await formsRepo.updateOption(optionId, patch);
    const detail = await formsRepo.getBuilderDetail(field.form_id);
    return res.json({ success: true, message: 'Opsi diperbarui.', data: detail });
  } catch (e) {
    return sendError(res, e);
  }
};

const deleteOption = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId === null) return;
    const fieldId = requirePositiveInt(req.params.fieldId, 'field_id');
    const optionId = requirePositiveInt(req.params.optionId, 'option_id');
    let field;
    try {
      field = await assertOptionFieldManage(fieldId, userId);
    } catch (e) {
      if (e.code === 'FIELD_NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Field tidak ditemukan.' });
      }
      if (e.code === 'FORBIDDEN_MANAGE') {
        return res.status(403).json({
          success: false,
          message: 'Anda hanya dapat mengelola form pada campaign yang Anda buat.'
        });
      }
      if (e instanceof ValidationError) {
        return res.status(400).json({ success: false, message: e.message });
      }
      throw e;
    }
    const existingOpt = await formsRepo.findOptionById(optionId);
    if (!existingOpt || existingOpt.field_id !== fieldId) {
      return res.status(404).json({ success: false, message: 'Opsi tidak ditemukan pada field ini.' });
    }
    await formsRepo.deleteOptionById(optionId);
    const detail = await formsRepo.getBuilderDetail(field.form_id);
    return res.json({ success: true, message: 'Opsi dihapus.', data: detail });
  } catch (e) {
    return sendError(res, e);
  }
};

const publishForm = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId === null) return;
    const formId = requirePositiveInt(req.params.id, 'form_id');
    let formRow;
    try {
      formRow = await manageFormOrThrow(formId, userId);
    } catch (e) {
      if (e.code === 'NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Form tidak ditemukan.' });
      }
      if (e.code === 'FORBIDDEN_MANAGE') {
        return res.status(403).json({
          success: false,
          message: 'Anda hanya dapat mengelola form pada campaign yang Anda buat.'
        });
      }
      throw e;
    }
    if (formRow.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Hanya form berstatus DRAFT yang dapat dipublish.'
      });
    }
    await assertPublishEligibility(formRow, formId);
    const result = await formsRepo.publishDraftForm(formId);
    if (!result.ok) {
      if (result.code === 'NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Form tidak ditemukan.' });
      }
      if (result.code === 'NOT_DRAFT' || result.code === 'CONFLICT') {
        return res.status(400).json({
          success: false,
          message: 'Form tidak dapat dipublish pada status saat ini.'
        });
      }
      if (result.code === 'NO_FORM_CODE') {
        return res.status(400).json({
          success: false,
          message: 'Form tidak memiliki form_code; hubungi administrator.'
        });
      }
      return res.status(400).json({ success: false, message: 'Publish gagal.' });
    }
    const data = await buildDetailWithLinks(formId);
    return res.json({ success: true, message: 'Form berhasil dipublish.', data });
  } catch (e) {
    return sendError(res, e);
  }
};

const getLinks = async (req, res) => {
  try {
    const formId = requirePositiveInt(req.params.id, 'form_id');
    const detail = await formsRepo.getBuilderDetail(formId);
    if (!detail) {
      return res.status(404).json({ success: false, message: 'Form tidak ditemukan.' });
    }
    if (detail.form.status === 'DRAFT') {
      return res.json({ success: true, data: { links: [] } });
    }
    const rows = await formsRepo.listDistributionLinksEnriched(formId);
    const links = rows.map(mapDistributionLinkRowToApi);
    return res.json({ success: true, data: { links } });
  } catch (e) {
    return sendError(res, e);
  }
};

const pauseResponses = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId === null) return;
    const formId = requirePositiveInt(req.params.id, 'form_id');
    let formRow;
    try {
      formRow = await manageFormOrThrow(formId, userId);
    } catch (e) {
      if (e.code === 'NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Form tidak ditemukan.' });
      }
      if (e.code === 'FORBIDDEN_MANAGE') {
        return res.status(403).json({
          success: false,
          message: 'Anda hanya dapat mengelola form pada campaign yang Anda buat.'
        });
      }
      throw e;
    }
    if (formRow.status !== 'PUBLISHED') {
      return res.status(400).json({
        success: false,
        message: 'Jeda respons hanya untuk form berstatus Published.'
      });
    }
    await formsRepo.setAcceptingResponsesIfPublished(formId, false);
    const detail = await formsRepo.getBuilderDetail(formId);
    return res.json({ success: true, message: 'Respons dijeda.', data: detail });
  } catch (e) {
    return sendError(res, e);
  }
};

const resumeResponses = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId === null) return;
    const formId = requirePositiveInt(req.params.id, 'form_id');
    let formRow;
    try {
      formRow = await manageFormOrThrow(formId, userId);
    } catch (e) {
      if (e.code === 'NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Form tidak ditemukan.' });
      }
      if (e.code === 'FORBIDDEN_MANAGE') {
        return res.status(403).json({
          success: false,
          message: 'Anda hanya dapat mengelola form pada campaign yang Anda buat.'
        });
      }
      throw e;
    }
    if (formRow.status !== 'PUBLISHED') {
      return res.status(400).json({
        success: false,
        message: 'Lanjutkan respons hanya untuk form berstatus Published.'
      });
    }
    await formsRepo.setAcceptingResponsesIfPublished(formId, true);
    const detail = await formsRepo.getBuilderDetail(formId);
    return res.json({ success: true, message: 'Respons dilanjutkan.', data: detail });
  } catch (e) {
    return sendError(res, e);
  }
};

const deactivateForm = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId === null) return;
    const formId = requirePositiveInt(req.params.id, 'form_id');
    try {
      await manageFormOrThrow(formId, userId);
    } catch (e) {
      if (e.code === 'NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Form tidak ditemukan.' });
      }
      if (e.code === 'FORBIDDEN_MANAGE') {
        return res.status(403).json({
          success: false,
          message: 'Anda hanya dapat mengelola form pada campaign yang Anda buat.'
        });
      }
      throw e;
    }
    const n = await formsRepo.deactivatePublishedForm(formId);
    if (n === 0) {
      return res.status(400).json({
        success: false,
        message: 'Hanya form berstatus PUBLISHED yang dapat dinonaktifkan.'
      });
    }
    const detail = await formsRepo.getBuilderDetail(formId);
    return res.json({ success: true, message: 'Form dinonaktifkan.', data: detail });
  } catch (e) {
    return sendError(res, e);
  }
};

const deleteDraftForm = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId === null) return;
    const formId = requirePositiveInt(req.params.id, 'form_id');
    let formRow;
    try {
      formRow = await manageFormOrThrow(formId, userId);
    } catch (e) {
      if (e.code === 'NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Form tidak ditemukan.' });
      }
      if (e.code === 'FORBIDDEN_MANAGE') {
        return res.status(403).json({
          success: false,
          message: 'Anda hanya dapat mengelola form pada campaign yang Anda buat.'
        });
      }
      throw e;
    }
    if (formRow.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Hanya form berstatus DRAFT yang dapat dihapus.'
      });
    }
    const result = await formsRepo.deleteDraftFormCascade(formId);
    if (!result.ok) {
      if (result.code === 'NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Form tidak ditemukan.' });
      }
      if (result.code === 'NOT_DRAFT') {
        return res.status(400).json({
          success: false,
          message: 'Hanya form berstatus DRAFT yang dapat dihapus.'
        });
      }
      if (result.code === 'HAS_SUBMISSIONS') {
        return res.status(400).json({
          success: false,
          message: 'Form tidak dapat dihapus karena sudah memiliki submission.'
        });
      }
      return res.status(400).json({ success: false, message: 'Penghapusan form gagal.' });
    }
    return res.json({ success: true, message: 'Draft form dihapus.' });
  } catch (e) {
    return sendError(res, e);
  }
};

module.exports = {
  listByCampaign,
  createDraft,
  getDetail,
  patchForm,
  addField,
  patchField,
  deleteField,
  addOption,
  patchOption,
  deleteOption,
  publishForm,
  getLinks,
  pauseResponses,
  resumeResponses,
  deactivateForm,
  deleteDraftForm
};
