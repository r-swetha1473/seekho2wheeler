const { processAndSave, deleteUpload } = require('../services/upload');
const {
  listAll,
  listPublic,
  createItem,
  updateItem,
  removeItem
} = require('../services/updates');

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
    const payload = { ...req.body };
    if (req.file) payload.image_url = await processAndSave(req.file, 'updates');
    const result = await createItem(payload);
    if (!result.ok) return res.status(400).json({ success: false, message: result.message });
    res.status(201).json({ success: true, message: 'Update created', data: result.data });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const all = await listAll();
    const existing = all.find((i) => String(i.id) === String(req.params.id));
    if (!existing) return res.status(404).json({ success: false, message: 'Update not found' });
    const payload = { ...req.body };
    if (req.file) {
      if (existing.image_url) await deleteUpload(existing.image_url);
      payload.image_url = await processAndSave(req.file, 'updates');
    }
    const result = await updateItem(req.params.id, payload);
    if (!result.ok) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }
    res.json({ success: true, message: 'Update saved', data: result.data });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const all = await listAll();
    const existing = all.find((i) => String(i.id) === String(req.params.id));
    if (existing && existing.image_url) await deleteUpload(existing.image_url);
    const ok = await removeItem(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Update not found' });
    res.json({ success: true, message: 'Update deleted' });
  } catch (err) {
    next(err);
  }
};
