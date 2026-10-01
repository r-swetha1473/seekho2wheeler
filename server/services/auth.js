const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('./db');
const { AppError, publicSheetsMessage } = require('../utils/httpError');

function assertLoginConfig() {
  const email = String(config.admin.email || '').trim();
  const password = String(config.admin.password || '');
  if (!email || !password) {
    throw new AppError(
      'ADMIN_EMAIL or ADMIN_PASSWORD is not set',
      503,
      'Admin login is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD on the server.'
    );
  }

  if (config.sheets.enabled && !config.sheets.ready) {
    throw new AppError(
      'GOOGLE_SHEETS_ENABLED=true but spreadsheet ID or credentials are missing',
      503,
      'Google Sheets is not configured. Set GOOGLE_SHEETS_ID and service account credentials (GOOGLE_SERVICE_ACCOUNT_JSON recommended on Vercel).'
    );
  }
}

/**
 * Ensure the admins tab and bootstrap row exist.
 * Missing tab/headers are created at runtime — never throw a generic 500.
 */
async function ensureAdmin() {
  assertLoginConfig();

  try {
    if (db.isSheetsMode()) {
      await db.ensureSheetTab('admins');
    }

    const admins = await db.getAll('admins');
    if (admins.length) return admins[0];

    const hash = await bcrypt.hash(config.admin.password, 12);
    return db.create('admins', {
      email: config.admin.email.toLowerCase(),
      password: hash,
      name: 'Seekho Admin',
      role: 'admin',
      active: true
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[auth] ensureAdmin failed:', err.message);
    throw new AppError(err.message, 503, publicSheetsMessage(err));
  }
}

async function login(email, password) {
  await ensureAdmin();
  const admins = await db.getAll('admins');
  const admin = admins.find((a) => a.email === String(email).toLowerCase() && a.active !== false);
  if (!admin) {
    return { ok: false, message: 'Invalid email or password' };
  }

  const match = await bcrypt.compare(password, admin.password);
  if (!match) {
    return { ok: false, message: 'Invalid email or password' };
  }

  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role || 'admin' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  return {
    ok: true,
    token,
    admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role }
  };
}

function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch {
    return null;
  }
}

async function changePassword(adminId, currentPassword, newPassword) {
  const admin = await db.getById('admins', adminId);
  if (!admin) return { ok: false, message: 'Admin not found' };

  const match = await bcrypt.compare(currentPassword, admin.password);
  if (!match) return { ok: false, message: 'Current password is incorrect' };

  const hash = await bcrypt.hash(newPassword, 12);
  await db.update('admins', adminId, { password: hash });
  return { ok: true, message: 'Password updated successfully' };
}

module.exports = { ensureAdmin, login, verifyToken, changePassword };
