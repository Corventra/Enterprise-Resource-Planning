// nfr-test.mjs — Pengujian NFR otomatis (KNF-01, 02, 03, 04, 06)
// CONFIG diisi dari kode nyata: routes/*.routes.js, .env, scripts/seed-data.json
// Jalankan: node nfr-test.mjs   (server backend harus hidup di localhost:3000)

const CONFIG = {
  BASE_URL: "http://localhost:4777",
  LOGIN_PATH: "/api/auth/login",

  // Akun uji per peran (dari scripts/seed-data.json). Lingkup skripsi: post-handover + KPI.
  ACCOUNTS: {
    CEO:        { email: "galihgumilang@dsk-global.id", password: "DSKGlobal2024" },
    COO:        { email: "suparnawijaya@dsk-global.id", password: "DSKGlobal2024" },
    PM:         { email: "girang.adipura@dsk-global.id", password: "Kiara1905" },   // pm_user_id=5, owner project 1 & 4
    CONSULTANT: { email: "revy.oktafiano@dsk-global.id", password: "Oktaviano11" }, // user id=8
    SUPERADMIN: { email: "muhamad.faried@dsk-global.id", password: "DSKGlobal2024" },
  },

  // KNF-01: endpoint data yang dimuat tiap dashboard + peran pengaksesnya
  DASHBOARD_ENDPOINTS: [
    { name: "Dashboard CEO",             role: "CEO",        method: "GET", path: "/api/dashboard/ceo" },
    { name: "Dashboard COO",             role: "COO",        method: "GET", path: "/api/dashboard/coo" },
    { name: "Dashboard PM",              role: "PM",         method: "GET", path: "/api/dashboard/pm" },
    { name: "Dashboard Consultant",      role: "CONSULTANT", method: "GET", path: "/api/dashboard/consultant" },
    { name: "Detail Project (PM)",       role: "PM",         method: "GET", path: "/api/projects/1" },
  ],

  // KNF-02: perhitungan KPI. Dashboard Consultant menghitung 4 dimensi KPI (WSM) live untuk konsultan login.
  KPI_COMPUTE: { name: "Perhitungan KPI Consultant (WSM live)", role: "CONSULTANT", method: "GET", path: "/api/dashboard/consultant" },

  // KNF-03: endpoint terproteksi (tanpa token / token invalid harus -> 401). Representatif lintas seluruh router.
  PROTECTED_ENDPOINTS: [
    { method: "GET",    path: "/api/users" },
    { method: "GET",    path: "/api/lookup/roles" },
    { method: "GET",    path: "/api/departments" },
    { method: "GET",    path: "/api/campaigns" },
    { method: "GET",    path: "/api/bank-data" },
    { method: "GET",    path: "/api/lead-tracker" },
    { method: "GET",    path: "/api/proposal-masters/services" },
    { method: "GET",    path: "/api/approvals/handovers/pending" },
    { method: "GET",    path: "/api/handovers" },
    { method: "GET",    path: "/api/invoices" },
    { method: "GET",    path: "/api/projects" },
    { method: "GET",    path: "/api/projects/1" },
    { method: "GET",    path: "/api/projects/1/handover" },
    { method: "GET",    path: "/api/projects/1/audit-trail" },
    { method: "GET",    path: "/api/kpi/config" },
    { method: "GET",    path: "/api/kpi/snapshots" },
    { method: "GET",    path: "/api/task-templates" },
    { method: "GET",    path: "/api/dashboard/ceo" },
    { method: "GET",    path: "/api/dashboard/coo" },
    { method: "GET",    path: "/api/dashboard/pm" },
    { method: "GET",    path: "/api/dashboard/consultant" },
    { method: "GET",    path: "/api/meetings" },
    { method: "GET",    path: "/api/document-center" },
    { method: "GET",    path: "/api/notifications" },
    { method: "GET",    path: "/api/notifications/unread-count" },
    { method: "POST",   path: "/api/projects/from-handover/1" },
    { method: "POST",   path: "/api/projects/1/complete" },
    { method: "PUT",    path: "/api/kpi/config" },
    { method: "DELETE", path: "/api/users/1" },
  ],

  // KNF-04: akses lintas-peran (harus ditolak -> 403). Sesuai matriks hak akses (role_permissions).
  RBAC_TESTS: [
    { role: "CONSULTANT", desc: "Consultant melihat daftar pengguna (butuh USER_MANAGE)",   method: "GET", path: "/api/users" },
    { role: "CONSULTANT", desc: "Consultant mengubah konfigurasi KPI (butuh KPI_CONFIGURE)", method: "PUT", path: "/api/kpi/config", body: {} },
    { role: "CONSULTANT", desc: "Consultant membuka Dashboard CEO",                          method: "GET", path: "/api/dashboard/ceo" },
    { role: "CONSULTANT", desc: "Consultant finalize snapshot KPI (butuh KPI_FINALIZE)",     method: "POST", path: "/api/kpi/snapshots", body: {} },
    { role: "PM",         desc: "PM mengubah konfigurasi KPI (hanya CEO)",                    method: "PUT", path: "/api/kpi/config", body: {} },
    { role: "PM",         desc: "PM melihat daftar pengguna (butuh USER_MANAGE)",             method: "GET", path: "/api/users" },
    { role: "PM",         desc: "PM membuka Dashboard CEO",                                   method: "GET", path: "/api/dashboard/ceo" },
    { role: "COO",        desc: "COO mengubah konfigurasi KPI (hanya CEO)",                   method: "PUT", path: "/api/kpi/config", body: {} },
    { role: "COO",        desc: "COO melihat daftar pengguna (butuh USER_MANAGE)",            method: "GET", path: "/api/users" },
    { role: "CONSULTANT", desc: "Consultant assign PM ke project (butuh PROJECT_ASSIGN_PM)", method: "POST", path: "/api/projects/from-handover/1", body: {} },
  ],

  // KNF-06: input tidak valid / transisi ilegal (harus 4xx terkontrol, server tidak crash).
  // Pakai SUPERADMIN agar lolos gate RBAC dan menguji penanganan business-rule/validasi, bukan 403.
  RELIABILITY_TESTS: [
    { role: "SUPERADMIN", desc: "Transisi ilegal: resume project berstatus Completed (project 1)", method: "POST",  path: "/api/projects/1/resume", body: {} },
    { role: "SUPERADMIN", desc: "Transisi ilegal: pause project berstatus Completed (project 1)",  method: "POST",  path: "/api/projects/1/pause", body: {} },
    { role: "SUPERADMIN", desc: "Buat project dari handover tidak ada (id 999999)",                 method: "POST",  path: "/api/projects/from-handover/999999", body: {} },
    { role: "SUPERADMIN", desc: "GET project id tidak ada (999999)",                                method: "GET",   path: "/api/projects/999999" },
    { role: "SUPERADMIN", desc: "Update milestone dgn status tidak valid",                          method: "PATCH", path: "/api/projects/1/milestones/1/status", body: { status: "INVALID_XYZ" } },
    { role: "SUPERADMIN", desc: "Body kosong pada create user",                                     method: "POST",  path: "/api/users", body: {} },
  ],

  HEALTH_PATH: "/api/health",
};

