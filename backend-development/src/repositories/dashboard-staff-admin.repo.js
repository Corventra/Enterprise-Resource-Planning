const { pool } = require('../config/db');
const {
  buildMonthBuckets,
  resolveComparisonPeriod,
  resolveDashboardPeriod
} = require('../utils/dashboard-period');
const { buildRevenueAnalytics } = require('./dashboard-revenue.repo');
const { parseOptionalInt } = require('./dashboard-pipeline.repo');

const getStaffAdminDashboard = async (query = {}) => {
  const serviceId = parseOptionalInt(query.serviceId);
  const departmentId = parseOptionalInt(query.departmentId);
  const period = resolveDashboardPeriod({
    period: query.period,
    from: query.from,
    to: query.to
  });
  const comparison = resolveComparisonPeriod(period, query.comparison);
  const trendBuckets = buildMonthBuckets(period.endExclusive, 12);

  const conn = await pool.getConnection();
  try {
    const revenue = await buildRevenueAnalytics(conn, {
      period,
      comparison,
      trendBuckets,
      serviceId,
      departmentId
    });

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
        revenue
      }
    };
  } finally {
    conn.release();
  }
};

module.exports = {
  getStaffAdminDashboard
};
