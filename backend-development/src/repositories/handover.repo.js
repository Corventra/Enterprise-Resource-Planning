const { pool } = require('../config/db');
const { formatSqlDate } = require('../utils/sql-date');

const normalizeHandoverId = (handoverId) => {
  const n = Number(handoverId);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
};

const formatDateTimeIso = (v) => {
  if (v == null) return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString();
  }
  const s = String(v);
  return s.includes('T') ? s : `${s.replace(' ', 'T')}Z`;
};

const formatPeriodLabel = (start, end) => {
  const s = formatSqlDate(start);
  const e = formatSqlDate(end);
  if (!s && !e) return null;
  if (s && e) return `${s} – ${e}`;
  return s || e;
};

const mapListRow = (row) => ({
  handover_id: row.handover_id,
  handover_code: row.handover_code,
  company_name: row.company_name ?? null,
  project_title: row.project_title ?? null,
  service_name: row.service_name ?? null,
  project_start_date: formatSqlDate(row.project_start_date),
  project_end_date: formatSqlDate(row.project_end_date),
  engagement_status: row.engagement_status ?? null,
  engagement_signed_at: formatDateTimeIso(row.engagement_signed_at),
  handover_status: row.handover_status,
  created_by_name: row.created_by_name ?? null,
  created_at: formatDateTimeIso(row.created_at)
});

const findHandoverList = async (access = {}) => {
  const params = [];
  let departmentFilterSql = '';

  if (access.restrictToDepartmentIds != null) {
    const departmentIds = access.restrictToDepartmentIds;
    if (departmentIds.length === 0) {
      return [];
    }
    departmentFilterSql = ` WHERE h.department_id IN (${departmentIds.map(() => '?').join(', ')})`;
    params.push(...departmentIds);
  }

  const [rows] = await pool.execute(
    `SELECT
        h.handover_id,
        h.handover_code,
        h.project_title,
        h.project_start_date,
        h.project_end_date,
        h.status AS handover_status,
        h.created_at,
        l.company_name,
        s.name AS service_name,
        uc.name AS created_by_name,
        e.engagement_status,
        e.signed_at AS engagement_signed_at
      FROM handovers h
      INNER JOIN leads l ON l.lead_id = h.lead_id
      INNER JOIN services s ON s.service_id = h.service_id
      INNER JOIN users uc ON uc.id = h.created_by
      INNER JOIN engagement_letters e ON e.engagement_id = h.engagement_id
      ${departmentFilterSql}
     ORDER BY h.created_at DESC, h.handover_id DESC`,
    params
  );
  return rows.map(mapListRow);
};

const findHandoverDepartmentId = async (handoverId) => {
  const [rows] = await pool.execute(
    `SELECT department_id FROM handovers WHERE handover_id = ? LIMIT 1`,
    [handoverId]
  );
  if (!rows[0]) return null;
  return rows[0].department_id ?? null;
};

const findHandoverCore = async (conn, handoverId) => {
  const db = conn ?? pool;
  const [rows] = await db.execute(
    `SELECT
        h.handover_id,
        h.handover_code,
        h.status,
        h.project_title,
        h.company_group,
        h.project_start_date,
        h.project_end_date,
        h.background_summary,
        h.risk_internal_note,
        h.ceo_revision_note,
        h.lead_id,
        h.proposal_id,
        h.engagement_id,
        h.service_id,
        h.created_at,
        h.updated_at,
        l.company_name,
        l.processed_by,
        l.pic_name,
        l.email,
        l.phone_number,
        uc.name AS created_by_name,
        s.name AS service_name,
        e.engagement_status,
        e.signed_at AS engagement_signed_at,
        e.agreed_fee,
        e.payment_method,
        e.issuer_company,
        e.engagement_code,
        p.proposal_code
      FROM handovers h
      INNER JOIN leads l ON l.lead_id = h.lead_id
      INNER JOIN services s ON s.service_id = h.service_id
      INNER JOIN users uc ON uc.id = h.created_by
      INNER JOIN engagement_letters e ON e.engagement_id = h.engagement_id
      INNER JOIN proposals p ON p.proposal_id = h.proposal_id
     WHERE h.handover_id = ?
     LIMIT 1`,
    [handoverId]
  );
  return rows[0] ?? null;
};

