const { deltaPercent } = require('../utils/dashboard-period');
const { buildServiceFilter, buildDepartmentFilter } = require('./dashboard-pipeline.repo');

const INVOICE_SCOPE_JOIN = `
  FROM invoice_terms it
  INNER JOIN invoice_accounts ia ON ia.account_id = it.account_id
  INNER JOIN services svc ON svc.service_id = ia.service_id
  INNER JOIN departments dept ON dept.id = svc.department_id`;

const INVOICE_PAYMENT_VERIFIED_SQL = "ip.status = 'VERIFIED'";

const invoicePaidAsOfJoin = `
  LEFT JOIN (
    SELECT invoice_id, COALESCE(SUM(amount_received_net), 0) AS paid_sum
      FROM invoice_payments
     WHERE transaction_date < ?
       AND status = 'VERIFIED'
     GROUP BY invoice_id
  ) paid ON paid.invoice_id = it.invoice_id`;

const invoiceBalanceExpr = 'GREATEST(it.net_amount - COALESCE(paid.paid_sum, 0), 0)';
const invoiceUnpaidAtCutoffWhere = '(it.net_amount - COALESCE(paid.paid_sum, 0)) > 0';

const invoiceOverdueAtCutoffWhere = `
  it.created_at < ?
  AND it.sent_to_client_at IS NOT NULL
  AND it.sent_to_client_at < ?
  AND it.due_date IS NOT NULL
  AND it.due_date < ?
  AND ${invoiceUnpaidAtCutoffWhere}`;

const TOP_CLIENTS_OVERDUE_LIMIT = 5;

const sumInRange = async (conn, sql, params, context = 'sum') => {
  if (typeof sql !== 'string' || sql.trim().length === 0) {
    throw new Error(`Invalid dashboard SQL (${context}): query is missing or empty.`);
  }
  const [rows] = await conn.execute(sql, params ?? []);
  return Number(rows[0]?.total ?? 0);
};

const fetchMonthlySumTrend = async (conn, { buckets, sqlTemplate, baseParams }) => {
  const points = [];
  for (const bucket of buckets) {
    // eslint-disable-next-line no-await-in-loop
    const value = await sumInRange(conn, sqlTemplate, [...baseParams, bucket.startSql, bucket.endSqlExclusive]);
    points.push({ month: bucket.key, label: bucket.label, value });
  }
  return points;
};

const kpiMetric = async (
  conn,
  { metricKey, currentSql, currentParams, compareSql, compareParams, isSum = false }
) => {
  if (!metricKey) {
    throw new Error('Unknown dashboard KPI metric: metricKey is required.');
  }
  const current = await sumInRange(conn, currentSql, currentParams, `${metricKey}.current`);
  const previous = await sumInRange(conn, compareSql, compareParams, `${metricKey}.compare`);
  return {
    value: current,
    previous,
    delta: deltaPercent(current, previous)
  };
};

const sumInvoiceOutstandingAsOf = async (conn, asOfExclusive, { filterParams, svcLead, deptLead }, context) => {
  const sql = `SELECT COALESCE(SUM(${invoiceBalanceExpr}), 0) AS total
    ${INVOICE_SCOPE_JOIN}
    ${invoicePaidAsOfJoin}
   WHERE it.created_at < ?
     ${svcLead.sql}
     ${deptLead.sql}`;
  return sumInRange(conn, sql, [asOfExclusive, asOfExclusive, ...filterParams], context);
};

const sumInvoiceOverdueAsOf = async (conn, asOfExclusive, { filterParams, svcLead, deptLead }, context) => {
  const sql = `SELECT COALESCE(SUM(${invoiceBalanceExpr}), 0) AS total
    ${INVOICE_SCOPE_JOIN}
    ${invoicePaidAsOfJoin}
   WHERE ${invoiceOverdueAtCutoffWhere}
     ${svcLead.sql}
     ${deptLead.sql}`;
  return sumInRange(
    conn,
    sql,
    [asOfExclusive, asOfExclusive, asOfExclusive, asOfExclusive, asOfExclusive, ...filterParams],
    context
  );
};

