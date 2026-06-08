const { deltaPercent } = require('../utils/dashboard-period');

/**
 * Dashboard CEO — scope post-handover (Project Ops) & KPI consultant.
 * Module ini bertanggung jawab atas section khusus skripsi Faried; di-include
 * oleh dashboard-ceo.repo.getCeoDashboard supaya muncul di response yang sama.
 *
 * Catatan:
 * - serviceId & departmentId filter di-honor lewat JOIN handovers + services.
 * - Period dipakai untuk slot "completed_in_period". Status distribution +
 *   blocked_by_dp pakai current state (snapshot saat ini) — bukan period-bound,
 *   karena CEO butuh visibility live untuk operational decision.
 */

const KPI_BAND_THRESHOLDS = {
  excellent: 85,
  good: 70
};

/**
 * Helper: simple count helper.
 */
const fetchScalar = async (conn, sql, params, field = 'cnt') => {
  const [rows] = await conn.execute(sql, params ?? []);
  return Number(rows[0]?.[field] ?? 0);
};

/**
 * Build filter fragments (dept + service) untuk JOIN ke handover/services.
 * Pakai alias `h` untuk handovers, `svc` untuk services. Caller harus pastikan
 * JOIN-nya konsisten.
 */
const buildProjectFilters = (serviceId, departmentId) => {
  const conditions = [];
  const params = [];
  if (serviceId != null) {
    conditions.push('h.service_id = ?');
    params.push(serviceId);
  }
  if (departmentId != null) {
    conditions.push('h.department_id = ?');
    params.push(departmentId);
  }
  return {
    sql: conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '',
    params
  };
};

/**
 * Build Project Operations section: status counts, completion rate, blocked
 * by DP, dan top departments by completed. Period dipakai untuk slot
 * completed_in_period (status='Completed' AND end_date in range).
 */
const buildProjectOperations = async (conn, { period, comparison, serviceId, departmentId }) => {
  const flt = buildProjectFilters(serviceId, departmentId);

  const baseJoin = `
    FROM projects p
    INNER JOIN handovers h ON h.handover_id = p.handover_id
    LEFT JOIN departments d ON d.id = h.department_id
    WHERE 1=1
    ${flt.sql}
  `;

  // 1. KPI: Active Projects (current snapshot — bukan period bound, biar live)
  const activeCount = await fetchScalar(
    conn,
    `SELECT COUNT(*) AS cnt ${baseJoin} AND p.status = 'In Progress'`,
    flt.params
  );

  // 2. KPI: Completed in Period (vs comparison)
  const completedCurrent = await fetchScalar(
    conn,
    `SELECT COUNT(*) AS cnt ${baseJoin}
       AND p.status = 'Completed'
       AND p.end_date >= ? AND p.end_date < ?`,
    [...flt.params, period.startSql, period.endSqlExclusive]
  );
  const completedPrevious = await fetchScalar(
    conn,
    `SELECT COUNT(*) AS cnt ${baseJoin}
       AND p.status = 'Completed'
       AND p.end_date >= ? AND p.end_date < ?`,
    [...flt.params, comparison.startSql, comparison.endSqlExclusive]
  );

  // 3. KPI: Blocked by DP (cross-module signal ke Izhhar) — current snapshot
  // Project status Awaiting Consultant + handover.dp_payment_status != PAID.
  const blockedByDp = await fetchScalar(
    conn,
    `SELECT COUNT(*) AS cnt ${baseJoin}
       AND p.status = 'Awaiting Consultant'
       AND (h.dp_payment_status IS NULL OR h.dp_payment_status <> 'PAID')`,
    flt.params
  );

  // 4. KPI: Avg duration (days) untuk completed in period
  const [avgDurRows] = await conn.execute(
    `SELECT AVG(DATEDIFF(p.end_date, p.start_date)) AS avg_days
     ${baseJoin}
       AND p.status = 'Completed'
       AND p.end_date >= ? AND p.end_date < ?`,
    [...flt.params, period.startSql, period.endSqlExclusive]
  );
  const avgDurationDays = Math.round(Number(avgDurRows[0]?.avg_days ?? 0));

  // 5. Status distribution (current snapshot)
  const [statusRows] = await conn.execute(
    `SELECT p.status, COUNT(*) AS cnt
     ${baseJoin}
     GROUP BY p.status
     ORDER BY cnt DESC`,
    flt.params
  );
  const statusDistribution = statusRows.map((r) => ({
    status: r.status,
    count: Number(r.cnt)
  }));

  // 6. Top departments by completed in period
  const [topDeptRows] = await conn.execute(
    `SELECT d.id AS department_id,
            COALESCE(d.name, 'Unassigned') AS department_name,
            COUNT(*) AS metric_value
     ${baseJoin}
       AND p.status = 'Completed'
       AND p.end_date >= ? AND p.end_date < ?
     GROUP BY d.id, d.name
     ORDER BY metric_value DESC
     LIMIT 8`,
    [...flt.params, period.startSql, period.endSqlExclusive]
  );
  const topDepartmentsByCompleted = topDeptRows.map((r) => ({
    department_id: r.department_id,
    name: r.department_name,
    value: Number(r.metric_value)
  }));

  // 7. On-time vs delayed (completed in period) — pakai project_milestones
  // target_date max vs completed_at. Simpler: pakai project.end_date vs hari
  // milestone terakhir Done. Tapi terlalu rumit, simplify: gunakan completed
  // before/after handover.project_end_date (snapshot original target).
  // NB: `delayed` adalah reserved word di MySQL — pakai `delayed_count`.
  const [otRows] = await conn.execute(
    `SELECT
       SUM(CASE WHEN p.end_date <= COALESCE(h.project_end_date, p.end_date) THEN 1 ELSE 0 END) AS on_time,
       SUM(CASE WHEN p.end_date > COALESCE(h.project_end_date, p.end_date) THEN 1 ELSE 0 END) AS delayed_count
     ${baseJoin}
       AND p.status = 'Completed'
       AND p.end_date >= ? AND p.end_date < ?`,
    [...flt.params, period.startSql, period.endSqlExclusive]
  );
  const onTime = Number(otRows[0]?.on_time ?? 0);
  const delayed = Number(otRows[0]?.delayed_count ?? 0);

  return {
    summary_metrics: {
      active_projects: { value: activeCount },
      completed_in_period: {
        value: completedCurrent,
        previous: completedPrevious,
        delta: deltaPercent(completedCurrent, completedPrevious)
      },
      blocked_by_dp: { value: blockedByDp },
      avg_duration_days: { value: avgDurationDays }
    },
    status_distribution: statusDistribution,
    completion_outcome: {
      on_time: onTime,
      delayed
    },
    top_departments_by_completed: topDepartmentsByCompleted
  };
};

