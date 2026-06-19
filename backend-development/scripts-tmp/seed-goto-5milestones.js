require('dotenv').config();
const mysql = require('mysql2/promise');

const PROJECT_ID = 3; // PRJ-2026-0002 GoTo
const REVY = { id: 8, name: 'Muhammad Revy Oktafiano' };
const SAUSAN = { id: 9, name: 'Sausan Zhafir Qunayta' };
const MATTHEW = { id: 11, name: 'Matthew Rafael Rajagukguk' };
const SILVANIA = { id: 12, name: 'Silvania Annisa' };

// 5 milestones — konsisten dengan Telkom.
// MF Group & CbCR digabung jadi 1 milestone "Master File & CbCR Documentation"
// supaya jumlah milestone sama tapi scope MF/LF/CbCR tetap ter-cover.
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
    target: '2026-06-05', weight: 25,
    owner: SAUSAN, status: 'Done', completed: '2026-06-03 16:30:00', rating: 4, rev: 1
  },
  {
    seq: 3, title: 'Master File & CbCR Documentation',
    notes: 'Master File: group structure, value chain seluruh grup GoTo (Gojek + Tokopedia + GoTo Financial). CbCR: data revenue / profit / tax paid per jurisdiction (ID, SG, IN, MY).',
    target: '2026-06-18', weight: 20,
    owner: SILVANIA, status: 'Done', completed: '2026-06-11 15:30:00', rating: 4, rev: 2
  },
  {
    seq: 4, title: 'Comparable Search & Benchmarking',
    notes: 'Database search (Orbis / RoyaltyStat) untuk comparable companies — transaksi intercompany: license fee, management service fee, IT shared service.',
    target: '2026-07-05', weight: 25,
    owner: MATTHEW, status: 'In Progress', completed: null, rating: null, rev: null
  },
  {
    seq: 5, title: 'QC Review & Client Discussion',
    notes: 'Final QC: review konsistensi MF/LF/CbCR, pre-submission discussion dengan client, finalize submission ke DJP.',
    target: '2026-07-31', weight: 20,
    owner: REVY, status: 'Pending', completed: null, rating: null, rev: null
  }
];

