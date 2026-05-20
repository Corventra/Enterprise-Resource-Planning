const { pool } = require('../config/db');
const { safeUnlinkOldUploadFile } = require('../utils/file');
const { buildHandoverDetailPayload } = require('./handover.repo');
const { recomputeDerivedHandoverChecklist } = require('../utils/handover-checklist');
const { formatSqlDate } = require('../utils/sql-date');

const normalizeHandoverId = (handoverId) => {
  const n = Number(handoverId);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
};

const normalizeOptionalDate = (v) => {
  if (v === undefined || v === null || String(v).trim() === '') {
    return { ok: true, value: null };
  }
  const formatted = formatSqlDate(v);
  if (formatted == null || !/^\d{4}-\d{2}-\d{2}$/.test(formatted)) {
    return { ok: false, message: 'Format tanggal harus YYYY-MM-DD.' };
  }
  return { ok: true, value: formatted };
};

const trimOrNull = (v, maxLen) => {
  if (v === undefined || v === null) {
    return { ok: true, value: null };
  }
  const s = String(v).trim();
  if (s === '') {
    return { ok: true, value: null };
  }
  if (maxLen && s.length > maxLen) {
    return { ok: false, message: `Teks maksimal ${maxLen} karakter.` };
  }
  return { ok: true, value: s };
};

const parsePayload = (raw) => {
  if (raw === undefined || raw === null) {
    return { ok: false, message: 'Payload wajib diisi.' };
  }
  let body = raw;
  if (typeof raw === 'string') {
    try {
      body = JSON.parse(raw);
    } catch {
      return { ok: false, message: 'Payload JSON tidak valid.' };
    }
  }
  if (!body || typeof body !== 'object') {
    return { ok: false, message: 'Payload tidak valid.' };
  }
  return { ok: true, body };
};

const stringArray = (arr, label) => {
  if (!Array.isArray(arr)) return { ok: false, message: `${label} harus berupa array.` };
  const values = arr.map((item) => String(item ?? '').trim()).filter((s) => s.length > 0);
  return { ok: true, values };
};

const fetchHandoverForUpdate = async (conn, handoverId) => {
  const [rows] = await conn.execute(
    `SELECT h.handover_id, h.lead_id, h.status, l.processed_by
       FROM handovers h
       INNER JOIN leads l ON l.lead_id = h.lead_id
      WHERE h.handover_id = ?
      FOR UPDATE`,
    [handoverId]
  );
  return rows[0] ?? null;
};

const assertLeadOperator = (row, userId) => {
  if (row.processed_by == null || Number(row.processed_by) !== Number(userId)) {
    return { ok: false, reason: 'FORBIDDEN' };
  }
  return { ok: true };
};

const EDITABLE_HANDOVER_STATUSES = ['DRAFT', 'NEED_REVISION'];

const isEditableHandoverStatus = (status) => EDITABLE_HANDOVER_STATUSES.includes(status);

const replaceScopeItems = async (conn, handoverId, included, excluded, deliverables) => {
  await conn.execute(`DELETE FROM handover_scope_items WHERE handover_id = ?`, [handoverId]);
  let order = 1;
  const insert = async (itemType, texts) => {
    for (const text of texts) {
      await conn.execute(
        `INSERT INTO handover_scope_items (handover_id, item_type, item_text, sort_order)
         VALUES (?, ?, ?, ?)`,
        [handoverId, itemType, text, order]
      );
      order += 1;
    }
  };
  await insert('INCLUDED', included);
  await insert('EXCLUDED', excluded);
  await insert('DELIVERABLE', deliverables);
};

