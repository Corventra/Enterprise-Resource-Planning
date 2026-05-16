/**
 * Backfill invoice_terms.billing_schedule_date from engagement_letter_termins
 * for rows that were provisioned with NULL (legacy bug: only INSTALLMENT copied).
 *
 * Usage: node scripts/backfill-invoice-term-billing-schedule.js
 * Requires .env with DB connection (same as backend).
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool } = require('../src/config/db');

const run = async () => {
  const [result] = await pool.execute(
    `UPDATE invoice_terms it
      INNER JOIN engagement_letter_termins elt
        ON elt.engagement_id = it.engagement_id
       AND elt.sort_order = it.term_order
       SET it.billing_schedule_date = elt.billing_schedule_date
     WHERE (it.billing_schedule_date IS NULL OR it.billing_schedule_date = '0000-00-00')
       AND elt.billing_schedule_date IS NOT NULL`
  );

  // eslint-disable-next-line no-console
  console.log(`Backfill selesai. Rows updated: ${result.affectedRows ?? result.changedRows ?? 0}`);
  await pool.end();
  process.exit(0);
};

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
