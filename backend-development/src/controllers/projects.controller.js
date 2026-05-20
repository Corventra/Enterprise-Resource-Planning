const { pool } = require('../config/db');
const handoverRepo = require('../repositories/handover.repo');
const { syncInvoiceTermLifecycle } = require('../utils/invoice-term-lifecycle');

/**
 * Projects controller.
 *
 * Phase 1: listProjects, getProjectDetail (read-only).
 * Phase 2: createFromHandover (COO assign PM, spawn project + milestones).
 * Phase 3+: assignConsultants, updateMilestoneStatus, rateMilestone.
 */

const sendError = (res, e) => {
  // eslint-disable-next-line no-console
  console.error('[projects.controller] error:', e);
  // Surface MySQL/JS error message di response — memudahkan debug demo. Bisa
  // di-hide kemudian via NODE_ENV check kalau aplikasi sudah masuk production.
  const detail =
    e?.sqlMessage || e?.message || (typeof e === 'string' ? e : 'Unknown error');
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    detail,
    code: e?.code || undefined
  });
};

const parseIdParam = (value) => {
  if (value === undefined || value === null) return null;
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
 * Map service.name (dinamis, dari tabel services) ke ENUM service_line di tabel
 * projects. Pakai contains/regex untuk fleksibilitas. Default 'Advisory' kalau
 * tidak match — supaya project tetap bisa lahir meski service kategorisasi baru.
 */
const mapServiceToServiceLine = (serviceName) => {
  if (!serviceName || typeof serviceName !== 'string') return 'Advisory';
  const lower = serviceName.toLowerCase();
  if (lower.includes('transfer pricing') || lower.includes(' tp ') || lower.startsWith('tp ')) {
    return 'Transfer Pricing';
  }
  if (lower.includes('audit')) return 'Audit';
  if (lower.includes('tax') || lower.includes('pajak')) return 'Tax';
  return 'Advisory';
};

/**
 * Load full project detail (project + consultants + milestones + per-milestone
 * update logs) di satu helper supaya reusable antara getProjectDetail dan
 * createFromHandover (yang perlu return shape sama).
 */
const loadProjectDetailById = async (db, projectId) => {
  const [[project]] = await db.query(
    `SELECT
       p.project_id,
       p.project_code,
       p.handover_id,
       p.client,
       p.project_name,
       p.service_line,
       p.status,
       p.pm_user_id,
       COALESCE(u_pm.name, p.pm_name_snapshot) AS pm_name,
       p.start_date,
       p.end_date,
       p.created_at,
       h.department_id,
       d.code AS department_code,
       d.name AS department_name,
       h.dp_payment_status,
       h.dp_paid_at,
       h.engagement_id,
       h.lead_id
     FROM projects p
     LEFT JOIN users u_pm ON u_pm.id = p.pm_user_id
     INNER JOIN handovers h ON h.handover_id = p.handover_id
     LEFT JOIN departments d ON d.id = h.department_id
     WHERE p.project_id = ?
     LIMIT 1`,
    [projectId]
  );
  if (!project) return null;

  const [consultants] = await db.query(
    `SELECT
       pc.consultant_user_id,
       COALESCE(u.name, pc.consultant_name_snapshot) AS consultant_name,
       pc.level,
       pc.assigned_at
     FROM project_consultants pc
     LEFT JOIN users u ON u.id = pc.consultant_user_id
     WHERE pc.project_id = ?
     ORDER BY pc.assigned_at ASC`,
    [projectId]
  );

  const [milestones] = await db.query(
    `SELECT
       m.milestone_id,
       m.title,
       m.notes,
       m.target_date,
       m.status,
       m.owner_user_id,
       COALESCE(u.name, m.owner_name_snapshot) AS owner_name,
       m.weight,
       m.phase,
       m.sequence_no,
       m.completed_at,
       m.quality_rating,
       m.revision_count
     FROM project_milestones m
     LEFT JOIN users u ON u.id = m.owner_user_id
     WHERE m.project_id = ?
     ORDER BY m.sequence_no ASC, m.milestone_id ASC`,
    [projectId]
  );

  const milestoneIds = milestones.map((m) => m.milestone_id);
  let updateRows = [];
  if (milestoneIds.length > 0) {
    const [rows] = await db.query(
      `SELECT
         upd.update_id,
         upd.milestone_id,
         upd.by_user_id,
         COALESCE(u.name, upd.by_name_snapshot) AS by_name,
         upd.from_status,
         upd.to_status,
         upd.note,
         upd.at
       FROM project_milestone_updates upd
       LEFT JOIN users u ON u.id = upd.by_user_id
       WHERE upd.milestone_id IN (?)
       ORDER BY upd.at ASC`,
      [milestoneIds]
    );
    updateRows = rows;
  }

  const updatesByMilestone = updateRows.reduce((acc, row) => {
    const key = row.milestone_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  return {
    ...project,
    consultants,
    milestones: milestones.map((m) => ({
      ...m,
      updates: updatesByMilestone[m.milestone_id] || []
    }))
  };
};

/**
 * GET /api/projects
 * Return array projects shallow (tanpa milestones/consultants/update_log).
 */
const listProjects = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         p.project_id,
         p.project_code,
         p.handover_id,
         p.client,
         p.project_name,
         p.service_line,
         p.status,
         p.pm_user_id,
         COALESCE(u_pm.name, p.pm_name_snapshot) AS pm_name,
         p.start_date,
         p.end_date,
         p.created_at,
         h.department_id,
         d.code AS department_code,
         d.name AS department_name,
         h.dp_payment_status,
         h.dp_paid_at,
         h.engagement_id,
         h.lead_id
       FROM projects p
       LEFT JOIN users u_pm ON u_pm.id = p.pm_user_id
       INNER JOIN handovers h ON h.handover_id = p.handover_id
       LEFT JOIN departments d ON d.id = h.department_id
       ORDER BY p.created_at DESC`
    );
    return res.json({ success: true, data: { items: rows } });
  } catch (e) {
    return sendError(res, e);
  }
};

/**
 * GET /api/projects/:projectId
 */
const getProjectDetail = async (req, res) => {
  const projectId = parseIdParam(req.params.projectId);
  if (projectId == null) {
    return res.status(400).json({ success: false, message: 'Project ID tidak valid.' });
  }

  try {
    const detail = await loadProjectDetailById(pool, projectId);
    if (!detail) {
      return res.status(404).json({ success: false, message: 'Project tidak ditemukan.' });
    }
    return res.json({ success: true, data: { project: detail } });
  } catch (e) {
    return sendError(res, e);
  }
};

/**
 * POST /api/projects/from-handover/:handoverId
 * Body: { pmUserId: number, note?: string }
 *
 * COO action: convert approved handover ke project.
 *   1. Validate handover APPROVED & belum ter-convert
 *   2. Validate PM user exists & active
 *   3. INSERT project (status Awaiting Consultant)
 *   4. Copy handover_milestones → project_milestones
 *   5. Transition handover APPROVED → ASSIGNED_TO_PM
 *   6. Log to handover_activity_logs
 *
 * Semua dalam 1 transaksi — rollback kalau ada yang gagal.
 */
const createFromHandover = async (req, res) => {
  const handoverId = parseIdParam(req.params.handoverId);
  if (handoverId == null) {
    return res.status(400).json({ success: false, message: 'Handover ID tidak valid.' });
  }

  const { pmUserId, note } = req.body || {};
  const pmId = Number(pmUserId);
  if (!Number.isInteger(pmId) || pmId <= 0) {
    return res.status(400).json({ success: false, message: 'pmUserId wajib diisi (integer positif).' });
  }

  const actorUserId = getUserIdFromRequest(req, res);
  if (!actorUserId) return; // 401 sudah dikirim

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Lock & read handover
    const [handoverRows] = await conn.query(
      `SELECT
         h.handover_id,
         h.status,
         h.handover_code,
         h.project_title,
         h.project_start_date,
         h.project_end_date,
         h.service_id,
         l.company_name AS client_name,
         s.name AS service_name
       FROM handovers h
       INNER JOIN leads l ON l.lead_id = h.lead_id
       INNER JOIN services s ON s.service_id = h.service_id
       WHERE h.handover_id = ?
       FOR UPDATE`,
      [handoverId]
    );
    const handover = handoverRows[0];
    if (!handover) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Handover tidak ditemukan.' });
    }
    if (handover.status !== 'APPROVED') {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: `Handover tidak dalam status APPROVED (current: ${handover.status}).`
      });
    }

    // 2. Cegah double-conversion
    const [existing] = await conn.query(
      `SELECT project_id FROM projects WHERE handover_id = ? LIMIT 1`,
      [handoverId]
    );
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: 'Handover ini sudah pernah di-convert ke project.'
      });
    }

    // 3. Validate PM user
    const [pmRows] = await conn.query(
      `SELECT u.id, u.name, r.code AS role_code
       FROM users u
       INNER JOIN roles r ON r.id = u.role_id
       WHERE u.id = ? AND u.is_active = 1
       LIMIT 1`,
      [pmId]
    );
    if (!pmRows[0]) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'PM user tidak ditemukan atau inactive.' });
    }
    const pmUser = pmRows[0];

    // 4. Service line mapping
    const serviceLine = mapServiceToServiceLine(handover.service_name);

    // 5. Project code (PRJ-YYYY-NNNN)
    const year = new Date().getFullYear();
    const [seqRows] = await conn.query(
      `SELECT COUNT(*) AS cnt FROM projects WHERE YEAR(created_at) = ?`,
      [year]
    );
    const seq = String((seqRows[0]?.cnt ?? 0) + 1).padStart(4, '0');
    const projectCode = `PRJ-${year}-${seq}`;

    // 6. Dates
    const today = new Date();
    const isoToday = today.toISOString().slice(0, 10);
    const startDate = handover.project_start_date
      ? new Date(handover.project_start_date).toISOString().slice(0, 10)
      : isoToday;
    const endDate = handover.project_end_date
      ? new Date(handover.project_end_date).toISOString().slice(0, 10)
      : new Date(today.getFullYear(), today.getMonth() + 6, today.getDate()).toISOString().slice(0, 10);

    // 7. INSERT project
    const [insertProject] = await conn.query(
      `INSERT INTO projects
        (project_code, handover_id, client, project_name, service_line, status,
         pm_user_id, pm_name_snapshot, start_date, end_date, created_by)
       VALUES (?, ?, ?, ?, ?, 'Awaiting Consultant', ?, ?, ?, ?, ?)`,
      [
        projectCode,
        handoverId,
        handover.client_name || '',
        handover.project_title || handover.handover_code,
        serviceLine,
        pmId,
        pmUser.name,
        startDate,
        endDate,
        actorUserId
      ]
    );
    const newProjectId = insertProject.insertId;

    // 8. Copy handover_milestones → project_milestones
    const [milestoneRows] = await conn.query(
      `SELECT milestone_name, target_date, notes, sort_order
       FROM handover_milestones
       WHERE handover_id = ?
       ORDER BY sort_order ASC, milestone_id ASC`,
      [handoverId]
    );
    if (milestoneRows.length > 0) {
      const values = milestoneRows.map((m, idx) => [
        newProjectId,
        m.milestone_name,
        m.notes || null,
        m.target_date ? new Date(m.target_date).toISOString().slice(0, 10) : startDate,
        pmId,
        pmUser.name,
        10, // default weight; task template per service_line will override at Phase 3
        idx + 1
      ]);
      await conn.query(
        `INSERT INTO project_milestones
          (project_id, title, notes, target_date, owner_user_id, owner_name_snapshot, weight, sequence_no)
         VALUES ?`,
        [values]
      );
    }

    // 9. Transition handover status
    await conn.query(
      `UPDATE handovers SET status = 'ASSIGNED_TO_PM', updated_at = NOW() WHERE handover_id = ?`,
      [handoverId]
    );

    // 10. Activity log (non-critical — log warning kalau gagal, jangan fail txn)
    try {
      await conn.query(
        `INSERT INTO handover_activity_logs
          (handover_id, activity_type, title, description, created_by)
         VALUES (?, 'PROJECT_CREATED', ?, ?, ?)`,
        [
          handoverId,
          `Assigned PM: ${pmUser.name}`,
          note
            ? `Project ${projectCode} dibuat. ${note}`
            : `Project ${projectCode} dibuat dan di-assign ke ${pmUser.name}.`,
          actorUserId
        ]
      );
    } catch (logErr) {
      // eslint-disable-next-line no-console
      console.warn('[projects.controller] activity log insert failed:', logErr.message);
    }

    await conn.commit();

    // 11. Re-fetch full detail untuk response
    const detail = await loadProjectDetailById(pool, newProjectId);
    return res.status(201).json({ success: true, data: { project: detail } });
  } catch (e) {
    try { await conn.rollback(); } catch (_) { /* ignore */ }
    return sendError(res, e);
  } finally {
    conn.release();
  }
};

/**
 * POST /api/projects/:projectId/consultants
 * Body: { consultants: [{ userId: number, level: 'Lead'|'Senior'|'Junior' }], note?: string }
 *
 * PM action: tambah consultant ke project. Validasi:
 *   - Project exists
 *   - Setiap consultant_user_id ada di users, aktif, role=CONSULTANT
 *   - Skip yang sudah ter-assign (composite PK akan reject)
 *   - Kalau project.status='Awaiting Consultant' & ada fresh consultant → transition 'In Progress'
 *   - Log handover_activity_logs (PROJECT_STARTED)
 */
const VALID_LEVELS = new Set(['Lead', 'Senior', 'Junior']);

const assignConsultants = async (req, res) => {
  const projectId = parseIdParam(req.params.projectId);
  if (projectId == null) {
    return res.status(400).json({ success: false, message: 'Project ID tidak valid.' });
  }

  const { consultants, note } = req.body || {};
  if (!Array.isArray(consultants) || consultants.length === 0) {
    return res.status(400).json({ success: false, message: 'Body `consultants` wajib array minimal 1 item.' });
  }

  // Sanitize input — extract { userId, level } pairs
  const normalized = consultants.map((c) => ({
    userId: Number(c?.userId),
    level: String(c?.level || '')
  }));
  const invalid = normalized.find(
    (c) => !Number.isInteger(c.userId) || c.userId <= 0 || !VALID_LEVELS.has(c.level)
  );
  if (invalid) {
    return res.status(400).json({
      success: false,
      message: `Item consultant invalid (userId integer & level salah satu: Lead/Senior/Junior).`
    });
  }
  // Dedupe by userId
  const seen = new Set();
  const requested = normalized.filter((c) => {
    if (seen.has(c.userId)) return false;
    seen.add(c.userId);
    return true;
  });

  const actorUserId = getUserIdFromRequest(req, res);
  if (!actorUserId) return;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Lock & read project (include department_id + DP status dari handover)
    const [[project]] = await conn.query(
      `SELECT p.project_id, p.project_code, p.handover_id, p.status,
              h.department_id, d.name AS department_name,
              h.dp_payment_status
       FROM projects p
       INNER JOIN handovers h ON h.handover_id = p.handover_id
       LEFT JOIN departments d ON d.id = h.department_id
       WHERE p.project_id = ? FOR UPDATE`,
      [projectId]
    );
    if (!project) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Project tidak ditemukan.' });
    }

    // 1b. Cross-module rule (PRD Integrasi Invoice ↔ Project, Rule A):
    // Project tidak boleh "mulai" sebelum DP dibayar. Assign consultant adalah
    // tindakan yang men-trigger transition ke In Progress, jadi di-block di sini.
    if (project.dp_payment_status !== 'PAID') {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: 'DP belum dibayar. Project belum boleh mulai — assign consultant akan tersedia setelah pembayaran DP dikonfirmasi.',
        code: 'DP_UNPAID'
      });
    }

    // 2. Validate semua user CONSULTANT, aktif, dan termasuk dept project-nya
    const userIds = requested.map((c) => c.userId);
    const [userRows] = await conn.query(
      `SELECT u.id, u.name, r.code AS role_code
       FROM users u
       INNER JOIN roles r ON r.id = u.role_id
       WHERE u.id IN (?) AND u.is_active = 1`,
      [userIds]
    );
    const validUserMap = new Map(userRows.map((u) => [u.id, u]));
    const notFoundOrInactive = userIds.filter((id) => !validUserMap.has(id));
    if (notFoundOrInactive.length > 0) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: `User berikut tidak ditemukan / inactive: ${notFoundOrInactive.join(', ')}.`
      });
    }
    const wrongRole = Array.from(validUserMap.values()).filter((u) => u.role_code !== 'CONSULTANT');
    if (wrongRole.length > 0) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: `User berikut bukan role CONSULTANT: ${wrongRole.map((u) => u.name).join(', ')}.`
      });
    }

    // 2b. Validate department: setiap consultant harus punya entry di
    // user_departments untuk department project. Skip kalau project tidak
    // punya department (legacy / data tidak lengkap).
    if (project.department_id) {
      const [deptRows] = await conn.query(
        `SELECT user_id FROM user_departments
         WHERE user_id IN (?) AND department_id = ?`,
        [userIds, project.department_id]
      );
      const validDeptUserIds = new Set(deptRows.map((r) => r.user_id));
      const wrongDept = userIds.filter((id) => !validDeptUserIds.has(id));
      if (wrongDept.length > 0) {
        const wrongNames = wrongDept.map((id) => validUserMap.get(id)?.name || id).join(', ');
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Consultant berikut tidak termasuk department "${project.department_name || project.department_id}": ${wrongNames}.`
        });
      }
    }

    // 3. Skip yang sudah ter-assign
    const [existingRows] = await conn.query(
      `SELECT consultant_user_id FROM project_consultants WHERE project_id = ? AND consultant_user_id IN (?)`,
      [projectId, userIds]
    );
    const alreadyAssignedIds = new Set(existingRows.map((r) => r.consultant_user_id));
    const fresh = requested.filter((c) => !alreadyAssignedIds.has(c.userId));
    if (fresh.length === 0) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: 'Semua consultant yang dipilih sudah ter-assign ke project ini.'
      });
    }

    // 4. INSERT fresh consultants
    const insertValues = fresh.map((c) => {
      const userObj = validUserMap.get(c.userId);
      return [projectId, c.userId, userObj.name, c.level, actorUserId];
    });
    await conn.query(
      `INSERT INTO project_consultants
        (project_id, consultant_user_id, consultant_name_snapshot, level, assigned_by)
       VALUES ?`,
      [insertValues]
    );

    // 5. Transition status kalau 'Awaiting Consultant' → 'In Progress'
    let statusTransitioned = false;
    if (project.status === 'Awaiting Consultant') {
      await conn.query(
        `UPDATE projects SET status = 'In Progress' WHERE project_id = ?`,
        [projectId]
      );
      statusTransitioned = true;
    }

    // 6. Activity log (non-critical) — log "PROJECT_STARTED" hanya pas first transition
    if (statusTransitioned) {
      try {
        const consultantNames = fresh.map((c) => validUserMap.get(c.userId).name).join(', ');
        await conn.query(
          `INSERT INTO handover_activity_logs
            (handover_id, activity_type, title, description, created_by)
           VALUES (?, 'PROJECT_STARTED', ?, ?, ?)`,
          [
            project.handover_id,
            `Project ${project.project_code} dimulai`,
            note
              ? `Consultant: ${consultantNames}. ${note}`
              : `Consultant ter-assign: ${consultantNames}.`,
            actorUserId
          ]
        );
      } catch (logErr) {
        // eslint-disable-next-line no-console
        console.warn('[projects.controller] activity log insert failed:', logErr.message);
      }
    }

    await conn.commit();

    const detail = await loadProjectDetailById(pool, projectId);
    return res.status(200).json({ success: true, data: { project: detail } });
  } catch (e) {
    try { await conn.rollback(); } catch (_) { /* ignore */ }
    return sendError(res, e);
  } finally {
    conn.release();
  }
};

