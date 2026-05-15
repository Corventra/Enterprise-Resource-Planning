const CHECKLIST_CLIENT_DOCS = 'CLIENT_DOCUMENTS_RECEIVED';
const CHECKLIST_DATA_REQUEST = 'DATA_REQUEST_PREPARED';

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
 *
 * - CLIENT_DOCUMENTS_RECEIVED = YES iff at least one HANDOVER document exists
 * - DATA_REQUEST_PREPARED = YES iff at least one non-empty outstanding_requirements row exists
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

module.exports = {
  CHECKLIST_CLIENT_DOCS,
  CHECKLIST_DATA_REQUEST,
  recomputeDerivedHandoverChecklist
};