/**
 * Empty shape untuk Consultant KPI — dipakai sebagai fallback kalau migration
 * 013-kpi-feature.sql belum dijalankan (tabel kpi_snapshots tidak ada). Mencegah
 * dashboard error 500 hanya karena modul KPI belum di-deploy.
 */
const emptyConsultantKpi = (periodKey) => ({
  period_status: {
    period: periodKey,
    snapshot_count: 0,
    finalized_count: 0,
    total_consultants: 0,
    is_finalized: false
  },
  summary_metrics: {
    avg_total_score: 0,
    excellent_count: 0,
    good_count: 0,
    need_improvement_count: 0
  },
  dimension_averages: {
    task_completion: 0,
    timeliness: 0,
    update_compliance: 0,
    output_quality: 0
  },
  top_performers: [],
  bottom_performers: []
});

/**
 * Build Consultant KPI section: avg score, distribution per band, top/bottom
 * performers, dimension averages, period finalisation status.
 * Period key = 'YYYY-MM' diturunkan dari period.startSql.
 */
const buildConsultantKpi = async (conn, { period, departmentId }) => {
  // kpi_snapshots.period stored as 'YYYY-MM' atau 'YYYY-QN'. Untuk filter
  // dashboard ('this_month'), ambil YYYY-MM dari period.startSql.
  const periodKey = period.startSql.slice(0, 7);

  // Probe: kalau tabel kpi_snapshots belum ada (migration 013 belum di-run),
  // return empty shape — jangan biarkan dashboard CEO error 500 hanya karena
  // modul KPI belum di-deploy.
  try {
    await conn.execute('SELECT 1 FROM kpi_snapshots LIMIT 1');
  } catch (e) {
    if (e?.code === 'ER_NO_SUCH_TABLE') {
      // eslint-disable-next-line no-console
      console.warn('[dashboard-ceo-faried] kpi_snapshots not found — returning empty consultant KPI. Run migration 2026-05-16-013-kpi-feature.sql to enable.');
      return emptyConsultantKpi(periodKey);
    }
    throw e;
  }

  // Optional dept filter — pakai EXISTS terhadap user_departments
  const deptJoin = departmentId != null
    ? `AND EXISTS (
         SELECT 1 FROM user_departments ud
         WHERE ud.user_id = s.consultant_user_id AND ud.department_id = ?
       )`
    : '';
  const deptParams = departmentId != null ? [departmentId] : [];

  // 1. Snapshot count + finalization status untuk periode
  const [periodRows] = await conn.execute(
    `SELECT COUNT(*) AS snapshot_count,
            SUM(CASE WHEN s.finalized_at IS NOT NULL THEN 1 ELSE 0 END) AS finalized_count
       FROM kpi_snapshots s
      WHERE s.period = ?
        ${deptJoin}`,
    [periodKey, ...deptParams]
  );
  const snapshotCount = Number(periodRows[0]?.snapshot_count ?? 0);
  const finalizedCount = Number(periodRows[0]?.finalized_count ?? 0);

  // 2. Total active consultants (untuk denominator coverage)
  const consultantTotalSql = departmentId != null
    ? `SELECT COUNT(DISTINCT u.id) AS cnt
         FROM users u
         INNER JOIN roles r ON r.id = u.role_id
         INNER JOIN user_departments ud ON ud.user_id = u.id
        WHERE r.code = 'CONSULTANT' AND u.is_active = 1 AND ud.department_id = ?`
    : `SELECT COUNT(DISTINCT u.id) AS cnt
         FROM users u
         INNER JOIN roles r ON r.id = u.role_id
        WHERE r.code = 'CONSULTANT' AND u.is_active = 1`;
  const totalConsultants = await fetchScalar(conn, consultantTotalSql, deptParams);

  // 3. Summary metrics (avg + bands) & dimension averages
  const [aggRows] = await conn.execute(
    `SELECT
       AVG(s.total_score) AS avg_total,
       AVG(s.capaian_task_completion) AS avg_dim_tc,
       AVG(s.capaian_timeliness) AS avg_dim_tm,
       AVG(s.capaian_update_compliance) AS avg_dim_uc,
       AVG(s.capaian_output_quality) AS avg_dim_oq,
       SUM(CASE WHEN s.total_score >= ? THEN 1 ELSE 0 END) AS excellent_count,
       SUM(CASE WHEN s.total_score >= ? AND s.total_score < ? THEN 1 ELSE 0 END) AS good_count,
       SUM(CASE WHEN s.total_score < ? THEN 1 ELSE 0 END) AS need_improvement_count
     FROM kpi_snapshots s
     WHERE s.period = ?
       ${deptJoin}`,
    [
      KPI_BAND_THRESHOLDS.excellent,
      KPI_BAND_THRESHOLDS.good,
      KPI_BAND_THRESHOLDS.excellent,
      KPI_BAND_THRESHOLDS.good,
      periodKey,
      ...deptParams
    ]
  );
  const agg = aggRows[0] ?? {};

  // 4. Top 5 performers
  const [topRows] = await conn.execute(
    `SELECT s.consultant_user_id,
            COALESCE(u.name, s.consultant_name_snapshot) AS name,
            s.total_score
       FROM kpi_snapshots s
       LEFT JOIN users u ON u.id = s.consultant_user_id
      WHERE s.period = ?
        ${deptJoin}
      ORDER BY s.total_score DESC
      LIMIT 5`,
    [periodKey, ...deptParams]
  );
  // 5. Bottom 5 performers
  const [bottomRows] = await conn.execute(
    `SELECT s.consultant_user_id,
            COALESCE(u.name, s.consultant_name_snapshot) AS name,
            s.total_score
       FROM kpi_snapshots s
       LEFT JOIN users u ON u.id = s.consultant_user_id
      WHERE s.period = ?
        ${deptJoin}
      ORDER BY s.total_score ASC
      LIMIT 5`,
    [periodKey, ...deptParams]
  );

  return {
    period_status: {
      period: periodKey,
      snapshot_count: snapshotCount,
      finalized_count: finalizedCount,
      total_consultants: totalConsultants,
      is_finalized: finalizedCount > 0 && finalizedCount === snapshotCount && snapshotCount > 0
    },
    summary_metrics: {
      avg_total_score: agg.avg_total != null ? Number(Number(agg.avg_total).toFixed(2)) : 0,
      excellent_count: Number(agg.excellent_count ?? 0),
      good_count: Number(agg.good_count ?? 0),
      need_improvement_count: Number(agg.need_improvement_count ?? 0)
    },
    dimension_averages: {
      task_completion: agg.avg_dim_tc != null ? Number(Number(agg.avg_dim_tc).toFixed(2)) : 0,
      timeliness: agg.avg_dim_tm != null ? Number(Number(agg.avg_dim_tm).toFixed(2)) : 0,
      update_compliance: agg.avg_dim_uc != null ? Number(Number(agg.avg_dim_uc).toFixed(2)) : 0,
      output_quality: agg.avg_dim_oq != null ? Number(Number(agg.avg_dim_oq).toFixed(2)) : 0
    },
    top_performers: topRows.map((r) => ({
      user_id: r.consultant_user_id,
      name: r.name,
      value: Number(Number(r.total_score).toFixed(2))
    })),
    bottom_performers: bottomRows.map((r) => ({
      user_id: r.consultant_user_id,
      name: r.name,
      value: Number(Number(r.total_score).toFixed(2))
    }))
  };
};

module.exports = {
  buildProjectOperations,
  buildConsultantKpi
};
