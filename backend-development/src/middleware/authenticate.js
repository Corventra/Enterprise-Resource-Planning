const { verify } = require('../utils/jwt');

/**
 * Middleware: verify Authorization: Bearer <token>.
 * Set req.user dari payload JWT (termasuk permissions snapshot saat login). Reject 401 kalau invalid/expired.
 */
const authenticate = (req, res, next) => {
  const header = req.headers['authorization'] || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }
  try {
    const payload = verify(match[1]);
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token', detail: e.message });
  }
};

module.exports = { authenticate };
