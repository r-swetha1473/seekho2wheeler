const { listAll, listPublic, createItem, updateItem, removeItem } = require('../services/pageCopy');

exports.listPublic = async (req, res, next) => {
  try {
    res.json({ success: true, data: await listPublic() });
  } catch (err) {
    next(err);
  }
};

exports.listAdmin = async (req, res, next) => {
  try {
    res.json({ success: true, data: await listAll() });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const result = await createItem(req.body || {});
    if (!result.ok) return res.status(400).json({ success: false, message: result.message });
    res.status(201).json({ success: true, message: 'Copy saved', data: result.data });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const result = await updateItem(req.params.id, req.body || {});
    if (!result.ok) return res.status(result.status || 400).json({ success: false, message: result.message });
    res.json({ success: true, message: 'Copy saved', data: result.data });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const ok = await removeItem(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Copy block not found' });
    res.json({ success: true, message: 'Copy deleted' });
  } catch (err) {
    next(err);
  }
};
