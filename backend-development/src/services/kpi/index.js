/**
 * KPI Compute Service — public entry point.
 *
 * Modul ini menyediakan:
 *   - WSM (Weighted Scoring Method) calculation untuk 4 dimensi KPI
 *   - Auto-compute preliminary snapshot saat project completed
 *   - Helper period & config fetching
 *
 * Lihat Activity Diagram WFMS bagian "SYS KPI Hitung KPI (WSM)" dan
 * "CEO FINALIZE Finalize KPI Periode" untuk konteks alur.
 */

const calculations = require('./kpi-calculations');
const computeService = require('./kpi-compute-service');

module.exports = {
  ...calculations,
  ...computeService
};
