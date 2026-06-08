const { pool } = require('../config/db');

/**
 * Task Templates controller.
 *
 * Endpoints:
 *   - GET    /api/task-templates                       — list semua template
 *   - GET    /api/task-templates/:templateId           — detail satu template
 *   - GET    /api/task-templates/default/:serviceLine  — default per service line
 *   - PUT    /api/task-templates/:templateId           — update (name + tasks replace)
 *
 * Notes:
 *   - Tasks selalu di-replace utuh saat update (DELETE + INSERT dalam txn).
 *   - sequence_no di-assign ulang dari order array yang dikirim (1-indexed).
 *   - Backend tidak enforce sum(weight)=100; frontend yang validate biar UX
 *     fleksibel (draft bisa di-save mid-edit).
 */

const VALID_SERVICE_LINES = new Set(['Transfer Pricing', 'Tax', 'Advisory', 'Audit']);
const VALID_PHASES = new Set(['Initiation', 'Analysis', 'Core Work', 'QC', 'Delivery']);

const sendError = (res, e) => {
  // eslint-disable-next-line no-console
  console.error('[task-templates.controller] error:', e);
  const detail = e?.sqlMessage || e?.message || 'Unknown error';
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    detail,
    code: e?.code || undefined
  });
};

const parseIdParam = (value) => {
  if (value == null) return null;
  const raw = String(value).trim();
  if (raw.length === 0 || !/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return id;
};

const getUserIdFromRequest = (req, res) => {
  const id = Number(req.user?.sub);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(401).json({ success: false, message: 'Token tidak berisi user ID yang valid.' });
    return null;
  }
  return id;
};

/**
 * Fetch full template (header + tasks ordered by sequence_no).
 */
const loadTemplateById = async (db, templateId) => {
  const [[tpl]] = await db.query(
    `SELECT template_id, service_line, name, is_default, created_by, created_at, updated_at
       FROM task_templates WHERE template_id = ? LIMIT 1`,
    [templateId]
  );
  if (!tpl) return null;
  const [tasks] = await db.query(
    `SELECT task_id, title, weight, phase, expected_duration_days, sequence_no
       FROM task_template_tasks
      WHERE template_id = ?
      ORDER BY sequence_no ASC, task_id ASC`,
    [templateId]
  );
  return { ...tpl, tasks };
};

/**
 * GET /api/task-templates
 */
