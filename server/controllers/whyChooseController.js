const CONTENT_LIMITS = require('../contentLimits');
const { getSectionByKey } = require('../services/homeSections');
const { listItems, createItem, updateItem, removeItem } = require('../services/whyChoose');

exports.listPublic = async (req, res, next) => {
  try {
    const section = await getSectionByKey('why_choose');
    if (!section || section.is_active === false) {
      return res.json({ success: true, data: { section: null, items: [] }, limits: CONTENT_LIMITS });
    }
    const items = await listItems(false);
    res.json({ success: true, data: { section, items }, limits: CONTENT_LIMITS });
  } catch (err) {
    next(err);
  }
};

exports.listAdmin = async (req, res, next) => {
  try {
    const section = await getSectionByKey('why_choose');
    const items = await listItems(true);
    res.json({ success: true, data: { section, items }, limits: CONTENT_LIMITS });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const result = await createItem(req.body || {});
    if (!result.ok) return res.status(400).json({ success: false, message: result.message });
    res.status(201).json({ success: true, message: 'Item created', data: result.data });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const result = await updateItem(req.params.id, req.body || {});
    if (!result.ok) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }
    res.json({ success: true, message: 'Item updated', data: result.data });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const ok = await removeItem(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    next(err);
  }
};
