const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('./db');

async function ensureAdmin() {
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
