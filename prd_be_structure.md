# PRD Backend — Corventra ERP

Backend untuk monorepo ERP "Corventra" (PT DSK Global Konsultama). Dipakai oleh dua sub-skripsi:
- **Muhamad Faried** — *Pengembangan Aplikasi Monitoring Proyek dan Penilaian Kinerja Karyawan Berbasis KPI*
- **Partner** — *Aplikasi Pemantauan Kinerja Sales and Marketing Berbasis CRM Operasional*

## 1. Arsitektur

Backend mengikuti **layered architecture** dengan pemisahan tanggung jawab teknis (bukan per-fitur). Tiga lapisan utama:

1. **HTTP layer** — `routes/` + `controllers/` (request validation, response shape)
2. **Data access layer** — `repositories/` (SQL queries terpusat, parameterized)
3. **Cross-cutting** — `middleware/`, `utils/`, `config/`

Setiap modul fitur direpresentasikan oleh **satu file di setiap layer** dengan naming `<feature>.routes.js`, `<feature>.controller.js`, `<feature>.repo.js`.

**Stack:** Express 5 (CommonJS), MySQL 8 via `mysql2/promise`, JWT (`jsonwebtoken`), bcrypt (`bcryptjs`), multer (file upload).

> **Catatan:** Service layer (business logic) saat ini di-fold ke controller karena logic masih sederhana. Akan dipromosikan ke `services/<feature>.service.js` saat business rules per fitur cukup complex (mis. KPI engine, project lifecycle).

## 2. Folder Structure

```
backend-development/
├── src/
│   ├── server.js                    # entry: load env, start HTTP server
│   ├── app.js                       # Express app: CORS, body parser, mount routes
│   │
│   ├── config/
│   │   └── db.js                    # mysql2 pool + ping helper
│   │
│   ├── db/
│   │   ├── schema.sql               # CREATE TABLE (DROP+CREATE — dev/skripsi mode)
│   │   └── init.sql                 # schema + seed combined (auto-generated, paste-ke-phpMyAdmin)
│   │
│   ├── middleware/
│   │   ├── authenticate.js          # verify JWT bearer; attach req.user
│   │   ├── require-permission.js    # gate berdasarkan permission code di JWT (Phase 3+)
│   │   └── require-role.js          # legacy fallback (deprecated, akan dihapus)
│   │
│   ├── routes/                      # path → controller wiring
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   ├── departments.routes.js
│   │   └── lookup.routes.js
│   │
│   ├── controllers/                 # HTTP handler: validasi request, build response
│   │   ├── auth.controller.js
│   │   ├── users.controller.js
│   │   ├── departments.controller.js
│   │   └── lookup.controller.js
│   │
│   ├── repositories/                # SQL queries terpusat — JANGAN call pool langsung dari controller
│   │   ├── user.repo.js
│   │   ├── role.repo.js
│   │   ├── department.repo.js
│   │   └── permission.repo.js
│   │
│   └── utils/
│       ├── jwt.js                   # sign/verify wrapper around jsonwebtoken
│       └── validation.js            # ValidationError + requireString/Email/Password helpers
│
├── scripts/                         # one-off ops di luar request lifecycle
│   ├── seed.js                      # idempotent seed: TRUNCATE + bcrypt + INSERT
│   ├── seed-data.json               # gitignored — plain credentials, source of truth
│   └── generate-init-sql.js         # produces hashed init.sql dari seed-data.json
│
├── uploads/                         # multer storage (TBD — saat fitur upload diaktifkan)
│   ├── proposal-files/
│   ├── engagement-letter-files/
│   ├── handover-files/
│   ├── project-documents/
│   ├── form-attachments/
│   └── profile-images/
│
├── tests/                           # Jest + supertest (TBD)
│   └── auth.test.js                 # roadmap: minimal login happy/fail paths
│
├── .env                             # gitignored: DB creds, JWT secret, FRONTEND_ORIGIN
├── .env.example                     # template
├── package.json
└── README.md
```

## 3. Module Mapping