const sumInvoiceInvoicedInMonth = async (
  conn,
  monthStartSql,
  monthEndExclusiveSql,
  { filterParams, svcLead, deptLead },
  context
) => {
  const sql = `SELECT COALESCE(SUM(it.net_amount), 0) AS total
    ${INVOICE_SCOPE_JOIN}
   WHERE it.created_at >= ?
     AND it.created_at < ?
     ${svcLead.sql}
     ${deptLead.sql}`;
  return sumInRange(conn, sql, [monthStartSql, monthEndExclusiveSql, ...filterParams], context);
};

const sumVerifiedPaymentsInMonth = async (
  conn,
  monthStartSql,
  monthEndExclusiveSql,
  { filterParams, svcLead, deptLead },
  context
) => {
  const sql = `SELECT COALESCE(SUM(ip.amount_received_net), 0) AS total
      FROM invoice_payments ip
      INNER JOIN invoice_terms it ON it.invoice_id = ip.invoice_id
      INNER JOIN invoice_accounts ia ON ia.account_id = it.account_id
      INNER JOIN services svc ON svc.service_id = ia.service_id
      INNER JOIN departments dept ON dept.id = svc.department_id
     WHERE ${INVOICE_PAYMENT_VERIFIED_SQL}
       AND ip.transaction_date >= ?
       AND ip.transaction_date < ?
       ${svcLead.sql}
       ${deptLead.sql}`;
  return sumInRange(conn, sql, [monthStartSql, monthEndExclusiveSql, ...filterParams], context);
};

const fetchTopClientsOverdueAsOf = async (conn, asOfExclusive, { filterParams, svcLead, deptLead }) => {
  const sql = `SELECT
      l.lead_id,
      COALESCE(NULLIF(TRIM(l.company_name), ''), l.lead_code, CONCAT('Klien #', l.lead_id)) AS client_name,
      COALESCE(SUM(${invoiceBalanceExpr}), 0) AS overdue_amount,
      COUNT(DISTINCT it.invoice_id) AS overdue_term_count,
      MIN(it.due_date) AS oldest_due_date,
      MAX(DATEDIFF(?, it.due_date)) AS max_days_overdue
    ${INVOICE_SCOPE_JOIN}
    INNER JOIN leads l ON l.lead_id = ia.lead_id
    ${invoicePaidAsOfJoin}
   WHERE ${invoiceOverdueAtCutoffWhere}
     ${svcLead.sql}
     ${deptLead.sql}
   GROUP BY l.lead_id, client_name
   HAVING overdue_amount > 0
   ORDER BY overdue_amount DESC
   LIMIT ${TOP_CLIENTS_OVERDUE_LIMIT}`;
  const [rows] = await conn.execute(sql, [
    asOfExclusive,
    asOfExclusive,
    asOfExclusive,
    asOfExclusive,
    asOfExclusive,
    asOfExclusive,
    ...filterParams
  ]);
  return rows;
};

/**
 * Revenue & invoice analytics — organisasi (CEO / Staff Administrasi).
 * Invoice tidak memiliki ownership per user di schema; staff admin mengelola seluruh invoice.
 */
