const db = require('../services/db');
const { processAndSave, deleteUpload } = require('../services/upload');

function sortByOrder(items) {
  return [...items].sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
}

exports.listPublic = async (req, res, next) => {
  try {
    const banners = await db.getAll('banners');
    const active = sortByOrder(banners.filter((b) => b.active !== false));
    res.json({ success: true, data: active });
  } catch (err) {
    next(err);
  }
};

exports.listAdmin = async (req, res, next) => {
  try {
    const banners = sortByOrder(await db.getAll('banners'));
    res.json({ success: true, data: banners });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { title, subtitle, ctaText, ctaLink, displayOrder, active } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Banner title is required' });

    let image = req.body.image || '';
    if (req.file) image = await processAndSave(req.file, 'banners');

    const banner = await db.create('banners', {
      title,
      subtitle: subtitle || '',
      ctaText: ctaText || 'Book Training',
      ctaLink: ctaLink || '/pages/booking.html',
      image,
      displayOrder: Number(displayOrder || 0),
      active: active !== 'false' && active !== false
    });
    res.status(201).json({ success: true, message: 'Banner created', data: banner });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await db.getById('banners', req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Banner not found' });

    const payload = { ...req.body };
    if (req.file) {
      if (existing.image) await deleteUpload(existing.image);
      payload.image = await processAndSave(req.file, 'banners');
    }
    if (payload.displayOrder !== undefined) payload.displayOrder = Number(payload.displayOrder);
    if (payload.active !== undefined) payload.active = payload.active !== 'false' && payload.active !== false;

    const banner = await db.update('banners', req.params.id, payload);
    res.json({ success: true, message: 'Banner updated', data: banner });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const existing = await db.getById('banners', req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Banner not found' });
    if (existing.image) await deleteUpload(existing.image);
    await db.remove('banners', req.params.id);
    res.json({ success: true, message: 'Banner deleted' });
  } catch (err) {
    next(err);
  }
};

exports.reorder = async (req, res, next) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) {
      return res.status(400).json({ success: false, message: 'Order array is required' });
    }
    await Promise.all(
      order.map((id, index) => db.update('banners', id, { displayOrder: index + 1 }))
    );
    res.json({ success: true, message: 'Banner order updated' });
  } catch (err) {
    next(err);
  }
};
