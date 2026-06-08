const { pool } = require('../config/db');
const {
  deltaPercent,
  resolveComparisonPeriod,
  resolveDashboardPeriod
} = require('../utils/dashboard-period');
const {
  buildKpiTrend,
  buildProjectVelocity,
  generateInsights
} = require('./dashboard-analytics.repo');

/**
 * Dashboard COO — helicopter view scoped ke department(s) COO.
 * COO punya is_department_scoped = 1 dan harus punya entry di user_departments.
 * Semua query filter pakai dept codes dari JWT (req.user.departments).
 *
 * Sections:
 *   - project_operations         — KPI + status distribution + on-time/delayed
 *   - handover_queue             — handover APPROVED yang belum di-assign PM
 *   - consultant_kpi             — avg + top/bottom + dimension averages
 *   - milestones_at_risk         — overdue + upcoming deadline (≤ 7 hari)
 *   - dp_unpaid_alert            — project stuck karena DP belum dibayar
 */

const KPI_BAND = { excellent: 85, good: 70 };

const fetchScalar = async (conn, sql, params, field = 'cnt') => {
  const [rows] = await conn.execute(sql, params ?? []);
  return Number(rows[0]?.[field] ?? 0);
};

/**
 * Build IN clause untuk array dept codes. Pakai conn.query (bukan execute) di
 * caller supaya array di-flatten, ATAU pre-resolve dept codes → ids dulu.
 * Pendekatan di sini: pakai placeholder `?` array dengan conn.query (mysql2
 * support IN ?).
 */
const buildDeptFilter = (deptCodes) => {
  const codes = Array.isArray(deptCodes) ? deptCodes.filter((c) => typeof c === 'string') : [];
  if (codes.length === 0) {
    return { sql: '', params: [], hasFilter: false };
  }
  return {
    sql: 'AND d.code IN (?)',
    params: [codes],
    hasFilter: true
  };
};

const buildConsultantDeptFilter = (deptCodes) => {
  const codes = Array.isArray(deptCodes) ? deptCodes.filter((c) => typeof c === 'string') : [];
  if (codes.length === 0) {
    return { sql: '', params: [], hasFilter: false };
  }
  return {
    sql: `AND EXISTS (
      SELECT 1 FROM user_departments ud2
      INNER JOIN departments d2 ON d2.id = ud2.department_id
      WHERE ud2.user_id = s.consultant_user_id AND d2.code IN (?)
    )`,
    params: [codes],
    hasFilter: true
  };
};

const buildProjectOps = async (conn, { period, comparison, deptCodes }) => {
  const flt = buildDeptFilter(deptCodes);
  const baseJoin = `
    FROM projects p
    INNER JOIN handovers h ON h.handover_id = p.handover_id
    LEFT JOIN departments d ON d.id = h.department_id
    WHERE 1=1
    ${flt.sql}
  `;

  // Pakai conn.query (bukan execute) supaya array `IN (?)` di-flatten.
  const activeCount = await (async () => {
    const [rows] = await conn.query(
      `SELECT COUNT(*) AS cnt ${baseJoin} AND p.status = 'In Progress'`,
      flt.params
    );
    return Number(rows[0]?.cnt ?? 0);
  })();

  const completedCurrent = await (async () => {
    const [rows] = await conn.query(
      `SELECT COUNT(*) AS cnt ${baseJoin}
         AND p.status = 'Completed' AND p.end_date >= ? AND p.end_date < ?`,
      [...flt.params, period.startSql, period.endSqlExclusive]
    );
    return Number(rows[0]?.cnt ?? 0);
  })();
  const completedPrevious = await (async () => {
    const [rows] = await conn.query(
      `SELECT COUNT(*) AS cnt ${baseJoin}
         AND p.status = 'Completed' AND p.end_date >= ? AND p.end_date < ?`,
      [...flt.params, comparison.startSql, comparison.endSqlExclusive]
    );
    return Number(rows[0]?.cnt ?? 0);
  })();

  const blockedByDp = await (async () => {
    const [rows] = await conn.query(
      `SELECT COUNT(*) AS cnt ${baseJoin}
         AND p.status = 'Awaiting Consultant'
         AND (h.dp_payment_status IS NULL OR h.dp_payment_status <> 'PAID')`,
      flt.params
    );
    return Number(rows[0]?.cnt ?? 0);
  })();

  const [avgRows] = await conn.query(
    `SELECT AVG(DATEDIFF(p.end_date, p.start_date)) AS avg_days ${baseJoin}
       AND p.status = 'Completed' AND p.end_date >= ? AND p.end_date < ?`,
    [...flt.params, period.startSql, period.endSqlExclusive]
  );
  const avgDurationDays = Math.round(Number(avgRows[0]?.avg_days ?? 0));

  const [statusRows] = await conn.query(
    `SELECT p.status, COUNT(*) AS cnt ${baseJoin}
     GROUP BY p.status ORDER BY cnt DESC`,
    flt.params
  );

  const [otRows] = await conn.query(
    `SELECT
       SUM(CASE WHEN p.end_date <= COALESCE(h.project_end_date, p.end_date) THEN 1 ELSE 0 END) AS on_time,
       SUM(CASE WHEN p.end_date > COALESCE(h.project_end_date, p.end_date) THEN 1 ELSE 0 END) AS delayed_count
     ${baseJoin}
       AND p.status = 'Completed' AND p.end_date >= ? AND p.end_date < ?`,
    [...flt.params, period.startSql, period.endSqlExclusive]
  );

  // Top departments by completed projects (dipakai CeoProjectOperationsSection).
  const [topDeptRows] = await conn.query(
    `SELECT d.id AS department_id,
            COALESCE(d.name, 'Unassigned') AS department_name,
            COUNT(*) AS metric_value
     ${baseJoin}
       AND p.status = 'Completed' AND p.end_date >= ? AND p.end_date < ?
     GROUP BY d.id, d.name
     ORDER BY metric_value DESC
     LIMIT 8`,
    [...flt.params, period.startSql, period.endSqlExclusive]
  );

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
    status_distribution: statusRows.map((r) => ({ status: r.status, count: Number(r.cnt) })),
    completion_outcome: {
      on_time: Number(otRows[0]?.on_time ?? 0),
      delayed: Number(otRows[0]?.delayed_count ?? 0)
    },
    top_departments_by_completed: topDeptRows.map((r) => ({
      department_id: r.department_id,
      name: r.department_name,
      value: Number(r.metric_value)
    }))
  };
};

