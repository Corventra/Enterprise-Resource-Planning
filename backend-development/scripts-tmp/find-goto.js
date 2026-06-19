require('dotenv').config();
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME
  });

  const [leads] = await conn.query(
    "SELECT lead_id, company_name FROM leads WHERE company_name LIKE '%GoTo%' OR company_name LIKE '%Gojek%' OR company_name LIKE '%Tokopedia%'"
  );
  console.log('LEADS matching GoTo:', leads);

  const [handovers] = await conn.query(`
    SELECT h.handover_id, h.handover_code, h.status, h.project_title, h.dp_payment_status,
           l.company_name, h.engagement_id, h.service_id, h.department_id,
           h.project_start_date, h.project_end_date,
           s.name AS service_name, d.name AS department_name
    FROM handovers h
    INNER JOIN leads l ON l.lead_id = h.lead_id
    LEFT JOIN services s ON s.service_id = h.service_id
    LEFT JOIN departments d ON d.id = h.department_id
    WHERE l.company_name LIKE '%GoTo%' OR l.company_name LIKE '%Gojek%' OR l.company_name LIKE '%Tokopedia%'
  `);
  console.log('\nHANDOVERS for GoTo:');
  handovers.forEach(h => console.log(' ', JSON.stringify(h)));

  if (handovers.length > 0) {
    const ids = handovers.map(h => h.handover_id);
    const [projects] = await conn.query(
      `SELECT project_id, project_code, project_name, status, handover_id, pm_user_id, pm_name_snapshot, start_date, end_date FROM projects WHERE handover_id IN (?)`,
      [ids]
    );
    console.log('\nPROJECTS for GoTo:');
    projects.forEach(p => console.log(' ', JSON.stringify(p)));

    if (projects.length > 0) {
      const pid = projects[0].project_id;
      const [ms] = await conn.query(
        `SELECT milestone_id, sequence_no, title, status, owner_user_id, owner_name_snapshot, weight, target_date, completed_at, quality_rating FROM project_milestones WHERE project_id=? ORDER BY sequence_no`,
        [pid]
      );
      console.log('\nMILESTONES for project ' + pid + ' (' + ms.length + ' rows):');
      ms.forEach(m => console.log(' ', JSON.stringify(m)));

      const [cs] = await conn.query(
        `SELECT consultant_user_id, consultant_name_snapshot, level FROM project_consultants WHERE project_id=?`,
        [pid]
      );
      console.log('\nCONSULTANTS for project ' + pid + ':');
      cs.forEach(c => console.log(' ', JSON.stringify(c)));
    }

    const engs = handovers.map(h => h.engagement_id).filter(Boolean);
    if (engs.length > 0) {
      const [terms] = await conn.query(
        `SELECT invoice_id, term_name, term_type, status, project_id, engagement_id FROM invoice_terms WHERE engagement_id IN (?) ORDER BY term_order`,
        [engs]
      );
      console.log('\nINVOICE_TERMS for GoTo engagement:');
      terms.forEach(t => console.log(' ', JSON.stringify(t)));
    }
  }

  const [consultants] = await conn.query(`
    SELECT u.id, u.name, GROUP_CONCAT(d.code) AS depts
    FROM users u
    INNER JOIN roles r ON r.id = u.role_id
    LEFT JOIN user_departments ud ON ud.user_id = u.id
    LEFT JOIN departments d ON d.id = ud.department_id
    WHERE r.code='CONSULTANT' AND u.is_active=1
    GROUP BY u.id, u.name
  `);
  console.log('\nACTIVE CONSULTANTS:');
  consultants.forEach(c => console.log(' ', JSON.stringify(c)));

  await conn.end();
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
