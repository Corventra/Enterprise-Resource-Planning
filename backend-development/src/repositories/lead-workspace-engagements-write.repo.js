const { pool } = require('../config/db');
const { LEAD_ACTIVITY_TYPES } = require('../constants/lead-activity-types');
const { safeUnlinkOldUploadFile } = require('../utils/file');
const { generateNextEngagementCode } = require('../utils/entity-display-code');
const {
  buildEngagementWorkspaceItem,
  engagementBaseSelect,
  normalizeEngagementId,
  normalizeLeadId
} = require('./lead-workspace-engagements.repo');
const {
  ENGAGEMENT_REQUIRES_PROPOSAL_MESSAGE,
  LEAD_HAS_ENGAGEMENT_MESSAGE,
  leadHasProposal,
  leadHasEngagementLetter
} = require('../utils/lead-workspace-readiness');

const LEAD_WORKSPACE_ELIGIBLE_SNIPPET = `
  l.lead_status IN ('ACTIVE', 'WON', 'LOST')
  AND (
    (l.source_type = 'FORM_LEAD_CAPTURE' AND l.bank_data_status = 'PROCESSED')
    OR l.source_type = 'MANUAL'
  )
`;

const fetchWorkspaceLeadRow = async (conn, leadId) => {
  const [rows] = await conn.execute(
    `SELECT l.lead_id, l.current_stage
       FROM leads l
      WHERE l.lead_id = ?
        AND ${LEAD_WORKSPACE_ELIGIBLE_SNIPPET.replace(/\n/g, ' ')}`,
    [leadId]
  );
  return rows[0] ?? null;
};

