const menuCms = require('../services/menuCms');

exports.listPublic = async (req, res, next) => {
  try {
    const data = await menuCms.listPublic();
    if (!data) return res.status(503).json({ success: false, message: 'Menu unavailable' });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.listAdmin = async (req, res, next) => {
  try {
    const data = await menuCms.listAdmin();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const result = await menuCms.createMenu(req.body || {});
    if (!result.ok) return res.status(400).json({ success: false, message: result.message });
    res.status(201).json({ success: true, message: 'Menu item created', data: result.data });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const result = await menuCms.updateMenu(req.params.id, req.body || {});
    if (!result.ok) return res.status(result.status || 400).json({ success: false, message: result.message });
    res.json({ success: true, message: 'Menu item updated', data: result.data });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const result = await menuCms.removeMenu(req.params.id);
    if (!result.ok) return res.status(result.status || 400).json({ success: false, message: result.message });
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (err) {
    next(err);
  }
};
