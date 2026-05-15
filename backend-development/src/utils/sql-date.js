/**
 * DATE-only fields (MySQL DATE): always YYYY-MM-DD strings, no timezone shift.
 */

const pad2 = (n) => String(n).padStart(2, '0');

const formatSqlDate = (v) => {
  if (v == null) return null;
  const s = String(v);
  const isoMatch = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const y = v.getFullYear();
    const m = v.getMonth() + 1;
    const d = v.getDate();
    return `${y}-${pad2(m)}-${pad2(d)}`;
  }

  return s.length >= 10 ? s.slice(0, 10) : s;
};

const sqlDateToLocalDate = (sqlDate) => {
  const normalized = formatSqlDate(sqlDate);
  if (!normalized) return new Date();
  const [y, m, d] = normalized.split('-').map(Number);
  return new Date(y, m - 1, d);
};

module.exports = {
  formatSqlDate,
  sqlDateToLocalDate
};
