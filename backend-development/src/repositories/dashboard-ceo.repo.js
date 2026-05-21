const { pool } = require('../config/db');
const {
  buildMonthBuckets,
  deltaPercent,
  resolveComparisonPeriod,
  resolveDashboardPeriod
} = require('../utils/dashboard-period');
const {
  buildPipelineAnalytics,
  parseOptionalInt,
  buildServiceFilter,
  buildDepartmentFilter
} = require('./dashboard-pipeline.repo');
const { buildMarketingAnalytics } = require('./dashboard-marketing.repo');
const { buildRevenueAnalytics } = require('./dashboard-revenue.repo');

const TRACKED_LEAD_WHERE = `
  l.lead_status IN ('ACTIVE', 'WON', 'LOST')
  AND (
    (l.source_type = 'FORM_LEAD_CAPTURE' AND l.bank_data_status = 'PROCESSED')
    OR l.source_type = 'MANUAL'
  )
`;

const countInRange = async (conn, sql, params, context = 'count') => {
  if (typeof sql !== 'string' || sql.trim().length === 0) {
    throw new Error(`Invalid dashboard SQL (${context}): query is missing or empty.`);
  }
  const [rows] = await conn.execute(sql, params ?? []);
  return Number(rows[0]?.cnt ?? 0);
};

const sumInRange = async (conn, sql, params, context = 'sum') => {
  if (typeof sql !== 'string' || sql.trim().length === 0) {
    throw new Error(`Invalid dashboard SQL (${context}): query is missing or empty.`);
  }
  const [rows] = await conn.execute(sql, params ?? []);
  return Number(rows[0]?.total ?? 0);
};

const kpiMetric = async (
  conn,
  { metricKey, currentSql, currentParams, compareSql, compareParams, isSum = false }
) => {
  if (!metricKey) {
    throw new Error('Unknown dashboard KPI metric: metricKey is required.');
  }
  if (typeof currentSql !== 'string' || currentSql.trim().length === 0) {
    throw new Error(`Unknown dashboard KPI metric: ${metricKey} (current SQL missing).`);
  }
  if (typeof compareSql !== 'string' || compareSql.trim().length === 0) {
    throw new Error(`Unknown dashboard KPI metric: ${metricKey} (compare SQL missing).`);
  }

  const fn = isSum ? sumInRange : countInRange;
  const current = await fn(conn, currentSql, currentParams, `${metricKey}.current`);
  const previous = await fn(conn, compareSql, compareParams, `${metricKey}.compare`);
  return {
    value: current,
    previous,
    delta: deltaPercent(current, previous)
  };
};

