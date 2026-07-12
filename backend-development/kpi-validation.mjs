// kpi-validation.mjs — Validasi perhitungan KPI terhadap FUNGSI SISTEM ASLI.
// Memanggil computeFullKpi + fungsi dimensi dari src/services/kpi/kpi-calculations.js
// (tidak menulis ulang rumus). Bandingkan hasil sistem vs perhitungan manual.
// Jalankan: node kpi-validation.mjs

import { createRequire } from "module";
const require = createRequire(import.meta.url);
// >>> import fungsi KPI ASLI (module CommonJS)
const {
  computeTaskCompletion,
  computeTimeliness,
  computeUpdateCompliance,
  computeOutputQuality,
  computeFullKpi,
} = require("./src/services/kpi/kpi-calculations.js");

// Parameter dari kpi_period_config (config_id=1) — nilai NYATA dari DB:
const CONFIG = {
  weights: { taskCompletion: 0.35, timeliness: 0.25, updateCompliance: 0.15, outputQuality: 0.25 },
  onTimeToleranceDays: 2,   // on_time_tolerance_days
  updateGapTargetDays: 3,   // update_gap_target_days
  qualityRatingScale: 5,    // quality_rating_scale
};

// ---------- SKENARIO TERKONTROL (angka bulat) ----------
// Field SESUAI kode nyata: weight, status, targetDate, completedAt, qualityRating,
// updateLog:[{at}]
const SCENARIOS = [
  { id: "SK-01", nama: "Sempurna (semua ideal)", milestones: [
    { weight:25, status:"Done", targetDate:"2025-01-10", completedAt:"2025-01-10", qualityRating:5, updateLog:[{at:"2025-01-01"},{at:"2025-01-04"},{at:"2025-01-07"},{at:"2025-01-10"}] },
    { weight:25, status:"Done", targetDate:"2025-01-20", completedAt:"2025-01-18", qualityRating:5, updateLog:[{at:"2025-01-11"},{at:"2025-01-14"},{at:"2025-01-17"},{at:"2025-01-20"}] },
    { weight:25, status:"Done", targetDate:"2025-01-30", completedAt:"2025-01-29", qualityRating:5, updateLog:[{at:"2025-01-21"},{at:"2025-01-24"},{at:"2025-01-27"},{at:"2025-01-30"}] },
    { weight:25, status:"Done", targetDate:"2025-02-10", completedAt:"2025-02-10", qualityRating:5, updateLog:[{at:"2025-02-01"},{at:"2025-02-04"},{at:"2025-02-07"},{at:"2025-02-10"}] },
  ]},
  { id: "SK-02", nama: "Buruk (banyak gagal)", milestones: [
    { weight:25, status:"Done",        targetDate:"2025-01-10", completedAt:"2025-01-15", qualityRating:2, updateLog:[{at:"2025-01-01"},{at:"2025-01-13"}] },
    { weight:25, status:"Done",        targetDate:"2025-01-20", completedAt:"2025-01-20", qualityRating:4, updateLog:[{at:"2025-01-08"},{at:"2025-01-20"}] },
    { weight:25, status:"In Progress", targetDate:"2025-01-30", completedAt:null,         qualityRating:null, updateLog:[{at:"2025-01-21"}] },
    { weight:25, status:"In Progress", targetDate:"2025-02-10", completedAt:null,         qualityRating:null, updateLog:[{at:"2025-02-01"}] },
  ]},
  { id: "SK-03", nama: "Campuran (realistis)", milestones: [
    { weight:40, status:"Done",        targetDate:"2025-01-10", completedAt:"2025-01-09", qualityRating:4, updateLog:[{at:"2025-01-01"},{at:"2025-01-04"},{at:"2025-01-07"},{at:"2025-01-10"}] },
    { weight:30, status:"Done",        targetDate:"2025-01-20", completedAt:"2025-01-25", qualityRating:3, updateLog:[{at:"2025-01-11"},{at:"2025-01-20"}] },
    { weight:30, status:"In Progress", targetDate:"2025-01-30", completedAt:null,         qualityRating:null, updateLog:[{at:"2025-01-21"},{at:"2025-01-27"}] },
  ]},
  { id: "SK-04", nama: "Tanpa milestone (pembagi nol)", milestones: [] },
  { id: "SK-05", nama: "Belum ada rating kualitas", milestones: [
    { weight:50, status:"Done", targetDate:"2025-01-10", completedAt:"2025-01-10", qualityRating:null, updateLog:[{at:"2025-01-01"},{at:"2025-01-04"},{at:"2025-01-07"},{at:"2025-01-10"}] },
    { weight:50, status:"Done", targetDate:"2025-01-20", completedAt:"2025-01-19", qualityRating:null, updateLog:[{at:"2025-01-11"},{at:"2025-01-14"},{at:"2025-01-17"},{at:"2025-01-20"}] },
  ]},
];

