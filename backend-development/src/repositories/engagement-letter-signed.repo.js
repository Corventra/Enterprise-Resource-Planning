const { pool } = require('../config/db');
const { LEAD_ACTIVITY_TYPES } = require('../constants/lead-activity-types');
const { computeInvoiceTermTax } = require('../utils/invoice-term-tax');
const { formatSqlDate } = require('../utils/sql-date');
const { generateHandoverCode } = require('../utils/handover-code');
const {
  buildDefaultHandoverChecklist,
  recomputeDerivedHandoverChecklist
} = require('../utils/handover-checklist');
const {
  buildEngagementWorkspaceItem,
  engagementBaseSelect,
  normalizeEngagementId,
  normalizeLeadId
} = require('./lead-workspace-engagements.repo');
const {
  INVOICE_ACTIVITY_TYPES,
  insertInvoiceActivityLog
} = require('../utils/invoice-activity-log');
const { ensureReadyToIssueDueDates } = require('../utils/invoice-term-lifecycle');

const LEAD_WORKSPACE_ELIGIBLE_SNIPPET = `
  l.lead_status IN ('ACTIVE', 'WON', 'LOST')
  AND (
    (l.source_type = 'FORM_LEAD_CAPTURE' AND l.bank_data_status = 'PROCESSED')
    OR l.source_type = 'MANUAL'
  )
`;

const MONTH_NAMES_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const insertActivityLog = async (conn, { leadId, activityType, title, description, createdBy }) => {
  await conn.execute(
    `INSERT INTO lead_activity_logs (lead_id, activity_type, title, description, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [leadId, activityType, title, description, createdBy]
  );
};

const formatDateYmd = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseYmd = (ymd) => {
  const [y, m, d] = String(ymd).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};

const lastDayOfMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0);

const enumerateContractMonths = (startYmd, endYmd) => {
  const start = parseYmd(startYmd);
  const end = parseYmd(endYmd);
  const months = [];
  let y = start.getFullYear();
  let m = start.getMonth();
  const endY = end.getFullYear();
  const endM = end.getMonth();
  while (y < endY || (y === endY && m <= endM)) {
    months.push({ year: y, month: m });
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
  return months;
};

const splitPercentagesEvenly = (count) => {
  if (count <= 0) return [];
  const base = Math.floor((10000 / count)) / 100;
  const parts = Array(count).fill(base);
  const sum = parts.reduce((a, b) => a + b, 0);
  parts[parts.length - 1] = Math.round((parts[parts.length - 1] + (100 - sum)) * 100) / 100;
  return parts;
};

const mapTerminBillingTrigger = (termType) => {
  if (termType === 'DOWN_PAYMENT') return 'IMMEDIATE';
  if (termType === 'INSTALLMENT') return 'SCHEDULE_DATE';
  return 'PROJECT_COMPLETION';
};

const mapTerminInitialStatus = (termType) => {
  if (termType === 'DOWN_PAYMENT') return 'READY_TO_ISSUE';
  return 'DRAFT';
};

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * DATE-only from EL termin / mysql2 Date — never String(date).slice(0,10) (yields "Wed May 15" → 0000-00-00).
 */
const normalizeBillingScheduleDate = (v) => {
  const formatted = formatSqlDate(v);
  if (!formatted || !DATE_ONLY_RE.test(formatted)) return null;
  const [y, m, d] = formatted.split('-').map(Number);
  const probe = new Date(y, m - 1, d);
  if (probe.getFullYear() !== y || probe.getMonth() !== m - 1 || probe.getDate() !== d) {
    return null;
  }
  return formatted;
};

const requireBillingScheduleDate = (v, label) => {
  const normalized = normalizeBillingScheduleDate(v);
  if (!normalized) {
    const preview = v instanceof Date ? v.toISOString() : String(v ?? '');
    throw new Error(`billing_schedule_date tidak valid untuk ${label} (nilai: ${preview})`);
  }
  return normalized;
};

const pickRetainerReadyTermOrder = (months, billingTiming) => {
  const now = new Date();
  const currentY = now.getFullYear();
  const currentM = now.getMonth();

  let readyIdx = months.findIndex((mo) => mo.year === currentY && mo.month === currentM);
  if (readyIdx >= 0) return readyIdx + 1;

  for (let i = 0; i < months.length; i += 1) {
    const mo = months[i];
    if (mo.year > currentY || (mo.year === currentY && mo.month > currentM)) {
      return i + 1;
    }
  }

  return months.length;
};

const buildInvoiceTermsFromTermins = ({ termins, agreedFee, issuerCompany, engagementId, departmentCode }) => {
  const fee = Number(agreedFee);
  return termins.map((t, idx) => {
    const pct = Number(t.percentage);
    const dpp = Math.round((fee * pct) / 100);
    const tax = computeInvoiceTermTax(dpp, issuerCompany);
    return {
      engagement_id: engagementId,
      term_name: t.term_name,
      term_type: t.term_type,
      term_order: t.sort_order ?? idx + 1,
      percentage: pct,
      billing_trigger_type: mapTerminBillingTrigger(t.term_type),
      billing_schedule_date: requireBillingScheduleDate(
        t.billing_schedule_date,
        `EL termin ${t.term_name} (${t.term_type})`
      ),
      department_code: departmentCode,
      status: mapTerminInitialStatus(t.term_type),
      ...tax
    };
  });
};

const buildInvoiceTermsFromRetainer = ({
  retainer,
  agreedFee,
  issuerCompany,
  engagementId,
  departmentCode
}) => {
  const months = enumerateContractMonths(retainer.contract_start_date, retainer.contract_end_date);
  if (months.length === 0) {
    return { ok: false, reason: 'RETAINER_PERIOD_INVALID' };
  }

  const percentages = splitPercentagesEvenly(months.length);
  const readyOrder = pickRetainerReadyTermOrder(months, retainer.billing_timing);
  const fee = Number(agreedFee);

  const terms = months.map((mo, idx) => {
    const pct = percentages[idx];
    const dpp = Math.round((fee * pct) / 100);
    const tax = computeInvoiceTermTax(dpp, issuerCompany);
    const termOrder = idx + 1;
    const monthLabel = MONTH_NAMES_EN[mo.month];
    const termName = `Retainer ${monthLabel} ${mo.year}`;

    let billingScheduleDate;
    let billingTriggerType;
    if (retainer.billing_timing === 'BEGINNING_OF_MONTH') {
      billingTriggerType = 'PERIOD_START';
      billingScheduleDate = formatDateYmd(new Date(mo.year, mo.month, 1));
    } else {
      billingTriggerType = 'PERIOD_END';
      billingScheduleDate = formatDateYmd(lastDayOfMonth(mo.year, mo.month));
    }

    return {
      engagement_id: engagementId,
      term_name: termName,
      term_type: 'RETAINER',
      term_order: termOrder,
      percentage: pct,
      billing_trigger_type: billingTriggerType,
      billing_schedule_date: billingScheduleDate,
      department_code: departmentCode,
      status: termOrder === readyOrder ? 'READY_TO_ISSUE' : 'DRAFT',
      ...tax
    };
  });

  return { ok: true, terms };
};

const insertHandoverChecklist = async (conn, handoverId, paymentMethod) => {
  const items = buildDefaultHandoverChecklist(paymentMethod);
  for (const item of items) {
    await conn.execute(
      `INSERT INTO handover_checklist (
          handover_id,
          item_code,
          item_name,
          item_group,
          status,
          sort_order,
          is_required_for_submit,
          is_required_for_start
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        handoverId,
        item.item_code,
        item.item_name,
        item.item_group,
        item.status,
        item.sort_order,
        item.is_required_for_submit,
        item.is_required_for_start
      ]
    );
  }
};