const getCeoDashboard = async (query = {}) => {
  const serviceId = parseOptionalInt(query.serviceId);
  const departmentId = parseOptionalInt(query.departmentId);
  const period = resolveDashboardPeriod({
    period: query.period,
    from: query.from,
    to: query.to
  });
  const comparison = resolveComparisonPeriod(period, query.comparison);
  const trendBuckets = buildMonthBuckets(period.endExclusive, 12);

  const svcLead = buildServiceFilter(serviceId, 'svc');
  const deptLead = buildDepartmentFilter(departmentId, 'dept');

  const conn = await pool.getConnection();
  try {
    const leadScopeJoin = `
      FROM leads l
      LEFT JOIN proposals p ON p.lead_id = l.lead_id
      LEFT JOIN services svc ON svc.service_id = p.service_id
      LEFT JOIN departments dept ON dept.id = svc.department_id
      WHERE ${TRACKED_LEAD_WHERE}
        ${svcLead.sql}
        ${deptLead.sql}
    `;

    const leadDateParams = [...svcLead.params, ...deptLead.params];

    const [kpiTotalLead, kpiClientWon, kpiProposals, kpiElSigned, kpiHandoverApproved] = await Promise.all([
      kpiMetric(conn, {
        metricKey: 'total_lead',
        currentSql: `SELECT COUNT(DISTINCT l.lead_id) AS cnt ${leadScopeJoin} AND l.created_at >= ? AND l.created_at < ?`,
        currentParams: [...leadDateParams, period.startSql, period.endSqlExclusive],
        compareSql: `SELECT COUNT(DISTINCT l.lead_id) AS cnt ${leadScopeJoin} AND l.created_at >= ? AND l.created_at < ?`,
        compareParams: [...leadDateParams, comparison.startSql, comparison.endSqlExclusive]
      }),
      kpiMetric(conn, {
        metricKey: 'client_won',
        currentSql: `SELECT COUNT(DISTINCT l.lead_id) AS cnt ${leadScopeJoin} AND l.lead_status = 'WON' AND l.updated_at >= ? AND l.updated_at < ?`,
        currentParams: [...leadDateParams, period.startSql, period.endSqlExclusive],
        compareSql: `SELECT COUNT(DISTINCT l.lead_id) AS cnt ${leadScopeJoin} AND l.lead_status = 'WON' AND l.updated_at >= ? AND l.updated_at < ?`,
        compareParams: [...leadDateParams, comparison.startSql, comparison.endSqlExclusive]
      }),
      kpiMetric(conn, {
        metricKey: 'proposals_created',
        currentSql: `SELECT COUNT(*) AS cnt
          FROM proposals pr
          INNER JOIN leads l ON l.lead_id = pr.lead_id
          INNER JOIN services svc ON svc.service_id = pr.service_id
          INNER JOIN departments dept ON dept.id = svc.department_id
         WHERE ${TRACKED_LEAD_WHERE.replace(/\bl\./g, 'l.')}
           ${svcLead.sql}
           ${deptLead.sql}
           AND pr.created_at >= ? AND pr.created_at < ?`,
        currentParams: [...leadDateParams, period.startSql, period.endSqlExclusive],
        compareSql: `SELECT COUNT(*) AS cnt
          FROM proposals pr
          INNER JOIN leads l ON l.lead_id = pr.lead_id
          INNER JOIN services svc ON svc.service_id = pr.service_id
          INNER JOIN departments dept ON dept.id = svc.department_id
         WHERE ${TRACKED_LEAD_WHERE.replace(/\bl\./g, 'l.')}
           ${svcLead.sql}
           ${deptLead.sql}
           AND pr.created_at >= ? AND pr.created_at < ?`,
        compareParams: [...leadDateParams, comparison.startSql, comparison.endSqlExclusive]
      }),
      kpiMetric(conn, {
        metricKey: 'engagement_letters_signed',
        currentSql: `SELECT COUNT(*) AS cnt
          FROM engagement_letters e
          INNER JOIN proposals pr ON pr.proposal_id = e.proposal_id
          INNER JOIN leads l ON l.lead_id = e.lead_id
          INNER JOIN services svc ON svc.service_id = pr.service_id
          INNER JOIN departments dept ON dept.id = svc.department_id
         WHERE e.engagement_status = 'SIGNED'
           AND ${TRACKED_LEAD_WHERE.replace(/\bl\./g, 'l.')}
           ${svcLead.sql}
           ${deptLead.sql}
           AND e.signed_at >= ? AND e.signed_at < ?`,
        currentParams: [...leadDateParams, period.startSql, period.endSqlExclusive],
        compareSql: `SELECT COUNT(*) AS cnt
          FROM engagement_letters e
          INNER JOIN proposals pr ON pr.proposal_id = e.proposal_id
          INNER JOIN leads l ON l.lead_id = e.lead_id
          INNER JOIN services svc ON svc.service_id = pr.service_id
          INNER JOIN departments dept ON dept.id = svc.department_id
         WHERE e.engagement_status = 'SIGNED'
           AND ${TRACKED_LEAD_WHERE.replace(/\bl\./g, 'l.')}
           ${svcLead.sql}
           ${deptLead.sql}
           AND e.signed_at >= ? AND e.signed_at < ?`,
        compareParams: [...leadDateParams, comparison.startSql, comparison.endSqlExclusive]
      }),
      kpiMetric(conn, {
        metricKey: 'handovers_approved',
        currentSql: `SELECT COUNT(*) AS cnt
          FROM handovers h
          INNER JOIN leads l ON l.lead_id = h.lead_id
          INNER JOIN services svc ON svc.service_id = h.service_id
          INNER JOIN departments dept ON dept.id = h.department_id
         WHERE h.status IN ('APPROVED', 'ROUTED_TO_COO', 'ASSIGNED_TO_PM')
           AND ${TRACKED_LEAD_WHERE.replace(/\bl\./g, 'l.')}
           ${svcLead.sql}
           ${deptLead.sql}
           AND h.approved_at >= ? AND h.approved_at < ?`,
        currentParams: [...leadDateParams, period.startSql, period.endSqlExclusive],
        compareSql: `SELECT COUNT(*) AS cnt
          FROM handovers h
          INNER JOIN leads l ON l.lead_id = h.lead_id
          INNER JOIN services svc ON svc.service_id = h.service_id
          INNER JOIN departments dept ON dept.id = h.department_id
         WHERE h.status IN ('APPROVED', 'ROUTED_TO_COO', 'ASSIGNED_TO_PM')
           AND ${TRACKED_LEAD_WHERE.replace(/\bl\./g, 'l.')}
           ${svcLead.sql}
           ${deptLead.sql}
           AND h.approved_at >= ? AND h.approved_at < ?`,
        compareParams: [...leadDateParams, comparison.startSql, comparison.endSqlExclusive]
      })
    ]);

    const marketing = await buildMarketingAnalytics(conn, {
      period,
      comparison,
      trendBuckets,
      serviceId,
      departmentId,
      userId: null
    });

    const pipeline = await buildPipelineAnalytics(conn, {
      period,
      comparison,
      trendBuckets,
      serviceId,
      departmentId,
      userId: null
    });

    const revenue = await buildRevenueAnalytics(conn, {
      period,
      comparison,
      trendBuckets,
      serviceId,
      departmentId
    });

    const [topServicesLead] = await conn.execute(
      `SELECT svc.service_id, svc.name AS service_name, COUNT(DISTINCT l.lead_id) AS metric_value
         FROM leads l
         INNER JOIN proposals p ON p.lead_id = l.lead_id
         INNER JOIN services svc ON svc.service_id = p.service_id
         INNER JOIN departments dept ON dept.id = svc.department_id
        WHERE ${TRACKED_LEAD_WHERE}
          ${svcLead.sql}
          ${deptLead.sql}
          AND l.created_at >= ? AND l.created_at < ?
        GROUP BY svc.service_id, svc.name
        ORDER BY metric_value DESC
        LIMIT 8`,
      [...leadDateParams, period.startSql, period.endSqlExclusive]
    );

    const [topServicesWon] = await conn.execute(
      `SELECT svc.service_id, svc.name AS service_name, COUNT(DISTINCT l.lead_id) AS metric_value
         FROM leads l
         INNER JOIN proposals p ON p.lead_id = l.lead_id
         INNER JOIN services svc ON svc.service_id = p.service_id
         INNER JOIN departments dept ON dept.id = svc.department_id
        WHERE ${TRACKED_LEAD_WHERE}
          AND l.lead_status = 'WON'
          ${svcLead.sql}
          ${deptLead.sql}
          AND l.updated_at >= ? AND l.updated_at < ?
        GROUP BY svc.service_id, svc.name
        ORDER BY metric_value DESC
        LIMIT 8`,
      [...leadDateParams, period.startSql, period.endSqlExclusive]
    );

    const [topServicesInvoice] = await conn.execute(
      `SELECT svc.service_id, svc.name AS service_name,
              COALESCE(SUM(ip.amount_received_net), 0) AS metric_value
         FROM invoice_payments ip
         INNER JOIN invoice_terms it ON it.invoice_id = ip.invoice_id
         INNER JOIN invoice_accounts ia ON ia.account_id = it.account_id
         INNER JOIN services svc ON svc.service_id = ia.service_id
         INNER JOIN departments dept ON dept.id = svc.department_id
        WHERE ip.status = 'VERIFIED'
          AND ip.transaction_date >= ? AND ip.transaction_date < ?
          ${svcLead.sql}
          ${deptLead.sql}
        GROUP BY svc.service_id, svc.name
        ORDER BY metric_value DESC
        LIMIT 8`,
      [period.startSql, period.endSqlExclusive, ...leadDateParams]
    );

    const [servicesLookup] = await conn.execute(
      `SELECT service_id, name FROM services WHERE is_active = 1 ORDER BY name ASC`
    );
    const [departmentsLookup] = await conn.execute(
      `SELECT id AS department_id, name FROM departments ORDER BY name ASC`
    );

    return {
      ok: true,
      data: {
        meta: {
          period: period.periodKey,
          period_start: period.startSql,
          period_end_exclusive: period.endSqlExclusive,
          comparison_label: comparison.label,
          scope: 'organization'
        },
        filters: {
          service_id: serviceId,
          department_id: departmentId,
          lookups: {
            services: servicesLookup,
            departments: departmentsLookup
          }
        },
        executive_kpis: {
          total_lead: kpiTotalLead,
          client_won: kpiClientWon,
          proposals_created: kpiProposals,
          engagement_letters_signed: kpiElSigned,
          handovers_approved: kpiHandoverApproved,
          payments_received: revenue.summary_metrics.total_paid,
          invoice_outstanding: revenue.summary_metrics.total_outstanding,
          overdue_amount: revenue.summary_metrics.total_overdue
        },
        marketing,
        pipeline,
        revenue,
        performance: {
          top_services_by_leads: topServicesLead.map((r) => ({
            service_id: r.service_id,
            name: r.service_name,
            value: Number(r.metric_value)
          })),
          top_services_by_won: topServicesWon.map((r) => ({
            service_id: r.service_id,
            name: r.service_name,
            value: Number(r.metric_value)
          })),
          top_services_by_invoice_value: topServicesInvoice.map((r) => ({
            service_id: r.service_id,
            name: r.service_name,
            value: Number(r.metric_value)
          }))
        }
      }
    };
  } finally {
    conn.release();
  }
};

module.exports = {
  getCeoDashboard
};
