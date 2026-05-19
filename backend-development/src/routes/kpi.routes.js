const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/require-permission');
const {
  getCurrentConfig,
  updateConfig,
  listSnapshots,
  listSnapshotsByConsultant,
  getSnapshotByConsultantAndPeriod,
  upsertSnapshot
} = require('../controllers/kpi.controller');

// Siapa pun dengan KPI_VIEW_OWN/TEAM/ALL boleh baca config supaya UI bisa
// render bobot/threshold yang sedang dipakai compute.
const readConfigStack = [
  authenticate,
  requirePermission(['KPI_VIEW_OWN', 'KPI_VIEW_TEAM', 'KPI_VIEW_ALL'], 'any')
];
// Update config hanya CEO (KPI_CONFIGURE).
const writeConfigStack = [authenticate, requirePermission('KPI_CONFIGURE')];

// Read snapshots: KPI_VIEW_OWN/TEAM/ALL. Scoping per role di-cek di frontend
// untuk simplifikasi (Phase 6c bisa tambah backend-side scoping).
const readSnapshotStack = [
  authenticate,
  requirePermission(['KPI_VIEW_OWN', 'KPI_VIEW_TEAM', 'KPI_VIEW_ALL'], 'any')
];
// Finalize/upsert snapshot: hanya CEO (KPI_FINALIZE_PERIOD).
const finalizeStack = [authenticate, requirePermission('KPI_FINALIZE_PERIOD')];

const router = express.Router();

router.get('/config', ...readConfigStack, getCurrentConfig);
router.put('/config', ...writeConfigStack, updateConfig);

router.get('/snapshots', ...readSnapshotStack, listSnapshots);
router.get('/snapshots/consultant/:userId', ...readSnapshotStack, listSnapshotsByConsultant);
router.get('/snapshots/consultant/:userId/:period', ...readSnapshotStack, getSnapshotByConsultantAndPeriod);
router.post('/snapshots', ...finalizeStack, upsertSnapshot);

module.exports = router;
