/**
 * KPI Calculations — Weighted Scoring Method (WSM) implementation.
 *
 * Port dari frontend `features/kpi/utils/kpi-calculations.ts` ke backend supaya
 * sistem bisa auto-compute KPI snapshot saat project completed (SYS KPI step
 * di Activity Diagram).
 *
 * Formula utama (KPI_total per konsultan per period):
 *
 *     KPI_total = w_TC * c_TC + w_TM * c_TM + w_UC * c_UC + w_OQ * c_OQ
 *
 * dimana:
 *   - c_TC = Task Completion    = Σ(weight × done) / Σ(weight) × 100%
 *   - c_TM = Timeliness          = onTimeCount / doneCount × 100%
 *   - c_UC = Update Compliance   = min(100, targetGapDays / avgGapDays × 100%)
 *   - c_OQ = Output Quality      = avgRating / 5 × 100%
 *
 * Semua capaian 0..100. Bobot dari `kpi_period_config` table (Σw_i ≈ 1.0).
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Parse period 'YYYY-MM' jadi [startMs, endMs] inclusive. Return null kalau
 * format invalid.
 */
const parsePeriodRange = (period) => {
  const m = /^(\d{4})-(\d{2})$/.exec(String(period || ''));
  if (!m) return null;
  const yyyy = Number(m[1]);
  const mm = Number(m[2]);
  if (!yyyy || mm < 1 || mm > 12) return null;
  const start = new Date(yyyy, mm - 1, 1).getTime();
  const end = new Date(yyyy, mm, 0, 23, 59, 59, 999).getTime();
  return [start, end];
};

/**
 * Cek apakah milestone "in scope" untuk satu period:
 *   - `completedAt` fall in period, ATAU
 *   - ada updateLog entry yang fall in period
 */
const isMilestoneInPeriod = (milestone, period) => {
  const range = parsePeriodRange(period);
  if (!range) return true;
  const [start, end] = range;

  if (milestone.completedAt) {
    const c = new Date(milestone.completedAt).getTime();
    if (!Number.isNaN(c) && c >= start && c <= end) return true;
  }
  return (milestone.updateLog || []).some((entry) => {
    const t = new Date(entry.at).getTime();
    return !Number.isNaN(t) && t >= start && t <= end;
  });
};

const filterUpdateLogByPeriod = (log, period) => {
  if (!period) return log;
  const range = parsePeriodRange(period);
  if (!range) return log;
  const [start, end] = range;
  return (log || []).filter((entry) => {
    const t = new Date(entry.at).getTime();
    return !Number.isNaN(t) && t >= start && t <= end;
  });
};

// =============================================================
// Dimension calculations
// =============================================================

/**
 * Task Completion (c_TC) = Σ(weight × done) / Σ(weight) × 100%.
 * Benefit indicator. Higher is better.
 */
const computeTaskCompletion = (milestones) => {
  const totalWeight = milestones.reduce((sum, m) => sum + Number(m.weight || 0), 0);
  if (totalWeight === 0) return { capaian: 0, rawValue: 0 };
  const doneWeight = milestones
    .filter((m) => m.status === 'Done')
    .reduce((sum, m) => sum + Number(m.weight || 0), 0);
  const ratio = doneWeight / totalWeight;
  return { capaian: ratio * 100, rawValue: ratio };
};

/**
 * Timeliness (c_TM) = onTimeCount / totalDoneCount × 100%.
 * "On time" = completedAt <= targetDate + onTimeToleranceDays.
 */
const computeTimeliness = (milestones, onTimeToleranceDays) => {
  const doneMilestones = milestones.filter((m) => m.status === 'Done' && m.completedAt);
  if (doneMilestones.length === 0) return { capaian: 0, rawValue: 0 };
  const onTime = doneMilestones.filter((m) => {
    const target = new Date(m.targetDate).getTime();
    const completed = new Date(m.completedAt).getTime();
    if (Number.isNaN(target) || Number.isNaN(completed)) return false;
    const diffDays = (completed - target) / MS_PER_DAY;
    return diffDays <= onTimeToleranceDays;
  });
  const ratio = onTime.length / doneMilestones.length;
  return { capaian: ratio * 100, rawValue: ratio };
};

