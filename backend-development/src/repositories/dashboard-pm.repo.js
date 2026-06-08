const { pool } = require('../config/db');
const {
  deltaPercent,
  resolveComparisonPeriod,
  resolveDashboardPeriod
} = require('../utils/dashboard-period');
const {
  buildKpiTrend,
  buildProjectVelocity,
  buildRatingDistribution,
  generateInsights
} = require('./dashboard-analytics.repo');

/**
 * Dashboard PM — scoped ke project yang dia jadi PM (pm_user_id = req.user.sub).
 *
 * Sections:
 *   - my_projects                — card grid project (status, milestones progress)
 *   - action_items               — milestone Done yang belum di-rate (PM action wajib)
 *   - team_kpi                   — KPI consultant yang dia kelola (avg, top/bottom)
 *   - milestones_at_risk         — overdue + upcoming di project saya
 *   - dp_blocks                  — project saya yang stuck karena DP UNPAID
 */

const KPI_BAND = { excellent: 85, good: 70 };

const fetchScalar = async (conn, sql, params, field = 'cnt') => {
  const [rows] = await conn.execute(sql, params ?? []);
  return Number(rows[0]?.[field] ?? 0);
};

const buildMyProjects = async (conn, { pmUserId, period, comparison }) => {
  // Daftar project + count milestone done/total + consultant count
  const [rows] = await conn.execute(
    `SELECT p.project_id, p.project_code, p.project_name, p.client, p.status,
            p.start_date, p.end_date, p.created_at,
            h.dp_payment_status,
            d.code AS department_code, d.name AS department_name,
            (SELECT COUNT(*) FROM project_milestones m WHERE m.project_id = p.project_id) AS milestones_total,
            (SELECT COUNT(*) FROM project_milestones m WHERE m.project_id = p.project_id AND m.status = 'Done') AS milestones_done,
            (SELECT COUNT(*) FROM project_consultants pc WHERE pc.project_id = p.project_id) AS consultant_count
       FROM projects p
       INNER JOIN handovers h ON h.handover_id = p.handover_id
       LEFT JOIN departments d ON d.id = h.department_id
      WHERE p.pm_user_id = ?
      ORDER BY p.created_at DESC`,
    [pmUserId]
  );

  // Summary cards (scope = my projects)
  const active = rows.filter((r) => r.status === 'In Progress').length;
  const completedAll = rows.filter((r) => r.status === 'Completed').length;
  const completedThisPeriod = rows.filter((r) => {
    if (r.status !== 'Completed' || !r.end_date) return false;
    const d = String(r.end_date).slice(0, 10);
    return d >= period.startSql && d < period.endSqlExclusive;
  }).length;
  const completedPrevPeriod = await fetchScalar(
    conn,
    `SELECT COUNT(*) AS cnt FROM projects
      WHERE pm_user_id = ? AND status = 'Completed'
        AND end_date >= ? AND end_date < ?`,
    [pmUserId, comparison.startSql, comparison.endSqlExclusive]
  );
  const awaitingConsultant = rows.filter((r) => r.status === 'Awaiting Consultant').length;
  const blockedByDp = rows.filter(
    (r) => r.status === 'Awaiting Consultant' && (r.dp_payment_status == null || r.dp_payment_status !== 'PAID')
  ).length;

  return {
    summary: {
      active,
      completed_total: completedAll,
      completed_this_period: {
        value: completedThisPeriod,
        previous: completedPrevPeriod,
        delta: deltaPercent(completedThisPeriod, completedPrevPeriod)
      },
      awaiting_consultant: awaitingConsultant,
      blocked_by_dp: blockedByDp
    },
    items: rows.map((r) => ({
      project_id: r.project_id,
      project_code: r.project_code,
      project_name: r.project_name,
      client: r.client,
      status: r.status,
      start_date: r.start_date,
      end_date: r.end_date,
      department_code: r.department_code,
      department_name: r.department_name,
      dp_payment_status: r.dp_payment_status,
      milestones_total: Number(r.milestones_total ?? 0),
      milestones_done: Number(r.milestones_done ?? 0),
      consultant_count: Number(r.consultant_count ?? 0)
    }))
  };
};