const buildHandoverQueue = async (conn, { deptCodes }) => {
  const flt = buildDeptFilter(deptCodes);
  // Handover APPROVED yang belum punya project (LEFT JOIN projects, project_id IS NULL).
  const [rows] = await conn.query(
    `SELECT h.handover_id, h.handover_code, h.project_title, h.approved_at,
            DATEDIFF(NOW(), h.approved_at) AS days_pending,
            l.company_name AS client_name,
            d.id AS department_id, d.name AS department_name
       FROM handovers h
       INNER JOIN leads l ON l.lead_id = h.lead_id
       LEFT JOIN departments d ON d.id = h.department_id
       LEFT JOIN projects p ON p.handover_id = h.handover_id
      WHERE h.status = 'APPROVED' AND p.project_id IS NULL
        ${flt.sql}
      ORDER BY h.approved_at ASC
      LIMIT 20`,
    flt.params
  );
  return {
    items: rows.map((r) => ({
      handover_id: r.handover_id,
      handover_code: r.handover_code,
      project_title: r.project_title || r.handover_code,
      client_name: r.client_name,
      department_id: r.department_id,
      department_name: r.department_name,
      approved_at: r.approved_at,
      days_pending: Number(r.days_pending ?? 0)
    })),
    count: rows.length
  };
};