| # | Module | Status | Scope | Files |
|---|---|---|---|---|
| 1 | **auth** | ✅ Phase 1 | Shared | `routes/auth.routes.js`, `controllers/auth.controller.js`, `repositories/user.repo.js` (login lookup) |
| 2 | **users** | ✅ Phase 1 | Shared (admin) | `routes/users.routes.js`, `controllers/users.controller.js`, `repositories/user.repo.js` |
| 3 | **roles** | ✅ Phase 3 | Shared (admin) | `repositories/role.repo.js` (lookup-only saat ini, full CRUD kalau perlu nanti) |
| 4 | **departments** | ✅ Phase 2 | Shared | `routes/departments.routes.js`, `controllers/departments.controller.js`, `repositories/department.repo.js` |
| 5 | **permissions** | ✅ Phase 3 | Shared (admin) | `repositories/permission.repo.js`, `middleware/require-permission.js` |
| 6 | **lookup** | ✅ Phase 1-2 | Shared | `routes/lookup.routes.js`, `controllers/lookup.controller.js` (roles + departments dropdown) |
| 7 | campaigns | 📋 TODO | Partner (CRM) | scope teman |
| 8 | forms | 📋 TODO | Partner (CRM) | form builder internal |
| 9 | public-forms | 📋 TODO | Partner (CRM) | form publik diisi calon klien |
| 10 | bank-data | 📋 TODO | Partner (CRM) | bank lead awal |
| 11 | leads | 📋 TODO | Partner (CRM) | lead tracker pipeline |
| 12 | meetings | 📋 TODO | Partner (CRM) | jadwal meeting client |
| 13 | notulensi | 📋 TODO | Partner (CRM) | notulensi meeting |
| 14 | proposals | 📋 TODO | Partner (CRM) | proposal + fee + termin |
| 15 | engagement-letters | 📋 TODO | Partner (CRM) | EL signature flow |
| 16 | **handovers** | 📋 TODO | **User (boundary)** | handover memo masuk antrian approval |
| 17 | **approvals** | 📋 TODO | **User** | CEO approve handover/proposal/EL |
| 18 | **projects** | 📋 TODO | **User** | project lifecycle, milestones, project team |
| 19 | **task-templates** | 📋 TODO | **User** | template task per service line (CEO+COO) |
| 20 | **kpi-engine** | 📋 TODO | **User** | computeSnapshot, aggregate, trend |
| 21 | **kpi-snapshots** | 📋 TODO | **User** | persist snapshot, finalize, recompute |
| 22 | **kpi-config** | 📋 TODO | **User** | bobot dimensi, threshold, CEO approval major |
| 23 | documents | 📋 TODO | Shared | document center, file metadata |
| 24 | invoices | 📋 TODO | Shared | DPP, PPN, PPh 23, termin pembayaran |

**Legend:**
- ✅ = sudah implemented
- 📋 = roadmap (sebagian masih frontend mock localStorage)
- **User** = sub-skripsi Faried (post-handover + KPI)
- **Partner** = sub-skripsi teman (CRM Sales & Marketing)
- **Shared** = lintas-scope

## 4. Auth & RBAC

### 4.1 Login flow

`POST /api/auth/login`
1. Validate email + password (non-empty string)
2. Lookup user by email — kalau tidak ada, log attempt + reject 401
3. Cek `is_active` — kalau false, reject 403
4. `bcrypt.compare(password, password_hash)` — kalau gagal, log + reject 401
5. Fetch role + departments + permissions (3 join queries)
6. Sign JWT: `{ sub, email, role, departments[], permissions[] }`, expires 8h (env)
7. Log attempt success
8. Return `{ token, user: { id, email, name, role, departments, permissions } }`

`GET /api/auth/me` (authenticated)
- Re-fetch user data dari DB pakai `sub` JWT
- Re-fetch permissions (live update tanpa re-login)
- Return refreshed user

`POST /api/auth/logout` — JWT stateless. Endpoint ini cuma contract untuk frontend bersihkan token + future audit.

### 4.2 Permission enforcement