// ---------- MESIN UJI ----------
const results = { knf01: [], knf02: null, knf03: [], knf04: [], knf06: [] };
const REPEAT = 10;

async function login(role) {
  const acc = CONFIG.ACCOUNTS[role];
  if (!acc) return null;
  try {
    const r = await fetch(CONFIG.BASE_URL + CONFIG.LOGIN_PATH, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: acc.email, email: acc.email, password: acc.password }),
    });
    const data = await r.json().catch(() => ({}));
    return data.token || data.accessToken || (data.data && data.data.token) || null;
  } catch { return null; }
}

async function timedFetch(method, path, token, body) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;
  const t0 = performance.now();
  let status = 0;
  try {
    const r = await fetch(CONFIG.BASE_URL + path, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
    });
    status = r.status; await r.text().catch(() => {});
  } catch (e) { status = -1; }
  return { ms: performance.now() - t0, status };
}

function stats(arr) {
  const nums = arr.map(x => x.ms);
  return {
    min: Math.min(...nums).toFixed(0),
    max: Math.max(...nums).toFixed(0),
    avg: (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(0),
    lastStatus: arr[arr.length - 1].status,
  };
}

async function run() {
  const tokens = {};
  for (const role of Object.keys(CONFIG.ACCOUNTS)) {
    tokens[role] = await login(role);
    console.error(`[login] ${role}: ${tokens[role] ? "OK" : "GAGAL"}`);
  }

  // KNF-01
  for (const ep of CONFIG.DASHBOARD_ENDPOINTS) {
    const runs = [];
    for (let i = 0; i < REPEAT; i++) runs.push(await timedFetch(ep.method, ep.path, tokens[ep.role]));
    const s = stats(runs);
    results.knf01.push({ name: ep.name, ...s, ok: Number(s.avg) < 3000 });
  }

  // KNF-02
  {
    const ep = CONFIG.KPI_COMPUTE; const runs = [];
    for (let i = 0; i < REPEAT; i++) runs.push(await timedFetch(ep.method, ep.path, tokens[ep.role]));
    const s = stats(runs);
    results.knf02 = { name: ep.name, ...s, ok: Number(s.avg) < 5000 };
  }

  // KNF-03
  for (const ep of CONFIG.PROTECTED_ENDPOINTS) {
    const noTok  = await timedFetch(ep.method, ep.path, null);
    const badTok = await timedFetch(ep.method, ep.path, "invalid.token.value");
    results.knf03.push({ ep: `${ep.method} ${ep.path}`, noTok: noTok.status, badTok: badTok.status, ok: noTok.status === 401 && badTok.status === 401 });
  }

  // KNF-04
  for (const t of CONFIG.RBAC_TESTS) {
    const res = await timedFetch(t.method, t.path, tokens[t.role], t.body);
    results.knf04.push({ role: t.role, desc: t.desc, ep: `${t.method} ${t.path}`, status: res.status, ok: res.status === 403 });
  }

  // KNF-06
  for (const t of CONFIG.RELIABILITY_TESTS) {
    const res = await timedFetch(t.method, t.path, tokens[t.role], t.body);
    const health = await timedFetch("GET", CONFIG.HEALTH_PATH, null);
    results.knf06.push({ desc: t.desc, status: res.status, controlled: res.status >= 400 && res.status < 500, serverUp: health.status !== -1 });
  }

  print();
}

function print() {
  const P = (b) => (b ? "Terpenuhi" : "TIDAK Terpenuhi");
  console.log("\n### KNF-01 Response Time Dashboard (target < 3000 ms, n=10)\n");
  console.log("| Halaman | Min (ms) | Maks (ms) | Rata-rata (ms) | HTTP | Status |\n|---|---|---|---|---|---|");
  results.knf01.forEach(r => console.log(`| ${r.name} | ${r.min} | ${r.max} | ${r.avg} | ${r.lastStatus} | ${P(r.ok)} |`));

  console.log("\n### KNF-02 Waktu Perhitungan KPI (target < 5000 ms, n=10)\n");
  const k = results.knf02;
  console.log("| Proses | Min (ms) | Maks (ms) | Rata-rata (ms) | HTTP | Status |\n|---|---|---|---|---|---|");
  console.log(`| ${k.name} | ${k.min} | ${k.max} | ${k.avg} | ${k.lastStatus} | ${P(k.ok)} |`);

  console.log("\n### KNF-03 Proteksi Endpoint (harapan 401)\n");
  console.log("| Endpoint | Tanpa Token | Token Invalid | Sesuai? |\n|---|---|---|---|");
  results.knf03.forEach(r => console.log(`| ${r.ep} | ${r.noTok} | ${r.badTok} | ${r.ok ? "Ya" : "TIDAK"} |`));
  const lolos03 = results.knf03.filter(r => r.ok).length;
  console.log(`\n**Rekap KNF-03: ${lolos03}/${results.knf03.length} endpoint terproteksi (${(lolos03/results.knf03.length*100).toFixed(1)}%)**`);

  console.log("\n### KNF-04 RBAC (harapan 403)\n");
  console.log("| Peran | Skenario | Endpoint | Status | Sesuai? |\n|---|---|---|---|---|");
  results.knf04.forEach(r => console.log(`| ${r.role} | ${r.desc} | ${r.ep} | ${r.status} | ${r.ok ? "Ya" : "TIDAK"} |`));
  const lolos04 = results.knf04.filter(r => r.ok).length;
  console.log(`\n**Rekap KNF-04: ${lolos04}/${results.knf04.length} skenario ditolak sesuai (403)**`);

  console.log("\n### KNF-06 Keandalan / Penanganan Galat\n");
  console.log("| Skenario | Status Respons | Terkontrol (4xx)? | Server Tetap Hidup? |\n|---|---|---|---|");
  results.knf06.forEach(r => console.log(`| ${r.desc} | ${r.status} | ${r.controlled ? "Ya" : "TIDAK"} | ${r.serverUp ? "Ya" : "TIDAK"} |`));
  const lolos06 = results.knf06.filter(r => r.controlled && r.serverUp).length;
  console.log(`\n**Rekap KNF-06: ${lolos06}/${results.knf06.length} galat direspons terkontrol tanpa crash**`);
}

run();
