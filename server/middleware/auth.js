const { verifyToken } = require('../services/auth');

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
  }

  req.admin = payload;
  next();
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    const payload = verifyToken(token);
    if (payload) req.admin = payload;
  }
  next();
}

module.exports = { authRequired, optionalAuth };