const buildActionItems = async (conn, { pmUserId }) => {
  // Milestone yang status='Done' tapi quality_rating masih NULL (PM belum rate).
  const [rows] = await conn.execute(
    `SELECT m.milestone_id, m.title, m.completed_at, m.target_date,
            p.project_id, p.project_code, p.project_name,
            COALESCE(u.name, m.owner_name_snapshot) AS consultant_name
       FROM project_milestones m
       INNER JOIN projects p ON p.project_id = m.project_id
       LEFT JOIN users u ON u.id = m.owner_user_id
      WHERE p.pm_user_id = ?
        AND m.status = 'Done'
        AND m.quality_rating IS NULL
      ORDER BY m.completed_at DESC
      LIMIT 20`,
    [pmUserId]
  );
  return {
    items: rows.map((r) => ({
      milestone_id: r.milestone_id,
      title: r.title,
      project_id: r.project_id,
      project_code: r.project_code,
      project_name: r.project_name,
      consultant_name: r.consultant_name,
      completed_at: r.completed_at,
      target_date: r.target_date
    })),
    count: rows.length
  };
};

const buildTeamKpi = async (conn, { pmUserId, period }) => {
  const periodKey = period.startSql.slice(0, 7);
  const empty = {
    period_status: { period: periodKey, snapshot_count: 0, finalized_count: 0, team_size: 0, is_finalized: false },
    summary_metrics: { avg_total_score: 0, excellent_count: 0, good_count: 0, need_improvement_count: 0 },
    top_performer: null,
    bottom_performer: null,
    team_members: []
  };

  // Team = consultant yang pernah/sedang di-assign ke project PM ini.
  const [teamRows] = await conn.execute(
    `SELECT DISTINCT pc.consultant_user_id, COALESCE(u.name, pc.consultant_name_snapshot) AS name
       FROM project_consultants pc
       INNER JOIN projects p ON p.project_id = pc.project_id
       LEFT JOIN users u ON u.id = pc.consultant_user_id
      WHERE p.pm_user_id = ?`,
    [pmUserId]
  );
  const teamSize = teamRows.length;
  if (teamSize === 0) {
    empty.period_status.team_size = 0;
    return empty;
  }

  // Probe kpi_snapshots
  try {
    await conn.execute('SELECT 1 FROM kpi_snapshots LIMIT 1');
  } catch (e) {
    if (e?.code === 'ER_NO_SUCH_TABLE') {
      return { ...empty, period_status: { ...empty.period_status, team_size: teamSize } };
    }
    throw e;
  }

  const teamIds = teamRows.map((r) => r.consultant_user_id);
  const [snapshotRows] = await conn.query(
    `SELECT s.consultant_user_id,
            COALESCE(u.name, s.consultant_name_snapshot) AS name,
            s.total_score, s.capaian_task_completion, s.capaian_timeliness,
            s.capaian_update_compliance, s.capaian_output_quality,
            s.finalized_at
       FROM kpi_snapshots s
       LEFT JOIN users u ON u.id = s.consultant_user_id
      WHERE s.period = ? AND s.consultant_user_id IN (?)
      ORDER BY s.total_score DESC`,
    [periodKey, teamIds]
  );

  if (snapshotRows.length === 0) {
    return {
      period_status: {
        period: periodKey,
        snapshot_count: 0,
        finalized_count: 0,
        team_size: teamSize,
        is_finalized: false
      },
      summary_metrics: { avg_total_score: 0, excellent_count: 0, good_count: 0, need_improvement_count: 0 },
      top_performer: null,
      bottom_performer: null,
      team_members: teamRows.map((r) => ({ user_id: r.consultant_user_id, name: r.name, total_score: null }))
    };
  }

  const scores = snapshotRows.map((r) => Number(r.total_score));
  const avgScore = scores.reduce((s, v) => s + v, 0) / scores.length;
  const excellentCount = scores.filter((s) => s >= KPI_BAND.excellent).length;
  const goodCount = scores.filter((s) => s >= KPI_BAND.good && s < KPI_BAND.excellent).length;
  const needCount = scores.filter((s) => s < KPI_BAND.good).length;
  const finalizedCount = snapshotRows.filter((r) => r.finalized_at != null).length;
  const top = snapshotRows[0];
  const bottom = snapshotRows[snapshotRows.length - 1];

  const num = (v) => (v != null ? Number(Number(v).toFixed(2)) : 0);

  return {
    period_status: {
      period: periodKey,
      snapshot_count: snapshotRows.length,
      finalized_count: finalizedCount,
      team_size: teamSize,
      is_finalized: snapshotRows.length > 0 && finalizedCount === snapshotRows.length
    },
    summary_metrics: {
      avg_total_score: num(avgScore),
      excellent_count: excellentCount,
      good_count: goodCount,
      need_improvement_count: needCount
    },
    top_performer: { user_id: top.consultant_user_id, name: top.name, value: num(top.total_score) },
    bottom_performer: { user_id: bottom.consultant_user_id, name: bottom.name, value: num(bottom.total_score) },
    team_members: snapshotRows.map((r) => ({
      user_id: r.consultant_user_id,
      name: r.name,
      total_score: num(r.total_score)
    }))
  };
};

