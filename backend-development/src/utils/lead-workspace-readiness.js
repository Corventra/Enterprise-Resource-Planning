const PROPOSAL_REQUIRES_MINUTES_MESSAGE =
  'Proposal hanya dapat dibuat setelah meeting memiliki notulensi.';

const ENGAGEMENT_REQUIRES_PROPOSAL_MESSAGE =
  'Engagement letter hanya dapat dibuat setelah proposal tersedia.';

const LEAD_HAS_PROPOSAL_MESSAGE = 'Lead ini sudah memiliki proposal.';

const LEAD_HAS_ENGAGEMENT_MESSAGE = 'Lead ini sudah memiliki engagement letter.';

const LEAD_HAS_HANDOVER_MESSAGE = 'Lead ini sudah memiliki handover.';

const leadHasMinutes = async (conn, leadId) => {
  const [rows] = await conn.execute(
    `SELECT minute_id
       FROM minutes
      WHERE lead_id = ?
      LIMIT 1`,
    [leadId]
  );
  return Boolean(rows[0]);
};

const leadHasProposal = async (conn, leadId) => {
  const [rows] = await conn.execute(
    `SELECT proposal_id
       FROM proposals
      WHERE lead_id = ?
      LIMIT 1`,
    [leadId]
  );
  return Boolean(rows[0]);
};

const leadHasEngagementLetter = async (conn, leadId) => {
  const [rows] = await conn.execute(
    `SELECT engagement_id
       FROM engagement_letters
      WHERE lead_id = ?
      LIMIT 1`,
    [leadId]
  );
  return Boolean(rows[0]);
};

const leadHasHandover = async (conn, leadId) => {
  const [rows] = await conn.execute(
    `SELECT handover_id
       FROM handovers
      WHERE lead_id = ?
      LIMIT 1`,
    [leadId]
  );
  return Boolean(rows[0]);
};

module.exports = {
  PROPOSAL_REQUIRES_MINUTES_MESSAGE,
  ENGAGEMENT_REQUIRES_PROPOSAL_MESSAGE,
  LEAD_HAS_PROPOSAL_MESSAGE,
  LEAD_HAS_ENGAGEMENT_MESSAGE,
  LEAD_HAS_HANDOVER_MESSAGE,
  leadHasMinutes,
  leadHasProposal,
  leadHasEngagementLetter,
  leadHasHandover
};