const updates = [
  // m1 Kickoff (Revy): May 19 → May 22 (3 days)
  { seq: 1, by: REVY, from: 'Pending', to: 'In Progress', note: 'Kickoff meeting dijadwalkan minggu ini.', at: '2026-05-19 09:30:00' },
  { seq: 1, by: REVY, from: 'In Progress', to: 'Done', note: 'Kickoff selesai. Document checklist diserahkan ke tim client (deadline submit: 1 minggu).', at: '2026-05-22 11:00:00' },

  // m2 LF Functional (Sausan): May 27 → Jun 3 (7 days)
  { seq: 2, by: SAUSAN, from: 'Pending', to: 'In Progress', note: 'Mulai FAR analysis untuk PT GoTo Indonesia.', at: '2026-05-27 09:00:00' },
  { seq: 2, by: SAUSAN, from: 'In Progress', to: 'Done', note: 'FAR analysis selesai: 5 functions identified (R&D, marketing, IT support, BPO, management). 2 revisi minor dari PM.', at: '2026-06-03 16:30:00' },

  // m3 MF & CbCR (Silvania): Jun 4 → Jun 11 (7 days)
  { seq: 3, by: SILVANIA, from: 'Pending', to: 'In Progress', note: 'Mulai mapping group structure & data CbCR per jurisdiction.', at: '2026-06-04 10:00:00' },
  { seq: 3, by: SILVANIA, from: 'In Progress', to: 'Done', note: 'Master File draft + CbCR table selesai. 4 entitas group (ID/SG/IN/MY) ter-konsolidasi: revenue, PBT, tax paid/accrued, employees.', at: '2026-06-11 15:30:00' },

  // m4 Benchmarking (Matthew): Jun 15 → currently active
  { seq: 4, by: MATTHEW, from: 'Pending', to: 'In Progress', note: 'Mulai database search (Orbis ASIA region) untuk comparable IT shared service & management fee.', at: '2026-06-15 10:00:00' }
];

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME
  });

  try {
    await conn.beginTransaction();

    const [d1] = await conn.query("DELETE FROM project_milestones WHERE project_id=?", [PROJECT_ID]);
    console.log('Deleted ' + d1.affectedRows + ' old milestone(s) + cascade updates.');

    const seqToId = {};
    for (const m of milestones) {
      const [r] = await conn.query(
        `INSERT INTO project_milestones
          (project_id, title, notes, target_date, status,
           owner_user_id, owner_name_snapshot, weight, sequence_no,
           completed_at, quality_rating, revision_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [PROJECT_ID, m.title, m.notes, m.target, m.status,
         m.owner.id, m.owner.name, m.weight, m.seq,
         m.completed, m.rating, m.rev]
      );
      seqToId[m.seq] = r.insertId;
      console.log('  m' + m.seq + ' [' + m.status + '] owner=' + m.owner.name + ' w=' + m.weight + ' rating=' + (m.rating || '-') + ' → id=' + r.insertId);
    }

    for (const u of updates) {
      await conn.query(
        `INSERT INTO project_milestone_updates
          (milestone_id, by_user_id, by_name_snapshot, from_status, to_status, note, at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [seqToId[u.seq], u.by.id, u.by.name, u.from, u.to, u.note, u.at]
      );
    }
    console.log('Inserted ' + updates.length + ' update log row(s).');

    const [dS] = await conn.query(
      `DELETE FROM kpi_snapshots
       WHERE period='2026-06'
         AND finalized_at IS NULL
         AND consultant_user_id IN (?, ?, ?, ?)`,
      [REVY.id, SAUSAN.id, MATTHEW.id, SILVANIA.id]
    );
    console.log('Deleted ' + dS.affectedRows + ' stale preliminary KPI snapshot(s).');

    const [check] = await conn.query(
      `SELECT sequence_no, title, status, owner_name_snapshot, weight, quality_rating
       FROM project_milestones WHERE project_id=? ORDER BY sequence_no`,
      [PROJECT_ID]
    );
    console.log('\n=== Final state (5 milestones) ===');
    check.forEach(m => {
      const tag = m.status === 'Done' ? '[OK Done]' :
                  m.status === 'In Progress' ? '[InProg ]' :
                  '[Pending]';
      console.log('  ' + tag + ' seq ' + m.sequence_no + ' (w=' + m.weight + ', ' + m.owner_name_snapshot.split(' ')[0] + ', rating=' + (m.quality_rating || '-') + ') ' + m.title);
    });

    const doneW = check.filter(m=>m.status==='Done').reduce((s,m)=>s+m.weight,0);
    const inProgW = check.filter(m=>m.status==='In Progress').reduce((s,m)=>s+m.weight,0);
    console.log('\nProgress: Done=' + doneW + '% + InProgress=' + inProgW + '% = ' + (doneW+inProgW) + '% started.');

    // Per-consultant load
    const byOwner = {};
    check.forEach(m => {
      if (!byOwner[m.owner_name_snapshot]) byOwner[m.owner_name_snapshot] = [];
      byOwner[m.owner_name_snapshot].push(m);
    });
    console.log('\nLoad per consultant:');
    Object.entries(byOwner).forEach(([name, ms]) => {
      const doneCount = ms.filter(m=>m.status==='Done').length;
      const ratings = ms.filter(m=>m.quality_rating).map(m=>m.quality_rating);
      const avgRating = ratings.length > 0 ? (ratings.reduce((s,r)=>s+r,0)/ratings.length).toFixed(2) : '-';
      console.log('  ' + name + ': ' + ms.length + ' task(s), ' + doneCount + ' done, avg rating=' + avgRating);
    });

    await conn.commit();
    console.log('\n=== COMMIT BERHASIL ===');
  } catch (e) {
    await conn.rollback();
    console.error('ROLLBACK:', e.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
})();
