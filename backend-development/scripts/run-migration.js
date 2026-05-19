#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Migration runner.
 *
 * Usage:
 *   node scripts/run-migration.js <path-to-sql-file>
 *
 * Example:
 *   node scripts/run-migration.js src/db/migrations/2026-05-16-012-projects-feature.sql
 *
 * Safety:
 *   - Baca CREATE TABLE statements dari SQL file, extract target table names.
 *   - Cek dulu apakah ada target table yang sudah exist di DB. Kalau ada, ABORT
 *     untuk hindari duplicate / data loss (kamu harus drop manual dulu, atau
 *     bikin migration ALTER baru).
 *   - Eksekusi seluruh SQL file pakai mysql2 multipleStatements.
 *   - Verifikasi setelah eksekusi: list target table yang sekarang exist.
 *
 * Catatan:
 *   - Pakai kredensial dari .env (.env di-load via require('dotenv').config()).
 *   - DDL (CREATE TABLE) auto-commit per statement, tidak ada rollback granular
 *     kalau partial fail. Cek error message + DB state secara manual kalau gagal.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/run-migration.js <path-to-sql-file>');
  console.error('Example: node scripts/run-migration.js src/db/migrations/2026-05-16-012-projects-feature.sql');
  process.exit(1);
}

const sqlPath = path.resolve(process.cwd(), args[0]);
if (!fs.existsSync(sqlPath)) {
  console.error(`File tidak ditemukan: ${sqlPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf8');

// Extract target CREATE TABLE names (handles backticks, quotes, IF NOT EXISTS).
const extractTargets = (sqlText) => {
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?(\w+)[`"]?/gi;
  const out = [];
  let m;
  while ((m = re.exec(sqlText)) !== null) out.push(m[1]);
  return out;
};

(async () => {
  const dbName = process.env.DB_NAME;
  const dbHost = process.env.DB_HOST;
  if (!dbName || !dbHost) {
    console.error('DB_NAME / DB_HOST tidak ada di environment. Pastikan .env benar.');
    process.exit(1);
  }

  const targets = extractTargets(sql);

  console.log('===== Migration Runner =====');
  console.log(`Database : ${dbName} @ ${dbHost}`);
  console.log(`File     : ${sqlPath}`);
  console.log(`Targets  : ${targets.length > 0 ? targets.join(', ') : '(none detected — non-CREATE migration?)'}`);
  console.log('============================');

  let conn;
  try {
    conn = await mysql.createConnection({
      host: dbHost,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: dbName,
      multipleStatements: true,
      connectTimeout: 15000
    });
  } catch (e) {
    console.error('Gagal connect ke DB:', e.message);
    process.exit(2);
  }

  try {
    // Pre-flight: pastikan tidak ada target table yang sudah exist.
    if (targets.length > 0) {
      const [existRows] = await conn.query(
        `SELECT TABLE_NAME FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (?)`,
        [dbName, targets]
      );
      const existing = existRows.map((r) => r.TABLE_NAME);
      if (existing.length > 0) {
        console.error(`\nABORT: tabel ini sudah ada di DB → ${existing.join(', ')}`);
        console.error('Drop dulu manual kalau memang mau re-create, atau bikin migration ALTER baru.');
        process.exit(3);
      }
    }

    console.log('\nExecuting migration SQL...');
    await conn.query(sql);
    console.log('OK — query selesai tanpa error.');

    // Verify
    if (targets.length > 0) {
      const [verifyRows] = await conn.query(
        `SELECT TABLE_NAME FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (?)`,
        [dbName, targets]
      );
      const created = verifyRows.map((r) => r.TABLE_NAME);
      console.log(`\nTables sekarang di DB: ${created.join(', ')}`);
      const missing = targets.filter((t) => !created.includes(t));
      if (missing.length > 0) {
        console.warn(`WARN: tabel target ini TIDAK terbentuk: ${missing.join(', ')}`);
        process.exit(4);
      } else {
        console.log('✓ Semua target table berhasil dibuat.');
      }
    }
  } catch (e) {
    console.error('\nMigration FAILED:');
    console.error('  sqlMessage:', e.sqlMessage || '(n/a)');
    console.error('  code      :', e.code || '(n/a)');
    console.error('  message   :', e.message);
    process.exit(5);
  } finally {
    await conn.end();
  }
})();
