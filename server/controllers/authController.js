const db = require('../services/db');
const { login, changePassword, ensureAdmin } = require('../services/auth');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const result = await login(email, password);
    if (!result.ok) {
      return res.status(401).json({ success: false, message: result.message });
    }
    res.json({ success: true, message: 'Login successful', data: { token: result.token, admin: result.admin } });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res) => {
  res.json({ success: true, data: req.admin });
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }
    const result = await changePassword(req.admin.id, currentPassword, newPassword);
    if (!result.ok) return res.status(400).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
};

exports.bootstrap = async () => {
  await ensureAdmin();
};
