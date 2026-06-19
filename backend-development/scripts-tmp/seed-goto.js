require('dotenv').config();
const mysql = require('mysql2/promise');

const PROJECT_ID = 3; // PRJ-2026-0002 GoTo
const PM_USER_ID = 6; // Panji Ega Saputra
const REVY = { id: 8, name: 'Muhammad Revy Oktafiano' };
const SAUSAN = { id: 9, name: 'Sausan Zhafir Qunayta' };
const MATTHEW = { id: 11, name: 'Matthew Rafael Rajagukguk' };
const SILVANIA = { id: 12, name: 'Silvania Annisa' };

// 6 milestones, total weight 100, distribusi fair berdasar level + complexity
const milestones = [
  {
    seq: 1, title: 'Kickoff & Document Request',
    notes: 'Project initiation, kickoff meeting dengan client, request supporting documents (TP policy, FS 3-tahun, intercompany contracts).',
    target: '2026-05-25', weight: 10,
    owner: REVY, status: 'Done', completed: '2026-05-22 11:00:00', rating: 5, rev: 0
  },
  {
    seq: 2, title: 'Local File - Functional Analysis',
    notes: 'FAR analysis untuk entitas Indonesia (PT GoTo Gojek Tokopedia Tbk) sebagai parent + Local File risk profiling.',
    target: '2026-06-05', weight: 20,
    owner: SAUSAN, status: 'Done', completed: '2026-06-03 16:30:00', rating: 4, rev: 1
  },
  {
    seq: 3, title: 'Master File - Group Structure & Business Overview',
    notes: 'Master File: chart of organization, value chain analysis seluruh grup GoTo (Gojek + Tokopedia + GoTo Financial), 5 key drivers of profit.',
    target: '2026-06-15', weight: 25,
    owner: REVY, status: 'Done', completed: '2026-06-13 14:45:00', rating: 4, rev: 2
  },
  {
    seq: 4, title: 'Comparable Search & Benchmarking',
    notes: 'Database search (Orbis / RoyaltyStat) untuk comparable companies untuk transaksi intercompany: license fee, management service fee, IT shared service.',
    target: '2026-07-01', weight: 20,
    owner: MATTHEW, status: 'In Progress', completed: null, rating: null, rev: null
  },
  {
    seq: 5, title: 'CbCR Preparation',
    notes: 'Country-by-Country Reporting per jurisdiction (ID, SG, IN). Konsolidasi data revenue, profit before tax, income tax paid/accrued, employees.',
    target: '2026-07-15', weight: 15,
    owner: SILVANIA, status: 'Pending', completed: null, rating: null, rev: null
  },
  {
    seq: 6, title: 'QC Review & Client Discussion',
    notes: 'Final QC: review konsistensi MF/LF/CbCR, pre-submission discussion dengan client, finalize submission ke DJP.',
    target: '2026-07-31', weight: 10,
    owner: REVY, status: 'Pending', completed: null, rating: null, rev: null
  }
];

