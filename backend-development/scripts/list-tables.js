#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Diagnostic helper: list semua tabel di DB yang ditarget oleh .env,
 * + flag mana yang related ke projects feature (yang kita expect dari Phase 1).
 *
 * Usage:
 *   node scripts/list-tables.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const EXPECTED_PROJECT_TABLES = [
  'projects',
  'project_consultants',
  'project_milestones',
  'project_milestone_updates'
];

(async () => {
  const dbName = process.env.DB_NAME;
  const dbHost = process.env.DB_HOST;
  const dbUser = process.env.DB_USER;
  console.log('===== DB State Check =====');
  console.log(`Database : ${dbName} @ ${dbHost}`);
  console.log(`User     : ${dbUser}`);
  console.log('==========================\n');

  let conn;
  try {
    conn = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: process.env.DB_PASSWORD,
      database: dbName,
      connectTimeout: 15000
    });
  } catch (e) {
    console.error('Gagal connect:', e.message);
    process.exit(1);
  }

  try {
    const [rows] = await conn.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ?
       ORDER BY TABLE_NAME`,
      [dbName]
    );
    const allTables = rows.map((r) => r.TABLE_NAME);
    console.log(`Total tables: ${allTables.length}`);
    console.log('All tables:');
    allTables.forEach((t) => console.log(`  - ${t}`));

    console.log('\n--- Projects feature status ---');
    EXPECTED_PROJECT_TABLES.forEach((t) => {
      const exists = allTables.includes(t);
      console.log(`  ${exists ? '✓' : '✗'} ${t}`);
    });
  } catch (e) {
    console.error('Query error:', e.message);
  } finally {
    await conn.end();
  }
})();