/**
 * PUT /api/projects/:projectId/consultants
 * Body: { consultants: [{ userId, level }], note? }
 *
 * PM edit action: REPLACE/SYNC seluruh consultant list. Berbeda dengan POST
 * yang hanya add — endpoint ini hitung diff vs state existing, lalu:
 *   - INSERT consultant yang baru
 *   - UPDATE level consultant existing kalau berubah
 *   - DELETE consultant yang sudah tidak ada di payload
 * Validasi role + department sama dengan POST.
 * Status project tidak di-revert ke Awaiting Consultant meski list kosong
 * (jaga history; PM cancel project secara explicit kalau perlu).
 */
const setConsultants = async (req, res) => {
  const projectId = parseIdParam(req.params.projectId);
  if (projectId == null) {
    return res.status(400).json({ success: false, message: 'Project ID tidak valid.' });
  }

  const { consultants, note } = req.body || {};
  if (!Array.isArray(consultants)) {
    return res.status(400).json({ success: false, message: 'Body `consultants` wajib array (boleh kosong).' });
  }

  // Sanitize + dedupe
  const normalized = consultants.map((c) => ({
    userId: Number(c?.userId),
    level: String(c?.level || '')
  }));
  const invalid = normalized.find(
    (c) => !Number.isInteger(c.userId) || c.userId <= 0 || !VALID_LEVELS.has(c.level)
  );
  if (invalid) {
    return res.status(400).json({
      success: false,
      message: 'Item consultant invalid (userId integer & level Lead/Senior/Junior).'
    });
  }
  const seen = new Set();
  const desired = normalized.filter((c) => {
    if (seen.has(c.userId)) return false;
    seen.add(c.userId);
    return true;
  });

  const actorUserId = getUserIdFromRequest(req, res);
  if (!actorUserId) return;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Read project + department + DP status
    const [[project]] = await conn.query(
      `SELECT p.project_id, p.project_code, p.handover_id, p.status,
              h.department_id, d.name AS department_name,
              h.dp_payment_status
       FROM projects p
       INNER JOIN handovers h ON h.handover_id = p.handover_id
       LEFT JOIN departments d ON d.id = h.department_id
       WHERE p.project_id = ? FOR UPDATE`,
      [projectId]
    );
    if (!project) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Project tidak ditemukan.' });
    }

    // 1b. Cross-module rule (PRD Integrasi Invoice ↔ Project, Rule A).
    // Block edit roster juga selama DP UNPAID — konsisten dengan POST.
    if (project.dp_payment_status !== 'PAID') {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: 'DP belum dibayar. Roster consultant belum bisa diubah — project mulai berjalan setelah DP dikonfirmasi.',
        code: 'DP_UNPAID'
      });
    }

    // 2. Validate desired users (role + dept) — kalau ada item
    if (desired.length > 0) {
      const userIds = desired.map((c) => c.userId);
      const [userRows] = await conn.query(
        `SELECT u.id, u.name, r.code AS role_code FROM users u
         INNER JOIN roles r ON r.id = u.role_id
         WHERE u.id IN (?) AND u.is_active = 1`,
        [userIds]
      );
      const validUserMap = new Map(userRows.map((u) => [u.id, u]));
      const notFound = userIds.filter((id) => !validUserMap.has(id));
      if (notFound.length > 0) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `User tidak ditemukan / inactive: ${notFound.join(', ')}.`
        });
      }
      const wrongRole = Array.from(validUserMap.values()).filter((u) => u.role_code !== 'CONSULTANT');
      if (wrongRole.length > 0) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Bukan role CONSULTANT: ${wrongRole.map((u) => u.name).join(', ')}.`
        });
      }
      if (project.department_id) {
        const [deptRows] = await conn.query(
          `SELECT user_id FROM user_departments WHERE user_id IN (?) AND department_id = ?`,
          [userIds, project.department_id]
        );
        const validDept = new Set(deptRows.map((r) => r.user_id));
        const wrongDept = userIds.filter((id) => !validDept.has(id));
        if (wrongDept.length > 0) {
          const wrongNames = wrongDept.map((id) => validUserMap.get(id)?.name || id).join(', ');
          await conn.rollback();
          return res.status(400).json({
            success: false,
            message: `Consultant bukan dari department "${project.department_name || project.department_id}": ${wrongNames}.`
          });
        }
      }
      // Stash names supaya bisa pakai di INSERT
      desired.forEach((c) => {
        c.name = validUserMap.get(c.userId).name;
      });
    }

    // 3. Read existing consultants
    const [existingRows] = await conn.query(
      `SELECT consultant_user_id, level FROM project_consultants WHERE project_id = ?`,
      [projectId]
    );
    const existingMap = new Map(existingRows.map((r) => [r.consultant_user_id, r.level]));
    const desiredMap = new Map(desired.map((c) => [c.userId, c]));

    // 4. Diff
    const toInsert = desired.filter((c) => !existingMap.has(c.userId));
    const toUpdate = desired.filter(
      (c) => existingMap.has(c.userId) && existingMap.get(c.userId) !== c.level
    );
    const toDelete = Array.from(existingMap.keys()).filter((id) => !desiredMap.has(id));

    // 5. Apply
    if (toInsert.length > 0) {
      const insertVals = toInsert.map((c) => [
        projectId, c.userId, c.name, c.level, actorUserId
      ]);
      await conn.query(
        `INSERT INTO project_consultants
          (project_id, consultant_user_id, consultant_name_snapshot, level, assigned_by)
         VALUES ?`,
        [insertVals]
      );
    }
    for (const c of toUpdate) {
      await conn.query(
        `UPDATE project_consultants SET level = ? WHERE project_id = ? AND consultant_user_id = ?`,
        [c.level, projectId, c.userId]
      );
    }
    if (toDelete.length > 0) {
      await conn.query(
        `DELETE FROM project_consultants WHERE project_id = ? AND consultant_user_id IN (?)`,
        [projectId, toDelete]
      );
    }

    // 6. Auto-transition status kalau pertama kali ada consultant
    let statusTransitioned = false;
    if (project.status === 'Awaiting Consultant' && desired.length > 0) {
      await conn.query(
        `UPDATE projects SET status = 'In Progress' WHERE project_id = ?`,
        [projectId]
      );
      statusTransitioned = true;
    }

    // 7. Activity log (non-critical)
    try {
      const parts = [];
      if (toInsert.length > 0) parts.push(`+${toInsert.length}`);
      if (toUpdate.length > 0) parts.push(`~${toUpdate.length}`);
      if (toDelete.length > 0) parts.push(`-${toDelete.length}`);
      const summary = parts.length > 0 ? parts.join(' / ') : 'no-op';
      const activityType = statusTransitioned ? 'PROJECT_STARTED' : 'CONSULTANTS_UPDATED';
      const title = statusTransitioned
        ? `Project ${project.project_code} dimulai`
        : `Roster consultant diupdate (${summary})`;
      await conn.query(
        `INSERT INTO handover_activity_logs
          (handover_id, activity_type, title, description, created_by)
         VALUES (?, ?, ?, ?, ?)`,
        [
          project.handover_id,
          activityType,
          title,
          note ? `${summary}. ${note}` : summary,
          actorUserId
        ]
      );
    } catch (logErr) {
      // eslint-disable-next-line no-console
      console.warn('[projects.controller] activity log insert failed:', logErr.message);
    }

    await conn.commit();
    const detail = await loadProjectDetailById(pool, projectId);
    return res.status(200).json({ success: true, data: { project: detail } });
  } catch (e) {
    try { await conn.rollback(); } catch (_) { /* ignore */ }
    return sendError(res, e);
  } finally {
    conn.release();
  }
};

const VALID_MILESTONE_STATUS = new Set(['Pending', 'In Progress', 'Done', 'Blocked']);

/**
 * PATCH /api/projects/:projectId/milestones/:milestoneId/status
 * Body: { status: ProjectMilestoneStatus, note?: string }
 *
 * Consultant / PM action: update milestone status. Validasi:
 *   - Milestone harus belong ke project tersebut
 *   - Actor: owner milestone (consultant) ATAU PM of project
 *   - Auto-set completed_at saat transition ke 'Done', clear saat keluar 'Done'
 *   - INSERT audit log ke project_milestone_updates
 * No-op kalau status sama dengan sekarang.
 */
const updateMilestoneStatus = async (req, res) => {
  const projectId = parseIdParam(req.params.projectId);
  const milestoneId = parseIdParam(req.params.milestoneId);
  if (projectId == null || milestoneId == null) {
    return res.status(400).json({ success: false, message: 'Project / Milestone ID tidak valid.' });
  }

  const { status: nextStatus, note } = req.body || {};
  if (!VALID_MILESTONE_STATUS.has(nextStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Status harus salah satu: Pending / In Progress / Done / Blocked.'
    });
  }

  const actorUserId = getUserIdFromRequest(req, res);
  if (!actorUserId) return;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Lock milestone + check ownership chain (milestone → project)
    const [[milestone]] = await conn.query(
      `SELECT m.milestone_id, m.project_id, m.status, m.owner_user_id, m.completed_at,
              p.pm_user_id
       FROM project_milestones m
       INNER JOIN projects p ON p.project_id = m.project_id
       WHERE m.milestone_id = ? AND m.project_id = ?
       FOR UPDATE`,
      [milestoneId, projectId]
    );
    if (!milestone) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Milestone tidak ditemukan di project ini.' });
    }

    // 2. Validasi actor: owner ATAU PM of project
    const isOwner = milestone.owner_user_id === actorUserId;
    const isPm = milestone.pm_user_id === actorUserId;
    if (!isOwner && !isPm) {
      await conn.rollback();
      return res.status(403).json({
        success: false,
        message: 'Hanya owner milestone atau PM project yang boleh update status ini.'
      });
    }

    // 3. No-op kalau status sama
    if (milestone.status === nextStatus) {
      await conn.commit();
      const detail = await loadProjectDetailById(pool, projectId);
      return res.status(200).json({ success: true, data: { project: detail } });
    }

    const fromStatus = milestone.status;

    // 4. Compute completed_at
    let newCompletedAt = milestone.completed_at;
    if (nextStatus === 'Done') {
      newCompletedAt = newCompletedAt ?? new Date();
    } else if (fromStatus === 'Done') {
      newCompletedAt = null;
    }

    // 5. Update milestone
    await conn.query(
      `UPDATE project_milestones SET status = ?, completed_at = ? WHERE milestone_id = ?`,
      [nextStatus, newCompletedAt, milestoneId]
    );

    // 6. Audit log (NOT in try/catch — kalau gagal, roll back semuanya supaya
    // KPI Update Compliance tidak missing entry).
    const [[actor]] = await conn.query(
      `SELECT name FROM users WHERE id = ? LIMIT 1`,
      [actorUserId]
    );
    await conn.query(
      `INSERT INTO project_milestone_updates
        (milestone_id, by_user_id, by_name_snapshot, from_status, to_status, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [milestoneId, actorUserId, actor?.name || null, fromStatus, nextStatus, note || null]
    );

    await conn.commit();

    const detail = await loadProjectDetailById(pool, projectId);
    return res.status(200).json({ success: true, data: { project: detail } });
  } catch (e) {
    try { await conn.rollback(); } catch (_) { /* ignore */ }
    return sendError(res, e);
  } finally {
    conn.release();
  }
};

