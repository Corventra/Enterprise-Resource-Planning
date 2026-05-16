const { pool } = require('../config/db');
const { LEAD_ACTIVITY_TYPES } = require('../constants/lead-activity-types');

const ELIGIBLE_LEAD_WHERE = `
  lead_status IN ('ACTIVE', 'WON', 'LOST')
  AND (
    (source_type = 'FORM_LEAD_CAPTURE' AND bank_data_status = 'PROCESSED')
    OR source_type = 'MANUAL'
  )
`;

const normalizeLeadId = (leadId) => {
  if (leadId === undefined || leadId === null) {
    return null;
  }
  const n = Number(leadId);
  if (!Number.isSafeInteger(n) || n <= 0) {
    return null;
  }
  return n;
};

const normalizeMeetingId = (meetingId) => {
  if (meetingId === undefined || meetingId === null) {
    return null;
  }
  const n = Number(meetingId);
  if (!Number.isSafeInteger(n) || n <= 0) {
    return null;
  }
  return n;
};

const insertActivityLog = async (conn, { leadId, activityType, title, description, createdBy }) => {
  await conn.execute(
    `INSERT INTO lead_activity_logs (lead_id, activity_type, title, description, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [leadId, activityType, title, description, createdBy]
  );
};

const mapMeetingRow = (row) => ({
  meeting_id: row.meeting_id,
  lead_id: row.lead_id,
  title: row.title,
  meeting_datetime: row.meeting_datetime,
  meeting_mode: row.meeting_mode,
  meeting_access: row.meeting_access ?? null,
  notes: row.notes ?? null,
  status: row.status,
  created_by: row.created_by ?? null,
  created_by_name: row.created_by_name ?? null,
  created_at: row.created_at,
  updated_at: row.updated_at,
  minute_id: row.minute_id ?? null,
  has_minutes: row.minute_id != null
});

const mapMinutesRow = (row) => ({
  minute_id: row.minute_id,
  meeting_id: row.meeting_id,
  lead_id: row.lead_id,
  meeting_objectives: row.meeting_objectives ?? null,
  background_summary: row.background_summary ?? null,
  issues_discussed: row.issues_discussed ?? null,
  info_client: row.info_client ?? null,
  info_firm: row.info_firm ?? null,
  risk_concerns: row.risk_concerns ?? null,
  next_steps: row.next_steps ?? null,
  notes_follow_up: row.notes_follow_up ?? null,
  created_by: row.created_by ?? null,
  created_by_name: row.created_by_name ?? null,
  created_at: row.created_at,
  updated_at: row.updated_at
});

const fetchEligibleLead = async (conn, leadId) => {
  const [rows] = await conn.execute(
    `SELECT lead_id, current_stage, stage_progress, next_action, due_date
       FROM leads
      WHERE lead_id = ?
        AND ${ELIGIBLE_LEAD_WHERE}`,
    [leadId]
  );
  return rows[0] ?? null;
};

const fetchMeetingForLead = async (conn, leadId, meetingId) => {
  const [rows] = await conn.execute(
    `SELECT
        m.meeting_id,
        m.lead_id,
        m.title,
        m.meeting_datetime,
        m.meeting_mode,
        m.meeting_access,
        m.notes,
        m.status,
        m.created_by,
        m.created_at,
        m.updated_at,
        mn.minute_id,
        uc.name AS created_by_name
      FROM meetings m
      LEFT JOIN minutes mn ON mn.meeting_id = m.meeting_id
      LEFT JOIN users uc ON uc.id = m.created_by
     WHERE m.meeting_id = ?
       AND m.lead_id = ?`,
    [meetingId, leadId]
  );
  return rows[0] ? mapMeetingRow(rows[0]) : null;
};

const insertParticipants = async (conn, minuteId, participants) => {
  for (let index = 0; index < participants.length; index += 1) {
    const participant = participants[index];
    await conn.execute(
      `INSERT INTO minute_participants (minute_id, participant_type, participant_name, sort_order)
       VALUES (?, ?, ?, ?)`,
      [minuteId, participant.participant_type, participant.participant_name, index + 1]
    );
  }
};

const insertAgreements = async (conn, minuteId, agreements) => {
  for (let index = 0; index < agreements.length; index += 1) {
    const agreement = agreements[index];
    await conn.execute(
      `INSERT INTO minute_agreements (minute_id, item, details, sort_order)
       VALUES (?, ?, ?, ?)`,
      [minuteId, agreement.item, agreement.details, index + 1]
    );
  }
};

const fetchMinutesDetail = async (conn, leadId, meetingId) => {
  const meeting = await fetchMeetingForLead(conn, leadId, meetingId);
  if (!meeting) {
    return null;
  }

  if (!meeting.minute_id) {
    return {
      meeting,
      minutes: null,
      participants: { internal: [], client: [] },
      agreements: []
    };
  }

  const [minuteRows] = await conn.execute(
    `SELECT
        mn.minute_id,
        mn.meeting_id,
        mn.lead_id,
        mn.meeting_objectives,
        mn.background_summary,
        mn.issues_discussed,
        mn.info_client,
        mn.info_firm,
        mn.risk_concerns,
        mn.next_steps,
        mn.notes_follow_up,
        mn.created_by,
        mn.created_at,
        mn.updated_at,
        uc.name AS created_by_name
      FROM minutes mn
      LEFT JOIN users uc ON uc.id = mn.created_by
     WHERE mn.meeting_id = ?
       AND mn.lead_id = ?`,
    [meetingId, leadId]
  );

  const [participantRows] = await conn.execute(
    `SELECT participant_type, participant_name, sort_order
       FROM minute_participants
      WHERE minute_id = ?
      ORDER BY sort_order ASC, participant_id ASC`,
    [meeting.minute_id]
  );

  const [agreementRows] = await conn.execute(
    `SELECT item, details, sort_order
       FROM minute_agreements
      WHERE minute_id = ?
      ORDER BY sort_order ASC, agreement_id ASC`,
    [meeting.minute_id]
  );

  const participants = { internal: [], client: [] };
  participantRows.forEach((row) => {
    if (row.participant_type === 'INTERNAL') {
      participants.internal.push(row.participant_name);
    } else {
      participants.client.push(row.participant_name);
    }
  });

  return {
    meeting,
    minutes: minuteRows[0] ? mapMinutesRow(minuteRows[0]) : null,
    participants,
    agreements: agreementRows.map((row) => ({
      item: row.item,
      details: row.details ?? null
    }))
  };
};

const listMeetings = async (leadId) => {
  const normalizedLeadId = normalizeLeadId(leadId);
  if (normalizedLeadId == null) {
    return null;
  }

  const [leadRows] = await pool.execute(
    `SELECT lead_id FROM leads WHERE lead_id = ? AND ${ELIGIBLE_LEAD_WHERE}`,
    [normalizedLeadId]
  );
  if (leadRows.length === 0) {
    return null;
  }

  const [rows] = await pool.execute(
    `SELECT
        m.meeting_id,
        m.lead_id,
        m.title,
        m.meeting_datetime,
        m.meeting_mode,
        m.meeting_access,
        m.notes,
        m.status,
        m.created_by,
        m.created_at,
        m.updated_at,
        mn.minute_id,
        uc.name AS created_by_name
      FROM meetings m
      LEFT JOIN minutes mn ON mn.meeting_id = m.meeting_id
      LEFT JOIN users uc ON uc.id = m.created_by
     WHERE m.lead_id = ?
     ORDER BY m.meeting_datetime DESC, m.meeting_id DESC`,
    [normalizedLeadId]
  );

  return rows.map(mapMeetingRow);
};

const createMeeting = async (leadId, payload, userId) => {
  const normalizedLeadId = normalizeLeadId(leadId);
  if (normalizedLeadId == null) {
    return { ok: false, reason: 'NOT_FOUND' };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const lead = await fetchEligibleLead(conn, normalizedLeadId);
    if (!lead) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }

    const [result] = await conn.execute(
      `INSERT INTO meetings (
          lead_id,
          title,
          meeting_datetime,
          meeting_mode,
          meeting_access,
          notes,
          status,
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, 'SCHEDULED', ?)`,
      [
        normalizedLeadId,
        payload.title,
        payload.meeting_datetime,
        payload.meeting_mode,
        payload.meeting_access,
        payload.notes,
        userId
      ]
    );

    if (lead.current_stage === 'MEETING') {
      await conn.execute(
        `UPDATE leads
            SET current_stage = 'MEETING',
                stage_progress = 'SCHEDULED',
                next_action = 'Lakukan meeting',
                due_date = ?
          WHERE lead_id = ?`,
        [payload.meeting_datetime, normalizedLeadId]
      );
    }

    await insertActivityLog(conn, {
      leadId: normalizedLeadId,
      activityType: LEAD_ACTIVITY_TYPES.MEETING_SCHEDULED,
      title: 'Meeting dijadwalkan',
      description: `Meeting "${payload.title}" dijadwalkan.`,
      createdBy: userId
    });

    await conn.commit();
    const meeting = await fetchMeetingForLead(conn, normalizedLeadId, result.insertId);
    return { ok: true, meeting };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const completeMeeting = async (leadId, meetingId, userId) => {
  const normalizedLeadId = normalizeLeadId(leadId);
  const normalizedMeetingId = normalizeMeetingId(meetingId);
  if (normalizedLeadId == null || normalizedMeetingId == null) {
    return { ok: false, reason: 'NOT_FOUND' };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const lead = await fetchEligibleLead(conn, normalizedLeadId);
    if (!lead) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }

    const [meetingRows] = await conn.execute(
      `SELECT meeting_id, status
         FROM meetings
        WHERE meeting_id = ?
          AND lead_id = ?`,
      [normalizedMeetingId, normalizedLeadId]
    );
    if (meetingRows.length === 0) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }

    const meeting = meetingRows[0];
    if (meeting.status === 'DONE') {
      await conn.rollback();
      return { ok: false, reason: 'ALREADY_DONE' };
    }
    if (meeting.status !== 'SCHEDULED') {
      await conn.rollback();
      return { ok: false, reason: 'NOT_SCHEDULED' };
    }

    await conn.execute(
      `UPDATE meetings
          SET status = 'DONE'
        WHERE meeting_id = ?`,
      [normalizedMeetingId]
    );

    if (lead.current_stage === 'MEETING') {
      await conn.execute(
        `UPDATE leads
            SET current_stage = 'MINUTES',
                stage_progress = 'NOT_CREATED',
                next_action = 'Buat notulensi',
                due_date = DATE_ADD(NOW(), INTERVAL 1 DAY)
          WHERE lead_id = ?`,
        [normalizedLeadId]
      );
    }

    await insertActivityLog(conn, {
      leadId: normalizedLeadId,
      activityType: LEAD_ACTIVITY_TYPES.MEETING_COMPLETED,
      title: 'Meeting selesai',
      description: 'Meeting ditandai selesai dan lead siap untuk notulensi.',
      createdBy: userId
    });

    await conn.commit();
    const updatedMeeting = await fetchMeetingForLead(conn, normalizedLeadId, normalizedMeetingId);
    return { ok: true, meeting: updatedMeeting };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const updateMeeting = async (leadId, meetingId, payload, userId) => {
  const normalizedLeadId = normalizeLeadId(leadId);
  const normalizedMeetingId = normalizeMeetingId(meetingId);
  if (normalizedLeadId == null || normalizedMeetingId == null) {
    return { ok: false, reason: 'NOT_FOUND' };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const lead = await fetchEligibleLead(conn, normalizedLeadId);
    if (!lead) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }

    const [meetingRows] = await conn.execute(
      `SELECT meeting_id, status
         FROM meetings
        WHERE meeting_id = ?
          AND lead_id = ?`,
      [normalizedMeetingId, normalizedLeadId]
    );
    if (meetingRows.length === 0) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }

    const meeting = meetingRows[0];
    if (meeting.status !== 'SCHEDULED') {
      await conn.rollback();
      return { ok: false, reason: 'NOT_EDITABLE' };
    }

    await conn.execute(
      `UPDATE meetings
          SET title = ?,
              meeting_datetime = ?,
              meeting_mode = ?,
              meeting_access = ?,
              notes = ?
        WHERE meeting_id = ?`,
      [
        payload.title,
        payload.meeting_datetime,
        payload.meeting_mode,
        payload.meeting_access,
        payload.notes,
        normalizedMeetingId
      ]
    );

    if (lead.current_stage === 'MEETING') {
      await conn.execute(
        `UPDATE leads
            SET due_date = ?,
                next_action = 'Lakukan meeting'
          WHERE lead_id = ?`,
        [payload.meeting_datetime, normalizedLeadId]
      );
    }

    await insertActivityLog(conn, {
      leadId: normalizedLeadId,
      activityType: LEAD_ACTIVITY_TYPES.MEETING_UPDATED,
      title: 'Meeting diperbarui',
      description: `Meeting "${payload.title}" diperbarui.`,
      createdBy: userId
    });

    await conn.commit();
    const updatedMeeting = await fetchMeetingForLead(conn, normalizedLeadId, normalizedMeetingId);
    return { ok: true, meeting: updatedMeeting };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const getMeetingMinutes = async (leadId, meetingId) => {
  const normalizedLeadId = normalizeLeadId(leadId);
  const normalizedMeetingId = normalizeMeetingId(meetingId);
  if (normalizedLeadId == null || normalizedMeetingId == null) {
    return null;
  }

  const conn = await pool.getConnection();
  try {
    const lead = await fetchEligibleLead(conn, normalizedLeadId);
    if (!lead) {
      return null;
    }
    return fetchMinutesDetail(conn, normalizedLeadId, normalizedMeetingId);
  } finally {
    conn.release();
  }
};

const createMinutes = async (leadId, meetingId, payload, userId) => {
  const normalizedLeadId = normalizeLeadId(leadId);
  const normalizedMeetingId = normalizeMeetingId(meetingId);
  if (normalizedLeadId == null || normalizedMeetingId == null) {
    return { ok: false, reason: 'NOT_FOUND' };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const lead = await fetchEligibleLead(conn, normalizedLeadId);
    if (!lead) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }

    const meeting = await fetchMeetingForLead(conn, normalizedLeadId, normalizedMeetingId);
    if (!meeting) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }
    if (meeting.minute_id) {
      await conn.rollback();
      return { ok: false, reason: 'MINUTES_EXISTS' };
    }

    const [minuteResult] = await conn.execute(
      `INSERT INTO minutes (
          meeting_id,
          lead_id,
          meeting_objectives,
          background_summary,
          issues_discussed,
          info_client,
          info_firm,
          risk_concerns,
          next_steps,
          notes_follow_up,
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        normalizedMeetingId,
        normalizedLeadId,
        payload.meeting_objectives,
        payload.background_summary,
        payload.issues_discussed,
        payload.info_client,
        payload.info_firm,
        payload.risk_concerns,
        payload.next_steps,
        payload.notes_follow_up,
        userId
      ]
    );

    const minuteId = minuteResult.insertId;
    await insertParticipants(conn, minuteId, payload.participants);
    await insertAgreements(conn, minuteId, payload.agreements);

    if (lead.current_stage === 'MEETING' || lead.current_stage === 'MINUTES') {
      await conn.execute(
        `UPDATE leads
            SET current_stage = 'PROPOSAL',
                stage_progress = 'NOT_CREATED',
                next_action = 'Buat proposal',
                due_date = DATE_ADD(NOW(), INTERVAL 1 DAY)
          WHERE lead_id = ?`,
        [normalizedLeadId]
      );
    }

    await insertActivityLog(conn, {
      leadId: normalizedLeadId,
      activityType: LEAD_ACTIVITY_TYPES.MINUTES_CREATED,
      title: 'Notulensi dibuat',
      description: `Notulensi untuk meeting "${meeting.title}" dibuat.`,
      createdBy: userId
    });

    await conn.commit();
    const entry = await fetchMinutesDetail(conn, normalizedLeadId, normalizedMeetingId);
    return { ok: true, entry };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const updateMinutes = async (leadId, meetingId, payload, userId) => {
  const normalizedLeadId = normalizeLeadId(leadId);
  const normalizedMeetingId = normalizeMeetingId(meetingId);
  if (normalizedLeadId == null || normalizedMeetingId == null) {
    return { ok: false, reason: 'NOT_FOUND' };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const lead = await fetchEligibleLead(conn, normalizedLeadId);
    if (!lead) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }

    const meeting = await fetchMeetingForLead(conn, normalizedLeadId, normalizedMeetingId);
    if (!meeting || !meeting.minute_id) {
      await conn.rollback();
      return { ok: false, reason: 'MINUTES_NOT_FOUND' };
    }

    await conn.execute(
      `UPDATE minutes
          SET meeting_objectives = ?,
              background_summary = ?,
              issues_discussed = ?,
              info_client = ?,
              info_firm = ?,
              risk_concerns = ?,
              next_steps = ?,
              notes_follow_up = ?
        WHERE minute_id = ?
          AND meeting_id = ?
          AND lead_id = ?`,
      [
        payload.meeting_objectives,
        payload.background_summary,
        payload.issues_discussed,
        payload.info_client,
        payload.info_firm,
        payload.risk_concerns,
        payload.next_steps,
        payload.notes_follow_up,
        meeting.minute_id,
        normalizedMeetingId,
        normalizedLeadId
      ]
    );

    await conn.execute(`DELETE FROM minute_participants WHERE minute_id = ?`, [meeting.minute_id]);
    await conn.execute(`DELETE FROM minute_agreements WHERE minute_id = ?`, [meeting.minute_id]);
    await insertParticipants(conn, meeting.minute_id, payload.participants);
    await insertAgreements(conn, meeting.minute_id, payload.agreements);

    await insertActivityLog(conn, {
      leadId: normalizedLeadId,
      activityType: LEAD_ACTIVITY_TYPES.MINUTES_UPDATED,
      title: 'Notulensi diperbarui',
      description: `Notulensi untuk meeting "${meeting.title}" diperbarui.`,
      createdBy: userId
    });

    await conn.commit();
    const entry = await fetchMinutesDetail(conn, normalizedLeadId, normalizedMeetingId);
    return { ok: true, entry };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

module.exports = {
  listMeetings,
  createMeeting,
  completeMeeting,
  updateMeeting,
  getMeetingMinutes,
  createMinutes,
  updateMinutes
};
