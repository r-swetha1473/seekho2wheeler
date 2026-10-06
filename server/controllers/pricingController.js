const db = require('../services/db');
const { processAndSave, deleteUpload } = require('../services/upload');
const { sanitizeHtml, parseBool, stripHtml } = require('../utils/sanitizeHtml');
const {
  makeSlug,
  parsePrice,
  parseClasses,
  normalizeCourse,
  toSheetRow,
  uniqueSlug
} = require('../services/courses');

function parseFeatures(features) {
  let feats = features || [];
  if (typeof feats === 'string') {
    try { feats = JSON.parse(feats); } catch { feats = feats.split('\n').map((s) => s.trim()).filter(Boolean); }
  }
  if (!Array.isArray(feats)) feats = [];
  return feats;
}

exports.listPublic = async (req, res, next) => {
  try {
    let items = (await db.getAll('pricing')).map(normalizeCourse).filter(Boolean);
    items = items.filter((p) => p.is_active !== false);
    items.sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

exports.listAdmin = async (req, res, next) => {
  try {
    const items = (await db.getAll('pricing')).map(normalizeCourse).filter(Boolean);
    items.sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const name = String(req.body.name || req.body.courseName || '').trim();
    const description = req.body.description || '';
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!stripHtml(description)) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }
    const priceRes = parsePrice(req.body.price ?? req.body.amount);
    if (!priceRes.ok) return res.status(400).json({ success: false, message: priceRes.message });
    const classesRes = parseClasses(req.body.classes);
    if (!classesRes.ok) return res.status(400).json({ success: false, message: classesRes.message });

    let image_url = req.body.image_url || req.body.image || '';
    if (req.file) image_url = await processAndSave(req.file, 'courses');

    const slug = await uniqueSlug(db, makeSlug(name, req.body.slug));
    const existing = await db.getAll('pricing');
    const sort_order = req.body.sort_order !== undefined && req.body.sort_order !== ''
      ? Number(req.body.sort_order)
      : existing.length + 1;

    const row = toSheetRow({
      name,
      slug,
      description: sanitizeHtml(description),
      price: priceRes.value,
      classes: classesRes.value,
      image_url,
      badge: String(req.body.badge || '').trim(),
      is_active: req.body.is_active !== undefined ? parseBool(req.body.is_active, true) : parseBool(req.body.active, true),
      sort_order,
      title_bold: parseBool(req.body.title_bold),
      features: parseFeatures(req.body.features)
    });

    const item = await db.create('pricing', row);
    res.status(201).json({ success: true, message: 'Course created', data: normalizeCourse(item) });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await db.getById('pricing', req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Course not found' });
    const current = normalizeCourse(existing);

    const nextData = { ...current };
    if (req.body.name !== undefined || req.body.courseName !== undefined) {
      nextData.name = String(req.body.name || req.body.courseName || '').trim();
    }
    if (req.body.description !== undefined) nextData.description = sanitizeHtml(req.body.description);
    if (req.body.price !== undefined || req.body.amount !== undefined) {
      const priceRes = parsePrice(req.body.price ?? req.body.amount);
      if (!priceRes.ok) return res.status(400).json({ success: false, message: priceRes.message });
      nextData.price = priceRes.value;
    }
    if (req.body.classes !== undefined) {
      const classesRes = parseClasses(req.body.classes);
      if (!classesRes.ok) return res.status(400).json({ success: false, message: classesRes.message });
      nextData.classes = classesRes.value;
    }
    if (req.body.badge !== undefined) nextData.badge = String(req.body.badge || '').trim();
    if (req.body.sort_order !== undefined || req.body.displayOrder !== undefined) {
      nextData.sort_order = Number(req.body.sort_order ?? req.body.displayOrder ?? 0);
    }
    if (req.body.is_active !== undefined || req.body.active !== undefined) {
      nextData.is_active = parseBool(req.body.is_active !== undefined ? req.body.is_active : req.body.active);
    }
    if (req.body.title_bold !== undefined) nextData.title_bold = parseBool(req.body.title_bold);
    if (req.body.features !== undefined) nextData.features = parseFeatures(req.body.features);
    if (req.body.slug !== undefined && String(req.body.slug).trim()) {
      nextData.slug = await uniqueSlug(db, makeSlug(nextData.name, req.body.slug), current.id);
    } else if (req.body.name || req.body.courseName) {
      nextData.slug = await uniqueSlug(db, makeSlug(nextData.name, current.slug), current.id);
    }

    if (req.file) {
      if (current.image_url) await deleteUpload(current.image_url);
      nextData.image_url = await processAndSave(req.file, 'courses');
    } else if (req.body.image_url !== undefined) {
      nextData.image_url = req.body.image_url;
    } else if (typeof req.body.image === 'string') {
      nextData.image_url = req.body.image;
    }

    if (!nextData.name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (req.body.description !== undefined && !stripHtml(nextData.description)) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }

    const row = toSheetRow({ ...nextData, id: current.id, created_at: current.created_at, createdAt: current.createdAt });
    const item = await db.update('pricing', req.params.id, row);
    res.json({ success: true, message: 'Course updated', data: normalizeCourse(item) });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const existing = await db.getById('pricing', req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Course not found' });
    const current = normalizeCourse(existing);
    if (current.image_url) await deleteUpload(current.image_url);
    const ok = await db.remove('pricing', req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, message: 'Course deleted' });
  } catch (err) {
    next(err);
  }
};