```js
// Pattern: setelah authenticate, gate route dengan permission
router.use(authenticate, requirePermission('USER_MANAGE'));

// Multiple permissions: 'any' (default) atau 'all'
router.use(authenticate, requirePermission(['KPI_CONFIGURE', 'KPI_FINALIZE_PERIOD'], 'any'));
```

Middleware cek `req.user.permissions` (dari JWT payload) memuat code yang dibutuhkan. Reject 403 dengan `{ error, requiredPermissions, mode }` untuk debugging.

### 4.3 Role-Department coupling

| Role | `is_department_scoped` | Department wajib? |
|---|:---:|---|
| CEO, STAFF_ADMIN, SUPERADMIN, MEO | false | Tidak (all-spanning) |
| COO | true | Min 1 (boleh multi — mis. TAX + AUDIT) |
| PM | true | Min 1 (umumnya 1 home dept) |
| CONSULTANT | true | Min 1 (primary = is_primary=1) |
| BD | true | Min 1 (MEO atau EXECUTIVE — sub-unit) |

Validasi di **application layer** (controller), bukan DB constraint — MySQL tidak support conditional FK.

## 5. Database Schema (current)

```
roles              (8 rows)     -- CEO, COO, PM, CONSULTANT, BD, STAFF_ADMIN, MEO, SUPERADMIN
departments        (8 rows)     -- TAX, AUDIT, TP_DOC, SR, LEGAL, WEBDEV, MEO, EXECUTIVE
permissions        (30 rows)    -- KPI_VIEW_ALL, USER_MANAGE, dll
role_permissions   (M:N, 86)    -- mapping role → permissions (Superadmin = all 30)
users              (25 rows)    -- email + bcrypt(password) + role_id
user_departments   (M:N, 22)    -- + is_primary flag
login_logs         (audit log)
```

### 5.1 FK strategy
- **ON UPDATE CASCADE** — semua FK
- **ON DELETE RESTRICT** — parent sensitif (roles, departments) kalau masih ada referensi
- **ON DELETE CASCADE** — junction tables (user_departments, role_permissions) saat parent dihapus
- **ON DELETE SET NULL** — audit (login_logs.user_id) supaya log tetap ada saat user dihapus

### 5.2 Tabel future (Phase 4+)
Akan ditambahkan saat migrate dari frontend mock:
- handovers, handover_approval_trail
- projects, project_team, milestones, milestone_logs
- task_templates, task_template_items
- kpi_snapshots, kpi_config, kpi_pending_changes
- documents, invoices, invoice_terms

## 6. Common Patterns

### 6.1 Validation
Pakai `utils/validation.js`:
```js
const { ValidationError, requireEmail, requirePassword, requireString } = require('../utils/validation');

const email = requireEmail(body.email);                // throw ValidationError kalau invalid
const name = requireString(body.name, 'name', { max: 128 });
const password = requirePassword(body.password);
```

Validate inline di controller method (saat ini), pindah ke `validators/<feature>.validator.js` kalau validation logic cukup besar per fitur.

### 6.2 Response shape

| Tipe | Shape |
|---|---|
| List | `{ resource: [...] }` (e.g., `{ users: [...] }`, `{ departments: [...] }`) |
| Detail / create / update | `{ resource: {...} }` |
| Action sukses | `{ ok: true }` |
| Error | `{ error: "human readable", ...debug fields }` |

### 6.3 Error handling

| Status | Kapan | Detail field |
|---|---|---|
| 400 | ValidationError | `{ error: msg }` |
| 401 | Token missing/expired/invalid; wrong credential | `{ error, detail? }` |
| 403 | Permission/role insufficient | `{ error, requiredPermissions, mode }` |
| 404 | Resource tidak ditemukan | `{ error: "X tidak ditemukan." }` |
| 500 | Unexpected — log ke console + return generic | `{ error: "Internal server error" }` |

### 6.4 Repository pattern
- Semua SQL **wajib** di `repositories/<feature>.repo.js`. Controller TIDAK panggil `pool.execute` langsung.
- Multi-table mutation pakai transaction (`pool.getConnection()` + `beginTransaction/commit/rollback`). Contoh: `userRepo.createWithDepartments` (insert user + user_departments dalam 1 atomic op).
- Parameterized queries — JANGAN concat string ke SQL.