/**
 * PATCH /api/projects/:projectId/milestones/:milestoneId/rate
 * Body: { rating: 1..5, revisionCount: number >= 0, note?: string }
 *
 * PM action: rate milestone yang sudah Done (feed KPI Output Quality dimensi).
 * Validasi:
 *   - Milestone harus belong ke project
 *   - Actor harus PM of project
 *   - rating 1..5, revisionCount integer >= 0
 *   - Audit log append ke project_milestone_updates (no status change; note
 *     berisi "Rated N/5 (revisions: X). ...")
 */
const rateMilestone = async (req, res) => {
  const projectId = parseIdParam(req.params.projectId);
  const milestoneId = parseIdParam(req.params.milestoneId);
  if (projectId == null || milestoneId == null) {
    return res.status(400).json({ success: false, message: 'Project / Milestone ID tidak valid.' });
  }

  const { rating, revisionCount, note } = req.body || {};
  const ratingNum = Number(rating);
  const revNum = Number(revisionCount);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ success: false, message: 'Rating harus integer 1..5.' });
  }
  if (!Number.isInteger(revNum) || revNum < 0) {
    return res.status(400).json({ success: false, message: 'revisionCount harus integer >= 0.' });
  }

  const actorUserId = getUserIdFromRequest(req, res);
  if (!actorUserId) return;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Lock milestone + ownership chain
    const [[milestone]] = await conn.query(
      `SELECT m.milestone_id, m.project_id, m.status,
              p.pm_user_id
       FROM project_milestones m
       INNER JOIN projects p ON p.project_id = m.project_id
       WHERE m.milestone_id = ? AND m.project_id = ?
       FOR UPDATE`,
      [milestoneId, projectId]
    );
    if (!milestone) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Milestone tidak ditemukan di project ini.' });
    }

    // 2. Actor harus PM project
    if (milestone.pm_user_id !== actorUserId) {
      await conn.rollback();
      return res.status(403).json({
        success: false,
        message: 'Hanya PM project yang boleh memberi rating milestone.'
      });
    }

    // 3. Update rating
    await conn.query(
      `UPDATE project_milestones
       SET quality_rating = ?, revision_count = ?
       WHERE milestone_id = ?`,
      [ratingNum, revNum, milestoneId]
    );

    // 4. Audit log (no status change — from = to = current status)
    const [[actor]] = await conn.query(
      `SELECT name FROM users WHERE id = ? LIMIT 1`,
      [actorUserId]
    );
    const noteWithRating = note
      ? `Rated ${ratingNum}/5 (revisions: ${revNum}). ${note}`
      : `Rated ${ratingNum}/5 (revisions: ${revNum}).`;
    await conn.query(
      `INSERT INTO project_milestone_updates
        (milestone_id, by_user_id, by_name_snapshot, from_status, to_status, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [milestoneId, actorUserId, actor?.name || null, milestone.status, milestone.status, noteWithRating]
    );

    await conn.commit();

    const detail = await loadProjectDetailById(pool, projectId);
    return res.status(200).json({ success: true, data: { project: detail } });
  } catch (e) {
    try { await conn.rollback(); } catch (_) { /* ignore */ }
    return sendError(res, e);
  } finally {
    conn.release();
  }
};

/**
 * POST /api/projects/:projectId/complete
 * Body: { note?: string }
 *
 * PM action: mark project Completed + trigger final invoice activation.
 * Cross-module integration dengan modul Invoice (PRD Rule B):
 *   - Project completion mengisi trigger final invoice (trigger_reference_value/_by/_at).
 *     Promosi DRAFT → READY_TO_ISSUE dijalankan lifecycle sync (termin sebelumnya
 *     harus PAID, billing schedule final tercapai jika ada).
 *
 * Validasi:
 *   - Project exists, status In Progress (atau On Hold)
 *   - Actor harus PM project ini
 *   - SEMUA project_milestones harus status='Done' (strict — sesuai keputusan
 *     desain: completion adalah final state, butuh semua deliverable selesai)
 *
 * Transaksi tunggal: update projects → update invoice_terms → log activity.
 * Kalau invoice_terms tidak ter-link (project_id NULL di sisi invoice) atau
 * tidak ada term FINAL, completion tetap berhasil tapi `triggeredInvoiceTerms`
 * di response = 0 supaya admin invoice (Izhhar) bisa investigate.
 */
const completeProject = async (req, res) => {
  const projectId = parseIdParam(req.params.projectId);
  if (projectId == null) {
    return res.status(400).json({ success: false, message: 'Project ID tidak valid.' });
  }

  const { note } = req.body || {};

  const actorUserId = getUserIdFromRequest(req, res);
  if (!actorUserId) return;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Lock & read project
    const [[project]] = await conn.query(
      `SELECT project_id, project_code, handover_id, status, pm_user_id, end_date
       FROM projects WHERE project_id = ? FOR UPDATE`,
      [projectId]
    );
    if (!project) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Project tidak ditemukan.' });
    }

    // 2. Actor harus PM
    if (project.pm_user_id !== actorUserId) {
      await conn.rollback();
      return res.status(403).json({
        success: false,
        message: 'Hanya PM project yang boleh menandai project sebagai Completed.'
      });
    }

    // 3. Status pre-check
    if (project.status === 'Completed') {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: 'Project sudah dalam status Completed.'
      });
    }
    if (project.status === 'Cancelled') {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: 'Project Cancelled tidak bisa di-complete.'
      });
    }

    // 4. Semua milestone harus Done (strict completion rule)
    const [milestoneStats] = await conn.query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'Done' THEN 1 ELSE 0 END) AS done_count
       FROM project_milestones WHERE project_id = ?`,
      [projectId]
    );
    const { total, done_count: doneCount } = milestoneStats[0];
    if (Number(total) === 0) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: 'Project tidak punya milestone — tidak bisa dianggap Completed.'
      });
    }
    if (Number(doneCount) < Number(total)) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: `Masih ada ${Number(total) - Number(doneCount)} dari ${total} milestone yang belum Done.`,
        code: 'MILESTONES_INCOMPLETE'
      });
    }

    // 5. Update project status + end_date (catat tanggal aktual completion)
    const todayIso = new Date().toISOString().slice(0, 10);
    await conn.query(
      `UPDATE projects SET status = 'Completed', end_date = ? WHERE project_id = ?`,
      [todayIso, projectId]
    );

    // 6. Trigger ke modul Invoice — isi field completion pada term FINAL (masih DRAFT).
    // Promosi READY_TO_ISSUE via syncInvoiceTermLifecycle (previous terms PAID, dll.).
    const [triggerResult] = await conn.query(
      `UPDATE invoice_terms
       SET trigger_reference_value = 'Project completed',
           trigger_confirmed_by = ?,
           trigger_confirmed_at = NOW(),
           updated_at = CURRENT_TIMESTAMP
       WHERE project_id = ?
         AND term_type = 'FINAL'
         AND status = 'DRAFT'`,
      [actorUserId, projectId]
    );
    const triggeredInvoiceTerms = triggerResult.affectedRows ?? 0;

    const [accountRows] = await conn.query(
      `SELECT DISTINCT account_id
         FROM invoice_terms
        WHERE project_id = ?
          AND term_type = 'FINAL'`,
      [projectId]
    );
    for (const row of accountRows) {
      await syncInvoiceTermLifecycle(conn, row.account_id);
    }

    // 7. Activity log (non-critical)
    try {
      const [[actor]] = await conn.query(
        `SELECT name FROM users WHERE id = ? LIMIT 1`,
        [actorUserId]
      );
      const description = note
        ? `Project ${project.project_code} ditandai Completed oleh ${actor?.name || 'PM'}. Trigger final invoice: ${triggeredInvoiceTerms} term. ${note}`
        : `Project ${project.project_code} ditandai Completed oleh ${actor?.name || 'PM'}. Trigger final invoice: ${triggeredInvoiceTerms} term.`;
      await conn.query(
        `INSERT INTO handover_activity_logs
          (handover_id, activity_type, title, description, created_by)
         VALUES (?, 'PROJECT_COMPLETED', ?, ?, ?)`,
        [
          project.handover_id,
          `Project ${project.project_code} completed`,
          description,
          actorUserId
        ]
      );
    } catch (logErr) {
      // eslint-disable-next-line no-console
      console.warn('[projects.controller] activity log insert failed:', logErr.message);
    }

    await conn.commit();

    const detail = await loadProjectDetailById(pool, projectId);
    return res.status(200).json({
      success: true,
      data: {
        project: detail,
        triggeredInvoiceTerms
      }
    });
  } catch (e) {
    try { await conn.rollback(); } catch (_) { /* ignore */ }
    return sendError(res, e);
  } finally {
    conn.release();
  }
};

