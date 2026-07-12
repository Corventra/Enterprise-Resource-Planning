// stress-test.mjs — KNF-10 Skalabilitas (setara k6, murni Node, tanpa dependency).
// Model: 50 concurrent virtual users (VU). Tiap VU login SEKALI lalu berulang
// memuat dashboard (read load) + think-time 1 dtk. Meniru metrik k6:
// http_req_failed (rate), http_req_duration (avg, p95), throughput (req/s).
// Jalankan: node stress-test.mjs   (server backend hidup di localhost:4777)

const BASE = "http://localhost:4777";
const PEAK_VU = 50;
const RAMP_MS = 15000;   // naikkan VU 0 -> 50 selama 15 dtk
const HOLD_MS = 45000;   // tahan 50 VU selama 45 dtk
const THINK_MS = 1000;   // jeda antar-request per VU
const ACC = { email: "revy.oktafiano@dsk-global.id", password: "Oktaviano11" }; // CONSULTANT
const TARGET = "/api/dashboard/consultant";

const durations = [];
let ok = 0, fail = 0, loginFail = 0;
let running = true;
const t0 = performance.now();

async function login() {
  try {
    const r = await fetch(BASE + "/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ACC),
    });
    const d = await r.json().catch(() => ({}));
    return d.token || null;
  } catch { return null; }
}

async function hit(token) {
  const s = performance.now();
  try {
    const r = await fetch(BASE + TARGET, { headers: { Authorization: "Bearer " + token } });
    await r.text().catch(() => {});
    const ms = performance.now() - s;
    durations.push(ms);
    if (r.status === 200) ok++; else fail++;
  } catch { fail++; durations.push(performance.now() - s); }
}

async function vu() {
  const token = await login();
  if (!token) { loginFail++; return; }
  while (running) {
    await hit(token);
    await new Promise((res) => setTimeout(res, THINK_MS));
  }
}

function pct(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
}

(async () => {
  const vus = [];
  // Ramp: start 1 VU tiap RAMP_MS/PEAK_VU
  const gap = RAMP_MS / PEAK_VU;
  for (let i = 0; i < PEAK_VU; i++) {
    vus.push(vu());
    await new Promise((res) => setTimeout(res, gap));
  }
  console.error(`[ramp selesai] ${PEAK_VU} VU aktif. Tahan ${HOLD_MS / 1000}s...`);
  await new Promise((res) => setTimeout(res, HOLD_MS));
  running = false;
  await Promise.allSettled(vus);

  const wall = (performance.now() - t0) / 1000;
  const total = ok + fail;
  const avg = durations.reduce((a, b) => a + b, 0) / (durations.length || 1);
  const failRate = total ? (fail / total) * 100 : 100;
  const thr = total / wall;

  console.log("\n### KNF-10 Stress Test — 50 concurrent VU (Node load test, setara k6)\n");
  console.log("| Metrik | Hasil |\n|---|---|");
  console.log(`| Jumlah VU (puncak) | ${PEAK_VU} |`);
  console.log(`| Durasi uji (wall) | ${wall.toFixed(0)} s |`);
  console.log(`| VU gagal login | ${loginFail} |`);
  console.log(`| Total request (dashboard) | ${total} |`);
  console.log(`| Request sukses (200) | ${ok} |`);
  console.log(`| Request gagal | ${fail} |`);
  console.log(`| Request gagal (%) | ${failRate.toFixed(2)}% |`);
  console.log(`| Response time rata-rata (ms) | ${avg.toFixed(0)} |`);
  console.log(`| p90 (ms) | ${pct(durations, 90).toFixed(0)} |`);
  console.log(`| p95 (ms) | ${pct(durations, 95).toFixed(0)} |`);
  console.log(`| Maks (ms) | ${(Math.max(...durations, 0)).toFixed(0)} |`);
  console.log(`| Throughput (req/s) | ${thr.toFixed(1)} |`);
  const pass = failRate < 5;
  console.log(`| Ambang k6: gagal<5% & p95<3000ms | fail=${failRate.toFixed(2)}% p95=${pct(durations,95).toFixed(0)}ms |`);
  console.log(`| Status | ${pass ? (pct(durations,95) < 3000 ? "Terpenuhi" : "Sebagian (p95>3s)") : "TIDAK Terpenuhi"} |`);
})();