/**
 * Update Compliance (c_UC) = min(100, targetGapDays / actualAvgGapDays × 100%).
 * Cost indicator (smaller gap is better) — di-cap 100% supaya tidak bias.
 *
 * Edge case: jika tidak ada gap data sama sekali (semua milestone < 2 entries),
 * return 100% — diasumsikan compliant by default (no work to track).
 */
const computeUpdateCompliance = (milestones, targetGapDays, period) => {
  const allGaps = [];
  milestones.forEach((m) => {
    const log = filterUpdateLogByPeriod(m.updateLog || [], period);
    for (let i = 1; i < log.length; i++) {
      const prev = new Date(log[i - 1].at).getTime();
      const curr = new Date(log[i].at).getTime();
      if (!Number.isNaN(prev) && !Number.isNaN(curr) && curr >= prev) {
        allGaps.push((curr - prev) / MS_PER_DAY);
      }
    }
  });
  if (allGaps.length === 0) return { capaian: 100, rawValue: 0 };
  const avgGap = allGaps.reduce((sum, g) => sum + g, 0) / allGaps.length;
  if (avgGap === 0) return { capaian: 100, rawValue: 0 };
  const capaian = Math.min(100, (targetGapDays / avgGap) * 100);
  return { capaian, rawValue: avgGap };
};

/**
 * Output Quality (c_OQ) = avgRating / 5 × 100%.
 * Hanya milestone yang punya quality_rating.
 */
const computeOutputQuality = (milestones, qualityRatingScale = 5) => {
  const rated = milestones.filter((m) => m.qualityRating != null);
  if (rated.length === 0) return { capaian: 0, rawValue: 0 };
  const sum = rated.reduce((acc, m) => acc + Number(m.qualityRating || 0), 0);
  const avg = sum / rated.length;
  return { capaian: (avg / qualityRatingScale) * 100, rawValue: avg };
};

/**
 * Total KPI = Σ(w_i × c_i).
 * Auto-normalize weights kalau sum != 1.0.
 */
const computeKpiTotal = (weights, capaian) => {
  const totalWeight =
    Number(weights.taskCompletion || 0) +
    Number(weights.timeliness || 0) +
    Number(weights.updateCompliance || 0) +
    Number(weights.outputQuality || 0);
  if (totalWeight === 0) return 0;
  const numerator =
    Number(weights.taskCompletion || 0) * Number(capaian.taskCompletion || 0) +
    Number(weights.timeliness || 0) * Number(capaian.timeliness || 0) +
    Number(weights.updateCompliance || 0) * Number(capaian.updateCompliance || 0) +
    Number(weights.outputQuality || 0) * Number(capaian.outputQuality || 0);
  return numerator / totalWeight;
};

/**
 * Aggregate function — kalkulasi seluruh 4 dimensi + total.
 *
 * @param {Array} milestones      List milestone (filtered by period scope)
 * @param {object} config         { weights, onTimeToleranceDays, updateGapTargetDays, qualityRatingScale }
 * @param {string} period         'YYYY-MM'
 * @returns {{ capaian: {...}, total: number }}
 */
const computeFullKpi = (milestones, config, period) => {
  const inScope = milestones.filter((m) => isMilestoneInPeriod(m, period));

  const tc = computeTaskCompletion(inScope);
  const tm = computeTimeliness(inScope, config.onTimeToleranceDays);
  const uc = computeUpdateCompliance(inScope, config.updateGapTargetDays, period);
  const oq = computeOutputQuality(inScope, config.qualityRatingScale);

  const capaian = {
    taskCompletion: tc.capaian,
    timeliness: tm.capaian,
    updateCompliance: uc.capaian,
    outputQuality: oq.capaian
  };
  const total = computeKpiTotal(config.weights, capaian);

  return { capaian, total };
};

module.exports = {
  parsePeriodRange,
  isMilestoneInPeriod,
  filterUpdateLogByPeriod,
  computeTaskCompletion,
  computeTimeliness,
  computeUpdateCompliance,
  computeOutputQuality,
  computeKpiTotal,
  computeFullKpi
};