const findHandoverScopeItems = async (conn, handoverId) => {
  const db = conn ?? pool;
  const [rows] = await db.execute(
    `SELECT scope_id, item_type, item_text, sort_order
       FROM handover_scope_items
      WHERE handover_id = ?
      ORDER BY sort_order ASC, scope_id ASC`,
    [handoverId]
  );
  return rows;
};

const findHandoverMilestones = async (conn, handoverId) => {
  const db = conn ?? pool;
  const [rows] = await db.execute(
    `SELECT milestone_id, milestone_name, target_date, notes, sort_order
       FROM handover_milestones
      WHERE handover_id = ?
      ORDER BY sort_order ASC, milestone_id ASC`,
    [handoverId]
  );
  return rows.map((r) => ({
    milestone_id: r.milestone_id,
    milestone_name: r.milestone_name,
    target_date: formatSqlDate(r.target_date),
    notes: r.notes ?? null,
    sort_order: r.sort_order
  }));
};

const findHandoverOutstandingRequirements = async (conn, handoverId) => {
  const db = conn ?? pool;
  const [rows] = await db.execute(
    `SELECT outstanding_id, requirement_text, sort_order
       FROM outstanding_requirements
      WHERE handover_id = ?
      ORDER BY sort_order ASC, outstanding_id ASC`,
    [handoverId]
  );
  return rows;
};

const findHandoverRisks = async (conn, handoverId) => {
  const db = conn ?? pool;
  const [rows] = await db.execute(
    `SELECT risk_id, risk_text, sort_order
       FROM handover_risks
      WHERE handover_id = ?
      ORDER BY sort_order ASC, risk_id ASC`,
    [handoverId]
  );
  return rows;
};

const findHandoverInternalProtocols = async (conn, handoverId) => {
  const db = conn ?? pool;
  const [rows] = await db.execute(
    `SELECT internal_id, instruction_text, sort_order
       FROM handover_internal_protocols
      WHERE handover_id = ?
      ORDER BY sort_order ASC, internal_id ASC`,
    [handoverId]
  );
  return rows;
};

const findHandoverExternalProtocols = async (conn, handoverId) => {
  const db = conn ?? pool;
  const [rows] = await db.execute(
    `SELECT external_id, role_label, contact_name, contact_text, instruction, sort_order
       FROM handover_external_protocols
      WHERE handover_id = ?
      ORDER BY sort_order ASC, external_id ASC`,
    [handoverId]
  );
  return rows;
};

const findHandoverTeamRequirements = async (conn, handoverId) => {
  const db = conn ?? pool;
  const [rows] = await db.execute(
    `SELECT requirement_id, role_name, needed, responsibilities, notes, sort_order
       FROM handover_team_requirements
      WHERE handover_id = ?
      ORDER BY sort_order ASC, requirement_id ASC`,
    [handoverId]
  );
  return rows;
};

const findHandoverChecklist = async (conn, handoverId) => {
  const db = conn ?? pool;
  const [rows] = await db.execute(
    `SELECT
        checklist_id,
        item_code,
        item_name,
        item_group,
        status,
        completed_at,
        sort_order
       FROM handover_checklist
      WHERE handover_id = ?
      ORDER BY sort_order ASC, checklist_id ASC`,
    [handoverId]
  );
  return rows.map((r) => ({
    checklist_id: r.checklist_id,
    item_code: r.item_code,
    item_name: r.item_name,
    item_group: r.item_group,
    status: r.status,
    completed_at: formatDateTimeIso(r.completed_at),
    sort_order: r.sort_order
  }));
};

const findHandoverActivityLogs = async (conn, handoverId) => {
  const db = conn ?? pool;
  const [rows] = await db.execute(
    `SELECT
        hal.handover_activity_id,
        hal.activity_type,
        hal.title,
        hal.description,
        hal.created_at,
        u.name AS created_by_name
       FROM handover_activity_logs hal
       LEFT JOIN users u ON u.id = hal.created_by
      WHERE hal.handover_id = ?
      ORDER BY hal.created_at DESC, hal.handover_activity_id DESC`,
    [handoverId]
  );
  return rows.map((r) => ({
    activity_id: r.handover_activity_id,
    activity_type: r.activity_type,
    title: r.title,
    description: r.description ?? null,
    created_by_name: r.created_by_name ?? null,
    created_at: formatDateTimeIso(r.created_at)
  }));
};