const insertInvoiceTerms = async (conn, accountId, terms) => {
  for (const t of terms) {
    const billingScheduleDate = requireBillingScheduleDate(
      t.billing_schedule_date,
      `invoice term "${t.term_name}" (order ${t.term_order})`
    );

    await conn.execute(
      `INSERT INTO invoice_terms (
          account_id, engagement_id, project_id,
          term_name, term_type, term_order, percentage,
          billing_trigger_type, billing_schedule_date,
          trigger_reference_value, trigger_confirmed_by, trigger_confirmed_at,
          invoice_number, invoice_sequence_no, department_code,
          issue_date, sent_to_client_at, due_date,
          dpp_amount, ppn_rate, ppn_amount, pph23_rate, pph23_amount,
          gross_amount, net_amount, sent_by, status
        ) VALUES (
          ?, ?, NULL,
          ?, ?, ?, ?,
          ?, ?,
          NULL, NULL, NULL,
          NULL, NULL, ?,
          NULL, NULL, NULL,
          ?, ?, ?, ?, ?,
          ?, ?, NULL, ?
        )`,
      [
        accountId,
        t.engagement_id,
        t.term_name,
        t.term_type,
        t.term_order,
        t.percentage,
        t.billing_trigger_type,
        billingScheduleDate,
        t.department_code,
        t.dpp_amount,
        t.ppn_rate,
        t.ppn_amount,
        t.pph23_rate,
        t.pph23_amount,
        t.gross_amount,
        t.net_amount,
        t.status
      ]
    );
  }
};

