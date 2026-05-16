const CHECKLIST_CLIENT_DOCS = 'CLIENT_DOCUMENTS_RECEIVED';
const CHECKLIST_DATA_REQUEST = 'DATA_REQUEST_PREPARED';
const CHECKLIST_DP_RECEIVED = 'DP_RECEIVED';

/** Final business rules for submit/start gates (by item_code only). */
const CHECKLIST_ITEM_FLAGS = {
  PROPOSAL_FINAL_STORED: { is_required_for_submit: 1, is_required_for_start: 0 },
  ENGAGEMENT_SIGNED: { is_required_for_submit: 1, is_required_for_start: 1 },
  DP_RECEIVED: { is_required_for_submit: 0, is_required_for_start: 1 },
  PROJECT_FOLDER_CREATED: { is_required_for_submit: 0, is_required_for_start: 1 },
  CLIENT_DOCUMENTS_RECEIVED: { is_required_for_submit: 0, is_required_for_start: 0 },
  DATA_REQUEST_PREPARED: { is_required_for_submit: 0, is_required_for_start: 0 }
};

const CHECKLIST_ITEM_CODES = Object.freeze(Object.keys(CHECKLIST_ITEM_FLAGS));

const getChecklistItemFlags = (itemCode) => {
  const flags = CHECKLIST_ITEM_FLAGS[itemCode];
  if (!flags) {
    return { is_required_for_submit: 0, is_required_for_start: 0 };
  }
  return { ...flags };
};

const withChecklistFlags = (item) => ({
  ...item,
  ...getChecklistItemFlags(item.item_code)
});

const buildDefaultHandoverChecklist = (paymentMethod) => {
  const items = [
    withChecklistFlags({
      item_code: 'PROPOSAL_FINAL_STORED',
      item_name: 'Proposal final tersimpan',
      item_group: 'DOCUMENT',
      status: 'YES',
      sort_order: 1
    }),
    withChecklistFlags({
      item_code: 'ENGAGEMENT_SIGNED',
      item_name: 'Engagement Letter ditandatangani',
      item_group: 'ENGAGEMENT',
      status: 'YES',
      sort_order: 2
    }),
    withChecklistFlags({
      item_code: 'PROJECT_FOLDER_CREATED',
      item_name: 'Folder project dibuat',
      item_group: 'PROJECT',
      status: 'YES',
      sort_order: 4
    }),
    withChecklistFlags({
      item_code: 'CLIENT_DOCUMENTS_RECEIVED',
      item_name: 'Dokumen klien diterima',
      item_group: 'DOCUMENT',
      status: 'NO',
      sort_order: 5
    }),
    withChecklistFlags({
      item_code: 'DATA_REQUEST_PREPARED',
      item_name: 'Data request disiapkan',
      item_group: 'DATA',
      status: 'NO',
      sort_order: 6
    })
  ];

  if (paymentMethod === 'TERMIN') {
    items.splice(
      2,
      0,
      withChecklistFlags({
        item_code: CHECKLIST_DP_RECEIVED,
        item_name: 'DP sudah diterima',
        item_group: 'PAYMENT',
        status: 'PENDING',
        sort_order: 3
      })
    );
  } else {
    items.splice(
      2,
      0,
      withChecklistFlags({
        item_code: CHECKLIST_DP_RECEIVED,
        item_name: 'DP sudah diterima',
        item_group: 'PAYMENT',
        status: 'NO',
        sort_order: 3
      })
    );
  }

  return items;
};

const DP_RECEIVED_ITEM = {
  item_code: CHECKLIST_DP_RECEIVED,
  item_name: 'DP sudah diterima',
  item_group: 'PAYMENT',
  sort_order: 3,
  ...getChecklistItemFlags(CHECKLIST_DP_RECEIVED)
};

const hasClientDocuments = async (conn, handoverId) => {
  const [rows] = await conn.execute(
    `SELECT 1
       FROM documents
      WHERE handover_id = ?
        AND document_category = 'HANDOVER'
      LIMIT 1`,
    [handoverId]
  );
  return rows.length > 0;
};

const hasOutstandingRequirements = async (conn, handoverId) => {
  const [rows] = await conn.execute(
    `SELECT 1
       FROM outstanding_requirements
      WHERE handover_id = ?
        AND TRIM(requirement_text) <> ''
      LIMIT 1`,
    [handoverId]
  );
  return rows.length > 0;
};

/**
 * Recompute CLIENT_DOCUMENTS_RECEIVED and DATA_REQUEST_PREPARED from persisted rows.
 */
const recomputeDerivedHandoverChecklist = async (conn, handoverId) => {
  const [hasDocs, hasOutstanding] = await Promise.all([
    hasClientDocuments(conn, handoverId),
    hasOutstandingRequirements(conn, handoverId)
  ]);

  const clientStatus = hasDocs ? 'YES' : 'NO';
  const dataStatus = hasOutstanding ? 'YES' : 'NO';

  await conn.execute(
    `UPDATE handover_checklist
        SET status = ?
      WHERE handover_id = ?
        AND item_code = ?`,
    [clientStatus, handoverId, CHECKLIST_CLIENT_DOCS]
  );

  await conn.execute(
    `UPDATE handover_checklist
        SET status = ?
      WHERE handover_id = ?
        AND item_code = ?`,
    [dataStatus, handoverId, CHECKLIST_DATA_REQUEST]
  );

  return { clientStatus, dataStatus };
};

/**
 * Mark DP_RECEIVED checklist YES when invoice DOWN_PAYMENT term is fully paid.
 */
const markDpReceivedChecklistPaid = async (conn, handoverId, userId) => {
  const completedBy =
    Number.isSafeInteger(Number(userId)) && Number(userId) > 0 ? Number(userId) : null;
  const { is_required_for_submit, is_required_for_start } = getChecklistItemFlags(CHECKLIST_DP_RECEIVED);

  const [update] = await conn.execute(
    `UPDATE handover_checklist
        SET status = 'YES',
            completed_at = NOW(),
            completed_by = ?
      WHERE handover_id = ?
        AND item_code = ?`,
    [completedBy, handoverId, CHECKLIST_DP_RECEIVED]
  );

  if (update.affectedRows === 0) {
    await conn.execute(
      `INSERT INTO handover_checklist (
          handover_id,
          item_code,
          item_name,
          item_group,
          status,
          sort_order,
          is_required_for_submit,
          is_required_for_start,
          completed_by,
          completed_at
        ) VALUES (?, ?, ?, ?, 'YES', ?, ?, ?, ?, NOW())`,
      [
        handoverId,
        DP_RECEIVED_ITEM.item_code,
        DP_RECEIVED_ITEM.item_name,
        DP_RECEIVED_ITEM.item_group,
        DP_RECEIVED_ITEM.sort_order,
        is_required_for_submit,
        is_required_for_start,
        completedBy
      ]
    );
  }
};

module.exports = {
  CHECKLIST_CLIENT_DOCS,
  CHECKLIST_DATA_REQUEST,
  CHECKLIST_DP_RECEIVED,
  CHECKLIST_ITEM_FLAGS,
  CHECKLIST_ITEM_CODES,
  getChecklistItemFlags,
  buildDefaultHandoverChecklist,
  recomputeDerivedHandoverChecklist,
  markDpReceivedChecklistPaid
};
