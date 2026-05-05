/* eslint-disable no-console */
/**
 * Seed script — load roles, departments, dan users (bcrypt-hashed) ke MySQL.
 *
 * Cara jalan:
 *   cd backend-development
 *   node scripts/seed.js
 *
 * Source: scripts/seed-data.json (gitignored — plain credentials).
 * Idempoten: TRUNCATE table sebelum insert. Untuk dev/skripsi, bukan prod.
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const SEED_PATH = path.join(__dirname, 'seed-data.json');
const BCRYPT_COST = 10;

const log = (...args) => console.log('[seed]', ...args);
const fail = (msg, e) => {
  console.error('[seed]', msg, e?.message ?? '');
  process.exit(1);
};

const loadSeed = () => {
  if (!fs.existsSync(SEED_PATH)) {
    fail(
      `Seed file ${SEED_PATH} tidak ditemukan. ` +
      `File ini gitignored — kalau hilang, copy dari developer lain atau buat ulang.`
    );
  }
  const raw = fs.readFileSync(SEED_PATH, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    fail(`Seed file invalid JSON:`, e);
  }
};

(async () => {
  const seed = loadSeed();
  const { roles, departments, users } = seed;
  if (!Array.isArray(roles) || !Array.isArray(departments) || !Array.isArray(users)) {
    fail('Seed JSON harus punya array: roles, departments, users');
  }

  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: false,
      connectTimeout: 15000
    });
    log(`Connected to ${process.env.DB_NAME} @ ${process.env.DB_HOST}`);
  } catch (e) {
    fail('Gagal connect MySQL:', e);
  }

  try {
    // ------------------------------------------------------------------
    // Reset tables (anak dulu, parent terakhir)
    // ------------------------------------------------------------------
    log('Truncating existing data...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('TRUNCATE TABLE login_logs');
    await conn.query('TRUNCATE TABLE user_departments');
    await conn.query('TRUNCATE TABLE role_permissions');
    await conn.query('TRUNCATE TABLE users');
    await conn.query('TRUNCATE TABLE permissions');
    await conn.query('TRUNCATE TABLE departments');
    await conn.query('TRUNCATE TABLE roles');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    // ------------------------------------------------------------------
    // Roles
    // ------------------------------------------------------------------
    log(`Inserting ${roles.length} roles...`);
    for (const r of roles) {
      await conn.execute(
        'INSERT INTO roles (code, name, is_department_scoped) VALUES (?, ?, ?)',
        [r.code, r.name, r.is_department_scoped ? 1 : 0]
      );
    }

    // ------------------------------------------------------------------
    // Departments
    // ------------------------------------------------------------------
    log(`Inserting ${departments.length} departments...`);
    for (const d of departments) {
      await conn.execute(
        'INSERT INTO departments (code, name) VALUES (?, ?)',
        [d.code, d.name]
      );
    }

    // ------------------------------------------------------------------
    // Permissions
    // ------------------------------------------------------------------
    const permissions = Array.isArray(seed.permissions) ? seed.permissions : [];
    log(`Inserting ${permissions.length} permissions...`);
    for (const p of permissions) {
      await conn.execute(
        'INSERT INTO permissions (code, description) VALUES (?, ?)',
        [p.code, p.description ?? null]
      );
    }

    // ------------------------------------------------------------------
    // Map code → id untuk roles, departments, permissions
    // ------------------------------------------------------------------
    const [roleRows] = await conn.query('SELECT id, code FROM roles');
    const [deptRows] = await conn.query('SELECT id, code FROM departments');
    const [permRows] = await conn.query('SELECT id, code FROM permissions');
    const roleId = Object.fromEntries(roleRows.map((r) => [r.code, r.id]));
    const deptId = Object.fromEntries(deptRows.map((d) => [d.code, d.id]));
    const permId = Object.fromEntries(permRows.map((p) => [p.code, p.id]));

    // ------------------------------------------------------------------
    // Role-permission mapping
    // - "ALL" = grant semua permission yang ada (untuk SUPERADMIN)
    // - array = grant subset
    // ------------------------------------------------------------------
    const rolePerms = seed.role_permissions || {};
    log('Inserting role_permissions...');
    let rpCount = 0;
    for (const [roleCode, perms] of Object.entries(rolePerms)) {
      if (!roleId[roleCode]) {
        fail(`role_permissions: role "${roleCode}" tidak dikenal`);
      }
      const codes = perms === 'ALL'
        ? Object.keys(permId)
        : Array.isArray(perms) ? perms : [];
      for (const code of codes) {
        if (!permId[code]) {
          fail(`role_permissions[${roleCode}]: permission "${code}" tidak dikenal`);
        }
        await conn.execute(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
          [roleId[roleCode], permId[code]]
        );
        rpCount += 1;
      }
    }
    log(`✓ ${rpCount} role_permission entries.`);

    // ------------------------------------------------------------------
    // Users + user_departments
    // ------------------------------------------------------------------
    log(`Hashing passwords + inserting ${users.length} users...`);
    let userCount = 0;
    let mappingCount = 0;
    for (const u of users) {
      if (!roleId[u.role]) {
        fail(`User ${u.email}: role "${u.role}" tidak dikenal`);
      }
      const hash = await bcrypt.hash(u.password, BCRYPT_COST);
      const [result] = await conn.execute(
        'INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES (?, ?, ?, ?, 1)',
        [u.email, u.name, hash, roleId[u.role]]
      );
      const newUserId = result.insertId;
      userCount += 1;

      const depts = Array.isArray(u.departments) ? u.departments : [];
      for (let i = 0; i < depts.length; i++) {
        const code = depts[i];
        if (!deptId[code]) {
          fail(`User ${u.email}: department "${code}" tidak dikenal`);
        }
        await conn.execute(
          'INSERT INTO user_departments (user_id, department_id, is_primary) VALUES (?, ?, ?)',
          [newUserId, deptId[code], i === 0 ? 1 : 0]
        );
        mappingCount += 1;
      }
    }

    log(`✓ ${userCount} users inserted, ${mappingCount} dept assignments.`);
    log('Done.');
  } catch (e) {
    fail('Seed gagal:', e);
  } finally {
    await conn.end();
  }
})();