const buildMilestonesAtRisk = async (conn, { pmUserId }) => {
  const today = `CURDATE()`;
  const [overdueRows] = await conn.execute(
    `SELECT m.milestone_id, m.title, m.target_date, m.status,
            DATEDIFF(${today}, m.target_date) AS days_overdue,
            p.project_id, p.project_code, p.project_name,
            COALESCE(u_o.name, m.owner_name_snapshot) AS owner_name
       FROM project_milestones m
       INNER JOIN projects p ON p.project_id = m.project_id
       LEFT JOIN users u_o ON u_o.id = m.owner_user_id
      WHERE p.pm_user_id = ?
        AND m.target_date < ${today}
        AND m.status NOT IN ('Done')
        AND p.status NOT IN ('Completed', 'Cancelled')
      ORDER BY m.target_date ASC
      LIMIT 15`,
    [pmUserId]
  );
  const [upcomingRows] = await conn.execute(
    `SELECT m.milestone_id, m.title, m.target_date, m.status,
            DATEDIFF(m.target_date, ${today}) AS days_until,
            p.project_id, p.project_code, p.project_name,
            COALESCE(u_o.name, m.owner_name_snapshot) AS owner_name
       FROM project_milestones m
       INNER JOIN projects p ON p.project_id = m.project_id
       LEFT JOIN users u_o ON u_o.id = m.owner_user_id
      WHERE p.pm_user_id = ?
        AND m.target_date >= ${today}
        AND m.target_date <= DATE_ADD(${today}, INTERVAL 7 DAY)
        AND m.status NOT IN ('Done')
        AND p.status NOT IN ('Completed', 'Cancelled')
      ORDER BY m.target_date ASC
      LIMIT 15`,
    [pmUserId]
  );
  return {
    overdue: overdueRows.map((r) => ({
      milestone_id: r.milestone_id,
      title: r.title,
      target_date: r.target_date,
      status: r.status,
      project_id: r.project_id,
      project_code: r.project_code,
      project_name: r.project_name,
      owner_name: r.owner_name,
      days_overdue: Number(r.days_overdue ?? 0)
    })),
    upcoming: upcomingRows.map((r) => ({
      milestone_id: r.milestone_id,
      title: r.title,
      target_date: r.target_date,
      status: r.status,
      project_id: r.project_id,
      project_code: r.project_code,
      project_name: r.project_name,
      owner_name: r.owner_name,
      days_until: Number(r.days_until ?? 0)
    }))
  };
};

