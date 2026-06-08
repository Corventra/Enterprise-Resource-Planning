const { pool } = require('../config/db');
const { resolveDashboardPeriod } = require('../utils/dashboard-period');
const {
  buildKpiTrend,
  buildDimensionVsPeer,
  generateInsights
} = require('./dashboard-analytics.repo');

/**
 * Dashboard Consultant — scoped ke milestone & project yang dia owned/assigned
 * (consultant_user_id = req.user.sub).
 *
 * Sections:
 *   - my_projects        — project yang dia di-assign sebagai consultant
 *   - my_milestones      — milestone yang dia owned, all statuses
 *   - urgent             — overdue + ≤ 7 hari (action items)
 *   - my_kpi             — current period: total + 4 dimensi + previous period
 *   - recent_ratings     — rating PM yang baru di-set untuk milestone dia
 */

const buildMyProjects = async (conn, { consultantUserId }) => {
  const [rows] = await conn.execute(
    `SELECT p.project_id, p.project_code, p.project_name, p.client, p.status,
            p.start_date, p.end_date,
            COALESCE(u_pm.name, p.pm_name_snapshot) AS pm_name,
            pc.level AS my_level,
            d.name AS department_name,
            (SELECT COUNT(*) FROM project_milestones m WHERE m.project_id = p.project_id) AS milestones_total,
            (SELECT COUNT(*) FROM project_milestones m WHERE m.project_id = p.project_id AND m.owner_user_id = ?) AS milestones_owned
       FROM project_consultants pc
       INNER JOIN projects p ON p.project_id = pc.project_id
       INNER JOIN handovers h ON h.handover_id = p.handover_id
       LEFT JOIN departments d ON d.id = h.department_id
       LEFT JOIN users u_pm ON u_pm.id = p.pm_user_id
      WHERE pc.consultant_user_id = ?
      ORDER BY p.created_at DESC`,
    [consultantUserId, consultantUserId]
  );
  return {
    items: rows.map((r) => ({
      project_id: r.project_id,
      project_code: r.project_code,
      project_name: r.project_name,
      client: r.client,
      status: r.status,
      pm_name: r.pm_name,
      my_level: r.my_level,
      department_name: r.department_name,
      start_date: r.start_date,
      end_date: r.end_date,
      milestones_total: Number(r.milestones_total ?? 0),
      milestones_owned: Number(r.milestones_owned ?? 0)
    })),
    count: rows.length
  };
};

const buildMyMilestones = async (conn, { consultantUserId }) => {
  const today = `CURDATE()`;
  const [rows] = await conn.execute(
    `SELECT m.milestone_id, m.title, m.target_date, m.status, m.completed_at,
            m.quality_rating, m.revision_count,
            p.project_id, p.project_code, p.project_name,
            DATEDIFF(m.target_date, ${today}) AS days_until,
            DATEDIFF(${today}, m.target_date) AS days_overdue
       FROM project_milestones m
       INNER JOIN projects p ON p.project_id = m.project_id
      WHERE m.owner_user_id = ?
      ORDER BY
        CASE m.status WHEN 'Blocked' THEN 0 WHEN 'In Progress' THEN 1 WHEN 'Pending' THEN 2 WHEN 'Done' THEN 3 END,
        m.target_date ASC
      LIMIT 50`,
    [consultantUserId]
  );
  return {
    items: rows.map((r) => {
      const isOverdue = r.status !== 'Done' && r.target_date && Number(r.days_overdue) > 0;
      return {
        milestone_id: r.milestone_id,
        title: r.title,
        project_id: r.project_id,
        project_code: r.project_code,
        project_name: r.project_name,
        target_date: r.target_date,
        status: r.status,
        completed_at: r.completed_at,
        quality_rating: r.quality_rating,
        revision_count: r.revision_count,
        days_until: r.status === 'Done' ? null : Number(r.days_until ?? 0),
        is_overdue: !!isOverdue
      };
    }),
    count: rows.length
  };
};

const buildUrgent = async (conn, { consultantUserId }) => {
  const today = `CURDATE()`;
  const [overdueRows] = await conn.execute(
    `SELECT m.milestone_id, m.title, m.target_date, m.status,
            DATEDIFF(${today}, m.target_date) AS days_overdue,
            p.project_id, p.project_code, p.project_name
       FROM project_milestones m
       INNER JOIN projects p ON p.project_id = m.project_id
      WHERE m.owner_user_id = ?
        AND m.target_date < ${today}
        AND m.status NOT IN ('Done')
        AND p.status NOT IN ('Completed', 'Cancelled')
      ORDER BY m.target_date ASC
      LIMIT 10`,
    [consultantUserId]
  );
  const [upcomingRows] = await conn.execute(
    `SELECT m.milestone_id, m.title, m.target_date, m.status,
            DATEDIFF(m.target_date, ${today}) AS days_until,
            p.project_id, p.project_code, p.project_name
       FROM project_milestones m
       INNER JOIN projects p ON p.project_id = m.project_id
      WHERE m.owner_user_id = ?
        AND m.target_date >= ${today}
        AND m.target_date <= DATE_ADD(${today}, INTERVAL 7 DAY)
        AND m.status NOT IN ('Done')
        AND p.status NOT IN ('Completed', 'Cancelled')
      ORDER BY m.target_date ASC
      LIMIT 10`,
    [consultantUserId]
  );
  return {
    overdue: overdueRows.map((r) => ({
      milestone_id: r.milestone_id,
      title: r.title,
      project_code: r.project_code,
      project_name: r.project_name,
      target_date: r.target_date,
      status: r.status,
      days_overdue: Number(r.days_overdue ?? 0)
    })),
    upcoming: upcomingRows.map((r) => ({
      milestone_id: r.milestone_id,
      title: r.title,
      project_code: r.project_code,
      project_name: r.project_name,
      target_date: r.target_date,
      status: r.status,
      days_until: Number(r.days_until ?? 0)
    }))
  };
};

