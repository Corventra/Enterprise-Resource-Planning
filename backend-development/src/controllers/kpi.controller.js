const { pool } = require('../config/db');

/**
 * KPI Controller — Phase 6a (config only).
 *
 * GET /api/kpi/config — return active (latest) config
 * PUT /api/kpi/config — CEO update (insert new row, latest = active)
 *
 * Phase 6b berikutnya: compute snapshot endpoints + finalize storage.
 */

const sendError = (res, e) => {
  // eslint-disable-next-line no-console
  console.error('[kpi.controller] error:', e);
  const detail = e?.sqlMessage || e?.message || 'Unknown error';
  return res.status(500).json({ success: false, message: 'Internal server error', detail, code: e?.code });
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
 * Helper: ambil row config terbaru sebagai active. Map ke shape frontend
 * (camelCase + nested weights object).
 */
const mapConfigRow = (row) => {
  if (!row) return null;
  return {
    configId: row.config_id,
    effectiveFrom: row.effective_from instanceof Date
      ? row.effective_from.toISOString().slice(0, 10)
      : String(row.effective_from).slice(0, 10),
    weights: {
      taskCompletion: Number(row.weight_task_completion),
      timeliness: Number(row.weight_timeliness),
      updateCompliance: Number(row.weight_update_compliance),
      outputQuality: Number(row.weight_output_quality)
    },
    onTimeToleranceDays: row.on_time_tolerance_days,
    updateGapTargetDays: row.update_gap_target_days,
    qualityRatingScale: row.quality_rating_scale,
    period: row.period_kind,
    approvedBy: row.approved_by_user_id
      ? { id: String(row.approved_by_user_id), name: row.approved_by_name || '', role: row.approved_by_role || 'CEO' }
      : undefined,
    approvedAt: row.approved_at ? new Date(row.approved_at).toISOString() : undefined
  };
};

/**
 * GET /api/kpi/config
 * Return active (latest) config row, mapped ke shape frontend.
 */
const getCurrentConfig = async (req, res) => {
  try {
    const [[row]] = await pool.query(
      `SELECT c.*,
              u.name AS approved_by_name,
              r.code AS approved_by_role
       FROM kpi_period_config c
       LEFT JOIN users u ON u.id = c.approved_by_user_id
       LEFT JOIN roles r ON r.id = u.role_id
       ORDER BY c.config_id DESC
       LIMIT 1`
    );
    if (!row) {
      return res.status(404).json({ success: false, message: 'KPI config belum di-setup.' });
    }
    return res.json({ success: true, data: { config: mapConfigRow(row) } });
  } catch (e) {
    return sendError(res, e);
  }
};

/**
 * PUT /api/kpi/config
 * CEO update config. Insert row baru (history preserved) — latest row = active.
 *
 * Body: { effectiveFrom, weights: {...}, onTimeToleranceDays, updateGapTargetDays,
 *         qualityRatingScale, period }
 *
 * Validation:
 *   - Weights sum ≈ 1.0 (tolerance 0.01)
 *   - Setiap weight 0..1
 *   - Tolerance & gap days non-negative
 *   - period 'monthly' | 'quarterly'
 */
const updateConfig = async (req, res) => {
  const actorUserId = getUserIdFromRequest(req, res);
  if (!actorUserId) return;

  const body = req.body || {};
  const weights = body.weights || {};
  const w = {
    tc: Number(weights.taskCompletion),
    tm: Number(weights.timeliness),
    uc: Number(weights.updateCompliance),
    oq: Number(weights.outputQuality)
  };
  const tolerance = Number(body.onTimeToleranceDays);
  const gap = Number(body.updateGapTargetDays);
  const scale = Number(body.qualityRatingScale ?? 5);
  const period = String(body.period || 'monthly');
  const effectiveFrom = String(body.effectiveFrom || new Date().toISOString().slice(0, 10));

  // Validate
  const inRange = (v) => Number.isFinite(v) && v >= 0 && v <= 1;
  if (!inRange(w.tc) || !inRange(w.tm) || !inRange(w.uc) || !inRange(w.oq)) {
    return res.status(400).json({ success: false, message: 'Setiap bobot harus 0..1.' });
  }
  const sum = w.tc + w.tm + w.uc + w.oq;
  if (Math.abs(sum - 1) > 0.01) {
    return res.status(400).json({
      success: false,
      message: `Total bobot harus 1.0 (sekarang ${sum.toFixed(3)}).`
    });
  }
  if (!Number.isInteger(tolerance) || tolerance < 0) {
    return res.status(400).json({ success: false, message: 'onTimeToleranceDays harus integer >= 0.' });
  }
  if (!Number.isInteger(gap) || gap <= 0) {
    return res.status(400).json({ success: false, message: 'updateGapTargetDays harus integer > 0.' });
  }
  if (!Number.isInteger(scale) || scale < 3 || scale > 10) {
    return res.status(400).json({ success: false, message: 'qualityRatingScale harus integer 3..10.' });
  }
  if (period !== 'monthly' && period !== 'quarterly') {
    return res.status(400).json({ success: false, message: 'period harus monthly atau quarterly.' });
  }

  try {
    await pool.query(
      `INSERT INTO kpi_period_config
        (effective_from,
         weight_task_completion, weight_timeliness, weight_update_compliance, weight_output_quality,
         on_time_tolerance_days, update_gap_target_days, quality_rating_scale, period_kind,
         approved_by_user_id, approved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [effectiveFrom, w.tc, w.tm, w.uc, w.oq, tolerance, gap, scale, period, actorUserId]
    );
    // Re-fetch latest
    const [[row]] = await pool.query(
      `SELECT c.*, u.name AS approved_by_name, r.code AS approved_by_role
       FROM kpi_period_config c
       LEFT JOIN users u ON u.id = c.approved_by_user_id
       LEFT JOIN roles r ON r.id = u.role_id
       ORDER BY c.config_id DESC
       LIMIT 1`
    );
    return res.json({ success: true, data: { config: mapConfigRow(row) } });
  } catch (e) {
    return sendError(res, e);
  }
};

// ====================================================================
// SNAPSHOTS
//
// kpi_snapshots di-store hanya saat user click Finalize. Preliminary
// snapshots di-compute live di frontend (kpi-engine) dan tidak masuk DB.
// Schema kpi_snapshots: UNIQUE (consultant_user_id, period) — upsert pattern.
// ====================================================================

const parseIdParam = (value) => {
  if (value === undefined || value === null) return null;
  const raw = String(value).trim();
  if (raw.length === 0 || !/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return id;
};

const PERIOD_RE = /^\d{4}-\d{2}$/; // YYYY-MM

const mapSnapshotRow = (row) => ({
  consultantId: String(row.consultant_user_id),
  consultantName: row.consultant_name_snapshot,
  period: row.period,
  computedAt: row.computed_at instanceof Date ? row.computed_at.toISOString() : row.computed_at,
  finalizedAt: row.finalized_at
    ? (row.finalized_at instanceof Date ? row.finalized_at.toISOString() : row.finalized_at)
    : undefined,
  finalizedBy: row.finalized_by_user_id
    ? {
        id: String(row.finalized_by_user_id),
        name: row.finalized_by_name || '',
        role: row.finalized_by_role || ''
      }
    : undefined,
  // Dimensions: backend cuma store capaian — weight & rawValue di-hydrate dari
  // config saat read di frontend kalau perlu detail break-down.
  dimensions: {
    taskCompletion: {
      weight: 0,
      capaian: Number(row.capaian_task_completion),
      rawValue: 0,
      contributingTaskIds: []
    },
    timeliness: {
      weight: 0,
      capaian: Number(row.capaian_timeliness),
      rawValue: 0,
      contributingTaskIds: []
    },
    updateCompliance: {
      weight: 0,
      capaian: Number(row.capaian_update_compliance),
      rawValue: 0,
      contributingTaskIds: []
    },
    outputQuality: {
      weight: 0,
      capaian: Number(row.capaian_output_quality),
      rawValue: 0,
      contributingTaskIds: []
    }
  },
  total: Number(row.total_score),
  contributingProjectIds: []
});

const SNAPSHOT_SELECT_FIELDS = `
  s.snapshot_id,
  s.consultant_user_id,
  s.consultant_name_snapshot,
  s.period,
  s.config_id_used,
  s.capaian_task_completion,
  s.capaian_timeliness,
  s.capaian_update_compliance,
  s.capaian_output_quality,
  s.total_score,
  s.computed_at,
  s.finalized_at,
  s.finalized_by_user_id,
  uf.name AS finalized_by_name,
  rf.code AS finalized_by_role
`;
const SNAPSHOT_JOIN = `
  FROM kpi_snapshots s
  LEFT JOIN users uf ON uf.id = s.finalized_by_user_id
  LEFT JOIN roles rf ON rf.id = uf.role_id
`;

/**
 * GET /api/kpi/snapshots?period=YYYY-MM
 * Return semua finalized snapshot untuk period tertentu. Tanpa period =
 * semua (gunakan hati-hati untuk dataset besar).
 */
const listSnapshots = async (req, res) => {
  try {
    const period = req.query.period ? String(req.query.period) : null;
    if (period && !PERIOD_RE.test(period)) {
      return res.status(400).json({ success: false, message: 'Format period: YYYY-MM.' });
    }
    const sql = period
      ? `SELECT ${SNAPSHOT_SELECT_FIELDS} ${SNAPSHOT_JOIN} WHERE s.period = ? ORDER BY s.consultant_name_snapshot ASC`
      : `SELECT ${SNAPSHOT_SELECT_FIELDS} ${SNAPSHOT_JOIN} ORDER BY s.period DESC, s.consultant_name_snapshot ASC`;
    const params = period ? [period] : [];
    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, data: { items: rows.map(mapSnapshotRow) } });
  } catch (e) {
    return sendError(res, e);
  }
};

/**
 * GET /api/kpi/snapshots/consultant/:userId
 * Return semua finalized snapshot history untuk satu consultant, sorted asc.
 */
const listSnapshotsByConsultant = async (req, res) => {
  const userId = parseIdParam(req.params.userId);
  if (userId == null) {
    return res.status(400).json({ success: false, message: 'User ID tidak valid.' });
  }
  try {
    const [rows] = await pool.query(
      `SELECT ${SNAPSHOT_SELECT_FIELDS} ${SNAPSHOT_JOIN}
       WHERE s.consultant_user_id = ?
       ORDER BY s.period ASC`,
      [userId]
    );
    return res.json({ success: true, data: { items: rows.map(mapSnapshotRow) } });
  } catch (e) {
    return sendError(res, e);
  }
};

/**
 * GET /api/kpi/snapshots/consultant/:userId/:period
 * Return single snapshot atau 404.
 */
const getSnapshotByConsultantAndPeriod = async (req, res) => {
  const userId = parseIdParam(req.params.userId);
  if (userId == null) {
    return res.status(400).json({ success: false, message: 'User ID tidak valid.' });
  }
  const period = String(req.params.period || '');
  if (!PERIOD_RE.test(period)) {
    return res.status(400).json({ success: false, message: 'Format period: YYYY-MM.' });
  }
  try {
    const [[row]] = await pool.query(
      `SELECT ${SNAPSHOT_SELECT_FIELDS} ${SNAPSHOT_JOIN}
       WHERE s.consultant_user_id = ? AND s.period = ?
       LIMIT 1`,
      [userId, period]
    );
    if (!row) {
      return res.status(404).json({ success: false, message: 'Snapshot tidak ditemukan.' });
    }
    return res.json({ success: true, data: { snapshot: mapSnapshotRow(row) } });
  } catch (e) {
    return sendError(res, e);
  }
};

/**
 * POST /api/kpi/snapshots
 * Upsert finalized snapshot. Body: { consultantId, consultantName, period,
 * dimensions: { taskCompletion: number (capaian 0-100), timeliness, ... }, total }
 *
 * Auth: KPI_FINALIZE_PERIOD (CEO).
 * Backend set finalized_at = NOW(), finalized_by = req.user.sub.
 * Pakai config_id terbaru sebagai snapshot config reference.
 */
const upsertSnapshot = async (req, res) => {
  const actorUserId = getUserIdFromRequest(req, res);
  if (!actorUserId) return;

  const { consultantId, consultantName, period, dimensions, total } = req.body || {};
  const consultantUserId = Number(consultantId);
  if (!Number.isInteger(consultantUserId) || consultantUserId <= 0) {
    return res.status(400).json({ success: false, message: 'consultantId tidak valid.' });
  }
  if (!consultantName || typeof consultantName !== 'string') {
    return res.status(400).json({ success: false, message: 'consultantName wajib string.' });
  }
  if (!period || !PERIOD_RE.test(String(period))) {
    return res.status(400).json({ success: false, message: 'period harus format YYYY-MM.' });
  }
  if (!dimensions || typeof dimensions !== 'object') {
    return res.status(400).json({ success: false, message: 'dimensions wajib object.' });
  }
  const cap = (d) => {
    // Frontend bisa kirim either flat number atau {capaian: number}
    if (typeof d === 'number') return d;
    if (d && typeof d === 'object' && typeof d.capaian === 'number') return d.capaian;
    return NaN;
  };
  const caps = {
    tc: cap(dimensions.taskCompletion),
    tm: cap(dimensions.timeliness),
    uc: cap(dimensions.updateCompliance),
    oq: cap(dimensions.outputQuality)
  };
  for (const [k, v] of Object.entries(caps)) {
    if (!Number.isFinite(v) || v < 0 || v > 100) {
      return res.status(400).json({
        success: false,
        message: `Capaian ${k} harus angka 0..100 (got: ${v}).`
      });
    }
  }
  const totalNum = Number(total);
  if (!Number.isFinite(totalNum) || totalNum < 0 || totalNum > 100) {
    return res.status(400).json({ success: false, message: 'total harus angka 0..100.' });
  }

  try {
    // Ambil config_id terbaru sebagai reference
    const [[latestConfig]] = await pool.query(
      `SELECT config_id FROM kpi_period_config ORDER BY config_id DESC LIMIT 1`
    );
    if (!latestConfig) {
      return res.status(409).json({
        success: false,
        message: 'KPI config belum di-setup. Tidak bisa simpan snapshot tanpa config reference.'
      });
    }

    // Verify consultant user exists
    const [[u]] = await pool.query(`SELECT id FROM users WHERE id = ? LIMIT 1`, [consultantUserId]);
    if (!u) {
      return res.status(400).json({ success: false, message: 'Consultant user tidak ditemukan.' });
    }

    // Upsert
    await pool.query(
      `INSERT INTO kpi_snapshots
        (consultant_user_id, consultant_name_snapshot, period, config_id_used,
         capaian_task_completion, capaian_timeliness, capaian_update_compliance, capaian_output_quality,
         total_score,
         computed_at, finalized_at, finalized_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)
       ON DUPLICATE KEY UPDATE
         consultant_name_snapshot = VALUES(consultant_name_snapshot),
         config_id_used = VALUES(config_id_used),
         capaian_task_completion = VALUES(capaian_task_completion),
         capaian_timeliness = VALUES(capaian_timeliness),
         capaian_update_compliance = VALUES(capaian_update_compliance),
         capaian_output_quality = VALUES(capaian_output_quality),
         total_score = VALUES(total_score),
         computed_at = NOW(),
         finalized_at = NOW(),
         finalized_by_user_id = VALUES(finalized_by_user_id)`,
      [
        consultantUserId,
        consultantName,
        period,
        latestConfig.config_id,
        caps.tc, caps.tm, caps.uc, caps.oq,
        totalNum,
        actorUserId
      ]
    );

    const [[row]] = await pool.query(
      `SELECT ${SNAPSHOT_SELECT_FIELDS} ${SNAPSHOT_JOIN}
       WHERE s.consultant_user_id = ? AND s.period = ?
       LIMIT 1`,
      [consultantUserId, period]
    );
    return res.status(200).json({ success: true, data: { snapshot: mapSnapshotRow(row) } });
  } catch (e) {
    return sendError(res, e);
  }
};

module.exports = {
  getCurrentConfig,
  updateConfig,
  listSnapshots,
  listSnapshotsByConsultant,
  getSnapshotByConsultantAndPeriod,
  upsertSnapshot
};