const buildDpBlocks = async (conn, { pmUserId }) => {
  const [rows] = await conn.execute(
    `SELECT p.project_id, p.project_code, p.project_name, p.created_at,
            DATEDIFF(NOW(), p.created_at) AS days_waiting,
            l.company_name AS client_name,
            h.dp_payment_status
       FROM projects p
       INNER JOIN handovers h ON h.handover_id = p.handover_id
       INNER JOIN leads l ON l.lead_id = h.lead_id
      WHERE p.pm_user_id = ?
        AND p.status = 'Awaiting Consultant'
        AND (h.dp_payment_status IS NULL OR h.dp_payment_status <> 'PAID')
      ORDER BY p.created_at ASC`,
    [pmUserId]
  );
  return {
    items: rows.map((r) => ({
      project_id: r.project_id,
      project_code: r.project_code,
      project_name: r.project_name,
      client_name: r.client_name,
      dp_payment_status: r.dp_payment_status || 'UNPAID',
      created_at: r.created_at,
      days_waiting: Number(r.days_waiting ?? 0)
    })),
    count: rows.length
  };
};

const getPmDashboard = async (query = {}, user = {}) => {
  const pmUserId = Number(user?.sub);
  if (!Number.isInteger(pmUserId) || pmUserId <= 0) {
    return { ok: false, message: 'User ID tidak valid.' };
  }
  const period = resolveDashboardPeriod({
    period: query.period,
    from: query.from,
    to: query.to
  });
  const comparison = resolveComparisonPeriod(period, query.comparison);

  const conn = await pool.getConnection();
  try {
    const [myProjects, actionItems, teamKpi, milestonesAtRisk, dpBlocks] = await Promise.all([
      buildMyProjects(conn, { pmUserId, period, comparison }),
      buildActionItems(conn, { pmUserId }),
      buildTeamKpi(conn, { pmUserId, period }),
      buildMilestonesAtRisk(conn, { pmUserId }),
      buildDpBlocks(conn, { pmUserId })
    ]);

    // Analytics overlay — scoped ke PM (team = consultants di project PM).
    const [teamRows] = await conn.query(
      `SELECT DISTINCT pc.consultant_user_id
         FROM project_consultants pc
         INNER JOIN projects p ON p.project_id = pc.project_id
        WHERE p.pm_user_id = ?`,
      [pmUserId]
    );
    const consultantUserIds = teamRows.map((r) => Number(r.consultant_user_id)).filter(Boolean);

    const [kpiTrend, projectVelocity, ratingDistribution] = await Promise.all([
      buildKpiTrend(conn, { period, consultantUserIds }),
      buildProjectVelocity(conn, { period, pmUserId }),
      buildRatingDistribution(conn, { pmUserId })
    ]);

    const insights = generateInsights({
      role: 'PM',
      projectOps: myProjects?.summary
        ? { summary_metrics: { completed_in_period: { delta: { direction: 'flat', value: 0 } } } }
        : null,
      consultantKpi: teamKpi?.summary_metrics ? { summary_metrics: teamKpi.summary_metrics } : null,
      kpiTrend,
      ratingDistribution,
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
          scope: 'pm_owned',
          pm_user_id: pmUserId
        },
        my_projects: myProjects,
        action_items: actionItems,
        team_kpi: teamKpi,
        milestones_at_risk: milestonesAtRisk,
        dp_blocks: dpBlocks,
        analytics: {
          kpi_trend: kpiTrend,
          project_velocity: projectVelocity,
          rating_distribution: ratingDistribution,
          insights
        }
      }
    };
  } finally {
    conn.release();
  }
};

module.exports = { getPmDashboard };
