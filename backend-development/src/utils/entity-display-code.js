/**
 * Kode referensi global per entitas (tanpa tahun): LD-xxx, BD-PRO-xxx, BD-EL-xxx.
 * Mengambil sequence dari MAX suffix numerik pada baris yang memenuhi pola tetap.
 * Uniqueness di DB; pada race condition kemungkinan ER_DUP_ENTRY — caller bisa retry generate+insert.
 */

const pad3 = (n) => String(Math.max(0, Number(n) || 0)).padStart(3, '0');

/**
 * @param {import('mysql2/promise').PoolConnection} conn
 */
const generateNextLeadCode = async (conn) => {
  const [rows] = await conn.execute(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(lead_code, 4) AS UNSIGNED)), 0) AS m
       FROM leads
      WHERE lead_code REGEXP '^LD-[0-9]+$'`
  );
  const m = Number(rows[0]?.m) || 0;
  return `LD-${pad3(m + 1)}`;
};

/**
 * @param {import('mysql2/promise').PoolConnection} conn
 */
const generateNextProposalCode = async (conn) => {
  const [rows] = await conn.execute(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(proposal_code, 8) AS UNSIGNED)), 0) AS m
       FROM proposals
      WHERE proposal_code REGEXP '^BD-PRO-[0-9]+$'`
  );
  const m = Number(rows[0]?.m) || 0;
  return `BD-PRO-${pad3(m + 1)}`;
};

/**
 * @param {import('mysql2/promise').PoolConnection} conn
 */
const generateNextEngagementCode = async (conn) => {
  const [rows] = await conn.execute(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(engagement_code, 7) AS UNSIGNED)), 0) AS m
       FROM engagement_letters
      WHERE engagement_code REGEXP '^BD-EL-[0-9]+$'`
  );
  const m = Number(rows[0]?.m) || 0;
  return `BD-EL-${pad3(m + 1)}`;
};

module.exports = {
  generateNextLeadCode,
  generateNextProposalCode,
  generateNextEngagementCode
};