const buildConsultantKpiSection = async (conn, { period, deptCodes }) => {
  const periodKey = period.startSql.slice(0, 7);
  const empty = {
    period_status: { period: periodKey, snapshot_count: 0, finalized_count: 0, total_consultants: 0, is_finalized: false },
    summary_metrics: { avg_total_score: 0, excellent_count: 0, good_count: 0, need_improvement_count: 0 },
    dimension_averages: { task_completion: 0, timeliness: 0, update_compliance: 0, output_quality: 0 },
    top_performers: [],
    bottom_performers: []
  };

  // Probe tabel
  try {
    await conn.execute('SELECT 1 FROM kpi_snapshots LIMIT 1');
  } catch (e) {
    if (e?.code === 'ER_NO_SUCH_TABLE') return empty;
    throw e;
  }

  const dflt = buildConsultantDeptFilter(deptCodes);

  const [periodRows] = await conn.query(
    `SELECT COUNT(*) AS snapshot_count,
            SUM(CASE WHEN s.finalized_at IS NOT NULL THEN 1 ELSE 0 END) AS finalized_count
       FROM kpi_snapshots s
      WHERE s.period = ? ${dflt.sql}`,
    [periodKey, ...dflt.params]
  );
  const snapshotCount = Number(periodRows[0]?.snapshot_count ?? 0);
  const finalizedCount = Number(periodRows[0]?.finalized_count ?? 0);

  const totalConsultants = await (async () => {
    if (dflt.hasFilter) {
      const [r] = await conn.query(
        `SELECT COUNT(DISTINCT u.id) AS cnt
           FROM users u
           INNER JOIN roles r ON r.id = u.role_id
           INNER JOIN user_departments ud ON ud.user_id = u.id
           INNER JOIN departments d ON d.id = ud.department_id
          WHERE r.code = 'CONSULTANT' AND u.is_active = 1 AND d.code IN (?)`,
        dflt.params
      );
      return Number(r[0]?.cnt ?? 0);
    }
    return fetchScalar(
      conn,
      `SELECT COUNT(DISTINCT u.id) AS cnt
         FROM users u INNER JOIN roles r ON r.id = u.role_id
        WHERE r.code = 'CONSULTANT' AND u.is_active = 1`
    );
  })();

  const [aggRows] = await conn.query(
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
     WHERE s.period = ? ${dflt.sql}`,
    [KPI_BAND.excellent, KPI_BAND.good, KPI_BAND.excellent, KPI_BAND.good, periodKey, ...dflt.params]
  );
  const agg = aggRows[0] ?? {};

  const [topRows] = await conn.query(
    `SELECT s.consultant_user_id, COALESCE(u.name, s.consultant_name_snapshot) AS name, s.total_score
       FROM kpi_snapshots s LEFT JOIN users u ON u.id = s.consultant_user_id
      WHERE s.period = ? ${dflt.sql}
      ORDER BY s.total_score DESC LIMIT 5`,
    [periodKey, ...dflt.params]
  );
  const [bottomRows] = await conn.query(
    `SELECT s.consultant_user_id, COALESCE(u.name, s.consultant_name_snapshot) AS name, s.total_score
       FROM kpi_snapshots s LEFT JOIN users u ON u.id = s.consultant_user_id
      WHERE s.period = ? ${dflt.sql}
      ORDER BY s.total_score ASC LIMIT 5`,
    [periodKey, ...dflt.params]
  );

  const num = (v) => (v != null ? Number(Number(v).toFixed(2)) : 0);

  return {
    period_status: {
      period: periodKey,
      snapshot_count: snapshotCount,
      finalized_count: finalizedCount,
      total_consultants: totalConsultants,
      is_finalized: snapshotCount > 0 && finalizedCount === snapshotCount
    },
    summary_metrics: {
      avg_total_score: num(agg.avg_total),
      excellent_count: Number(agg.excellent_count ?? 0),
      good_count: Number(agg.good_count ?? 0),
      need_improvement_count: Number(agg.need_improvement_count ?? 0)
    },
    dimension_averages: {
      task_completion: num(agg.avg_dim_tc),
      timeliness: num(agg.avg_dim_tm),
      update_compliance: num(agg.avg_dim_uc),
      output_quality: num(agg.avg_dim_oq)
    },
    top_performers: topRows.map((r) => ({ user_id: r.consultant_user_id, name: r.name, value: num(r.total_score) })),
    bottom_performers: bottomRows.map((r) => ({ user_id: r.consultant_user_id, name: r.name, value: num(r.total_score) }))
  };
};

const buildMilestonesAtRisk = async (conn, { deptCodes }) => {
  const flt = buildDeptFilter(deptCodes);
  const todayClause = `CURDATE()`;

  // Overdue: target_date < today, status != Done/Cancelled-equivalent
  const [overdueRows] = await conn.query(
    `SELECT m.milestone_id, m.title, m.target_date, m.status,
            DATEDIFF(${todayClause}, m.target_date) AS days_overdue,
            p.project_id, p.project_code, p.project_name,
            COALESCE(u_pm.name, p.pm_name_snapshot) AS pm_name,
            COALESCE(u_o.name, m.owner_name_snapshot) AS owner_name,
            d.name AS department_name
       FROM project_milestones m
       INNER JOIN projects p ON p.project_id = m.project_id
       INNER JOIN handovers h ON h.handover_id = p.handover_id
       LEFT JOIN departments d ON d.id = h.department_id
       LEFT JOIN users u_pm ON u_pm.id = p.pm_user_id
       LEFT JOIN users u_o ON u_o.id = m.owner_user_id
      WHERE m.target_date < ${todayClause}
        AND m.status NOT IN ('Done')
        AND p.status NOT IN ('Completed', 'Cancelled')
        ${flt.sql}
      ORDER BY m.target_date ASC
      LIMIT 15`,
    flt.params
  );

  // Upcoming: target_date BETWEEN today AND today+7, status != Done
  const [upcomingRows] = await conn.query(
    `SELECT m.milestone_id, m.title, m.target_date, m.status,
            DATEDIFF(m.target_date, ${todayClause}) AS days_until,
            p.project_id, p.project_code, p.project_name,
            COALESCE(u_pm.name, p.pm_name_snapshot) AS pm_name,
            COALESCE(u_o.name, m.owner_name_snapshot) AS owner_name,
            d.name AS department_name
       FROM project_milestones m
       INNER JOIN projects p ON p.project_id = m.project_id
       INNER JOIN handovers h ON h.handover_id = p.handover_id
       LEFT JOIN departments d ON d.id = h.department_id
       LEFT JOIN users u_pm ON u_pm.id = p.pm_user_id
       LEFT JOIN users u_o ON u_o.id = m.owner_user_id
      WHERE m.target_date >= ${todayClause}
        AND m.target_date <= DATE_ADD(${todayClause}, INTERVAL 7 DAY)
        AND m.status NOT IN ('Done')
        AND p.status NOT IN ('Completed', 'Cancelled')
        ${flt.sql}
      ORDER BY m.target_date ASC
      LIMIT 15`,
    flt.params
  );

  const mapRow = (r, isOverdue) => ({
    milestone_id: r.milestone_id,
    title: r.title,
    target_date: r.target_date,
    status: r.status,
    project_id: r.project_id,
    project_code: r.project_code,
    project_name: r.project_name,
    pm_name: r.pm_name,
    owner_name: r.owner_name,
    department_name: r.department_name,
    days_overdue: isOverdue ? Number(r.days_overdue ?? 0) : undefined,
    days_until: !isOverdue ? Number(r.days_until ?? 0) : undefined
  });

  return {
    overdue: overdueRows.map((r) => mapRow(r, true)),
    upcoming: upcomingRows.map((r) => mapRow(r, false))
  };
};

const buildDpUnpaidAlert = async (conn, { deptCodes }) => {
  const flt = buildDeptFilter(deptCodes);
  const [rows] = await conn.query(
    `SELECT p.project_id, p.project_code, p.project_name, p.created_at,
            DATEDIFF(NOW(), p.created_at) AS days_waiting,
            l.company_name AS client_name,
            h.dp_payment_status,
            COALESCE(u_pm.name, p.pm_name_snapshot) AS pm_name,
            d.name AS department_name
       FROM projects p
       INNER JOIN handovers h ON h.handover_id = p.handover_id
       INNER JOIN leads l ON l.lead_id = h.lead_id
       LEFT JOIN departments d ON d.id = h.department_id
       LEFT JOIN users u_pm ON u_pm.id = p.pm_user_id
      WHERE p.status = 'Awaiting Consultant'
        AND (h.dp_payment_status IS NULL OR h.dp_payment_status <> 'PAID')
        ${flt.sql}
      ORDER BY p.created_at ASC
      LIMIT 15`,
    flt.params
  );
  return {
    items: rows.map((r) => ({
      project_id: r.project_id,
      project_code: r.project_code,
      project_name: r.project_name,
      client_name: r.client_name,
      pm_name: r.pm_name,
      department_name: r.department_name,
      dp_payment_status: r.dp_payment_status || 'UNPAID',
      created_at: r.created_at,
      days_waiting: Number(r.days_waiting ?? 0)
    })),
    count: rows.length
  };
};

const getCooDashboard = async (query = {}, user = {}) => {
  const period = resolveDashboardPeriod({
    period: query.period,
    from: query.from,
    to: query.to
  });
  const comparison = resolveComparisonPeriod(period, query.comparison);
  const deptCodes = Array.isArray(user?.departments) ? user.departments : [];

  const conn = await pool.getConnection();
  try {
    const [projectOps, handoverQueue, consultantKpi, milestonesAtRisk, dpUnpaid] = await Promise.all([
      buildProjectOps(conn, { period, comparison, deptCodes }),
      buildHandoverQueue(conn, { deptCodes }),
      buildConsultantKpiSection(conn, { period, deptCodes }),
      buildMilestonesAtRisk(conn, { deptCodes }),
      buildDpUnpaidAlert(conn, { deptCodes })
    ]);

    // Analytics overlay — scoped ke dept COO.
    const [kpiTrend, projectVelocity] = await Promise.all([
      buildKpiTrend(conn, { period, deptCodes }),
      buildProjectVelocity(conn, { period, deptCodes })
    ]);
    const insights = generateInsights({
      role: 'COO',
      projectOps,
      consultantKpi,
      kpiTrend,
      dpUnpaid,
      milestonesAtRisk
    });

    return {
      ok: true,
      data: {
        meta: {
          period: period.periodKey,
          period_start: period.startSql,
          period_end_exclusive: period.endSqlExclusive,
          comparison_label: comparison.label,
          scope: 'department',
          departments: deptCodes
        },
        project_operations: projectOps,
        handover_queue: handoverQueue,
        consultant_kpi: consultantKpi,
        milestones_at_risk: milestonesAtRisk,
        dp_unpaid_alert: dpUnpaid,
        analytics: {
          kpi_trend: kpiTrend,
          project_velocity: projectVelocity,
          insights
        }
      }
    };
  } finally {
    conn.release();
  }
};

module.exports = { getCooDashboard };
