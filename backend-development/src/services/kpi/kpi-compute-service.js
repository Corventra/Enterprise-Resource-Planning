/**
 * KPI Compute Service — auto-compute preliminary KPI snapshot.
 *
 * Function utama:
 *   - `computeAndStorePreliminarySnapshots(conn, consultantIds, period)`
 *     Dipanggil dari `completeProject` setelah invoice trigger (SYS KPI step
 *     di Activity Diagram).
 *
 * Mekanisme:
 *   1. Untuk setiap consultant_user_id, fetch raw data milestone yang dia
 *      involved selama period (dari project_milestones + project_milestone_updates).
 *   2. Hitung 4 dimensi KPI (WSM) via kpi-calculations.js.
 *   3. UPSERT ke kpi_snapshots dengan finalized_at = NULL (preliminary).
 *   4. Kalau snapshot sudah finalized (finalized_at NOT NULL), SKIP — tidak
 *      boleh override snapshot yang sudah di-lock oleh CEO.
 */

const { computeFullKpi } = require('./kpi-calculations');

/**
 * Fetch active KPI config (latest row) dari kpi_period_config.
 */
const fetchActiveConfig = async (conn) => {
  const [[row]] = await conn.query(
    `SELECT config_id,
            weight_task_completion, weight_timeliness,
            weight_update_compliance, weight_output_quality,
            on_time_tolerance_days, update_gap_target_days,
            quality_rating_scale
     FROM kpi_period_config
     ORDER BY config_id DESC
     LIMIT 1`
  );
  if (!row) return null;
  return {
    configId: row.config_id,
    weights: {
      taskCompletion:   Number(row.weight_task_completion),
      timeliness:       Number(row.weight_timeliness),
      updateCompliance: Number(row.weight_update_compliance),
      outputQuality:    Number(row.weight_output_quality)
    },
    onTimeToleranceDays: Number(row.on_time_tolerance_days),
    updateGapTargetDays: Number(row.update_gap_target_days),
    qualityRatingScale:  Number(row.quality_rating_scale)
  };
};

/**
 * Fetch milestone yang relevan untuk satu consultant.
 *
 * Relevant = consultant adalah owner milestone, ATAU pernah update milestone
 * (muncul di by_user_id di project_milestone_updates).
 *
 * Return shape kompatibel dengan kpi-calculations (ProjectMilestone +
 * TaskUpdateLogEntry).
 */
const fetchConsultantMilestones = async (conn, consultantUserId) => {
  // Get milestone IDs yang involved: (owner OR update by)
  const [milestoneIds] = await conn.query(
    `SELECT DISTINCT m.milestone_id
     FROM project_milestones m
     LEFT JOIN project_milestone_updates upd ON upd.milestone_id = m.milestone_id
     WHERE m.owner_user_id = ? OR upd.by_user_id = ?`,
    [consultantUserId, consultantUserId]
  );
  if (milestoneIds.length === 0) return [];

  const ids = milestoneIds.map((r) => r.milestone_id);
  const [milestones] = await conn.query(
    `SELECT milestone_id, title, status, target_date, completed_at,
            weight, quality_rating, revision_count
     FROM project_milestones
     WHERE milestone_id IN (?)`,
    [ids]
  );
  const [updates] = await conn.query(
    `SELECT update_id, milestone_id, by_user_id, from_status, to_status, note, at
     FROM project_milestone_updates
     WHERE milestone_id IN (?)
     ORDER BY at ASC`,
    [ids]
  );

  const updatesByMilestone = updates.reduce((acc, u) => {
    if (!acc[u.milestone_id]) acc[u.milestone_id] = [];
    acc[u.milestone_id].push({
      at: u.at,
      byId: String(u.by_user_id ?? ''),
      fromStatus: u.from_status,
      toStatus: u.to_status,
      note: u.note
    });
    return acc;
  }, {});

  return milestones.map((m) => ({
    id: String(m.milestone_id),
    title: m.title,
    status: m.status,
    targetDate: m.target_date,
    completedAt: m.completed_at,
    weight: Number(m.weight),
    qualityRating: m.quality_rating != null ? Number(m.quality_rating) : undefined,
    revisionCount: m.revision_count != null ? Number(m.revision_count) : undefined,
    updateLog: updatesByMilestone[m.milestone_id] || []
  }));
};