### 6.5 Audit log pattern
Aksi sensitif (login attempt, finalize KPI, approve handover, dll) di-log ke tabel `<feature>_logs` atau audit umum. Log failure tidak boleh blok response (try-catch + console.error).

### 6.6 DTO / response masking (TODO)
Untuk fitur yang punya data sensitif (proposal fee, project financials), tambahkan layer DTO atau filter inline di controller berdasarkan `req.user.permissions`. Contoh saat implement Phase 4:

```js
// project.controller.js (future)
const project = await projectRepo.findById(id);
const dto = req.user.permissions.includes('PROJECT_VIEW_FINANCIALS')
  ? project
  : omit(project, ['feeItems', 'paymentTerms', 'dealPrice']);
return res.json({ project: dto });
```

## 7. Testing

Saat ini: tidak ada test ditulis. Jest + supertest sudah installed via `package.json`.

**Roadmap minimal:**
- `tests/auth.test.js` — login happy path, wrong password, missing token, expired token
- `tests/users.test.js` — CRUD happy path + auth fail (PM access /api/users → 403)
- `tests/departments.test.js` — CRUD + safety (delete dept dengan users → 400)

Target: per-modul coverage ≥ 70%, full path coverage untuk auth flow.

## 8. Roadmap

Urutan migrasi data dari frontend mock (localStorage) → real backend:

| # | Phase | Deliverable | Tabel baru |
|---|---|---|---|
| 1 | ✅ Phase 1 | Auth login real (JWT, bcrypt) | roles, departments, users, user_departments, login_logs |
| 2 | ✅ Phase 2 | Departments CRUD UI | (no schema change) |
| 3 | ✅ Phase 3 | RBAC enforcement berbasis permissions DB | permissions, role_permissions |
| 4 | 📋 Phase 4 | Handovers + Approvals → DB | handovers, handover_approval_trail |
| 5 | 📋 Phase 5 | Projects + Milestones → DB | projects, project_team, milestones, milestone_logs |
| 6 | 📋 Phase 6 | Task Templates → DB | task_templates, task_template_items |
| 7 | 📋 Phase 7 | KPI Engine + Snapshots + Config → DB | kpi_snapshots, kpi_config, kpi_pending_changes |
| 8 | 📋 Phase 8 | Documents + Invoices → DB | documents, invoices, invoice_terms |
| 9 | 📋 Phase 9 | CRM modul (scope teman) → DB | campaigns, forms, leads, meetings, dst |
| 10 | 📋 Phase 10 | Test coverage minimal per modul | — |

## 9. Decisions log

Pilihan arsitektur yang tidak konvensional + alasannya:

| Keputusan | Alasan |
|---|---|
| Per-layer (controllers/, repositories/) bukan per-module (modules/users/) | Kode yang sudah ada konsisten ini; refactor ke per-module risk break running auth flow tanpa benefit signifikan untuk skripsi-scale. |
| Schema.sql DROP+CREATE bukan migrations bertahap | Dev/skripsi mode — re-runnable. Production akan butuh Knex/Sequelize migrations. |
| seed-data.json di luar src/ (di `scripts/`) | Plain credentials gitignored di luar source code utama. Aman. |
| Permissions di DB, bukan constants statis | Phase 3 update — mendukung dynamic permission grant tanpa redeploy frontend. |
| Validate inline di controller, bukan middleware | Validation logic per-endpoint masih kecil. Akan promote ke `validators/` kalau growing. |
| Service layer kosong saat ini | Controller masih thin enough. Promote saat business logic complex (mis. KPI engine compute). |
| `lookup.routes.js` cross-feature endpoint | Convenience untuk dropdown frontend. Alternatif: tiap feature expose own list endpoint, tapi itu duplicate effort. |

---

**Last updated:** 2026-05-05 setelah Phase 1-3 implementation. Akan di-update tiap akhir phase berikutnya.
