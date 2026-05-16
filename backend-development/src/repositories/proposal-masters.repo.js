const { pool } = require('../config/db');

const listServiceClasses = async () => {
  const [rows] = await pool.execute(
    `SELECT service_class_id, name, code, is_active, created_at
       FROM service_classes
      ORDER BY service_class_id ASC`
  );
  return rows.map((row) => ({
    service_class_id: row.service_class_id,
    name: row.name,
    code: row.code,
    is_active: Boolean(row.is_active),
    created_at: row.created_at
  }));
};

const listServices = async () => {
  const [rows] = await pool.execute(
    `SELECT service_id, service_class_id, department_id, name, code, is_active, created_at
       FROM services
      ORDER BY service_id ASC`
  );
  return rows.map((row) => ({
    service_id: row.service_id,
    service_class_id: row.service_class_id,
    department_id: row.department_id,
    name: row.name,
    code: row.code,
    is_active: Boolean(row.is_active),
    created_at: row.created_at
  }));
};

module.exports = {
  listServiceClasses,
  listServices
};
