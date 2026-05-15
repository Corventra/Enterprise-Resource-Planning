/**
 * Backfill handover_checklist.is_required_for_submit / is_required_for_start
 * for standard item_code rows only (does not change status).
 *
 * Usage: node scripts/backfill-handover-checklist-required-flags.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool } = require('../src/config/db');
const { CHECKLIST_ITEM_CODES, CHECKLIST_ITEM_FLAGS } = require('../src/utils/handover-checklist');

const run = async () => {
  let totalUpdated = 0;

  for (const itemCode of CHECKLIST_ITEM_CODES) {
    const flags = CHECKLIST_ITEM_FLAGS[itemCode];
    const [result] = await pool.execute(
      `UPDATE handover_checklist
          SET is_required_for_submit = ?,
              is_required_for_start = ?
        WHERE item_code = ?`,
      [flags.is_required_for_submit, flags.is_required_for_start, itemCode]
    );
    const count = result.affectedRows ?? 0;
    totalUpdated += count;
    // eslint-disable-next-line no-console
    console.log(`${itemCode}: ${count} row(s) updated`);
  }

  // eslint-disable-next-line no-console
  console.log(`Backfill selesai. Total rows updated: ${totalUpdated}`);
  await pool.end();
  process.exit(0);
};

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
