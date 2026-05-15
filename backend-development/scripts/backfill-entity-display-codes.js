/**
 * Backfill lead_code, proposal_code, engagement_code untuk data lama.
 * Urutan: created_at ASC, id ASC; sequence global per tabel.
 *
 * Prasyarat: migration phase 1 sudah dijalankan (kolom nullable ada).
 * Setelah ini, jalankan migration phase 2.
 *
 * Usage: node scripts/backfill-entity-display-codes.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool } = require('../src/config/db');

const pad3 = (n) => String(Math.max(0, Number(n) || 0)).padStart(3, '0');

const backfillLeads = async (conn) => {
  const [maxRows] = await conn.execute(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(lead_code, 4) AS UNSIGNED)), 0) AS m
       FROM leads
      WHERE lead_code REGEXP '^LD-[0-9]+$'`
  );
  let seq = Number(maxRows[0]?.m) || 0;

  const [todo] = await conn.execute(
    `SELECT lead_id
       FROM leads
      WHERE lead_code IS NULL
      ORDER BY created_at ASC, lead_id ASC`
  );

  for (const row of todo) {
    seq += 1;
    const code = `LD-${pad3(seq)}`;
    await conn.execute(`UPDATE leads SET lead_code = ? WHERE lead_id = ? AND lead_code IS NULL`, [
      code,
      row.lead_id
    ]);
  }

  return todo.length;
};

const backfillProposals = async (conn) => {
  const [maxRows] = await conn.execute(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(proposal_code, 8) AS UNSIGNED)), 0) AS m
       FROM proposals
      WHERE proposal_code REGEXP '^BD-PRO-[0-9]+$'`
  );
  let seq = Number(maxRows[0]?.m) || 0;

  const [todo] = await conn.execute(
    `SELECT proposal_id
       FROM proposals
      WHERE proposal_code IS NULL
      ORDER BY created_at ASC, proposal_id ASC`
  );

  for (const row of todo) {
    seq += 1;
    const code = `BD-PRO-${pad3(seq)}`;
    await conn.execute(`UPDATE proposals SET proposal_code = ? WHERE proposal_id = ? AND proposal_code IS NULL`, [
      code,
      row.proposal_id
    ]);
  }

  return todo.length;
};

const backfillEngagements = async (conn) => {
  const [maxRows] = await conn.execute(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(engagement_code, 7) AS UNSIGNED)), 0) AS m
       FROM engagement_letters
      WHERE engagement_code REGEXP '^BD-EL-[0-9]+$'`
  );
  let seq = Number(maxRows[0]?.m) || 0;

  const [todo] = await conn.execute(
    `SELECT engagement_id
       FROM engagement_letters
      WHERE engagement_code IS NULL
      ORDER BY created_at ASC, engagement_id ASC`
  );

  for (const row of todo) {
    seq += 1;
    const code = `BD-EL-${pad3(seq)}`;
    await conn.execute(
      `UPDATE engagement_letters SET engagement_code = ? WHERE engagement_id = ? AND engagement_code IS NULL`,
      [code, row.engagement_id]
    );
  }

  return todo.length;
};

const run = async () => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const nLeads = await backfillLeads(conn);
    const nProposals = await backfillProposals(conn);
    const nEng = await backfillEngagements(conn);
    await conn.commit();
    // eslint-disable-next-line no-console
    console.log(`Backfill selesai. leads=${nLeads}, proposals=${nProposals}, engagement_letters=${nEng}`);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
  await pool.end();
  process.exit(0);
};

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