const insertActivityLog = async (conn, { leadId, activityType, title, description, createdBy }) => {
  await conn.execute(
    `INSERT INTO lead_activity_logs (lead_id, activity_type, title, description, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [leadId, activityType, title, description, createdBy]
  );
};

/**
 * Baris termin dari client diurutkan: [Down Payment, ...installment opsional, Final].
 * term_type dan sort_order dihitung ulang di server (abaikan nilai client bila ada).
 */
const expandTerminsFromOrderedRows = (termins) => {
  if (!Array.isArray(termins) || termins.length < 2) {
    return { ok: false, message: 'Termin wajib minimal 2 baris.' };
  }
  const n = termins.length;
  const full = termins.map((t, i) => ({
    term_name: t.term_name,
    percentage: Number(t.percentage),
    description:
      t.description != null && String(t.description).trim() !== '' ? String(t.description).trim() : null,
    billing_schedule_date:
      t.billing_schedule_date && String(t.billing_schedule_date).trim() !== ''
        ? String(t.billing_schedule_date).trim().slice(0, 10)
        : null,
    term_type: i === 0 ? 'DOWN_PAYMENT' : i === n - 1 ? 'FINAL' : 'INSTALLMENT',
    sort_order: i + 1
  }));
  return validateTermins(full);
};

const validateTermins = (termins) => {
  if (!Array.isArray(termins) || termins.length < 2) {
    return { ok: false, message: 'Termin wajib minimal 2 baris.' };
  }
  const dps = termins.filter((t) => t.term_type === 'DOWN_PAYMENT');
  const fins = termins.filter((t) => t.term_type === 'FINAL');
  if (dps.length !== 1 || fins.length !== 1) {
    return { ok: false, message: 'Termin wajib memuat tepat satu Down Payment dan satu Final.' };
  }
  let sum = 0;
  for (const t of termins) {
    const p = Number(t.percentage);
    if (!Number.isFinite(p) || p <= 0) {
      return { ok: false, message: 'Setiap termin harus memiliki percentage > 0.' };
    }
    sum += p;
  }
  if (Math.abs(sum - 100) > 0.02) {
    return { ok: false, message: 'Total percentage termin harus 100%.' };
  }
  const orders = termins.map((t) => Number(t.sort_order));
  if (orders.some((o) => !Number.isFinite(o))) {
    return { ok: false, message: 'Sort order termin tidak valid.' };
  }
  const minO = Math.min(...orders);
  const maxO = Math.max(...orders);
  const dpOrder = Number(dps[0].sort_order);
  const finOrder = Number(fins[0].sort_order);
  if (dpOrder !== minO) {
    return { ok: false, message: 'Down Payment harus memiliki sort_order paling awal (minimum).' };
  }
  if (finOrder !== maxO) {
    return { ok: false, message: 'Final harus memiliki sort_order paling akhir (maksimum).' };
  }
  const allowed = new Set(['DOWN_PAYMENT', 'INSTALLMENT', 'FINAL']);
  for (const t of termins) {
    if (!allowed.has(t.term_type)) {
      return { ok: false, message: 'Term type tidak valid.' };
    }
    const name = String(t.term_name ?? '').trim();
    if (name.length === 0 || name.length > 150) {
      return { ok: false, message: 'Term name wajib diisi (maks. 150 karakter).' };
    }
    const schedule = t.billing_schedule_date && String(t.billing_schedule_date).trim();
    if (!schedule || schedule.length < 10) {
      return {
        ok: false,
        message: 'Setiap termin wajib memiliki billing schedule date (Down Payment, Installment, dan Final).'
      };
    }
  }
  return { ok: true, termins };
};

const validateRetainer = (retainer) => {
  if (!retainer || typeof retainer !== 'object') {
    return { ok: false, message: 'Konfigurasi retainer wajib diisi.' };
  }
  const start = String(retainer.contract_start_date ?? '').trim();
  const end = String(retainer.contract_end_date ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return { ok: false, message: 'Tanggal kontrak retainer wajib format YYYY-MM-DD.' };
  }
  if (start > end) {
    return { ok: false, message: 'Tanggal akhir kontrak tidak boleh lebih kecil dari tanggal mulai.' };
  }
  const bt = String(retainer.billing_timing ?? '').trim();
  if (bt !== 'BEGINNING_OF_MONTH' && bt !== 'END_OF_MONTH') {
    return { ok: false, message: 'Billing timing retainer tidak valid.' };
  }
  return { ok: true, retainer: { contract_start_date: start, contract_end_date: end, billing_timing: bt } };
};

const deleteEngagementDocuments = async (conn, engagementId) => {
  const [rows] = await conn.execute(
    `SELECT file_path
       FROM documents
      WHERE engagement_id = ?
        AND document_category = 'ENGAGEMENT_LETTER'`,
    [engagementId]
  );
  for (const row of rows) {
    // eslint-disable-next-line no-await-in-loop
    await safeUnlinkOldUploadFile(row.file_path);
  }
  await conn.execute(
    `DELETE FROM documents
      WHERE engagement_id = ?
        AND document_category = 'ENGAGEMENT_LETTER'`,
    [engagementId]
  );
};

const markPreviousEngagementDocumentsNotLatest = async (conn, engagementId) => {
  await conn.execute(
    `UPDATE documents
        SET is_latest = 0
      WHERE engagement_id = ?
        AND document_category = 'ENGAGEMENT_LETTER'`,
    [engagementId]
  );
};

const getNextEngagementDocumentVersion = async (conn, engagementId) => {
  const [rows] = await conn.execute(
    `SELECT COALESCE(MAX(version_no), 0) AS max_version
       FROM documents
      WHERE engagement_id = ?
        AND document_category = 'ENGAGEMENT_LETTER'`,
    [engagementId]
  );
  return Number(rows[0].max_version) + 1;
};

const insertEngagementDocument = async (conn, params) => {
  const {
    leadId,
    engagementId,
    documentName,
    fileName,
    filePath,
    mimeType,
    fileSizeBytes,
    uploadedBy,
    versionNo
  } = params;
  await conn.execute(
    `INSERT INTO documents (
        lead_id,
        proposal_id,
        engagement_id,
        document_category,
        document_name,
        version_no,
        is_latest,
        file_name,
        file_path,
        mime_type,
        file_size_bytes,
        uploaded_by
      ) VALUES (?, NULL, ?, 'ENGAGEMENT_LETTER', ?, ?, 1, ?, ?, ?, ?, ?)`,
    [leadId, engagementId, documentName, versionNo, fileName, filePath, mimeType, fileSizeBytes, uploadedBy]
  );
};

const replaceTermins = async (conn, engagementId, termins) => {
  await conn.execute(`DELETE FROM engagement_letter_termins WHERE engagement_id = ?`, [engagementId]);
  for (const t of termins) {
    // eslint-disable-next-line no-await-in-loop
    await conn.execute(
      `INSERT INTO engagement_letter_termins (
          engagement_id, term_name, term_type, percentage, description, billing_schedule_date, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        engagementId,
        String(t.term_name).trim(),
        t.term_type,
        Number(t.percentage),
        t.description != null && String(t.description).trim() !== '' ? String(t.description).trim() : null,
        t.billing_schedule_date && String(t.billing_schedule_date).trim() !== ''
          ? String(t.billing_schedule_date).trim().slice(0, 10)
          : null,
        Number(t.sort_order)
      ]
    );
  }
};

