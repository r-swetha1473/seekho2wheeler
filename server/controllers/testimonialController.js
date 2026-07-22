const db = require('../services/db');
const { processAndSave, deleteUpload } = require('../services/upload');

exports.listPublic = async (req, res, next) => {
  try {
    let items = await db.getAll('testimonials');
    items = items.filter((t) => t.active !== false);
    items.sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

exports.listAdmin = async (req, res, next) => {
  try {
    const items = await db.getAll('testimonials');
    items.sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, review, rating, videoUrl, type, headline, displayOrder, active } = req.body;
    if (!name || !review) {
      return res.status(400).json({ success: false, message: 'Name and review are required' });
    }

    let photo = req.body.photo || '';
    if (req.file) photo = await processAndSave(req.file, 'testimonials');

    const item = await db.create('testimonials', {
      name,
      review,
      rating: Number(rating || 5),
      photo,
      videoUrl: videoUrl || '',
      type: type || 'text',
      headline: headline || '',
      displayOrder: Number(displayOrder || 0),
      active: active !== 'false' && active !== false
    });
    res.status(201).json({ success: true, message: 'Testimonial created', data: item });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await db.getById('testimonials', req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Testimonial not found' });

    const payload = { ...req.body };
    if (req.file) {
      if (existing.photo) await deleteUpload(existing.photo);
      payload.photo = await processAndSave(req.file, 'testimonials');
    }
    if (payload.rating !== undefined) payload.rating = Number(payload.rating);

    const item = await db.update('testimonials', req.params.id, payload);
    res.json({ success: true, message: 'Testimonial updated', data: item });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const existing = await db.getById('testimonials', req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Testimonial not found' });
    if (existing.photo) await deleteUpload(existing.photo);
    await db.remove('testimonials', req.params.id);
    res.json({ success: true, message: 'Testimonial deleted' });
  } catch (err) {
    next(err);
  }
};
