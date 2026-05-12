const { findLeadProcessedBy } = require('../repositories/lead-workspace.repo');

const LEAD_WORKSPACE_OPERATOR_FORBIDDEN_MESSAGE =
  'Hanya BD yang memproses lead ini yang dapat mengelola workspace.';

const getLeadWorkspaceOperator = async (leadId) => {
  const lookup = await findLeadProcessedBy(leadId);
  if (!lookup.ok) {
    return lookup;
  }
  return {
    ok: true,
    processedBy: lookup.processedBy
  };
};

const assertLeadWorkspaceOperator = async (leadId, currentUserId) => {
  const lookup = await getLeadWorkspaceOperator(leadId);
  if (!lookup.ok) {
    if (lookup.reason === 'NOT_FOUND') {
      return { ok: false, status: 404, message: 'Lead tidak ditemukan.' };
    }
    return { ok: false, status: 400, message: 'Lead ID tidak valid.' };
  }

  if (lookup.processedBy == null || Number(lookup.processedBy) !== Number(currentUserId)) {
    return {
      ok: false,
      status: 403,
      message: LEAD_WORKSPACE_OPERATOR_FORBIDDEN_MESSAGE
    };
  }

  return { ok: true, processedBy: lookup.processedBy };
};

const ensureLeadWorkspaceOperator = async (leadId, currentUserId, res) => {
  const result = await assertLeadWorkspaceOperator(leadId, currentUserId);
  if (!result.ok) {
    res.status(result.status).json({ success: false, message: result.message });
    return false;
  }
  return true;
};

module.exports = {
  getLeadWorkspaceOperator,
  assertLeadWorkspaceOperator,
  ensureLeadWorkspaceOperator,
  LEAD_WORKSPACE_OPERATOR_FORBIDDEN_MESSAGE
};