const replaceRetainer = async (conn, engagementId, retainer) => {
  await conn.execute(`DELETE FROM engagement_letter_retainers WHERE engagement_id = ?`, [engagementId]);
  await conn.execute(
    `INSERT INTO engagement_letter_retainers (
        engagement_id, contract_start_date, contract_end_date, billing_timing
      ) VALUES (?, ?, ?, ?)`,
    [engagementId, retainer.contract_start_date, retainer.contract_end_date, retainer.billing_timing]
  );
};

const clearChildPaymentRows = async (conn, engagementId) => {
  await conn.execute(`DELETE FROM engagement_letter_termins WHERE engagement_id = ?`, [engagementId]);
  await conn.execute(`DELETE FROM engagement_letter_retainers WHERE engagement_id = ?`, [engagementId]);
};

const fetchProposalForNewEngagement = async (conn, leadId) => {
  const [rows] = await conn.execute(
    `SELECT p.proposal_id, p.proposal_status
      FROM proposals p
      LEFT JOIN engagement_letters e ON e.proposal_id = p.proposal_id
     WHERE p.lead_id = ?
       AND e.engagement_id IS NULL
     ORDER BY p.updated_at DESC, p.proposal_id DESC
     LIMIT 1`,
    [leadId]
  );
  return rows[0] ?? null;
};

const normalizePayload = ({ issuer_company, agreed_fee, payment_method, termins, retainer }) => {
  const ic = String(issuer_company ?? '').trim().toUpperCase();
  if (ic !== 'DSK' && ic !== 'DTAX') {
    return { ok: false, message: 'Issuer company harus DSK atau DTAX.' };
  }
  const fee = Number(agreed_fee);
  if (!Number.isFinite(fee) || fee <= 0) {
    return { ok: false, message: 'Agreed fee harus lebih besar dari 0.' };
  }
  const pm = String(payment_method ?? '').trim().toUpperCase();
  if (pm !== 'TERMIN' && pm !== 'RETAINER') {
    return { ok: false, message: 'Payment method harus TERMIN atau RETAINER.' };
  }
  if (pm === 'TERMIN') {
    const vt = expandTerminsFromOrderedRows(termins);
    if (!vt.ok) return vt;
    return { ok: true, payload: { issuer_company: ic, agreed_fee: fee, payment_method: pm, termins: vt.termins } };
  }
  const vr = validateRetainer(retainer);
  if (!vr.ok) return vr;
  return { ok: true, payload: { issuer_company: ic, agreed_fee: fee, payment_method: pm, retainer: vr.retainer } };
};

const assertLatestEngagementDocumentExists = async (conn, engagementId) => {
  const [rows] = await conn.execute(
    `SELECT document_id
       FROM documents
      WHERE engagement_id = ?
        AND document_category = 'ENGAGEMENT_LETTER'
        AND is_latest = 1
      LIMIT 1`,
    [engagementId]
  );
  return Boolean(rows[0]);
};

