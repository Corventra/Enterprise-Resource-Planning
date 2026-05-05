/* eslint-disable no-console */
/**
 * Generator: bikin satu file SQL siap-paste ke phpMyAdmin.
 *
 *   cd backend-development
 *   node scripts/generate-init-sql.js
 *
 * Output: src/db/init.sql — berisi schema + seed (password sudah bcrypt-hashed).
 *
 * Catatan: dijalankan ulang setelah ada perubahan schema atau seed-data.json.
 * Hash bcrypt setiap run beda (random salt) — itu normal, tidak masalah karena
 * verifikasi pakai bcrypt.compare() yang bisa baca salt dari hash.
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const SEED_PATH = path.join(__dirname, 'seed-data.json');
const SCHEMA_PATH = path.join(__dirname, '..', 'src', 'db', 'schema.sql');
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'db', 'init.sql');
const BCRYPT_COST = 10;

const escapeStr = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;

(async () => {
  if (!fs.existsSync(SEED_PATH)) {
    console.error(`[gen-sql] seed-data.json tidak ditemukan di ${SEED_PATH}`);
    process.exit(1);
  }
  if (!fs.existsSync(SCHEMA_PATH)) {
    console.error(`[gen-sql] schema.sql tidak ditemukan di ${SCHEMA_PATH}`);
    process.exit(1);
  }

  const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf-8'));
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');

  const lines = [];
  lines.push('-- ============================================================');
  lines.push('-- DSK Global Konsultama — ERP Auth/RBAC init script');
  lines.push('-- Generated: ' + new Date().toISOString());
  lines.push('-- Source   : scripts/seed-data.json + src/db/schema.sql');
  lines.push('-- Pakai    : paste seluruh file ini ke phpMyAdmin → SQL tab → Run');
  lines.push('--            (atau import sebagai SQL file)');
  lines.push('-- ============================================================');
  lines.push('');

  lines.push('-- =============== 1. SCHEMA ===============');
  lines.push(schemaSql.trim());
  lines.push('');
  lines.push('-- =============== 2. SEED: roles ===============');
  for (const r of seed.roles) {
    lines.push(
      `INSERT INTO roles (code, name, is_department_scoped) VALUES (${escapeStr(r.code)}, ${escapeStr(r.name)}, ${r.is_department_scoped ? 1 : 0});`
    );
  }

  lines.push('');
  lines.push('-- =============== 3. SEED: departments ===============');
  for (const d of seed.departments) {
    lines.push(`INSERT INTO departments (code, name) VALUES (${escapeStr(d.code)}, ${escapeStr(d.name)});`);
  }

  lines.push('');
  lines.push('-- =============== 4. SEED: users (password sudah bcrypt-hashed) ===============');
  console.log('[gen-sql] Hashing passwords for', seed.users.length, 'users...');
  for (const u of seed.users) {
    const hash = await bcrypt.hash(u.password, BCRYPT_COST);
    lines.push(
      `INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES (` +
        `${escapeStr(u.email)}, ` +
        `${escapeStr(u.name)}, ` +
        `${escapeStr(hash)}, ` +
        `(SELECT id FROM roles WHERE code = ${escapeStr(u.role)}), ` +
        `1` +
      `);`
    );
  }

  lines.push('');
  lines.push('-- =============== 5. SEED: user_departments ===============');
  for (const u of seed.users) {
    const depts = Array.isArray(u.departments) ? u.departments : [];
    for (let i = 0; i < depts.length; i++) {
      const code = depts[i];
      const isPrimary = i === 0 ? 1 : 0;
      lines.push(
        `INSERT INTO user_departments (user_id, department_id, is_primary) VALUES (` +
          `(SELECT id FROM users WHERE email = ${escapeStr(u.email)}), ` +
          `(SELECT id FROM departments WHERE code = ${escapeStr(code)}), ` +
          `${isPrimary}` +
        `);`
      );
    }
  }

  lines.push('');
  lines.push('-- =============== 6. SEED: permissions ===============');
  const perms = Array.isArray(seed.permissions) ? seed.permissions : [];
  for (const p of perms) {
    lines.push(
      `INSERT INTO permissions (code, description) VALUES (${escapeStr(p.code)}, ${
        p.description ? escapeStr(p.description) : 'NULL'
      });`
    );
  }

  lines.push('');
  lines.push('-- =============== 7. SEED: role_permissions ===============');
  const rolePerms = seed.role_permissions || {};
  for (const [roleCode, codes] of Object.entries(rolePerms)) {
    const list = codes === 'ALL' ? perms.map((p) => p.code) : Array.isArray(codes) ? codes : [];
    for (const permCode of list) {
      lines.push(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES (` +
          `(SELECT id FROM roles WHERE code = ${escapeStr(roleCode)}), ` +
          `(SELECT id FROM permissions WHERE code = ${escapeStr(permCode)})` +
        `);`
      );
    }
  }

  lines.push('');
  lines.push('-- =============== Done ===============');

  fs.writeFileSync(OUTPUT_PATH, lines.join('\n') + '\n', 'utf-8');
  const sizeKb = (fs.statSync(OUTPUT_PATH).size / 1024).toFixed(1);
  console.log(`[gen-sql] ✓ ${OUTPUT_PATH} (${sizeKb} KB)`);
  console.log('[gen-sql] Tinggal paste isi file ini ke phpMyAdmin → tab SQL → Run.');
})();
