const { deltaPercent } = require('../utils/dashboard-period');

const TRACKED_LEAD_WHERE = `
  l.lead_status IN ('ACTIVE', 'WON', 'LOST')
  AND (
    (l.source_type = 'FORM_LEAD_CAPTURE' AND l.bank_data_status = 'PROCESSED')
    OR l.source_type = 'MANUAL'
  )
`;

const parseOptionalInt = (value) => {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
};

const buildServiceFilter = (serviceId, alias = 'svc') => {
  if (serviceId == null) return { sql: '', params: [] };
  return { sql: ` AND ${alias}.service_id = ?`, params: [serviceId] };
};

const buildDepartmentFilter = (departmentId, alias = 'dept') => {
  if (departmentId == null) return { sql: '', params: [] };
  return { sql: ` AND ${alias}.id = ?`, params: [departmentId] };
};

/** CEO = null (semua lead). BD = userId dari JWT (processed_by). */
const buildProcessedByFilter = (userId) => {
  if (userId == null) return { sql: '', params: [] };
  return { sql: ' AND l.processed_by = ?', params: [Number(userId)] };
};

const countInRange = async (conn, sql, params, context = 'count') => {
  if (typeof sql !== 'string' || sql.trim().length === 0) {
    throw new Error(`Invalid dashboard SQL (${context}): query is missing or empty.`);
  }
  const [rows] = await conn.execute(sql, params ?? []);
  return Number(rows[0]?.cnt ?? 0);
};

const fetchMonthlyTrend = async (conn, { buckets, sqlTemplate, baseParams }) => {
  const points = [];
  for (const bucket of buckets) {
    // eslint-disable-next-line no-await-in-loop
    const value = await countInRange(conn, sqlTemplate, [...baseParams, bucket.startSql, bucket.endSqlExclusive]);
    points.push({ month: bucket.key, label: bucket.label, value });
  }
  return points;
};

const pipelineKpiMetric = (value, previous) => ({
  value,
  previous,
  delta: deltaPercent(value, previous)
});

const conversionRate = (from, to) => {
  if (!from) return 0;
  return Math.round((to / from) * 1000) / 10;
};

const buildLeadScope = ({ serviceId, departmentId, userId }) => {
  const svcLead = buildServiceFilter(serviceId, 'svc');
  const deptLead = buildDepartmentFilter(departmentId, 'dept');
  const processedBy = buildProcessedByFilter(userId);
  const leadJoinTail = `
      LEFT JOIN proposals p ON p.lead_id = l.lead_id
      LEFT JOIN services svc ON svc.service_id = p.service_id
      LEFT JOIN departments dept ON dept.id = svc.department_id
      WHERE ${TRACKED_LEAD_WHERE}
        ${svcLead.sql}
        ${deptLead.sql}
        ${processedBy.sql}`;
  const leadDateParams = [...svcLead.params, ...deptLead.params, ...processedBy.params];
  return { leadJoinTail, leadDateParams, svcLead, deptLead, processedBy };
};

/**
 * Pipeline / sales analytics — dipakai CEO (userId null) dan BD (processed_by = user).
 */