const validatePaymentChildrenForSubmit = async (conn, engagementId, paymentMethod) => {
  if (paymentMethod === 'TERMIN') {
    const [rows] = await conn.execute(
      `SELECT term_name, term_type, percentage, description, billing_schedule_date, sort_order
         FROM engagement_letter_termins
        WHERE engagement_id = ?
        ORDER BY sort_order ASC`,
      [engagementId]
    );
    const termins = rows.map((r) => ({
      term_name: r.term_name,
      term_type: r.term_type,
      percentage: Number(r.percentage),
      description: r.description,
      billing_schedule_date: r.billing_schedule_date
        ? r.billing_schedule_date.toISOString?.().slice(0, 10) ?? String(r.billing_schedule_date).slice(0, 10)
        : null,
      sort_order: r.sort_order
    }));
    return validateTermins(termins);
  }
  const [retRows] = await conn.execute(
    `SELECT contract_start_date, contract_end_date, billing_timing
       FROM engagement_letter_retainers
      WHERE engagement_id = ?
      LIMIT 1`,
    [engagementId]
  );
  if (!retRows[0]) {
    return { ok: false, message: 'Konfigurasi retainer belum lengkap.' };
  }
  const r = retRows[0];
  return validateRetainer({
    contract_start_date: r.contract_start_date?.toISOString?.().slice(0, 10) ?? String(r.contract_start_date).slice(0, 10),
    contract_end_date: r.contract_end_date?.toISOString?.().slice(0, 10) ?? String(r.contract_end_date).slice(0, 10),
    billing_timing: r.billing_timing
  });
};

/**
 * Menyetujui pengajuan EL dalam transaksi yang sudah berjalan (setelah data + dokumen tersimpan).
 * @returns {{ ok: true } | { ok: false, reason: string, message?: string }}
 */
const applyEngagementSubmitInTxn = async (conn, leadId, engagementId, userId, paymentMethod) => {
  const hasDoc = await assertLatestEngagementDocumentExists(conn, engagementId);
  if (!hasDoc) {
    return { ok: false, reason: 'DOCUMENT_REQUIRED' };
  }

  const childOk = await validatePaymentChildrenForSubmit(conn, engagementId, paymentMethod);
  if (!childOk.ok) {
    return { ok: false, reason: 'VALIDATION', message: childOk.message };
  }

  const [pend] = await conn.execute(
    `SELECT approval_id
       FROM approvals
      WHERE engagement_id = ?
        AND decision = 'PENDING'
      LIMIT 1`,
    [engagementId]
  );
  if (pend[0]) {
    return { ok: false, reason: 'ALREADY_PENDING' };
  }

  const [seqRows] = await conn.execute(
    `SELECT COALESCE(MAX(sequence_no), 0) AS mx
       FROM approvals
      WHERE engagement_id = ?`,
    [engagementId]
  );
  const nextSeq = Number(seqRows[0]?.mx ?? 0) + 1;

  await conn.execute(
    `UPDATE engagement_letters
        SET engagement_status = 'WAITING_CEO_APPROVAL',
            submitted_by = ?,
            submitted_at = NOW()
      WHERE engagement_id = ?
        AND lead_id = ?`,
    [userId, engagementId, leadId]
  );

  await conn.execute(
    `INSERT INTO approvals (
        proposal_id,
        engagement_id,
        approval_role,
        sequence_no,
        decision
      ) VALUES (NULL, ?, 'CEO', ?, 'PENDING')`,
    [engagementId, nextSeq]
  );

  await conn.execute(
    `UPDATE leads
        SET current_stage = 'ENGAGEMENT_LETTER',
            stage_progress = 'WAITING_CEO_APPROVAL',
            next_action = 'Tunggu review CEO',
            due_date = NULL
      WHERE lead_id = ?`,
    [leadId]
  );

  await insertActivityLog(conn, {
    leadId,
    activityType: LEAD_ACTIVITY_TYPES.ENGAGEMENT_LETTER_SUBMITTED,
    title: 'Engagement letter diajukan',
    description: 'Engagement letter diajukan untuk persetujuan CEO.',
    createdBy: userId
  });

  return { ok: true };
};

