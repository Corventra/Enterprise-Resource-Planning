const { fetchMonthlyTrend, buildServiceFilter, buildDepartmentFilter } = require('./dashboard-pipeline.repo');

/** Hanya form lead capture — selaras CEO dashboard. */
const FORM_LEAD_CAPTURE_LEAD_WHERE = `
  l.source_type = 'FORM_LEAD_CAPTURE' AND l.bank_data_status = 'PROCESSED'`;

/**
 * Definisi scope MEO (`meta.scope: own_marketing`):
 * Semua analytics marketing diturunkan dari campaign yang dibuat user (`campaigns.created_by = userId`).
 *
 * Turunan yang ikut scope campaign user:
 * - submission: form lead capture pada campaign tersebut (forms → campaigns.created_by)
 * - lead: lead form capture dengan campaign_id milik user (EXISTS / JOIN campaigns.created_by)
 * - top campaign / channel / topic: agregasi hanya dari lead & submission dalam scope di atas
 *
 * CEO: `userId === null` → tanpa filter campaign owner (organisasi penuh).
 */
const MEO_MARKETING_SCOPE_CAMPAIGN_OWNER_COLUMN = 'campaigns.created_by';

const conversionRate = (from, to) => {
  if (!from) return 0;
  return Math.round((to / from) * 1000) / 10;
};

/** SQL fragment & params untuk scope MEO per campaign owner. */
const buildMeoCampaignScopeSql = (userId) => {
  if (userId == null) {
    return {
      submissionJoinSql: '',
      submissionParams: [],
      leadOwnerSql: '',
      leadOwnerParams: [],
      campaignOwnerSql: '',
      campaignOwnerParams: []
    };
  }
  const uid = Number(userId);
  return {
    submissionJoinSql: ' INNER JOIN campaigns c_owner ON c_owner.campaign_id = f.campaign_id AND c_owner.created_by = ?',
    submissionParams: [uid],
    leadOwnerSql: ` AND EXISTS (
      SELECT 1 FROM campaigns c_owner
      WHERE c_owner.campaign_id = l.campaign_id AND c_owner.created_by = ?
    )`,
    leadOwnerParams: [uid],
    campaignOwnerSql: ' AND c.created_by = ?',
    campaignOwnerParams: [uid]
  };
};

/**
 * Analitik marketing akuisisi (CEO org-wide / MEO own_marketing).
 * @param {object} opts
 * @param {number|null} opts.userId - null = organisasi; number = scope MEO (campaign owner)
 */