const replaceMilestones = async (conn, handoverId, milestones) => {
  await conn.execute(`DELETE FROM handover_milestones WHERE handover_id = ?`, [handoverId]);
  let order = 1;
  for (const m of milestones) {
    const name = String(m.milestone_name ?? m.milestone ?? '').trim();
    if (!name) continue;
    const dateParsed = normalizeOptionalDate(m.target_date);
    const targetDate = dateParsed.ok ? dateParsed.value : null;
    const notes = m.notes != null && String(m.notes).trim() !== '' ? String(m.notes).trim() : null;
    await conn.execute(
      `INSERT INTO handover_milestones (handover_id, milestone_name, target_date, notes, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
      [handoverId, name, targetDate, notes, order]
    );
    order += 1;
  }
};

const replaceSimpleTextRows = async (conn, table, handoverId, column, texts) => {
  await conn.execute(`DELETE FROM ${table} WHERE handover_id = ?`, [handoverId]);
  let order = 1;
  for (const text of texts) {
    await conn.execute(
      `INSERT INTO ${table} (handover_id, ${column}, sort_order) VALUES (?, ?, ?)`,
      [handoverId, text, order]
    );
    order += 1;
  }
};

const replaceInternalProtocols = async (conn, handoverId, items) => {
  await conn.execute(`DELETE FROM handover_internal_protocols WHERE handover_id = ?`, [handoverId]);
  let order = 1;
  for (const text of items) {
    await conn.execute(
      `INSERT INTO handover_internal_protocols (handover_id, instruction_text, sort_order)
       VALUES (?, ?, ?)`,
      [handoverId, text, order]
    );
    order += 1;
  }
};

const replaceExternalProtocols = async (conn, handoverId, items) => {
  await conn.execute(`DELETE FROM handover_external_protocols WHERE handover_id = ?`, [handoverId]);
  let order = 1;
  for (const item of items) {
    const role = String(item.role_label ?? item.role ?? '').trim();
    const name = String(item.contact_name ?? item.name ?? '').trim();
    const contact = String(item.contact_text ?? item.contact ?? '').trim();
    if (!role || !name || !contact) continue;
    const instruction =
      item.instruction != null && String(item.instruction).trim() !== ''
        ? String(item.instruction).trim()
        : null;
    await conn.execute(
      `INSERT INTO handover_external_protocols (
          handover_id, role_label, contact_name, contact_text, instruction, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?)`,
      [handoverId, role, name, contact, instruction, order]
    );
    order += 1;
  }
};

const replaceTeamRequirements = async (conn, handoverId, items) => {
  await conn.execute(`DELETE FROM handover_team_requirements WHERE handover_id = ?`, [handoverId]);
  let order = 1;
  for (const item of items) {
    const role = String(item.role_name ?? item.role ?? '').trim();
    const needed = String(item.needed ?? item.name ?? '').trim();
    const responsibilities = String(item.responsibilities ?? '').trim();
    if (!role || !needed || !responsibilities) continue;
    const notes =
      item.notes != null && String(item.notes).trim() !== '' ? String(item.notes).trim() : null;
    await conn.execute(
      `INSERT INTO handover_team_requirements (
          handover_id, role_name, needed, responsibilities, notes, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?)`,
      [handoverId, role, needed, responsibilities, notes, order]
    );
    order += 1;
  }
};

const insertClientDocuments = async (conn, { handoverId, leadId, files, userId }) => {
  if (!files || files.length === 0) return;
  for (const file of files) {
    if (!file?.filename) continue;
    const filePath = `/uploads/handovers/${file.filename}`;
    const documentName = file.originalname || file.filename;
    await conn.execute(
      `INSERT INTO documents (
          lead_id, handover_id, document_category, document_name, version_no, is_latest,
          file_name, file_path, mime_type, file_size_bytes, uploaded_by
        ) VALUES (?, ?, 'HANDOVER', ?, 1, 1, ?, ?, ?, ?, ?)`,
      [
        leadId,
        handoverId,
        documentName,
        file.filename,
        filePath,
        file.mimetype || null,
        file.size ?? null,
        userId
      ]
    );
  }
};

const deleteClientDocuments = async (conn, handoverId, documentIds) => {
  if (!Array.isArray(documentIds) || documentIds.length === 0) return;
  const ids = documentIds
    .map((id) => Number(id))
    .filter((id) => Number.isSafeInteger(id) && id > 0);
  if (ids.length === 0) return;

  const placeholders = ids.map(() => '?').join(', ');
  const [rows] = await conn.execute(
    `SELECT document_id, file_path
       FROM documents
      WHERE handover_id = ?
        AND document_category = 'HANDOVER'
        AND document_id IN (${placeholders})`,
    [handoverId, ...ids]
  );

  await conn.execute(
    `DELETE FROM documents
      WHERE handover_id = ?
        AND document_category = 'HANDOVER'
        AND document_id IN (${placeholders})`,
    [handoverId, ...ids]
  );

  for (const row of rows) {
    if (row.file_path) {
      await safeUnlinkOldUploadFile(row.file_path);
    }
  }
};

const validateSubmitFields = (body) => {
  const title = trimOrNull(body.project_title, 255);
  if (!title.ok) return title;
  if (!title.value) {
    return { ok: false, message: 'Project title wajib diisi sebelum submit.' };
  }

  const start = normalizeOptionalDate(body.project_start_date);
  if (!start.ok) return start;
  if (!start.value) {
    return { ok: false, message: 'Project start date wajib diisi sebelum submit.' };
  }

  const end = normalizeOptionalDate(body.project_end_date);
  if (!end.ok) return end;
  if (!end.value) {
    return { ok: false, message: 'Project end date wajib diisi sebelum submit.' };
  }

  if (end.value < start.value) {
    return { ok: false, message: 'Project end date tidak boleh lebih kecil dari project start date.' };
  }

  return { ok: true };
};

const updateDraftHandover = async (handoverIdRaw, payloadRaw, uploadedFiles, userId) => {
  const handoverId = normalizeHandoverId(handoverIdRaw);
  if (handoverId == null) return { ok: false, reason: 'INVALID_ID' };

  const parsed = parsePayload(payloadRaw);
  if (!parsed.ok) return { ok: false, reason: 'VALIDATION', message: parsed.message };
  const body = parsed.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const row = await fetchHandoverForUpdate(conn, handoverId);
    if (!row) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }
    const op = assertLeadOperator(row, userId);
    if (!op.ok) {
      await conn.rollback();
      return { ok: false, reason: 'FORBIDDEN' };
    }
    if (!isEditableHandoverStatus(row.status)) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_EDITABLE' };
    }

    const projectTitle = trimOrNull(body.project_title, 255);
    if (!projectTitle.ok) {
      await conn.rollback();
      return { ok: false, reason: 'VALIDATION', message: projectTitle.message };
    }
    const companyGroup = trimOrNull(body.company_group, 255);
    if (!companyGroup.ok) {
      await conn.rollback();
      return { ok: false, reason: 'VALIDATION', message: companyGroup.message };
    }
    const start = normalizeOptionalDate(body.project_start_date);
    if (!start.ok) {
      await conn.rollback();
      return { ok: false, reason: 'VALIDATION', message: start.message };
    }
    const end = normalizeOptionalDate(body.project_end_date);
    if (!end.ok) {
      await conn.rollback();
      return { ok: false, reason: 'VALIDATION', message: end.message };
    }
    if (start.value && end.value && end.value < start.value) {
      await conn.rollback();
      return { ok: false, reason: 'VALIDATION', message: 'Project end date tidak boleh lebih kecil dari project start date.' };
    }

    const background = trimOrNull(body.background_summary, 65535);
    if (!background.ok) {
      await conn.rollback();
      return { ok: false, reason: 'VALIDATION', message: background.message };
    }
    const riskNote = trimOrNull(body.risk_internal_note, 65535);
    if (!riskNote.ok) {
      await conn.rollback();
      return { ok: false, reason: 'VALIDATION', message: riskNote.message };
    }

    const included = stringArray(body.scope_included, 'scope_included');
    if (!included.ok) {
      await conn.rollback();
      return { ok: false, reason: 'VALIDATION', message: included.message };
    }
    const excluded = stringArray(body.scope_excluded, 'scope_excluded');
    if (!excluded.ok) {
      await conn.rollback();
      return { ok: false, reason: 'VALIDATION', message: excluded.message };
    }
    const deliverables = stringArray(body.deliverables, 'deliverables');
    if (!deliverables.ok) {
      await conn.rollback();
      return { ok: false, reason: 'VALIDATION', message: deliverables.message };
    }
    const outstanding = stringArray(body.outstanding_requirements, 'outstanding_requirements');
    if (!outstanding.ok) {
      await conn.rollback();
      return { ok: false, reason: 'VALIDATION', message: outstanding.message };
    }
    const risks = stringArray(body.risk_items, 'risk_items');
    if (!risks.ok) {
      await conn.rollback();
      return { ok: false, reason: 'VALIDATION', message: risks.message };
    }
    const internal = stringArray(body.internal_protocols, 'internal_protocols');
    if (!internal.ok) {
      await conn.rollback();
      return { ok: false, reason: 'VALIDATION', message: internal.message };
    }

    const milestones = Array.isArray(body.milestones) ? body.milestones : [];
    const external = Array.isArray(body.external_protocols) ? body.external_protocols : [];
    const team = Array.isArray(body.team_requirements) ? body.team_requirements : [];

    await conn.execute(
      `UPDATE handovers
          SET project_title = ?,
              company_group = ?,
              project_start_date = ?,
              project_end_date = ?,
              background_summary = ?,
              risk_internal_note = ?
        WHERE handover_id = ?`,
      [
        projectTitle.value,
        companyGroup.value,
        start.value,
        end.value,
        background.value,
        riskNote.value,
        handoverId
      ]
    );

    await replaceScopeItems(conn, handoverId, included.values, excluded.values, deliverables.values);
    await replaceMilestones(conn, handoverId, milestones);
    await replaceSimpleTextRows(
      conn,
      'outstanding_requirements',
      handoverId,
      'requirement_text',
      outstanding.values
    );
    await replaceSimpleTextRows(conn, 'handover_risks', handoverId, 'risk_text', risks.values);
    await replaceInternalProtocols(conn, handoverId, internal.values);
    await replaceExternalProtocols(conn, handoverId, external);
    await replaceTeamRequirements(conn, handoverId, team);

    const deletedIds = Array.isArray(body.deleted_document_ids) ? body.deleted_document_ids : [];
    await deleteClientDocuments(conn, handoverId, deletedIds);
    await insertClientDocuments(conn, {
      handoverId,
      leadId: row.lead_id,
      files: uploadedFiles,
      userId
    });

    await recomputeDerivedHandoverChecklist(conn, handoverId);

    await conn.commit();

    const data = await buildHandoverDetailPayload(handoverId);
    return { ok: true, data };
  } catch (e) {
    await conn.rollback();
    if (uploadedFiles?.length) {
      for (const f of uploadedFiles) {
        if (f?.filename) await safeUnlinkOldUploadFile(`/uploads/handovers/${f.filename}`);
      }
    }
    throw e;
  } finally {
    conn.release();
  }
};

const submitHandover = async (handoverIdRaw, userId) => {
  const handoverId = normalizeHandoverId(handoverIdRaw);
  if (handoverId == null) return { ok: false, reason: 'INVALID_ID' };

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const row = await fetchHandoverForUpdate(conn, handoverId);
    if (!row) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }
    const op = assertLeadOperator(row, userId);
    if (!op.ok) {
      await conn.rollback();
      return { ok: false, reason: 'FORBIDDEN' };
    }
    if (!isEditableHandoverStatus(row.status)) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_EDITABLE' };
    }

    const [hRows] = await conn.execute(
      `SELECT project_title, project_start_date, project_end_date, status
         FROM handovers
        WHERE handover_id = ?`,
      [handoverId]
    );
    const h = hRows[0] ?? {};
    const submitCheck = validateSubmitFields({
      project_title: h.project_title,
      project_start_date: formatSqlDate(h.project_start_date),
      project_end_date: formatSqlDate(h.project_end_date)
    });
    if (!submitCheck.ok) {
      await conn.rollback();
      return { ok: false, reason: 'VALIDATION', message: submitCheck.message };
    }

    const [pendingApproval] = await conn.execute(
      `SELECT approval_id
         FROM approvals
        WHERE handover_id = ?
          AND approval_role = 'CEO'
          AND decision = 'PENDING'
        LIMIT 1`,
      [handoverId]
    );
    if (pendingApproval[0]) {
      await conn.rollback();
      return { ok: false, reason: 'ALREADY_SUBMITTED' };
    }

    const isResubmit = h.status === 'NEED_REVISION';

    const [handoverUpdate] = await conn.execute(
      `UPDATE handovers
          SET status = 'WAITING_CEO_APPROVAL',
              submitted_by = ?,
              submitted_at = NOW(),
              ceo_revision_note = NULL
        WHERE handover_id = ?
          AND status IN ('DRAFT', 'NEED_REVISION')`,
      [userId, handoverId]
    );
    if (handoverUpdate.affectedRows !== 1) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_EDITABLE' };
    }

    const [approvalRows] = await conn.execute(
      `SELECT COALESCE(MAX(sequence_no), 0) AS max_sequence
         FROM approvals
        WHERE handover_id = ?`,
      [handoverId]
    );
    const sequenceNo = Number(approvalRows[0].max_sequence) + 1;

    await conn.execute(
      `INSERT INTO approvals (handover_id, approval_role, sequence_no, decision)
       VALUES (?, 'CEO', ?, 'PENDING')`,
      [handoverId, sequenceNo]
    );

    await conn.execute(
      `INSERT INTO handover_activity_logs (handover_id, activity_type, title, description, created_by)
       VALUES (?, 'HANDOVER_SUBMITTED', ?, ?, ?)`,
      [
        handoverId,
        isResubmit ? 'Handover diajukan ulang ke CEO' : 'Handover diajukan ke CEO',
        isResubmit
          ? 'Memo handover disubmit ulang setelah revisi untuk review dan persetujuan CEO.'
          : 'Memo handover disubmit untuk review dan persetujuan CEO.',
        userId
      ]
    );

    await recomputeDerivedHandoverChecklist(conn, handoverId);

    await conn.commit();

    const data = await buildHandoverDetailPayload(handoverId);
    return { ok: true, data };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

module.exports = {
  updateDraftHandover,
  submitHandover
};