// ---------- PERHITUNGAN MANUAL (referensi harapan, mengikuti RUMUS ACUAN + aturan edge kode) ----------
const MS_PER_DAY = 86400000;
const dayDiff = (a, b) => (new Date(a) - new Date(b)) / MS_PER_DAY;
function expected(ms, C) {
  const totW = ms.reduce((s,m)=>s+(m.weight||0),0);
  const doneW = ms.filter(m=>m.status==="Done").reduce((s,m)=>s+(m.weight||0),0);
  const tc = totW ? (doneW/totW*100) : 0;

  const done = ms.filter(m=>m.status==="Done" && m.completedAt);
  const onTime = done.filter(m=>dayDiff(m.completedAt,m.targetDate) <= C.onTimeToleranceDays).length;
  const tm = done.length ? (onTime/done.length*100) : 0;

  const rated = ms.filter(m=>m.qualityRating!=null);
  const oq = rated.length ? (rated.reduce((s,m)=>s+m.qualityRating,0)/rated.length/C.qualityRatingScale*100) : 0;

  const gaps=[];
  ms.forEach(m=>{ const log=(m.updateLog||[]); for(let i=1;i<log.length;i++){ const g=dayDiff(log[i].at,log[i-1].at); if(g>=0) gaps.push(g);} });
  const avgGap = gaps.length ? gaps.reduce((a,b)=>a+b,0)/gaps.length : 0;
  const uc = gaps.length===0 ? 100 : (avgGap===0 ? 100 : Math.min(100, C.updateGapTargetDays/avgGap*100)); // aturan kode: no-gap => 100

  const w=C.weights, sumW=w.taskCompletion+w.timeliness+w.updateCompliance+w.outputQuality;
  const total=(w.taskCompletion*tc+w.timeliness*tm+w.updateCompliance*uc+w.outputQuality*oq)/sumW;
  return { tc, tm, oq, uc, total };
}

// ---------- HASIL SISTEM (panggil fungsi ASLI) ----------
function systemActual(ms, C) {
  const full = computeFullKpi(ms, C, null); // period=null -> semua milestone in-scope
  return {
    tc: full.capaian.taskCompletion,
    tm: full.capaian.timeliness,
    oq: full.capaian.outputQuality,
    uc: full.capaian.updateCompliance,
    total: full.total,
    // cek konsistensi fungsi dimensi individual (dipanggil terpisah):
    _dim: {
      tc: computeTaskCompletion(ms).capaian,
      tm: computeTimeliness(ms, C.onTimeToleranceDays).capaian,
      uc: computeUpdateCompliance(ms, C.updateGapTargetDays, null).capaian,
      oq: computeOutputQuality(ms, C.qualityRatingScale).capaian,
    },
  };
}

// ---------- EKSEKUSI & CETAK ----------
const f = (x)=> (x==null?"-":Number(x).toFixed(2));
let validCount=0; const summary=[];
for (const s of SCENARIOS) {
  console.log(`\n## ${s.id} — ${s.nama}`);
  let exp, act, err=null;
  try { exp = expected(s.milestones, CONFIG); } catch(e){ exp=null; console.log("Harapan error:",e.message); }
  try { act = systemActual(s.milestones, CONFIG); } catch(e){ act=null; err=e.message; console.log("SISTEM ERROR/CRASH:",e.message); }

  const rows=[["Task Completion","tc"],["Timeliness","tm"],["Output Quality","oq"],["Update Compliance","uc"],["TOTAL KPI","total"]];
  console.log("| Dimensi | Harapan (manual) | Hasil Sistem | Selisih | Status |");
  console.log("|---|---|---|---|---|");
  let allOk=true;
  for (const [nama,key] of rows) {
    const e=exp?.[key], a=act?.[key];
    const diff=(e!=null&&a!=null)?Math.abs(e-a):null;
    const ok=diff!=null&&diff<0.01;
    if(!ok) allOk=false;
    console.log(`| ${nama} | ${f(e)} | ${f(a)} | ${diff==null?"-":f(diff)} | ${ok?"Valid":"PERIKSA"} |`);
  }
  if(allOk && !err) validCount++;
  summary.push({id:s.id, ok: allOk && !err, crash: !!err, total_exp: exp?.total, total_act: act?.total});
}

console.log(`\n\n## REKAP: ${validCount}/${SCENARIOS.length} skenario Valid (semua dimensi cocok, selisih < 0.01)`);
summary.forEach(r=> console.log(`- ${r.id}: ${r.crash?"CRASH":r.ok?"Valid":"ADA SELISIH"} | Total harapan=${f(r.total_exp)} sistem=${f(r.total_act)}`));