/**
 * GET /api/projects/:projectId/handover
 *
 * Return handover detail untuk project tertentu — accessible by PROJECT_VIEW
 * (PM/Consultant/COO/CEO). Berbeda dengan /api/handovers/:id yang butuh
 * HANDOVER_MANAGE/APPROVE permission.
 *
 * Backend tidak filter field di sini (mis. fee structure) — frontend yang
 * tentukan section mana ditampilkan berdasarkan role.
 */
const getProjectHandover = async (req, res) => {
  const projectId = parseIdParam(req.params.projectId);
  if (projectId == null) {
    return res.status(400).json({ success: false, message: 'Project ID tidak valid.' });
  }

  try {
    const [[project]] = await pool.query(
      `SELECT handover_id FROM projects WHERE project_id = ? LIMIT 1`,
      [projectId]
    );
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project tidak ditemukan.' });
    }
    // Pass empty access — no department restriction. Permission check sudah
    // via PROJECT_VIEW di route middleware.
    const result = await handoverRepo.findHandoverDetail(project.handover_id, {});
    if (!result.ok) {
      return res.status(404).json({ success: false, message: 'Handover tidak ditemukan.' });
    }
    return res.json({ success: true, data: result.data });
  } catch (e) {
    return sendError(res, e);
  }
};

module.exports = {
  listProjects,
  getProjectDetail,
  createFromHandover,
  assignConsultants,
  setConsultants,
  updateMilestoneStatus,
  rateMilestone,
  completeProject,
  getProjectHandover
};