const buildMyKpi = async (conn, { consultantUserId, period }) => {
  const periodKey = period.startSql.slice(0, 7);
  const empty = {
    period: periodKey,
    has_snapshot: false,
    is_finalized: false,
    total_score: 0,
    dimensions: { task_completion: 0, timeliness: 0, update_compliance: 0, output_quality: 0 },
    previous: null
  };

  try {
    await conn.execute('SELECT 1 FROM kpi_snapshots LIMIT 1');
  } catch (e) {
    if (e?.code === 'ER_NO_SUCH_TABLE') return empty;
    throw e;
  }

  const [currentRows] = await conn.execute(
    `SELECT total_score, capaian_task_completion, capaian_timeliness,
            capaian_update_compliance, capaian_output_quality, finalized_at
       FROM kpi_snapshots
      WHERE consultant_user_id = ? AND period = ?
      LIMIT 1`,
    [consultantUserId, periodKey]
  );
  const current = currentRows[0];

  // Previous: ambil snapshot terbaru selain current
  const [prevRows] = await conn.execute(
    `SELECT period, total_score
       FROM kpi_snapshots
      WHERE consultant_user_id = ? AND period <> ?
      ORDER BY period DESC LIMIT 1`,
    [consultantUserId, periodKey]
  );
  const prev = prevRows[0];

  const num = (v) => (v != null ? Number(Number(v).toFixed(2)) : 0);

  if (!current) {
    return {
      ...empty,
      previous: prev
        ? { period: prev.period, total_score: num(prev.total_score) }
        : null
    };
  }

  return {
    period: periodKey,
    has_snapshot: true,
    is_finalized: current.finalized_at != null,
    total_score: num(current.total_score),
    dimensions: {
      task_completion: num(current.capaian_task_completion),
      timeliness: num(current.capaian_timeliness),
      update_compliance: num(current.capaian_update_compliance),
      output_quality: num(current.capaian_output_quality)
    },
    previous: prev
      ? { period: prev.period, total_score: num(prev.total_score) }
      : null
  };
};

const buildRecentRatings = async (conn, { consultantUserId }) => {
  // Ambil milestone yang dia owned + sudah punya quality_rating (rated by PM).
  // updated_at sebagai proxy "kapan di-rate" (project_milestones tidak punya
  // rated_at column; rating disimpan inline ke milestone row).
  const [rows] = await conn.execute(
    `SELECT m.milestone_id, m.title, m.quality_rating, m.revision_count,
            m.completed_at, m.updated_at,
            p.project_id, p.project_code, p.project_name,
            COALESCE(u_pm.name, p.pm_name_snapshot) AS pm_name
       FROM project_milestones m
       INNER JOIN projects p ON p.project_id = m.project_id
       LEFT JOIN users u_pm ON u_pm.id = p.pm_user_id
      WHERE m.owner_user_id = ?
        AND m.quality_rating IS NOT NULL
      ORDER BY m.updated_at DESC
      LIMIT 8`,
    [consultantUserId]
  );
  return {
    items: rows.map((r) => ({
      milestone_id: r.milestone_id,
      title: r.title,
      project_code: r.project_code,
      project_name: r.project_name,
      pm_name: r.pm_name,
      quality_rating: Number(r.quality_rating),
      revision_count: r.revision_count != null ? Number(r.revision_count) : 0,
      completed_at: r.completed_at,
      rated_at: r.updated_at
    }))
  };
};

const getConsultantDashboard = async (query = {}, user = {}) => {
  const consultantUserId = Number(user?.sub);
  if (!Number.isInteger(consultantUserId) || consultantUserId <= 0) {
    return { ok: false, message: 'User ID tidak valid.' };
  }
  const period = resolveDashboardPeriod({
    period: query.period,
    from: query.from,
    to: query.to
  });

  const conn = await pool.getConnection();
  try {
    const [myProjects, myMilestones, urgent, myKpi, recentRatings] = await Promise.all([
      buildMyProjects(conn, { consultantUserId }),
      buildMyMilestones(conn, { consultantUserId }),
      buildUrgent(conn, { consultantUserId }),
      buildMyKpi(conn, { consultantUserId, period }),
      buildRecentRatings(conn, { consultantUserId })
    ]);

    // Analytics overlay — scoped ke self.
    const [kpiTrend, dimensionVsPeer] = await Promise.all([
      buildKpiTrend(conn, { period, userId: consultantUserId }),
      buildDimensionVsPeer(conn, { period, userId: consultantUserId })
    ]);

    const insights = generateInsights({
      role: 'CONSULTANT',
      kpiTrend,
      dimensionVsPeer,
      milestonesAtRisk: urgent ? { overdue: urgent.overdue ?? [] } : null
    });

    return {
      ok: true,
      data: {
        meta: {
          period: period.periodKey,
          period_start: period.startSql,
          period_end_exclusive: period.endSqlExclusive,
          scope: 'consultant_owned',
          consultant_user_id: consultantUserId
        },
        my_projects: myProjects,
        my_milestones: myMilestones,
        urgent,
        my_kpi: myKpi,
        recent_ratings: recentRatings,
        analytics: {
          kpi_trend: kpiTrend,
          dimension_vs_peer: dimensionVsPeer,
          insights
        }
      }
    };
  } finally {
    conn.release();
  }
};

module.exports = { getConsultantDashboard };
