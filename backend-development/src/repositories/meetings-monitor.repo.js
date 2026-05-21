const { pool } = require('../config/db');

const ELIGIBLE_LEAD_WHERE = `
  l.lead_status IN ('ACTIVE', 'WON', 'LOST')
  AND (
    (l.source_type = 'FORM_LEAD_CAPTURE' AND l.bank_data_status = 'PROCESSED')
    OR l.source_type = 'MANUAL'
  )
`;

const buildProcessedByFilter = (processedByUserId) => {
  if (processedByUserId == null) {
    return { sql: '', params: [] };
  }
  return { sql: ' AND l.processed_by = ?', params: [Number(processedByUserId)] };
};

const mapListRow = (row) => ({
  meeting_id: row.meeting_id,
  lead_id: row.lead_id,
  title: row.title,
  meeting_datetime: row.meeting_datetime,
  meeting_mode: row.meeting_mode,
  meeting_access: row.meeting_access ?? null,
  notes: row.notes ?? null,
  status: row.status,
  has_minutes: row.minute_id != null,
  company_name: row.company_name ?? null,
  pic_name: row.pic_name ?? null,
  processed_by: row.processed_by ?? null,
  processed_by_name: row.processed_by_name ?? null
});

const listMeetingsBaseSql = `
  SELECT
      m.meeting_id,
      m.lead_id,
      m.title,
      m.meeting_datetime,
      m.meeting_mode,
      m.meeting_access,
      m.notes,
      m.status,
      mn.minute_id,
      l.company_name,
      l.pic_name,
      l.processed_by,
      up.name AS processed_by_name
    FROM meetings m
    INNER JOIN leads l ON l.lead_id = m.lead_id
    LEFT JOIN minutes mn ON mn.meeting_id = m.meeting_id
    LEFT JOIN users up ON up.id = l.processed_by
   WHERE ${ELIGIBLE_LEAD_WHERE}
`;

const listMeetingsForScope = async (processedByUserId) => {
  const owner = buildProcessedByFilter(processedByUserId);
  const [rows] = await pool.execute(
    `${listMeetingsBaseSql}${owner.sql}
     ORDER BY m.meeting_datetime DESC, m.meeting_id DESC`,
    owner.params
  );
  return rows.map(mapListRow);
};

const getMeetingsSummary = async (processedByUserId) => {
  const items = await listMeetingsForScope(processedByUserId);
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  let totalMeeting = 0;
  let todayCount = 0;
  let upcomingCount = 0;
  let completedCount = 0;
  let noMinutesCount = 0;

  for (const item of items) {
    totalMeeting += 1;
    const dt = new Date(item.meeting_datetime);
    if (!Number.isNaN(dt.getTime()) && dt >= todayStart && dt < todayEnd) {
      todayCount += 1;
    }
    if (item.status === 'SCHEDULED' && !Number.isNaN(dt.getTime()) && dt > now) {
      upcomingCount += 1;
    }
    if (item.status === 'DONE') {
      completedCount += 1;
    }
    if (!item.has_minutes && item.status !== 'CANCELLED') {
      noMinutesCount += 1;
    }
  }

  return {
    total_meeting: { value: totalMeeting },
    today: { value: todayCount },
    upcoming: { value: upcomingCount },
    completed: { value: completedCount },
    no_minutes: { value: noMinutesCount }
  };
};

module.exports = {
  listMeetingsForScope,
  getMeetingsSummary
};