const markEngagementLetterSigned = async (leadIdRaw, engagementIdRaw, userId) => {
  const leadId = normalizeLeadId(leadIdRaw);
  const engagementId = normalizeEngagementId(engagementIdRaw);
  if (leadId == null || engagementId == null) return { ok: false, reason: 'INVALID_ID' };

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [leadRows] = await conn.execute(
      `SELECT l.lead_id
         FROM leads l
        WHERE l.lead_id = ?
          AND ${LEAD_WORKSPACE_ELIGIBLE_SNIPPET.replace(/\n/g, ' ')}`,
      [leadId]
    );
    if (!leadRows[0]) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }

    const [elRows] = await conn.execute(
      `SELECT
          e.engagement_id,
          e.lead_id,
          e.proposal_id,
          e.issuer_company,
          e.agreed_fee,
          e.payment_method,
          e.engagement_status,
          p.service_id,
          s.code AS service_code,
          s.name AS service_name,
          s.department_id,
          d.code AS department_code
         FROM engagement_letters e
         INNER JOIN proposals p ON p.proposal_id = e.proposal_id
         INNER JOIN services s ON s.service_id = p.service_id
         INNER JOIN departments d ON d.id = s.department_id
        WHERE e.engagement_id = ?
          AND e.lead_id = ?
        FOR UPDATE`,
      [engagementId, leadId]
    );
    const el = elRows[0];
    if (!el) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }
    if (el.engagement_status === 'SIGNED') {
      await conn.rollback();
      return { ok: false, reason: 'ALREADY_SIGNED' };
    }
    if (el.engagement_status !== 'SENT') {
      await conn.rollback();
      return { ok: false, reason: 'NOT_SENT' };
    }

    const [existingHandover] = await conn.execute(
      `SELECT handover_id FROM handovers WHERE engagement_id = ? LIMIT 1`,
      [engagementId]
    );
    if (existingHandover[0]) {
      await conn.rollback();
      return { ok: false, reason: 'ALREADY_PROVISIONED' };
    }

    const [existingAccount] = await conn.execute(
      `SELECT account_id FROM invoice_accounts WHERE engagement_id = ? LIMIT 1`,
      [engagementId]
    );
    if (existingAccount[0]) {
      await conn.rollback();
      return { ok: false, reason: 'ALREADY_PROVISIONED' };
    }

    const [elUpdate] = await conn.execute(
      `UPDATE engagement_letters
          SET engagement_status = 'SIGNED',
              signed_at = NOW()
        WHERE engagement_id = ?
          AND lead_id = ?
          AND engagement_status = 'SENT'`,
      [engagementId, leadId]
    );
    if (elUpdate.affectedRows !== 1) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_SENT' };
    }

    await conn.execute(
      `UPDATE leads
          SET current_stage = 'ENGAGEMENT_LETTER',
              stage_progress = 'SIGNED',
              lead_status = 'WON',
              next_action = 'Siapkan handover',
              due_date = NULL
        WHERE lead_id = ?`,
      [leadId]
    );

    const dpPaymentStatus = el.payment_method === 'TERMIN' ? 'UNPAID' : null;
    const handoverCode = await generateHandoverCode(conn, el.service_code, el.service_name);

    const [handoverInsert] = await conn.execute(
      `INSERT INTO handovers (
          lead_id, proposal_id, engagement_id, service_id, department_id,
          handover_code, project_title, company_group,
          project_start_date, project_end_date,
          background_summary, risk_internal_note,
          status, ceo_revision_note, coo_revision_note, routed_coo_id,
          submitted_by, submitted_at, approved_by, approved_at,
          dp_payment_status, dp_paid_at, created_by
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, NULL, NULL,
          NULL, NULL,
          NULL, NULL,
          'DRAFT', NULL, NULL, NULL,
          NULL, NULL, NULL, NULL,
          ?, NULL, ?
        )`,
      [
        leadId,
        el.proposal_id,
        engagementId,
        el.service_id,
        el.department_id,
        handoverCode,
        dpPaymentStatus,
        userId
      ]
    );
    const handoverId = handoverInsert.insertId;
    await insertHandoverChecklist(conn, handoverId, el.payment_method);
    await recomputeDerivedHandoverChecklist(conn, handoverId);

    await conn.execute(
      `INSERT INTO handover_activity_logs (handover_id, activity_type, title, description, created_by)
       VALUES (?, 'HANDOVER_DRAFT_CREATED', ?, ?, ?)`,
      [
        handoverId,
        'Draft handover dibuat',
        `Draft handover ${handoverCode} dibuat otomatis setelah engagement letter ditandatangani.`,
        userId
      ]
    );

    let invoiceTerms = [];
    if (el.payment_method === 'TERMIN') {
      const [terminRows] = await conn.execute(
        `SELECT term_name, term_type, percentage, billing_schedule_date, sort_order
           FROM engagement_letter_termins
          WHERE engagement_id = ?
          ORDER BY sort_order ASC, termin_id ASC`,
        [engagementId]
      );
      if (terminRows.length < 2) {
        await conn.rollback();
        return { ok: false, reason: 'TERMIN_DATA_INVALID' };
      }
      const missingSchedule = terminRows.some((r) => normalizeBillingScheduleDate(r.billing_schedule_date) == null);
      if (missingSchedule) {
        await conn.rollback();
        return { ok: false, reason: 'TERMIN_BILLING_SCHEDULE_REQUIRED' };
      }
      invoiceTerms = buildInvoiceTermsFromTermins({
        termins: terminRows,
        agreedFee: el.agreed_fee,
        issuerCompany: el.issuer_company,
        engagementId,
        departmentCode: el.department_code
      });
    } else {
      const [retainerRows] = await conn.execute(
        `SELECT contract_start_date, contract_end_date, billing_timing
           FROM engagement_letter_retainers
          WHERE engagement_id = ?
          LIMIT 1`,
        [engagementId]
      );
      const retainer = retainerRows[0];
      if (!retainer) {
        await conn.rollback();
        return { ok: false, reason: 'RETAINER_DATA_INVALID' };
      }
      const built = buildInvoiceTermsFromRetainer({
        retainer: {
          contract_start_date: String(retainer.contract_start_date).slice(0, 10),
          contract_end_date: String(retainer.contract_end_date).slice(0, 10),
          billing_timing: retainer.billing_timing
        },
        agreedFee: el.agreed_fee,
        issuerCompany: el.issuer_company,
        engagementId,
        departmentCode: el.department_code
      });
      if (!built.ok) {
        await conn.rollback();
        return built;
      }
      invoiceTerms = built.terms;
    }

    const totalBillNet = invoiceTerms.reduce((sum, t) => sum + Number(t.net_amount), 0);
    const termCount = invoiceTerms.length;
    const progressSummary = `0/${termCount} Paid`;

    const [accountInsert] = await conn.execute(
      `INSERT INTO invoice_accounts (
          lead_id, proposal_id, engagement_id, service_id,
          issuer_company, payment_method, contract_value_dpp,
          total_bill_net, total_paid_net, total_outstanding_net,
          next_due_date, status, progress_summary
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, NULL, 'READY_TO_BILL', ?)`,
      [
        leadId,
        el.proposal_id,
        engagementId,
        el.service_id,
        el.issuer_company,
        el.payment_method,
        el.agreed_fee,
        totalBillNet,
        totalBillNet,
        progressSummary
      ]
    );
    const accountId = accountInsert.insertId;
    await insertInvoiceTerms(conn, accountId, invoiceTerms);
    await ensureReadyToIssueDueDates(conn, accountId);

    await insertInvoiceActivityLog(conn, {
      accountId,
      invoiceId: null,
      activityType: INVOICE_ACTIVITY_TYPES.INVOICE_ACCOUNT_CREATED,
      title: 'Akun invoice dibuat',
      description: 'Akun invoice dibuat otomatis setelah engagement letter ditandatangani.',
      createdBy: userId
    });

    const termCountLabel = termCount === 1 ? '1 termin invoice' : `${termCount} termin invoice`;
    await insertInvoiceActivityLog(conn, {
      accountId,
      invoiceId: null,
      activityType: INVOICE_ACTIVITY_TYPES.INVOICE_TERMS_CREATED,
      title: 'Termin invoice dibuat',
      description: `${termCountLabel} berhasil dibuat otomatis dari engagement letter.`,
      createdBy: userId
    });

    await insertActivityLog(conn, {
      leadId,
      activityType: LEAD_ACTIVITY_TYPES.ENGAGEMENT_LETTER_SIGNED,
      title: 'Engagement letter ditandatangani',
      description:
        'Engagement letter ditandai signed. Sistem membuat draft handover, checklist default, dan akun invoice beserta termin penagihan.',
      createdBy: userId
    });

    await conn.commit();

    const [rows] = await conn.execute(`${engagementBaseSelect} WHERE e.engagement_id = ? LIMIT 1`, [engagementId]);
    const item = await buildEngagementWorkspaceItem(conn, rows[0]);
    return {
      ok: true,
      item,
      provisioning: {
        handover_id: handoverId,
        handover_code: handoverCode,
        account_id: accountId,
        invoice_term_count: termCount
      }
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

module.exports = { markEngagementLetterSigned };