const buildMarketingAnalytics = async (
  conn,
  { period, comparison, trendBuckets, serviceId, departmentId, userId = null }
) => {
  const owner = buildMeoCampaignScopeSql(userId);
  const svcLead = buildServiceFilter(serviceId, 'svc');
  const deptLead = buildDepartmentFilter(departmentId, 'dept');
  const rankFilterParams = [
    ...owner.campaignOwnerParams,
    ...(serviceId != null ? [serviceId] : []),
    ...(departmentId != null ? [departmentId] : []),
    period.startSql,
    period.endSqlExclusive
  ];
  const rankServiceSql = serviceId != null ? ' AND (p.proposal_id IS NULL OR svc.service_id = ?)' : '';
  const rankDeptSql = departmentId != null ? ' AND (p.proposal_id IS NULL OR dept.id = ?)' : '';

  const submissionTrend = await fetchMonthlyTrend(conn, {
    buckets: trendBuckets,
    sqlTemplate: `SELECT COUNT(*) AS cnt
      FROM form_submissions fs
      INNER JOIN forms f ON f.form_id = fs.form_id AND f.form_category = 'LEAD_CAPTURE'
      ${owner.submissionJoinSql}
     WHERE fs.submitted_at >= ? AND fs.submitted_at < ?`,
    baseParams: [...owner.submissionParams]
  });

  const leadTrend = await fetchMonthlyTrend(conn, {
    buckets: trendBuckets,
    sqlTemplate: `SELECT COUNT(*) AS cnt
      FROM leads l
     WHERE ${FORM_LEAD_CAPTURE_LEAD_WHERE}
       ${owner.leadOwnerSql}
       AND l.created_at >= ? AND l.created_at < ?`,
    baseParams: [...owner.leadOwnerParams]
  });

  const [topCampaigns] = await conn.execute(
    `SELECT c.campaign_id, c.name AS campaign_name, COUNT(DISTINCT l.lead_id) AS lead_count
       FROM leads l
       INNER JOIN campaigns c ON c.campaign_id = l.campaign_id
       LEFT JOIN proposals p ON p.lead_id = l.lead_id
       LEFT JOIN services svc ON svc.service_id = p.service_id
       LEFT JOIN departments dept ON dept.id = svc.department_id
      WHERE ${FORM_LEAD_CAPTURE_LEAD_WHERE}
        AND l.campaign_id IS NOT NULL
        ${owner.campaignOwnerSql}
        ${rankServiceSql}
        ${rankDeptSql}
        AND l.created_at >= ? AND l.created_at < ?
      GROUP BY c.campaign_id, c.name
      ORDER BY lead_count DESC, c.name ASC
      LIMIT 8`,
    rankFilterParams
  );

  const [topChannels] = await conn.execute(
    `SELECT COALESCE(fc.name, 'Lainnya') AS channel_name,
            COALESCE(fc.code, 'OTHER') AS channel_code,
            COUNT(DISTINCT l.lead_id) AS lead_count
       FROM leads l
       LEFT JOIN form_distribution_links fdl ON fdl.distribution_link_id = l.distribution_link_id
       LEFT JOIN form_channels fc ON fc.channel_id = fdl.channel_id
       LEFT JOIN proposals p ON p.lead_id = l.lead_id
       LEFT JOIN services svc ON svc.service_id = p.service_id
       LEFT JOIN departments dept ON dept.id = svc.department_id
      WHERE ${FORM_LEAD_CAPTURE_LEAD_WHERE}
        ${owner.leadOwnerSql}
        ${rankServiceSql}
        ${rankDeptSql}
        AND l.created_at >= ? AND l.created_at < ?
      GROUP BY fc.channel_id, fc.name, fc.code
      ORDER BY lead_count DESC
      LIMIT 8`,
    [
      ...owner.leadOwnerParams,
      ...(serviceId != null ? [serviceId] : []),
      ...(departmentId != null ? [departmentId] : []),
      period.startSql,
      period.endSqlExclusive
    ]
  );

  const periodSubmissionParams = [...owner.submissionParams, period.startSql, period.endSqlExclusive];
  const periodLeadParams = [...owner.leadOwnerParams, period.startSql, period.endSqlExclusive];
  const prevSubmissionParams = [...owner.submissionParams, comparison.startSql, comparison.endSqlExclusive];
  const prevLeadParams = [...owner.leadOwnerParams, comparison.startSql, comparison.endSqlExclusive];

  const [[submissionTotalRow], [leadFromFormRow], [prevSubmissionRow], [prevLeadRow]] = await Promise.all([
    conn.execute(
      `SELECT COUNT(*) AS cnt
         FROM form_submissions fs
         INNER JOIN forms f ON f.form_id = fs.form_id AND f.form_category = 'LEAD_CAPTURE'
         ${owner.submissionJoinSql}
        WHERE fs.submitted_at >= ? AND fs.submitted_at < ?`,
      periodSubmissionParams
    ),
    conn.execute(
      `SELECT COUNT(*) AS cnt
         FROM leads l
        WHERE ${FORM_LEAD_CAPTURE_LEAD_WHERE}
          ${owner.leadOwnerSql}
          AND l.created_at >= ? AND l.created_at < ?`,
      periodLeadParams
    ),
    conn.execute(
      `SELECT COUNT(*) AS cnt
         FROM form_submissions fs
         INNER JOIN forms f ON f.form_id = fs.form_id AND f.form_category = 'LEAD_CAPTURE'
         ${owner.submissionJoinSql}
        WHERE fs.submitted_at >= ? AND fs.submitted_at < ?`,
      prevSubmissionParams
    ),
    conn.execute(
      `SELECT COUNT(*) AS cnt
         FROM leads l
        WHERE ${FORM_LEAD_CAPTURE_LEAD_WHERE}
          ${owner.leadOwnerSql}
          AND l.created_at >= ? AND l.created_at < ?`,
      prevLeadParams
    )
  ]);

  const submissionTotal = Number(submissionTotalRow[0]?.cnt ?? 0);
  const leadFromForm = Number(leadFromFormRow[0]?.cnt ?? 0);
  const prevSubmissionTotal = Number(prevSubmissionRow[0]?.cnt ?? 0);
  const prevLeadFromForm = Number(prevLeadRow[0]?.cnt ?? 0);

  const [topTopics] = await conn.execute(
    `SELECT t.topic_id, t.name AS topic_name, COUNT(DISTINCT l.lead_id) AS lead_count
       FROM leads l
       INNER JOIN campaigns c ON c.campaign_id = l.campaign_id
       INNER JOIN topics t ON t.topic_id = c.topic_id
       LEFT JOIN proposals p ON p.lead_id = l.lead_id
       LEFT JOIN services svc ON svc.service_id = p.service_id
       LEFT JOIN departments dept ON dept.id = svc.department_id
      WHERE ${FORM_LEAD_CAPTURE_LEAD_WHERE}
        AND l.campaign_id IS NOT NULL
        ${owner.campaignOwnerSql}
        ${rankServiceSql}
        ${rankDeptSql}
        AND l.created_at >= ? AND l.created_at < ?
      GROUP BY t.topic_id, t.name
      ORDER BY lead_count DESC, t.name ASC
      LIMIT 8`,
    rankFilterParams
  );

  return {
    submission_trend: submissionTrend,
    lead_trend: leadTrend,
    monthly_acquisition: submissionTrend.map((sub) => {
      const leadPoint = leadTrend.find((l) => l.month === sub.month);
      const leads = Number(leadPoint?.value ?? 0);
      const submissions = Number(sub.value);
      return {
        month: sub.month,
        label: sub.label,
        submissions,
        leads,
        conversion_rate: submissions > 0 ? conversionRate(submissions, leads) : 0
      };
    }),
    period_summary: {
      submissions: submissionTotal,
      leads: leadFromForm,
      conversion_rate: conversionRate(submissionTotal, leadFromForm),
      previous: {
        submissions: prevSubmissionTotal,
        leads: prevLeadFromForm,
        conversion_rate: conversionRate(prevSubmissionTotal, prevLeadFromForm)
      }
    },
    top_campaigns: topCampaigns.map((r) => ({
      campaign_id: r.campaign_id,
      name: r.campaign_name,
      lead_count: Number(r.lead_count)
    })),
    top_channels: topChannels.map((r) => ({
      name: r.channel_name,
      code: r.channel_code,
      lead_count: Number(r.lead_count)
    })),
    top_topics: topTopics.map((r) => ({
      topic_id: r.topic_id,
      name: r.topic_name,
      lead_count: Number(r.lead_count)
    })),
    submission_to_lead: {
      submissions: submissionTotal,
      leads: leadFromForm,
      conversion_rate: conversionRate(submissionTotal, leadFromForm)
    }
  };
};

module.exports = {
  FORM_LEAD_CAPTURE_LEAD_WHERE,
  MEO_MARKETING_SCOPE_CAMPAIGN_OWNER_COLUMN,
  buildMeoCampaignScopeSql,
  /** @deprecated alias */
  buildMarketingOwnerFilter: buildMeoCampaignScopeSql,
  buildMarketingAnalytics
};