const findHandoverClientDocuments = async (conn, handoverId) => {
  const db = conn ?? pool;
  const [rows] = await db.execute(
    `SELECT
        document_id,
        document_name,
        file_path,
        mime_type,
        file_size_bytes,
        created_at
       FROM documents
      WHERE handover_id = ?
        AND document_category = 'HANDOVER'
        AND is_latest = 1
      ORDER BY created_at DESC, document_id DESC`,
    [handoverId]
  );
  return rows.map((r) => ({
    document_id: r.document_id,
    document_name: r.document_name,
    file_path: r.file_path,
    mime_type: r.mime_type ?? null,
    file_size_bytes: r.file_size_bytes != null ? Number(r.file_size_bytes) : null,
    created_at: formatDateTimeIso(r.created_at)
  }));
};

const findHandoverFeeStructure = async (conn, engagementId, paymentMethod, agreedFee) => {
  const db = conn ?? pool;
  const fee = Number(agreedFee);

  if (paymentMethod === 'TERMIN') {
    const [rows] = await db.execute(
      `SELECT term_name, term_type, percentage, description, sort_order
         FROM engagement_letter_termins
        WHERE engagement_id = ?
        ORDER BY sort_order ASC, termin_id ASC`,
      [engagementId]
    );
    return {
      payment_method: 'TERMIN',
      fee_items: rows.map((r) => {
        const pct = Number(r.percentage);
        const amount = Number.isFinite(fee) ? Math.round((fee * pct) / 100) : null;
        return {
          term_name: r.term_name,
          amount,
          description: r.description ?? null,
          term_type: r.term_type,
          percentage: pct
        };
      })
    };
  }

  const [retainerRows] = await db.execute(
    `SELECT contract_start_date, contract_end_date, billing_timing
       FROM engagement_letter_retainers
      WHERE engagement_id = ?
      LIMIT 1`,
    [engagementId]
  );
  const retainer = retainerRows[0];
  if (!retainer) {
    return { payment_method: 'RETAINER', fee_items: [] };
  }

  const start = formatSqlDate(retainer.contract_start_date);
  const end = formatSqlDate(retainer.contract_end_date);
  const timingLabel =
    retainer.billing_timing === 'BEGINNING_OF_MONTH' ? 'Awal bulan' : 'Akhir bulan';

  let monthCount = 0;
  if (start && end) {
    const s = new Date(start);
    const e = new Date(end);
    monthCount =
      (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
    if (monthCount < 1) monthCount = 1;
  }

  const monthlyAmount =
    Number.isFinite(fee) && monthCount > 0 ? Math.round(fee / monthCount) : null;

  return {
    payment_method: 'RETAINER',
    fee_items: [
      {
        term_name: 'Retainer fee (ringkasan kontrak)',
        amount: fee,
        description: `Periode kontrak ${start ?? '-'} s/d ${end ?? '-'} · ${monthCount} bulan · penagihan ${timingLabel}${
          monthlyAmount != null ? ` · estimasi per bulan Rp ${monthlyAmount.toLocaleString('id-ID')}` : ''
        }`,
        term_type: 'RETAINER',
        percentage: null
      }
    ],
    retainer_summary: {
      contract_start_date: start,
      contract_end_date: end,
      billing_timing: retainer.billing_timing,
      month_count: monthCount,
      monthly_amount_estimate: monthlyAmount
    }
  };
};

const buildHandoverDetailPayload = async (handoverId) => {
  const core = await findHandoverCore(null, handoverId);
  if (!core) return null;

  const [
    scopeRows,
    milestones,
    outstanding,
    risks,
    internalProtocols,
    externalProtocols,
    teamRequirements,
    checklist,
    activityLogs,
    clientDocuments,
    feeStructure
  ] = await Promise.all([
    findHandoverScopeItems(null, handoverId),
    findHandoverMilestones(null, handoverId),
    findHandoverOutstandingRequirements(null, handoverId),
    findHandoverRisks(null, handoverId),
    findHandoverInternalProtocols(null, handoverId),
    findHandoverExternalProtocols(null, handoverId),
    findHandoverTeamRequirements(null, handoverId),
    findHandoverChecklist(null, handoverId),
    findHandoverActivityLogs(null, handoverId),
    findHandoverClientDocuments(null, handoverId),
    findHandoverFeeStructure(null, core.engagement_id, core.payment_method, core.agreed_fee)
  ]);

  const scopeIncluded = scopeRows
    .filter((r) => r.item_type === 'INCLUDED')
    .map((r) => r.item_text);
  const scopeExcluded = scopeRows
    .filter((r) => r.item_type === 'EXCLUDED')
    .map((r) => r.item_text);
  const deliverables = scopeRows
    .filter((r) => r.item_type === 'DELIVERABLE')
    .map((r) => r.item_text);

  const clientContactParts = [core.email, core.phone_number].filter(Boolean);
  const clientContact = clientContactParts.length > 0 ? clientContactParts.join(' · ') : null;

  return {
    handover_id: core.handover_id,
    handover_code: core.handover_code,
    lead_id: core.lead_id,
    processed_by: core.processed_by ?? null,
    status: core.status,
    ceo_revision_note: core.ceo_revision_note ?? null,
    created_at: formatDateTimeIso(core.created_at),
    updated_at: formatDateTimeIso(core.updated_at),
    project_information: {
      project_title: core.project_title ?? null,
      client_name: core.company_name ?? null,
      company_group: core.company_group ?? null,
      service_line: core.service_name ?? null,
      project_start_date: formatSqlDate(core.project_start_date),
      project_end_date: formatSqlDate(core.project_end_date),
      project_period: formatPeriodLabel(core.project_start_date, core.project_end_date),
      pic_client_name: core.pic_name ?? null,
      client_contact: clientContact,
      engagement_status: core.engagement_status ?? null,
      engagement_signed_at: formatDateTimeIso(core.engagement_signed_at),
      proposal_reference:
        core.proposal_code && String(core.proposal_code).trim() !== ''
          ? String(core.proposal_code).trim()
          : core.proposal_id != null
            ? `Proposal #${core.proposal_id}`
            : null,
      engagement_reference:
        core.engagement_code && String(core.engagement_code).trim() !== ''
          ? String(core.engagement_code).trim()
          : core.engagement_id != null
            ? `EL #${core.engagement_id}`
            : null,
      created_by_name: core.created_by_name ?? null
    },
    background_summary: core.background_summary ?? null,
    scope: {
      scope_included: scopeIncluded,
      scope_excluded: scopeExcluded,
      deliverables,
      milestones
    },
    fee_structure: feeStructure,
    client_documents: clientDocuments,
    outstanding_requirements: outstanding.map((r) => ({
      outstanding_id: r.outstanding_id,
      requirement_text: r.requirement_text
    })),
    risks: {
      risk_items: risks.map((r) => r.risk_text),
      risk_internal_note: core.risk_internal_note ?? null
    },
    communication_protocol: {
      internal_items: internalProtocols.map((r) => r.instruction_text),
      external_items: externalProtocols.map((r) => ({
        role: r.role_label,
        name: r.contact_name,
        contact: r.contact_text,
        instruction: r.instruction ?? null
      }))
    },
    team_requirements: teamRequirements.map((r) => ({
      requirement_id: r.requirement_id,
      role_name: r.role_name,
      needed: r.needed,
      responsibilities: r.responsibilities,
      notes: r.notes ?? null
    })),
    checklist,
    activity_logs: activityLogs
  };
};

const findHandoverDetail = async (handoverIdRaw, access = {}) => {
  const handoverId = normalizeHandoverId(handoverIdRaw);
  if (handoverId == null) return { ok: false, reason: 'INVALID_ID' };

  if (access.restrictToDepartmentIds != null) {
    if (access.restrictToDepartmentIds.length === 0) {
      return { ok: false, reason: 'NOT_FOUND' };
    }
    const departmentId = await findHandoverDepartmentId(handoverId);
    if (departmentId == null) {
      return { ok: false, reason: 'NOT_FOUND' };
    }
    const allowed = access.restrictToDepartmentIds.some((id) => Number(id) === Number(departmentId));
    if (!allowed) {
      return { ok: false, reason: 'NOT_FOUND' };
    }
  }

  const data = await buildHandoverDetailPayload(handoverId);
  if (!data) return { ok: false, reason: 'NOT_FOUND' };
  return { ok: true, data };
};

module.exports = {
  normalizeHandoverId,
  buildHandoverDetailPayload,
  findHandoverList,
  findHandoverDepartmentId,
  findHandoverDetail,
  findHandoverScopeItems,
  findHandoverMilestones,
  findHandoverOutstandingRequirements,
  findHandoverRisks,
  findHandoverInternalProtocols,
  findHandoverExternalProtocols,
  findHandoverTeamRequirements,
  findHandoverChecklist,
  findHandoverActivityLogs,
  findHandoverClientDocuments,
  findHandoverFeeStructure
};