// Update logs untuk reconstruct audit trail
const updates = [
  // m1 Kickoff (Revy): Pending → In Progress (2026-05-19), → Done (2026-05-22)
  { seq: 1, by: REVY, from: 'Pending', to: 'In Progress', note: 'Kickoff meeting dijadwalkan minggu ini.', at: '2026-05-19 09:30:00' },
  { seq: 1, by: REVY, from: 'In Progress', to: 'Done', note: 'Kickoff selesai. Document checklist diserahkan ke tim client (deadline submit: 1 minggu).', at: '2026-05-22 11:00:00' },

  // m2 LF Functional (Sausan): Pending → In Progress (2026-05-27), → Done (2026-06-03) — 7 days
  { seq: 2, by: SAUSAN, from: 'Pending', to: 'In Progress', note: 'Mulai FAR analysis untuk PT GoTo Indonesia.', at: '2026-05-27 09:00:00' },
  { seq: 2, by: SAUSAN, from: 'In Progress', to: 'Done', note: 'FAR analysis selesai: 5 functions identified (R&D, marketing, IT support, BPO, management). 2 revisi minor dari PM.', at: '2026-06-03 16:30:00' },

  // m3 MF Group (Revy): Pending → In Progress (2026-06-06), → Done (2026-06-13) — 7 days
  { seq: 3, by: REVY, from: 'Pending', to: 'In Progress', note: 'Mulai mapping group structure & value chain GoTo Group.', at: '2026-06-06 09:30:00' },
  { seq: 3, by: REVY, from: 'In Progress', to: 'Done', note: 'Master File draft selesai: 3 line of business (Gojek/Tokopedia/GoTo Financial), 4 entitas group (ID/SG/IN/MY). 2 round revisi sesuai feedback PM.', at: '2026-06-13 14:45:00' },

  // m4 Benchmarking (Matthew): Pending → In Progress (2026-06-15) — currently active
  { seq: 4, by: MATTHEW, from: 'Pending', to: 'In Progress', note: 'Mulai database search (Orbis ASIA region) untuk comparable IT shared service & management fee.', at: '2026-06-15 10:00:00' }
];

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME
  });

  try {
    await conn.beginTransaction();

    // 1. Hapus milestone placeholder lama (CASCADE akan hapus updates juga)
    const [d1] = await conn.query("DELETE FROM project_milestones WHERE project_id=?", [PROJECT_ID]);
    console.log('Deleted ' + d1.affectedRows + ' old milestone(s).');

    // 2. Insert 6 milestones baru
    const seqToId = {};
    for (const m of milestones) {
      const [r] = await conn.query(
        `INSERT INTO project_milestones
          (project_id, title, notes, target_date, status,
           owner_user_id, owner_name_snapshot, weight, sequence_no,
           completed_at, quality_rating, revision_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          PROJECT_ID, m.title, m.notes, m.target, m.status,
          m.owner.id, m.owner.name, m.weight, m.seq,
          m.completed, m.rating, m.rev
        ]
      );
      seqToId[m.seq] = r.insertId;
      console.log('  m' + m.seq + ' (' + m.status + ', owner=' + m.owner.name + ', weight=' + m.weight + ') → milestone_id=' + r.insertId);
    }

    // 3. Insert update logs
    for (const u of updates) {
      await conn.query(
        `INSERT INTO project_milestone_updates
          (milestone_id, by_user_id, by_name_snapshot, from_status, to_status, note, at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [seqToId[u.seq], u.by.id, u.by.name, u.from, u.to, u.note, u.at]
      );
    }
    console.log('Inserted ' + updates.length + ' update log row(s).');

    // 4. Extend project end_date jadi 2026-07-31 (project belum selesai)
    await conn.query(
      "UPDATE projects SET end_date='2026-07-31' WHERE project_id=?",
      [PROJECT_ID]
    );
    console.log('Project end_date extended to 2026-07-31.');

    // 5. Hapus snapshot KPI 2026-06 preliminary (akan re-compute fresh)
    const [dS] = await conn.query(
      `DELETE FROM kpi_snapshots
       WHERE period='2026-06'
         AND finalized_at IS NULL
         AND consultant_user_id IN (?, ?, ?, ?)`,
      [REVY.id, SAUSAN.id, MATTHEW.id, SILVANIA.id]
    );
    console.log('Deleted ' + dS.affectedRows + ' stale preliminary KPI snapshot(s).');

    // 6. Verifikasi
    const [check] = await conn.query(
      `SELECT sequence_no, title, status, owner_name_snapshot, weight, quality_rating
       FROM project_milestones WHERE project_id=? ORDER BY sequence_no`,
      [PROJECT_ID]
    );
    console.log('\n=== Final milestone state ===');
    check.forEach(m => {
      const tag = m.status === 'Done' ? '[✓ Done]' :
                  m.status === 'In Progress' ? '[⟳ In Progress]' :
                  '[• Pending]';
      console.log('  ' + tag + ' seq ' + m.sequence_no + ' (w=' + m.weight + ', owner=' + m.owner_name_snapshot + ', rating=' + (m.quality_rating || '-') + ') ' + m.title);
    });

    const doneWeight = check.filter(m=>m.status==='Done').reduce((s,m)=>s+m.weight,0);
    const inProgWeight = check.filter(m=>m.status==='In Progress').reduce((s,m)=>s+m.weight,0);
    console.log('\nWeight progress: Done=' + doneWeight + '% + InProgress=' + inProgWeight + '% = ' + (doneWeight+inProgWeight) + '% started, ' + (100-doneWeight-inProgWeight) + '% not started.');

    await conn.commit();
    console.log('\n=== COMMIT BERHASIL ===');
  } catch (e) {
    await conn.rollback();
    console.error('ROLLBACK:', e.message, e.stack);
    process.exit(1);
  } finally {
    await conn.end();
  }
})();
