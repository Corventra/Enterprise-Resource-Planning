const pad2 = (n) => String(n).padStart(2, '0');

const toSqlDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const startOfMonth = (year, monthIndex) => new Date(year, monthIndex, 1);

const startOfNextMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 1);

const startOfYear = (year) => new Date(year, 0, 1);

const startOfNextYear = (year) => new Date(year + 1, 0, 1);

const parseIsoDate = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value).trim())) {
    return null;
  }
  const d = new Date(`${String(value).trim()}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * @returns {{ periodKey: string, start: Date, endExclusive: Date, startSql: string, endSqlExclusive: string }}
 */
const resolveDashboardPeriod = ({ period = 'this_month', from, to } = {}) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  let start;
  let endExclusive;
  let periodKey = String(period || 'this_month').trim().toLowerCase();

  switch (periodKey) {
    case 'last_month': {
      start = startOfMonth(y, m - 1);
      endExclusive = startOfMonth(y, m);
      break;
    }
    case 'this_year': {
      start = startOfYear(y);
      endExclusive = startOfNextYear(y);
      break;
    }
    case 'last_year': {
      start = startOfYear(y - 1);
      endExclusive = startOfYear(y);
      break;
    }
    case 'custom': {
      const startDate = parseIsoDate(from);
      const endDate = parseIsoDate(to);
      if (!startDate || !endDate || startDate > endDate) {
        throw new Error('Rentang custom tidak valid. Gunakan format YYYY-MM-DD.');
      }
      start = startDate;
      endExclusive = new Date(endDate);
      endExclusive.setDate(endExclusive.getDate() + 1);
      break;
    }
    case 'this_month':
    default: {
      periodKey = 'this_month';
      start = startOfMonth(y, m);
      endExclusive = startOfNextMonth(y, m);
      break;
    }
  }

  return {
    periodKey,
    start,
    endExclusive,
    startSql: toSqlDate(start),
    endSqlExclusive: toSqlDate(endExclusive)
  };
};

/**
 * @returns {{ start: Date, endExclusive: Date, startSql: string, endSqlExclusive: string, label: string }}
 */
const resolveComparisonPeriod = (current, comparison = 'prev_month') => {
  const cmp = String(comparison || 'prev_month').trim().toLowerCase();
  const ms = current.endExclusive.getTime() - current.start.getTime();

  if (cmp === 'prev_year') {
    const start = new Date(current.start);
    start.setFullYear(start.getFullYear() - 1);
    const endExclusive = new Date(current.endExclusive);
    endExclusive.setFullYear(endExclusive.getFullYear() - 1);
    return {
      start,
      endExclusive,
      startSql: toSqlDate(start),
      endSqlExclusive: toSqlDate(endExclusive),
      label: 'vs tahun lalu'
    };
  }

  const endExclusive = new Date(current.start);
  const start = new Date(endExclusive.getTime() - ms);
  return {
    start,
    endExclusive,
    startSql: toSqlDate(start),
    endSqlExclusive: toSqlDate(endExclusive),
    label: 'vs bulan lalu'
  };
};

/** Last N months ending at current period end (exclusive), for trend charts. */
const buildMonthBuckets = (endExclusive, count = 12) => {
  const buckets = [];
  const anchor = new Date(endExclusive);
  anchor.setDate(1);
  for (let i = count - 1; i >= 0; i -= 1) {
    const start = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
    const end = new Date(anchor.getFullYear(), anchor.getMonth() - i + 1, 1);
    const label = start.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    buckets.push({
      key: `${start.getFullYear()}-${pad2(start.getMonth() + 1)}`,
      label,
      start,
      endExclusive: end,
      startSql: toSqlDate(start),
      endSqlExclusive: toSqlDate(end)
    });
  }
  return buckets;
};

const deltaPercent = (current, previous) => {
  const c = Number(current) || 0;
  const p = Number(previous) || 0;
  if (p === 0) {
    if (c === 0) return { value: 0, direction: 'flat' };
    return { value: 100, direction: 'up' };
  }
  const pct = Math.round(((c - p) / p) * 1000) / 10;
  if (pct > 0) return { value: pct, direction: 'up' };
  if (pct < 0) return { value: Math.abs(pct), direction: 'down' };
  return { value: 0, direction: 'flat' };
};

module.exports = {
  resolveDashboardPeriod,
  resolveComparisonPeriod,
  buildMonthBuckets,
  deltaPercent,
  toSqlDate
};