/**
 * Cek apakah snapshot existing sudah ter-finalized.
 * Kalau yes → SKIP overwrite. Kalau no → boleh UPSERT.
 */
const isSnapshotFinalized = async (conn, consultantUserId, period) => {
  const [[row]] = await conn.query(
    `SELECT finalized_at FROM kpi_snapshots
     WHERE consultant_user_id = ? AND period = ?
     LIMIT 1`,
    [consultantUserId, period]
  );
  return !!(row && row.finalized_at);
};

/**
 * Compute & store preliminary KPI snapshot untuk satu consultant.
 *
 * @returns {Promise<{ skipped: boolean, snapshot?: object }>}
 */
const computeAndStorePreliminaryForConsultant = async (conn, params) => {
  const { consultantUserId, consultantName, period, config } = params;

  // Skip kalau sudah finalized
  if (await isSnapshotFinalized(conn, consultantUserId, period)) {
    return { skipped: true, reason: 'ALREADY_FINALIZED' };
  }

  // Fetch raw data
  const milestones = await fetchConsultantMilestones(conn, consultantUserId);
  if (milestones.length === 0) {
    return { skipped: true, reason: 'NO_MILESTONES' };
  }

  // Compute WSM
  const result = computeFullKpi(milestones, config, period);

  // UPSERT — finalized_at = NULL (preliminary)
  await conn.query(
    `INSERT INTO kpi_snapshots
      (consultant_user_id, consultant_name_snapshot, period, config_id_used,
       capaian_task_completion, capaian_timeliness, capaian_update_compliance, capaian_output_quality,
       total_score, computed_at, finalized_at, finalized_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NULL, NULL)
     ON DUPLICATE KEY UPDATE
       consultant_name_snapshot = VALUES(consultant_name_snapshot),
       config_id_used = VALUES(config_id_used),
       capaian_task_completion = VALUES(capaian_task_completion),
       capaian_timeliness = VALUES(capaian_timeliness),
       capaian_update_compliance = VALUES(capaian_update_compliance),
       capaian_output_quality = VALUES(capaian_output_quality),
       total_score = VALUES(total_score),
       computed_at = NOW()
       -- finalized_at & finalized_by_user_id NOT touched (preserve NULL state)`,
    [
      consultantUserId,
      consultantName,
      period,
      config.configId,
      Number(result.capaian.taskCompletion.toFixed(2)),
      Number(result.capaian.timeliness.toFixed(2)),
      Number(result.capaian.updateCompliance.toFixed(2)),
      Number(result.capaian.outputQuality.toFixed(2)),
      Number(result.total.toFixed(2))
    ]
  );

  return {
    skipped: false,
    snapshot: {
      consultantUserId,
      period,
      capaian: result.capaian,
      total: result.total
    }
  };
};

/**
 * Public API: compute preliminary snapshots untuk multiple consultants
 * sekaligus (typical use case: setelah project completed, untuk semua tim).
 *
 * @returns {Promise<Array<object>>} Array of result per consultant.
 */
const computeAndStorePreliminarySnapshots = async (conn, params) => {
  const { consultants, period } = params;
  if (!Array.isArray(consultants) || consultants.length === 0) return [];

  const config = await fetchActiveConfig(conn);
  if (!config) {
    // No config — cannot compute. Return empty result, caller handles.
    return [];
  }

  const results = [];
  for (const c of consultants) {
    try {
      const r = await computeAndStorePreliminaryForConsultant(conn, {
        consultantUserId: c.userId,
        consultantName: c.name || 'Unknown',
        period,
        config
      });
      results.push({ consultantUserId: c.userId, ...r });
    } catch (e) {
      // Per-consultant error tidak fail batch — log & continue
      // eslint-disable-next-line no-console
      console.warn('[kpi-compute] failed for consultant', c.userId, ':', e.message);
      results.push({ consultantUserId: c.userId, skipped: true, reason: 'ERROR', error: e.message });
    }
  }
  return results;
};

/**
 * Helper: bentuk period 'YYYY-MM' dari Date (default = today).
 */
const formatPeriodFromDate = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

module.exports = {
  fetchActiveConfig,
  fetchConsultantMilestones,
  isSnapshotFinalized,
  computeAndStorePreliminaryForConsultant,
  computeAndStorePreliminarySnapshots,
  formatPeriodFromDate
};
