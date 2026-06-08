/**
 * Shared analytics queries (trend + velocity + distribution + insights generator)
 * dipakai oleh dashboard CEO / COO / PM / Konsultan untuk section analitik.
 *
 * Semua function bersifat read-only dan tidak punya side-effect.
 * Filter scope di-pass via opts:
 *   - deptCodes:  array string  (COO scope; CEO = [] berarti all)
 *   - pmUserId:   integer       (PM scope; query terfilter)
 *   - userId:     integer       (Konsultan scope; query untuk self only)
 */

/**
 * Build array periode YYYY-MM dari 6 bulan terakhir, ending di end month dari `period`.
 * Output: [{ key: '2025-12', label: 'Des 25' }, ...].
 */
const buildPeriodKeys = (period, count = 6) => {
  const anchor = new Date(period.endExclusive);
  anchor.setDate(1);
  const pad2 = (n) => String(n).padStart(2, '0');
  const out = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    // d = first day of bucket month; nextMonth = first day of month setelahnya
    // (Date constructor auto-handle month overflow ke tahun depan, jadi aman).
    const d = new Date(anchor.getFullYear(), anchor.getMonth() - 1 - i, 1);
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
    const label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    out.push({
      key,
      label,
      startSql: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`,
      endExclusiveSql: `${nextMonth.getFullYear()}-${pad2(nextMonth.getMonth() + 1)}-01`
    });
  }
  return out;
};

const probeKpiSnapshots = async (conn) => {
  try {
    await conn.execute('SELECT 1 FROM kpi_snapshots LIMIT 1');
    return true;
  } catch (e) {
    if (e?.code === 'ER_NO_SUCH_TABLE') return false;
    throw e;
  }
};

/**
 * KPI Trend (6 periode) — return avg total + 4 dimensi avg per periode.
 * Scope options (mutually exclusive, first non-null wins):
 *   - userId            (integer)        — Konsultan mode (snapshot diri sendiri)
 *   - consultantUserIds (array integer)  — PM mode (team scope; consultant di project PM)
 *   - deptCodes         (array string)   — COO mode
 * Kalau semua null → CEO mode (organisasi).
 */
const buildKpiTrend = async (conn, { period, deptCodes = null, userId = null, consultantUserIds = null } = {}) => {
  const periods = buildPeriodKeys(period, 6);
  const emptyShape = {
    points: periods.map((p) => ({
      period: p.key,
      label: p.label,
      total_score: 0,
      task_completion: 0,
      timeliness: 0,
      update_compliance: 0,
      output_quality: 0,
      sample_size: 0
    }))
  };

  const tableExists = await probeKpiSnapshots(conn);
  if (!tableExists) return emptyShape;

  let scopeJoin = '';
  let scopeParams = [];
  if (userId != null) {
    scopeJoin = 'AND s.consultant_user_id = ?';
    scopeParams = [userId];
  } else if (Array.isArray(consultantUserIds) && consultantUserIds.length > 0) {
    scopeJoin = 'AND s.consultant_user_id IN (?)';
    scopeParams = [consultantUserIds];
  } else if (Array.isArray(consultantUserIds) && consultantUserIds.length === 0) {
    // PM mode but team kosong → return empty trend tanpa query
    return emptyShape;
  } else if (Array.isArray(deptCodes) && deptCodes.length > 0) {
    scopeJoin = `AND EXISTS (
      SELECT 1 FROM user_departments ud
      INNER JOIN departments d ON d.id = ud.department_id
      WHERE ud.user_id = s.consultant_user_id AND d.code IN (?)
    )`;
    scopeParams = [deptCodes];
  }

  const periodKeys = periods.map((p) => p.key);
  const [rows] = await conn.query(
    `SELECT s.period,
            AVG(s.total_score) AS avg_total,
            AVG(s.capaian_task_completion) AS avg_tc,
            AVG(s.capaian_timeliness) AS avg_tm,
            AVG(s.capaian_update_compliance) AS avg_uc,
            AVG(s.capaian_output_quality) AS avg_oq,
            COUNT(*) AS sample_size
       FROM kpi_snapshots s
      WHERE s.period IN (?) ${scopeJoin}
      GROUP BY s.period`,
    [periodKeys, ...scopeParams]
  );

  const byPeriod = new Map(rows.map((r) => [r.period, r]));
  const num = (v) => (v != null ? Number(Number(v).toFixed(2)) : 0);

  return {
    points: periods.map((p) => {
      const r = byPeriod.get(p.key);
      return {
        period: p.key,
        label: p.label,
        total_score: r ? num(r.avg_total) : 0,
        task_completion: r ? num(r.avg_tc) : 0,
        timeliness: r ? num(r.avg_tm) : 0,
        update_compliance: r ? num(r.avg_uc) : 0,
        output_quality: r ? num(r.avg_oq) : 0,
        sample_size: r ? Number(r.sample_size ?? 0) : 0
      };
    })
  };
};

/**
 * Project Velocity (6 bulan): created vs completed per bulan.
 */
const buildProjectVelocity = async (conn, { period, deptCodes = null, pmUserId = null } = {}) => {
  const periods = buildPeriodKeys(period, 6);

  let deptClause = '';
  let deptParams = [];
  if (Array.isArray(deptCodes) && deptCodes.length > 0) {
    deptClause = `AND d.code IN (?)`;
    deptParams = [deptCodes];
  }
  let pmClause = '';
  let pmParams = [];
  if (pmUserId != null) {
    pmClause = `AND p.pm_user_id = ?`;
    pmParams = [pmUserId];
  }

  const out = [];
  for (const pk of periods) {
    const [[createdRow]] = await conn.query(
      `SELECT COUNT(*) AS cnt
         FROM projects p
         INNER JOIN handovers h ON h.handover_id = p.handover_id
         LEFT JOIN departments d ON d.id = h.department_id
        WHERE p.created_at >= ? AND p.created_at < ?
          ${deptClause} ${pmClause}`,
      [pk.startSql, pk.endExclusiveSql, ...deptParams, ...pmParams]
    );
    const [[completedRow]] = await conn.query(
      `SELECT COUNT(*) AS cnt
         FROM projects p
         INNER JOIN handovers h ON h.handover_id = p.handover_id
         LEFT JOIN departments d ON d.id = h.department_id
        WHERE p.status = 'Completed'
          AND p.end_date >= ? AND p.end_date < ?
          ${deptClause} ${pmClause}`,
      [pk.startSql, pk.endExclusiveSql, ...deptParams, ...pmParams]
    );
    out.push({
      period: pk.key,
      label: pk.label,
      created: Number(createdRow?.cnt ?? 0),
      completed: Number(completedRow?.cnt ?? 0)
    });
  }
  return { points: out };
};

/**
 * Quality Rating Distribution — histogram 1..5 berdasarkan project_milestones.quality_rating.
 * Scope: optional dept filter (CEO/COO), atau PM (only ratings he/she gave).
 * NB: rating yang dianggap "given by PM" = milestone where pm_user_id = PM's userId.
 */
const buildRatingDistribution = async (conn, { deptCodes = null, pmUserId = null } = {}) => {
  let scopeClause = '';
  let scopeParams = [];

  if (pmUserId != null) {
    scopeClause = `AND p.pm_user_id = ?`;
    scopeParams = [pmUserId];
  } else if (Array.isArray(deptCodes) && deptCodes.length > 0) {
    scopeClause = `AND d.code IN (?)`;
    scopeParams = [deptCodes];
  }

  const [rows] = await conn.query(
    `SELECT m.quality_rating, COUNT(*) AS cnt
       FROM project_milestones m
       INNER JOIN projects p ON p.project_id = m.project_id
       INNER JOIN handovers h ON h.handover_id = p.handover_id
       LEFT JOIN departments d ON d.id = h.department_id
      WHERE m.quality_rating IS NOT NULL ${scopeClause}
      GROUP BY m.quality_rating
      ORDER BY m.quality_rating DESC`,
    scopeParams
  );

  const map = new Map(rows.map((r) => [Number(r.quality_rating), Number(r.cnt)]));
  const buckets = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: map.get(rating) || 0
  }));
  const total = buckets.reduce((sum, b) => sum + b.count, 0);
  const avg = total > 0
    ? Number((buckets.reduce((sum, b) => sum + b.rating * b.count, 0) / total).toFixed(2))
    : 0;

  return { buckets, total, average: avg };
};

/**
 * Konsultan: dimensi self vs dept avg (period berjalan).
 * Return [{ dimension, self_value, peer_avg, delta }] untuk 4 dimensi.
 */
const buildDimensionVsPeer = async (conn, { period, userId }) => {
  const periodKey = period.startSql.slice(0, 7);
  const dims = [
    { key: 'task_completion', column: 'capaian_task_completion', label: 'Task Completion' },
    { key: 'timeliness', column: 'capaian_timeliness', label: 'Timeliness' },
    { key: 'update_compliance', column: 'capaian_update_compliance', label: 'Update Compliance' },
    { key: 'output_quality', column: 'capaian_output_quality', label: 'Output Quality' }
  ];

  const tableExists = await probeKpiSnapshots(conn);
  if (!tableExists) {
    return { dimensions: dims.map((d) => ({ ...d, self_value: 0, peer_avg: 0, delta: 0 })) };
  }

  // Self
  const [[selfRow]] = await conn.query(
    `SELECT capaian_task_completion, capaian_timeliness,
            capaian_update_compliance, capaian_output_quality, total_score
       FROM kpi_snapshots
      WHERE consultant_user_id = ? AND period = ? LIMIT 1`,
    [userId, periodKey]
  );

  // Peer: same depts as this user, excluding self
  const [[peerRow]] = await conn.query(
    `SELECT
       AVG(s.capaian_task_completion) AS avg_tc,
       AVG(s.capaian_timeliness) AS avg_tm,
       AVG(s.capaian_update_compliance) AS avg_uc,
       AVG(s.capaian_output_quality) AS avg_oq,
       AVG(s.total_score) AS avg_total
     FROM kpi_snapshots s
     WHERE s.period = ?
       AND s.consultant_user_id <> ?
       AND EXISTS (
         SELECT 1 FROM user_departments ud_self
         INNER JOIN user_departments ud_peer
           ON ud_peer.department_id = ud_self.department_id
         WHERE ud_self.user_id = ?
           AND ud_peer.user_id = s.consultant_user_id
       )`,
    [periodKey, userId, userId]
  );

  const num = (v) => (v != null ? Number(Number(v).toFixed(2)) : 0);
  const selfVal = {
    task_completion: num(selfRow?.capaian_task_completion),
    timeliness: num(selfRow?.capaian_timeliness),
    update_compliance: num(selfRow?.capaian_update_compliance),
    output_quality: num(selfRow?.capaian_output_quality)
  };
  const peerVal = {
    task_completion: num(peerRow?.avg_tc),
    timeliness: num(peerRow?.avg_tm),
    update_compliance: num(peerRow?.avg_uc),
    output_quality: num(peerRow?.avg_oq)
  };

  return {
    dimensions: dims.map((d) => ({
      key: d.key,
      label: d.label,
      self_value: selfVal[d.key],
      peer_avg: peerVal[d.key],
      delta: Number((selfVal[d.key] - peerVal[d.key]).toFixed(2))
    })),
    self_total: num(selfRow?.total_score),
    peer_total_avg: num(peerRow?.avg_total)
  };
};

/**
 * Insight generator. Input = aggregated section data (project_operations,
 * consultant_kpi, dst.) + scope role. Output array of { severity, text }.
 * Bersifat heuristic & deterministic — tidak akses DB.
 */
const generateInsights = ({ role, projectOps = null, consultantKpi = null, dpUnpaid = null, ratingDistribution = null, kpiTrend = null, dimensionVsPeer = null, milestonesAtRisk = null }) => {
  const insights = [];

  // 1. KPI band balance
  if (consultantKpi?.summary_metrics) {
    const sm = consultantKpi.summary_metrics;
    const total = sm.excellent_count + sm.good_count + sm.need_improvement_count;
    if (total > 0) {
      const niPct = Math.round((sm.need_improvement_count / total) * 100);
      if (niPct >= 30) {
        insights.push({
          severity: 'warning',
          text: `${niPct}% consultant berada di band Need Improvement (<70). Pertimbangkan intervensi training atau review beban kerja.`
        });
      } else if (sm.excellent_count > 0 && niPct === 0) {
        insights.push({
          severity: 'positive',
          text: `Tidak ada consultant di band Need Improvement periode ini. ${sm.excellent_count} consultant mencapai band Excellent.`
        });
      }
    }
  }

  // 2. Avg score directional from trend
  if (kpiTrend?.points && kpiTrend.points.length >= 2) {
    const recent = kpiTrend.points[kpiTrend.points.length - 1];
    const prev = kpiTrend.points[kpiTrend.points.length - 2];
    if (recent.sample_size > 0 && prev.sample_size > 0) {
      const diff = recent.total_score - prev.total_score;
      if (Math.abs(diff) >= 3) {
        insights.push({
          severity: diff > 0 ? 'positive' : 'warning',
          text: `KPI rata-rata ${diff > 0 ? 'naik' : 'turun'} ${Math.abs(diff).toFixed(1)} poin (${prev.label} → ${recent.label}: ${prev.total_score.toFixed(1)} → ${recent.total_score.toFixed(1)}).`
        });
      }
    }
  }

  // 3. Lowest dimension highlight
  if (consultantKpi?.dimension_averages) {
    const dims = consultantKpi.dimension_averages;
    const entries = [
      { key: 'Task Completion', val: dims.task_completion },
      { key: 'Timeliness', val: dims.timeliness },
      { key: 'Update Compliance', val: dims.update_compliance },
      { key: 'Output Quality', val: dims.output_quality }
    ].filter((e) => e.val > 0);
    if (entries.length > 0) {
      const lowest = entries.reduce((min, e) => (e.val < min.val ? e : min));
      const highest = entries.reduce((max, e) => (e.val > max.val ? e : max));
      if (lowest.val < 70) {
        insights.push({
          severity: 'warning',
          text: `Dimensi terlemah: ${lowest.key} (${lowest.val.toFixed(1)}). Fokus coaching disini akan paling berdampak.`
        });
      } else {
        insights.push({
          severity: 'info',
          text: `Dimensi terkuat: ${highest.key} (${highest.val.toFixed(1)}). Pertahankan praktik kerja yang menghasilkan skor ini.`
        });
      }
    }
  }

  // 4. DP Unpaid block (cross-module)
  if (dpUnpaid?.count != null && dpUnpaid.count > 0) {
    insights.push({
      severity: 'warning',
      text: `${dpUnpaid.count} project tertahan karena DP belum dibayar. Koordinasikan dengan tim invoice untuk percepatan konfirmasi pembayaran.`
    });
  }

  // 5. Project velocity (CEO/COO insight): compare last 2 months
  if (projectOps?.summary_metrics?.completed_in_period?.delta) {
    const d = projectOps.summary_metrics.completed_in_period.delta;
    if (d.direction === 'up' && d.value >= 20) {
      insights.push({
        severity: 'positive',
        text: `Velocity completion naik ${d.value}% vs periode pembanding. Indikasi delivery membaik.`
      });
    } else if (d.direction === 'down' && d.value >= 20) {
      insights.push({
        severity: 'warning',
        text: `Velocity completion turun ${d.value}% vs periode pembanding. Cek bottleneck di milestones aktif.`
      });
    }
  }

  // 6. Milestones overdue concentration
  if (milestonesAtRisk?.overdue && milestonesAtRisk.overdue.length > 0) {
    const overdueCount = milestonesAtRisk.overdue.length;
    if (overdueCount >= 5) {
      insights.push({
        severity: 'warning',
        text: `${overdueCount} milestone overdue saat ini. Prioritaskan untuk eskalasi ke PM masing-masing.`
      });
    }
  }

  // 7. Rating distribution (PM scope)
  if (ratingDistribution?.total > 0) {
    const avg = ratingDistribution.average;
    if (avg < 3.5) {
      insights.push({
        severity: 'warning',
        text: `Rata-rata rating yang Anda berikan ${avg.toFixed(2)}/5. Kalau ini akurat, ada sinyal kualitas output team perlu peningkatan.`
      });
    } else if (avg >= 4.5) {
      insights.push({
        severity: 'positive',
        text: `Rata-rata rating Anda ${avg.toFixed(2)}/5 — team menunjukkan kualitas output yang konsisten tinggi.`
      });
    }
  }

  // 8. Konsultan vs peer
  if (dimensionVsPeer?.dimensions) {
    const above = dimensionVsPeer.dimensions.filter((d) => d.delta >= 5);
    const below = dimensionVsPeer.dimensions.filter((d) => d.delta <= -5);
    if (above.length > 0) {
      insights.push({
        severity: 'positive',
        text: `Anda di atas rata-rata department untuk: ${above.map((d) => d.label).join(', ')}.`
      });
    }
    if (below.length > 0) {
      insights.push({
        severity: 'warning',
        text: `Perlu perhatian — di bawah rata-rata department untuk: ${below.map((d) => d.label).join(', ')}.`
      });
    }
  }

  // Default fallback kalau belum ada insight apapun (data kosong)
  if (insights.length === 0) {
    insights.push({
      severity: 'info',
      text: role === 'CONSULTANT'
        ? 'Belum ada data KPI cukup untuk menghasilkan insight personal. Selesaikan milestone untuk mengakumulasi data.'
        : 'Belum cukup data untuk menghasilkan insight otomatis pada periode ini.'
    });
  }

  return insights.slice(0, 5);
};

module.exports = {
  buildPeriodKeys,
  buildKpiTrend,
  buildProjectVelocity,
  buildRatingDistribution,
  buildDimensionVsPeer,
  generateInsights
};
