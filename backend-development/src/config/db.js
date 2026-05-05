const mysql = require('mysql2/promise');

/**
 * MySQL connection pool. Pakai promise-based API supaya gampang dipakai
 * dengan async/await di controller/repository.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Remote DB di idcloudhosting — kasih timeout lebih panjang dari default 10s.
  connectTimeout: 15000,
  // Auto-tambah created_at sebagai Date object, bukan string.
  dateStrings: false
});

const ping = async () => {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    return true;
  } finally {
    conn.release();
  }
};

module.exports = { pool, ping };