const buildRevenueAnalytics = async (
  conn,
  { period, comparison, trendBuckets, serviceId, departmentId }
) => {
  const svcLead = buildServiceFilter(serviceId, 'svc');
  const deptLead = buildDepartmentFilter(departmentId, 'dept');
  const filterParams = [...svcLead.params, ...deptLead.params];
  const invoiceSnapshotFilters = { filterParams, svcLead, deptLead };

  const [kpiPayments, kpiRevenueInvoiced, kpiRevenueOutstanding, kpiRevenueOverdue] = await Promise.all([
    kpiMetric(conn, {
      metricKey: 'payments_received',
      currentSql: `SELECT COALESCE(SUM(ip.amount_received_net), 0) AS total
          FROM invoice_payments ip
          INNER JOIN invoice_terms it ON it.invoice_id = ip.invoice_id
          INNER JOIN invoice_accounts ia ON ia.account_id = it.account_id
          INNER JOIN services svc ON svc.service_id = ia.service_id
          INNER JOIN departments dept ON dept.id = svc.department_id
         WHERE ${INVOICE_PAYMENT_VERIFIED_SQL}
           ${svcLead.sql}
           ${deptLead.sql}
           AND ip.transaction_date >= ? AND ip.transaction_date < ?`,
      currentParams: [...filterParams, period.startSql, period.endSqlExclusive],
      compareSql: `SELECT COALESCE(SUM(ip.amount_received_net), 0) AS total
          FROM invoice_payments ip
          INNER JOIN invoice_terms it ON it.invoice_id = ip.invoice_id
          INNER JOIN invoice_accounts ia ON ia.account_id = it.account_id
          INNER JOIN services svc ON svc.service_id = ia.service_id
          INNER JOIN departments dept ON dept.id = svc.department_id
         WHERE ${INVOICE_PAYMENT_VERIFIED_SQL}
           ${svcLead.sql}
           ${deptLead.sql}
           AND ip.transaction_date >= ? AND ip.transaction_date < ?`,
      compareParams: [...filterParams, comparison.startSql, comparison.endSqlExclusive],
      isSum: true
    }),
    kpiMetric(conn, {
      metricKey: 'revenue_total_invoiced',
      currentSql: `SELECT COALESCE(SUM(it.net_amount), 0) AS total ${INVOICE_SCOPE_JOIN}
         WHERE 1=1
           ${svcLead.sql}
           ${deptLead.sql}
           AND it.created_at >= ? AND it.created_at < ?`,
      currentParams: [...filterParams, period.startSql, period.endSqlExclusive],
      compareSql: `SELECT COALESCE(SUM(it.net_amount), 0) AS total ${INVOICE_SCOPE_JOIN}
         WHERE 1=1
           ${svcLead.sql}
           ${deptLead.sql}
           AND it.created_at >= ? AND it.created_at < ?`,
      compareParams: [...filterParams, comparison.startSql, comparison.endSqlExclusive],
      isSum: true
    }),
    kpiMetric(conn, {
      metricKey: 'revenue_total_outstanding',
      currentSql: `SELECT COALESCE(SUM(${invoiceBalanceExpr}), 0) AS total
          ${INVOICE_SCOPE_JOIN}
          ${invoicePaidAsOfJoin}
         WHERE it.created_at < ?
           ${svcLead.sql}
           ${deptLead.sql}`,
      currentParams: [period.endSqlExclusive, period.endSqlExclusive, ...filterParams],
      compareSql: `SELECT COALESCE(SUM(${invoiceBalanceExpr}), 0) AS total
          ${INVOICE_SCOPE_JOIN}
          ${invoicePaidAsOfJoin}
         WHERE it.created_at < ?
           ${svcLead.sql}
           ${deptLead.sql}`,
      compareParams: [comparison.endSqlExclusive, comparison.endSqlExclusive, ...filterParams],
      isSum: true
    }),
    kpiMetric(conn, {
      metricKey: 'revenue_total_overdue',
      currentSql: `SELECT COALESCE(SUM(${invoiceBalanceExpr}), 0) AS total
          ${INVOICE_SCOPE_JOIN}
          ${invoicePaidAsOfJoin}
         WHERE ${invoiceOverdueAtCutoffWhere}
           ${svcLead.sql}
           ${deptLead.sql}`,
      currentParams: [
        period.endSqlExclusive,
        period.endSqlExclusive,
        period.endSqlExclusive,
        period.endSqlExclusive,
        ...filterParams
      ],
      compareSql: `SELECT COALESCE(SUM(${invoiceBalanceExpr}), 0) AS total
          ${INVOICE_SCOPE_JOIN}
          ${invoicePaidAsOfJoin}
         WHERE ${invoiceOverdueAtCutoffWhere}
           ${svcLead.sql}
           ${deptLead.sql}`,
      compareParams: [
        comparison.endSqlExclusive,
        comparison.endSqlExclusive,
        comparison.endSqlExclusive,
        comparison.endSqlExclusive,
        ...filterParams
      ],
      isSum: true
    })
  ]);

  const paymentTrend = await fetchMonthlySumTrend(conn, {
    buckets: trendBuckets,
    sqlTemplate: `SELECT COALESCE(SUM(ip.amount_received_net), 0) AS total
        FROM invoice_payments ip
        INNER JOIN invoice_terms it ON it.invoice_id = ip.invoice_id
        INNER JOIN invoice_accounts ia ON ia.account_id = it.account_id
        INNER JOIN services svc ON svc.service_id = ia.service_id
        INNER JOIN departments dept ON dept.id = svc.department_id
       WHERE ${INVOICE_PAYMENT_VERIFIED_SQL}
         AND ip.transaction_date >= ? AND ip.transaction_date < ?
         ${svcLead.sql}
         ${deptLead.sql}`,
    baseParams: [...filterParams]
  });

  const paidVsOutstandingTrend = await Promise.all(
    trendBuckets.map(async (bucket) => {
      const paid = await sumVerifiedPaymentsInMonth(
        conn,
        bucket.startSql,
        bucket.endSqlExclusive,
        invoiceSnapshotFilters,
        `paid_vs_outstanding_paid_${bucket.key}`
      );
      const outstanding = await sumInvoiceOutstandingAsOf(
        conn,
        bucket.endSqlExclusive,
        invoiceSnapshotFilters,
        `outstanding_${bucket.key}`
      );
      return { month: bucket.key, label: bucket.label, paid, outstanding };
    })
  );

  const monthlyInvoiceTrend = await Promise.all(
    trendBuckets.map(async (bucket) => {
      const [invoiced, paid, outstanding, overdue] = await Promise.all([
        sumInvoiceInvoicedInMonth(
          conn,
          bucket.startSql,
          bucket.endSqlExclusive,
          invoiceSnapshotFilters,
          `monthly_invoice_invoiced_${bucket.key}`
        ),
        sumVerifiedPaymentsInMonth(
          conn,
          bucket.startSql,
          bucket.endSqlExclusive,
          invoiceSnapshotFilters,
          `monthly_invoice_paid_${bucket.key}`
        ),
        sumInvoiceOutstandingAsOf(
          conn,
          bucket.endSqlExclusive,
          invoiceSnapshotFilters,
          `monthly_invoice_outstanding_${bucket.key}`
        ),
        sumInvoiceOverdueAsOf(
          conn,
          bucket.endSqlExclusive,
          invoiceSnapshotFilters,
          `monthly_invoice_overdue_${bucket.key}`
        )
      ]);
      return { month: bucket.key, label: bucket.label, invoiced, paid, outstanding, overdue };
    })
  );

  const [invoiceStatusRows] = await conn.execute(
    `SELECT it.status,
            COUNT(*) AS cnt,
            COALESCE(SUM(it.net_amount), 0) AS amount
       FROM invoice_terms it
       INNER JOIN invoice_accounts ia ON ia.account_id = it.account_id
       INNER JOIN services svc ON svc.service_id = ia.service_id
       INNER JOIN departments dept ON dept.id = svc.department_id
      WHERE 1=1
        ${svcLead.sql}
        ${deptLead.sql}
      GROUP BY it.status`,
    [...filterParams]
  );

  const topClientsOverdueRows = await fetchTopClientsOverdueAsOf(
    conn,
    period.endSqlExclusive,
    invoiceSnapshotFilters
  );

  return {
    payment_trend: paymentTrend,
    paid_vs_outstanding_trend: paidVsOutstandingTrend,
    monthly_invoice_trend: monthlyInvoiceTrend,
    invoice_status_distribution: invoiceStatusRows.map((r) => ({
      status: r.status,
      count: Number(r.cnt),
      amount: Number(r.amount)
    })),
    top_clients_overdue: topClientsOverdueRows.map((r) => ({
      lead_id: Number(r.lead_id),
      client_name: r.client_name,
      overdue_amount: Number(r.overdue_amount),
      overdue_term_count: Number(r.overdue_term_count),
      oldest_due_date: r.oldest_due_date ? String(r.oldest_due_date).slice(0, 10) : null,
      max_days_overdue: Number(r.max_days_overdue ?? 0)
    })),
    summary: {
      total_invoiced: kpiRevenueInvoiced.value,
      total_paid: kpiPayments.value,
      total_outstanding: kpiRevenueOutstanding.value,
      total_overdue: kpiRevenueOverdue.value
    },
    summary_metrics: {
      total_invoiced: kpiRevenueInvoiced,
      total_paid: kpiPayments,
      total_outstanding: kpiRevenueOutstanding,
      total_overdue: kpiRevenueOverdue
    }
  };
};

module.exports = {
  buildRevenueAnalytics
};