const listTemplates = async (req, res) => {
  try {
    const [tplRows] = await pool.query(
      `SELECT template_id, service_line, name, is_default, created_by, created_at, updated_at
         FROM task_templates
        ORDER BY service_line ASC, is_default DESC, template_id ASC`
    );
    if (tplRows.length === 0) {
      return res.json({ success: true, data: { items: [] } });
    }
    const ids = tplRows.map((t) => t.template_id);
    const [taskRows] = await pool.query(
      `SELECT template_id, task_id, title, weight, phase, expected_duration_days, sequence_no
         FROM task_template_tasks
        WHERE template_id IN (?)
        ORDER BY sequence_no ASC, task_id ASC`,
      [ids]
    );
    const byTpl = taskRows.reduce((acc, row) => {
      const key = row.template_id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {});
    const items = tplRows.map((t) => ({
      ...t,
      tasks: byTpl[t.template_id] || []
    }));
    return res.json({ success: true, data: { items } });
  } catch (e) {
    return sendError(res, e);
  }
};

/**
 * GET /api/task-templates/:templateId
 */
const getTemplate = async (req, res) => {
  const templateId = parseIdParam(req.params.templateId);
  if (templateId == null) {
    return res.status(400).json({ success: false, message: 'Template ID tidak valid.' });
  }
  try {
    const tpl = await loadTemplateById(pool, templateId);
    if (!tpl) {
      return res.status(404).json({ success: false, message: 'Template tidak ditemukan.' });
    }
    return res.json({ success: true, data: { template: tpl } });
  } catch (e) {
    return sendError(res, e);
  }
};

/**
 * GET /api/task-templates/default/:serviceLine
 * Pakai param string (URL-encoded), bukan ID, karena frontend tahu service
 * line dari project, tidak tahu template_id.
 */
const getDefaultByServiceLine = async (req, res) => {
  const raw = String(req.params.serviceLine || '').trim();
  if (!VALID_SERVICE_LINES.has(raw)) {
    return res.status(400).json({
      success: false,
      message: `Service line invalid: ${raw}. Pilihan: ${[...VALID_SERVICE_LINES].join(', ')}`
    });
  }
  try {
    const [[tpl]] = await pool.query(
      `SELECT template_id FROM task_templates
        WHERE service_line = ? AND is_default = 1
        ORDER BY template_id ASC LIMIT 1`,
      [raw]
    );
    if (!tpl) {
      return res.status(404).json({
        success: false,
        message: `Tidak ada default template untuk service line ${raw}.`
      });
    }
    const detail = await loadTemplateById(pool, tpl.template_id);
    return res.json({ success: true, data: { template: detail } });
  } catch (e) {
    return sendError(res, e);
  }
};

/**
 * PUT /api/task-templates/:templateId
 * Body: { name?: string, tasks: [{title, weight, phase?, expectedDurationDays}] }
 *
 * Replace semantics untuk tasks. Transaksi tunggal:
 *   1. UPDATE task_templates SET name (kalau dikirim), updated_at
 *   2. DELETE task_template_tasks WHERE template_id = ?
 *   3. INSERT ulang dengan sequence_no = index + 1
 */
const updateTemplate = async (req, res) => {
  const templateId = parseIdParam(req.params.templateId);
  if (templateId == null) {
    return res.status(400).json({ success: false, message: 'Template ID tidak valid.' });
  }

  const actorUserId = getUserIdFromRequest(req, res);
  if (!actorUserId) return;

  const { name, tasks } = req.body || {};

  if (!Array.isArray(tasks)) {
    return res.status(400).json({
      success: false,
      message: 'Body `tasks` wajib array (boleh kosong).'
    });
  }

  // Validate setiap task
  const normalized = [];
  for (let i = 0; i < tasks.length; i += 1) {
    const t = tasks[i] || {};
    const title = String(t.title || '').trim();
    const weight = Number(t.weight);
    const duration = Number(t.expectedDurationDays);
    const phase = t.phase == null || t.phase === '' ? null : String(t.phase);
    if (title.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Task #${i + 1}: title wajib diisi.`
      });
    }
    if (!Number.isFinite(weight) || weight < 0 || weight > 100) {
      return res.status(400).json({
        success: false,
        message: `Task #${i + 1} (${title}): weight harus 0-100.`
      });
    }
    if (!Number.isInteger(duration) || duration < 1) {
      return res.status(400).json({
        success: false,
        message: `Task #${i + 1} (${title}): expectedDurationDays harus integer ≥ 1.`
      });
    }
    if (phase != null && !VALID_PHASES.has(phase)) {
      return res.status(400).json({
        success: false,
        message: `Task #${i + 1} (${title}): phase invalid (${phase}).`
      });
    }
    normalized.push({ title, weight, phase, duration });
  }

  const newName = typeof name === 'string' ? name.trim() : '';

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[existing]] = await conn.query(
      `SELECT template_id, name FROM task_templates WHERE template_id = ? FOR UPDATE`,
      [templateId]
    );
    if (!existing) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Template tidak ditemukan.' });
    }

    if (newName.length > 0 && newName !== existing.name) {
      await conn.query(
        `UPDATE task_templates SET name = ?, updated_at = NOW() WHERE template_id = ?`,
        [newName, templateId]
      );
    } else {
      // Touch updated_at supaya tetap reflect edit time meski cuma tasks yang berubah
      await conn.query(
        `UPDATE task_templates SET updated_at = NOW() WHERE template_id = ?`,
        [templateId]
      );
    }

    await conn.query(`DELETE FROM task_template_tasks WHERE template_id = ?`, [templateId]);

    if (normalized.length > 0) {
      const values = normalized.map((t, idx) => [
        templateId,
        t.title,
        t.weight,
        t.phase,
        t.duration,
        idx + 1
      ]);
      await conn.query(
        `INSERT INTO task_template_tasks
          (template_id, title, weight, phase, expected_duration_days, sequence_no)
         VALUES ?`,
        [values]
      );
    }

    await conn.commit();
    const detail = await loadTemplateById(pool, templateId);
    return res.json({ success: true, data: { template: detail } });
  } catch (e) {
    try { await conn.rollback(); } catch (_) { /* ignore */ }
    return sendError(res, e);
  } finally {
    conn.release();
  }
};

module.exports = {
  listTemplates,
  getTemplate,
  getDefaultByServiceLine,
  updateTemplate
};