const buildPipelineAnalytics = async (
  conn,
  { period, comparison, trendBuckets, serviceId, departmentId, userId = null }
) => {
  const { leadJoinTail, leadDateParams } = buildLeadScope({ serviceId, departmentId, userId });

  const countPipelineFunnel = async (startSql, endSqlExclusive) => {
    const cohortParams = [...leadDateParams, startSql, endSqlExclusive];
    const milestoneParams = [...leadDateParams, startSql, endSqlExclusive, startSql, endSqlExclusive];
    const [
      funnelLead,
      funnelMeeting,
      funnelMinutes,
      funnelProposal,
      funnelElSigned,
      funnelHandoverApproved,
      funnelLost
    ] = await Promise.all([
      countInRange(
        conn,
        `SELECT COUNT(DISTINCT l.lead_id) AS cnt
           FROM leads l
           ${leadJoinTail}
           AND l.created_at >= ? AND l.created_at < ?`,
        cohortParams,
        'pipeline.lead'
      ),
      countInRange(
        conn,
        `SELECT COUNT(DISTINCT l.lead_id) AS cnt
           FROM leads l
           INNER JOIN meetings m ON m.lead_id = l.lead_id
           ${leadJoinTail}
           AND l.created_at >= ? AND l.created_at < ?`,
        cohortParams,
        'pipeline.meeting'
      ),
      countInRange(
        conn,
        `SELECT COUNT(DISTINCT l.lead_id) AS cnt
           FROM leads l
           INNER JOIN minutes mn ON mn.lead_id = l.lead_id
           ${leadJoinTail}
           AND l.created_at >= ? AND l.created_at < ?`,
        cohortParams,
        'pipeline.minutes'
      ),
      countInRange(
        conn,
        `SELECT COUNT(DISTINCT l.lead_id) AS cnt
           FROM leads l
           INNER JOIN proposals pr ON pr.lead_id = l.lead_id
           ${leadJoinTail}
           AND l.created_at >= ? AND l.created_at < ?`,
        cohortParams,
        'pipeline.proposal'
      ),
      countInRange(
        conn,
        `SELECT COUNT(DISTINCT l.lead_id) AS cnt
           FROM leads l
           INNER JOIN engagement_letters e ON e.lead_id = l.lead_id
           ${leadJoinTail}
           AND l.created_at >= ? AND l.created_at < ?
           AND e.engagement_status = 'SIGNED'
           AND e.signed_at >= ? AND e.signed_at < ?`,
        milestoneParams,
        'pipeline.el_signed'
      ),
      countInRange(
        conn,
        `SELECT COUNT(DISTINCT l.lead_id) AS cnt
           FROM leads l
           INNER JOIN handovers h ON h.lead_id = l.lead_id
           ${leadJoinTail}
           AND l.created_at >= ? AND l.created_at < ?
           AND h.status IN ('APPROVED', 'ROUTED_TO_COO', 'ASSIGNED_TO_PM')
           AND h.approved_at >= ? AND h.approved_at < ?`,
        milestoneParams,
        'pipeline.handover'
      ),
      countInRange(
        conn,
        `SELECT COUNT(DISTINCT l.lead_id) AS cnt
           FROM leads l
           ${leadJoinTail}
           AND l.lead_status = 'LOST'
           AND l.lost_at >= ? AND l.lost_at < ?`,
        cohortParams,
        'pipeline.lost'
      )
    ]);

    return {
      funnelLead,
      funnelMeeting,
      funnelMinutes,
      funnelProposal,
      funnelElSigned,
      funnelHandoverApproved,
      funnelWon: funnelElSigned,
      funnelLost
    };
  };

  const currentFunnel = await countPipelineFunnel(period.startSql, period.endSqlExclusive);
  const previousFunnel = await countPipelineFunnel(comparison.startSql, comparison.endSqlExclusive);

  const {
    funnelLead,
    funnelMeeting,
    funnelMinutes,
    funnelProposal,
    funnelElSigned,
    funnelHandoverApproved,
    funnelWon,
    funnelLost
  } = currentFunnel;

  const funnel = [
    { stage: 'Lead', key: 'lead', count: funnelLead },
    { stage: 'Meeting', key: 'meeting', count: funnelMeeting },
    { stage: 'Minutes Completed', key: 'minutes', count: funnelMinutes },
    { stage: 'Proposal', key: 'proposal', count: funnelProposal },
    { stage: 'Engagement Letter Signed', key: 'el_signed', count: funnelElSigned },
    { stage: 'Handover Approved', key: 'handover', count: funnelHandoverApproved },
    { stage: 'Won', key: 'won', count: funnelWon }
  ];

  const stageTransitions = [
    { key: 'lead_to_meeting', label: 'Lead → Meeting', from: funnelLead, to: funnelMeeting },
    { key: 'meeting_to_minutes', label: 'Meeting → Minutes Completed', from: funnelMeeting, to: funnelMinutes },
    { key: 'minutes_to_proposal', label: 'Minutes Completed → Proposal', from: funnelMinutes, to: funnelProposal },
    { key: 'proposal_to_el_signed', label: 'Proposal → EL Signed', from: funnelProposal, to: funnelElSigned },
    { key: 'el_signed_to_handover', label: 'EL Signed → Handover Approved', from: funnelElSigned, to: funnelHandoverApproved }
  ].map((t) => ({
    key: t.key,
    label: t.label,
    from_count: t.from,
    to_count: t.to,
    rate: conversionRate(t.from, t.to),
    stuck_count: Math.max(t.from - t.to, 0)
  }));

  const eligibleTransitions = stageTransitions.filter((t) => t.from_count > 0);
  const pipelineBottleneck =
    eligibleTransitions.length > 0
      ? eligibleTransitions.reduce((min, t) => (t.rate < min.rate ? t : min), eligibleTransitions[0])
      : null;

  const totalConversion = conversionRate(funnelLead, funnelWon);
  const winRateDenom = funnelWon + funnelLost;
  const winRate = winRateDenom > 0 ? conversionRate(winRateDenom, funnelWon) : 0;

  const largestStage = funnel.reduce((best, s) => (s.count > best.count ? s : best), funnel[0]);
  let biggestDrop = null;
  for (let i = 1; i < funnel.length; i += 1) {
    const prev = funnel[i - 1];
    const curr = funnel[i];
    if (prev.count <= 0) continue;
    const rate = conversionRate(prev.count, curr.count);
    const drop = 100 - rate;
    if (!biggestDrop || drop > biggestDrop.drop) {
      biggestDrop = {
        from_stage: prev.stage,
        to_stage: curr.stage,
        drop,
        rate
      };
    }
  }

  const conversions = {
    lead_to_meeting: conversionRate(funnelLead, funnelMeeting),
    meeting_to_minutes: conversionRate(funnelMeeting, funnelMinutes),
    minutes_to_proposal: conversionRate(funnelMinutes, funnelProposal),
    lead_to_proposal: conversionRate(funnelLead, funnelProposal),
    proposal_to_el_signed: conversionRate(funnelProposal, funnelElSigned),
    el_signed_to_handover_approved: conversionRate(funnelElSigned, funnelHandoverApproved),
    lead_to_won: totalConversion
  };

  const pipelineKpis = {
    total_lead: pipelineKpiMetric(funnelLead, previousFunnel.funnelLead),
    meeting: pipelineKpiMetric(funnelMeeting, previousFunnel.funnelMeeting),
    minutes_completed: pipelineKpiMetric(funnelMinutes, previousFunnel.funnelMinutes),
    proposal: pipelineKpiMetric(funnelProposal, previousFunnel.funnelProposal),
    el_signed: pipelineKpiMetric(funnelElSigned, previousFunnel.funnelElSigned),
    handover_approved: pipelineKpiMetric(funnelHandoverApproved, previousFunnel.funnelHandoverApproved),
    lost: pipelineKpiMetric(funnelLost, previousFunnel.funnelLost)
  };

  const svcFilter = buildServiceFilter(serviceId, 'svc');
  const deptFilter = buildDepartmentFilter(departmentId, 'dept');
  const ownerFilter = buildProcessedByFilter(userId);
  const trendLeadParams = [...svcFilter.params, ...deptFilter.params, ...ownerFilter.params];
  const trendScopeSql = `${svcFilter.sql}${deptFilter.sql}${ownerFilter.sql}`;

  const wonLostTrend = await Promise.all(
    trendBuckets.map(async (bucket) => {
      const won = await countInRange(
        conn,
        `SELECT COUNT(*) AS cnt FROM leads l
          LEFT JOIN proposals p ON p.lead_id = l.lead_id
          LEFT JOIN services svc ON svc.service_id = p.service_id
          LEFT JOIN departments dept ON dept.id = svc.department_id
         WHERE ${TRACKED_LEAD_WHERE}
           ${trendScopeSql}
           AND l.lead_status = 'WON'
           AND l.updated_at >= ? AND l.updated_at < ?`,
        [...trendLeadParams, bucket.startSql, bucket.endSqlExclusive]
      );
      const lost = await countInRange(
        conn,
        `SELECT COUNT(*) AS cnt FROM leads l
          LEFT JOIN proposals p ON p.lead_id = l.lead_id
          LEFT JOIN services svc ON svc.service_id = p.service_id
          LEFT JOIN departments dept ON dept.id = svc.department_id
         WHERE ${TRACKED_LEAD_WHERE}
           ${trendScopeSql}
           AND l.lead_status = 'LOST'
           AND l.lost_at >= ? AND l.lost_at < ?`,
        [...trendLeadParams, bucket.startSql, bucket.endSqlExclusive]
      );
      return { month: bucket.key, label: bucket.label, won, lost };
    })
  );

  const proposalTrendFixed = await fetchMonthlyTrend(conn, {
    buckets: trendBuckets,
    sqlTemplate: `SELECT COUNT(*) AS cnt
      FROM proposals pr
      INNER JOIN leads l ON l.lead_id = pr.lead_id
      INNER JOIN services svc ON svc.service_id = pr.service_id
      INNER JOIN departments dept ON dept.id = svc.department_id
     WHERE ${TRACKED_LEAD_WHERE}
       ${trendScopeSql}
       AND pr.created_at >= ? AND pr.created_at < ?`,
    baseParams: trendLeadParams
  });

  const elSignedTrend = await fetchMonthlyTrend(conn, {
    buckets: trendBuckets,
    sqlTemplate: `SELECT COUNT(*) AS cnt
      FROM engagement_letters e
      INNER JOIN leads l ON l.lead_id = e.lead_id
      INNER JOIN proposals pr ON pr.proposal_id = e.proposal_id
      INNER JOIN services svc ON svc.service_id = pr.service_id
      INNER JOIN departments dept ON dept.id = svc.department_id
     WHERE e.engagement_status = 'SIGNED'
       AND ${TRACKED_LEAD_WHERE}
       ${trendScopeSql}
       AND e.signed_at >= ? AND e.signed_at < ?`,
    baseParams: trendLeadParams
  });

  const handoverApprovedTrend = await fetchMonthlyTrend(conn, {
    buckets: trendBuckets,
    sqlTemplate: `SELECT COUNT(*) AS cnt
      FROM handovers h
      INNER JOIN leads l ON l.lead_id = h.lead_id
      INNER JOIN services svc ON svc.service_id = h.service_id
      INNER JOIN departments dept ON dept.id = h.department_id
     WHERE h.status IN ('APPROVED', 'ROUTED_TO_COO', 'ASSIGNED_TO_PM')
       AND ${TRACKED_LEAD_WHERE}
       ${trendScopeSql}
       AND h.approved_at >= ? AND h.approved_at < ?`,
    baseParams: trendLeadParams
  });

  const documentTrend = proposalTrendFixed.map((p, index) => ({
    month: p.month,
    label: p.label,
    proposals: Number(p.value),
    el_signed: Number(elSignedTrend[index]?.value ?? 0),
    handover_approved: Number(handoverApprovedTrend[index]?.value ?? 0)
  }));

  const bottleneckNarrative = pipelineBottleneck
    ? pipelineBottleneck.key === 'el_signed_to_handover'
      ? 'Risiko: deal komersial sudah menang (EL Signed), tetapi pergerakan operasional handover belum secepat tahap sebelumnya.'
      : `Risiko: ${pipelineBottleneck.stuck_count} lead tertahan pada transisi ini.`
    : null;

  return {
    kpi_cards: pipelineKpis,
    funnel,
    funnel_insights: {
      largest_stage: { stage: largestStage.stage, count: largestStage.count },
      biggest_drop: biggestDrop
    },
    stage_transitions: stageTransitions,
    bottleneck: pipelineBottleneck
      ? {
          label: pipelineBottleneck.label,
          rate: pipelineBottleneck.rate,
          from_count: pipelineBottleneck.from_count,
          to_count: pipelineBottleneck.to_count,
          stuck_count: pipelineBottleneck.stuck_count,
          narrative: bottleneckNarrative
        }
      : null,
    total_conversion: totalConversion,
    commercial_outcome: {
      won: funnelWon,
      lost: funnelLost,
      win_rate: winRate,
      win_rate_label: 'Won / (Won + Lost)'
    },
    conversions,
    document_trend: documentTrend,
    won_lost_trend: wonLostTrend,
    proposal_trend: proposalTrendFixed,
    el_signed_trend: elSignedTrend,
    handover_approved_trend: handoverApprovedTrend
  };
};

module.exports = {
  TRACKED_LEAD_WHERE,
  parseOptionalInt,
  buildServiceFilter,
  buildDepartmentFilter,
  buildProcessedByFilter,
  buildPipelineAnalytics,
  countInRange,
  fetchMonthlyTrend
};