const createDraftEngagementLetter = async (leadIdRaw, body, fileMeta, userId) => {
  const leadId = normalizeLeadId(leadIdRaw);
  if (leadId == null) return { ok: false, reason: 'INVALID_LEAD_ID' };

  if (!fileMeta?.filePath) {
    return { ok: false, reason: 'DOCUMENT_REQUIRED' };
  }

  const norm = normalizePayload(body);
  if (!norm.ok) {
    return { ok: false, reason: 'VALIDATION', message: norm.message };
  }
  const { payload } = norm;
  const action = String(body?.action ?? 'draft').trim().toLowerCase() === 'submit' ? 'submit' : 'draft';

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const lead = await fetchWorkspaceLeadRow(conn, leadId);
    if (!lead) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }

    const hasProposal = await leadHasProposal(conn, leadId);
    if (!hasProposal) {
      await conn.rollback();
      return {
        ok: false,
        reason: 'NO_PROPOSAL',
        message: ENGAGEMENT_REQUIRES_PROPOSAL_MESSAGE
      };
    }

    const proposal = await fetchProposalForNewEngagement(conn, leadId);
    if (!proposal) {
      await conn.rollback();
      return {
        ok: false,
        reason: 'NO_PROPOSAL',
        message: ENGAGEMENT_REQUIRES_PROPOSAL_MESSAGE
      };
    }

    const engagementExists = await leadHasEngagementLetter(conn, leadId);
    if (engagementExists) {
      await conn.rollback();
      return {
        ok: false,
        reason: 'ENGAGEMENT_EXISTS',
        message: LEAD_HAS_ENGAGEMENT_MESSAGE
      };
    }

    const [insertEl] = await (async () => {
      let lastErr;
      for (let attempt = 0; attempt < 15; attempt++) {
        const engagementCode = await generateNextEngagementCode(conn);
        try {
          const [r] = await conn.execute(
            `INSERT INTO engagement_letters (
          engagement_code,
          lead_id,
          proposal_id,
          issuer_company,
          agreed_fee,
          payment_method,
          engagement_status,
          revision_note,
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, 'DRAFT', NULL, ?)`,
            [engagementCode, leadId, proposal.proposal_id, payload.issuer_company, payload.agreed_fee, payload.payment_method, userId]
          );
          return [r];
        } catch (e) {
          lastErr = e;
          if (e.code === 'ER_DUP_ENTRY') {
            continue;
          }
          throw e;
        }
      }
      throw lastErr ?? new Error('Gagal menetapkan engagement_code');
    })();
    const engagementId = insertEl.insertId;

    if (payload.payment_method === 'TERMIN') {
      await replaceTermins(conn, engagementId, payload.termins);
    } else {
      await replaceRetainer(conn, engagementId, payload.retainer);
    }

    await insertEngagementDocument(conn, {
      leadId,
      engagementId,
      documentName: fileMeta.documentName,
      fileName: fileMeta.fileName,
      filePath: fileMeta.filePath,
      mimeType: fileMeta.mimeType,
      fileSizeBytes: fileMeta.fileSizeBytes,
      uploadedBy: userId,
      versionNo: 1
    });

    if (action === 'submit') {
      const sub = await applyEngagementSubmitInTxn(conn, leadId, engagementId, userId, payload.payment_method);
      if (!sub.ok) {
        await conn.rollback();
        return sub;
      }
    }

    await conn.commit();

    const [rows] = await conn.execute(`${engagementBaseSelect} WHERE e.engagement_id = ? LIMIT 1`, [engagementId]);
    const item = await buildEngagementWorkspaceItem(conn, rows[0]);
    return { ok: true, item };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const updateDraftEngagementLetter = async (leadIdRaw, engagementIdRaw, body, fileMeta, userId) => {
  const leadId = normalizeLeadId(leadIdRaw);
  const engagementId = normalizeEngagementId(engagementIdRaw);
  if (leadId == null || engagementId == null) return { ok: false, reason: 'INVALID_ID' };

  const norm = normalizePayload(body);
  if (!norm.ok) {
    return { ok: false, reason: 'VALIDATION', message: norm.message };
  }
  const { payload } = norm;
  const action = String(body?.action ?? 'draft').trim().toLowerCase() === 'submit' ? 'submit' : 'draft';

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [elRows] = await conn.execute(
      `SELECT engagement_id, lead_id, engagement_status, payment_method
         FROM engagement_letters
        WHERE engagement_id = ?
          AND lead_id = ?
        FOR UPDATE`,
      [engagementId, leadId]
    );
    const el = elRows[0];
    if (!el) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }
    if (el.engagement_status !== 'DRAFT' && el.engagement_status !== 'NEED_REVISION') {
      await conn.rollback();
      return { ok: false, reason: 'NOT_EDITABLE' };
    }

    await conn.execute(
      `UPDATE engagement_letters
          SET issuer_company = ?,
              agreed_fee = ?,
              payment_method = ?
        WHERE engagement_id = ?
          AND lead_id = ?`,
      [payload.issuer_company, payload.agreed_fee, payload.payment_method, engagementId, leadId]
    );

    if (payload.payment_method === 'TERMIN') {
      await clearChildPaymentRows(conn, engagementId);
      await replaceTermins(conn, engagementId, payload.termins);
    } else {
      await clearChildPaymentRows(conn, engagementId);
      await replaceRetainer(conn, engagementId, payload.retainer);
    }

    if (fileMeta?.filePath) {
      const [latestBefore] = await conn.execute(
        `SELECT file_path
           FROM documents
          WHERE engagement_id = ?
            AND document_category = 'ENGAGEMENT_LETTER'
            AND is_latest = 1
          LIMIT 1`,
        [engagementId]
      );
      const oldPath = latestBefore[0]?.file_path ?? null;
      await markPreviousEngagementDocumentsNotLatest(conn, engagementId);
      const versionNo = await getNextEngagementDocumentVersion(conn, engagementId);
      await insertEngagementDocument(conn, {
        leadId,
        engagementId,
        documentName: fileMeta.documentName,
        fileName: fileMeta.fileName,
        filePath: fileMeta.filePath,
        mimeType: fileMeta.mimeType,
        fileSizeBytes: fileMeta.fileSizeBytes,
        uploadedBy: userId,
        versionNo
      });
      if (oldPath) {
        await safeUnlinkOldUploadFile(oldPath);
      }
    }

    if (action === 'submit') {
      const sub = await applyEngagementSubmitInTxn(conn, leadId, engagementId, userId, payload.payment_method);
      if (!sub.ok) {
        await conn.rollback();
        return sub;
      }
    }

    await conn.commit();

    const [rows] = await conn.execute(`${engagementBaseSelect} WHERE e.engagement_id = ? LIMIT 1`, [engagementId]);
    const item = await buildEngagementWorkspaceItem(conn, rows[0]);
    return { ok: true, item };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const deleteDraftEngagementLetter = async (leadIdRaw, engagementIdRaw) => {
  const leadId = normalizeLeadId(leadIdRaw);
  const engagementId = normalizeEngagementId(engagementIdRaw);
  if (leadId == null || engagementId == null) return { ok: false, reason: 'INVALID_ID' };

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [elRows] = await conn.execute(
      `SELECT engagement_id, engagement_status
         FROM engagement_letters
        WHERE engagement_id = ?
          AND lead_id = ?
        FOR UPDATE`,
      [engagementId, leadId]
    );
    const el = elRows[0];
    if (!el) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }
    if (el.engagement_status !== 'DRAFT') {
      await conn.rollback();
      return { ok: false, reason: 'NOT_DRAFT' };
    }

    await deleteEngagementDocuments(conn, engagementId);
    await conn.execute(`DELETE FROM engagement_letters WHERE engagement_id = ? AND lead_id = ?`, [engagementId, leadId]);

    await conn.commit();
    return { ok: true };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const submitEngagementLetter = async (leadIdRaw, engagementIdRaw, userId) => {
  const leadId = normalizeLeadId(leadIdRaw);
  const engagementId = normalizeEngagementId(engagementIdRaw);
  if (leadId == null || engagementId == null) return { ok: false, reason: 'INVALID_ID' };

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [elRows] = await conn.execute(
      `SELECT engagement_id, lead_id, engagement_status, payment_method
         FROM engagement_letters
        WHERE engagement_id = ?
          AND lead_id = ?
        FOR UPDATE`,
      [engagementId, leadId]
    );
    const el = elRows[0];
    if (!el) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }
    if (el.engagement_status !== 'DRAFT' && el.engagement_status !== 'NEED_REVISION') {
      await conn.rollback();
      return { ok: false, reason: 'NOT_EDITABLE' };
    }

    const sub = await applyEngagementSubmitInTxn(conn, leadId, engagementId, userId, el.payment_method);
    if (!sub.ok) {
      await conn.rollback();
      return sub;
    }

    await conn.commit();

    const [rows] = await conn.execute(`${engagementBaseSelect} WHERE e.engagement_id = ? LIMIT 1`, [engagementId]);
    const item = await buildEngagementWorkspaceItem(conn, rows[0]);
    return { ok: true, item };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const markEngagementLetterSentToClient = async (leadIdRaw, engagementIdRaw, userId) => {
  const leadId = normalizeLeadId(leadIdRaw);
  const engagementId = normalizeEngagementId(engagementIdRaw);
  if (leadId == null || engagementId == null) return { ok: false, reason: 'INVALID_ID' };

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const lead = await fetchWorkspaceLeadRow(conn, leadId);
    if (!lead) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }

    const [elRows] = await conn.execute(
      `SELECT engagement_id, lead_id, engagement_status
         FROM engagement_letters
        WHERE engagement_id = ?
          AND lead_id = ?
        FOR UPDATE`,
      [engagementId, leadId]
    );
    const el = elRows[0];
    if (!el) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }
    if (el.engagement_status !== 'APPROVED') {
      await conn.rollback();
      return { ok: false, reason: 'NOT_APPROVED' };
    }

    const [elUpdate] = await conn.execute(
      `UPDATE engagement_letters
          SET engagement_status = 'SENT',
              sent_to_client_at = NOW()
        WHERE engagement_id = ?
          AND lead_id = ?
          AND engagement_status = 'APPROVED'`,
      [engagementId, leadId]
    );
    if (elUpdate.affectedRows !== 1) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_APPROVED' };
    }

    await conn.execute(
      `UPDATE leads
          SET current_stage = 'ENGAGEMENT_LETTER',
              stage_progress = 'SENT',
              next_action = 'Tunggu tanda tangan client',
              due_date = DATE_ADD(NOW(), INTERVAL 7 DAY)
        WHERE lead_id = ?`,
      [leadId]
    );

    await insertActivityLog(conn, {
      leadId,
      activityType: LEAD_ACTIVITY_TYPES.ENGAGEMENT_LETTER_SENT,
      title: 'Engagement letter dikirim ke client',
      description: 'Engagement letter ditandai terkirim; tim menunggu tanda tangan client.',
      createdBy: userId
    });

    await conn.commit();

    const [rows] = await conn.execute(`${engagementBaseSelect} WHERE e.engagement_id = ? LIMIT 1`, [engagementId]);
    const item = await buildEngagementWorkspaceItem(conn, rows[0]);
    return { ok: true, item };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

module.exports = {
  createDraftEngagementLetter,
  updateDraftEngagementLetter,
  deleteDraftEngagementLetter,
  submitEngagementLetter,
  markEngagementLetterSentToClient,
  normalizePayload
};
