const db = require('../services/db');
const { processAndSave, deleteUpload } = require('../services/upload');

exports.listPublic = async (req, res, next) => {
  try {
    let items = await db.getAll('gallery');
    items = items.filter((g) => g.active !== false);
    if (req.query.category && req.query.category !== 'all') {
      items = items.filter((g) => g.category === req.query.category);
    }
    items.sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

exports.listAdmin = async (req, res, next) => {
  try {
    const items = await db.getAll('gallery');
    items.sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length) return res.status(400).json({ success: false, message: 'At least one image is required' });

    const category = req.body.category || 'Student Success';
    const title = req.body.title || '';
    const existing = await db.getAll('gallery');
    let order = existing.length;

    const created = [];
    for (const file of files) {
      order += 1;
      const image = await processAndSave(file, 'gallery');
      const item = await db.create('gallery', {
        title: title || category,
        category,
        image,
        displayOrder: order,
        active: true
      });
      created.push(item);
    }
    res.status(201).json({ success: true, message: `${created.length} image(s) uploaded`, data: created });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await db.getById('gallery', req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Gallery item not found' });

    const payload = { ...req.body };
    if (req.file) {
      if (existing.image) await deleteUpload(existing.image);
      payload.image = await processAndSave(req.file, 'gallery');
    }
    if (payload.displayOrder !== undefined) payload.displayOrder = Number(payload.displayOrder);

    const item = await db.update('gallery', req.params.id, payload);
    res.json({ success: true, message: 'Gallery item updated', data: item });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const existing = await db.getById('gallery', req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Gallery item not found' });
    if (existing.image) await deleteUpload(existing.image);
    await db.remove('gallery', req.params.id);
    res.json({ success: true, message: 'Gallery item deleted' });
  } catch (err) {
    next(err);
  }
};

exports.reorder = async (req, res, next) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) return res.status(400).json({ success: false, message: 'Order array required' });
    await Promise.all(order.map((id, i) => db.update('gallery', id, { displayOrder: i + 1 })));
    res.json({ success: true, message: 'Gallery order updated' });
  } catch (err) {
    next(err);
  }
};
