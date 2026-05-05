const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

if (!SECRET) {
  // Fail fast kalau secret tidak di-set — supaya tidak silent insecure.
  throw new Error('JWT_SECRET tidak diset di .env');
}

const sign = (payload) => jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });

const verify = (token) => jwt.verify(token, SECRET);

module.exports = { sign, verify };
