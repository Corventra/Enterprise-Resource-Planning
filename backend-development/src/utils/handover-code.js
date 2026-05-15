const { resolveHandoverServiceCode } = require('./handover-service-code');

/**
 * Generate handover code: BD-HO-{ServiceCode}-{seq}-{year}
 * Sequence = max existing sequence for same service code in calendar year + 1.
 *
 * @param {import('mysql2/promise').PoolConnection} conn
 * @param {string|null|undefined} serviceDbCode - `services.code`
 * @param {string|null|undefined} [serviceName] - optional `services.name` for name-based mapping
 */
const generateHandoverCode = async (conn, serviceDbCode, serviceName = null) => {
  const serviceCode = resolveHandoverServiceCode(serviceDbCode, serviceName);
  const year = new Date().getFullYear();
  const pattern = `BD-HO-${serviceCode}-%-${year}`;

  const [rows] = await conn.execute(
    `SELECT handover_code
       FROM handovers
      WHERE handover_code LIKE ?
      ORDER BY handover_id DESC
      LIMIT 1`,
    [pattern]
  );

  let nextSeq = 1;
  if (rows[0]?.handover_code) {
    const escaped = serviceCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = String(rows[0].handover_code).match(
      new RegExp(`^BD-HO-${escaped}-(\\d{3})-${year}$`)
    );
    if (match) {
      nextSeq = Number(match[1]) + 1;
    }
  }

  return `BD-HO-${serviceCode}-${String(nextSeq).padStart(3, '0')}-${year}`;
};

module.exports = { generateHandoverCode };
