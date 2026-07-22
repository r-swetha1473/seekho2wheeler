const db = require('../services/db');

exports.listPublic = async (req, res, next) => {
  try {
    let items = await db.getAll('pricing');
    items = items.filter((p) => p.active !== false);
    items.sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

exports.listAdmin = async (req, res, next) => {
  try {
    const items = await db.getAll('pricing');
    items.sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { courseName, price, description, duration, features, displayOrder, active, image } = req.body;
    if (!courseName || price === undefined) {
      return res.status(400).json({ success: false, message: 'Course name and price are required' });
    }
    let feats = features || [];
    if (typeof feats === 'string') {
      try { feats = JSON.parse(feats); } catch { feats = feats.split('\n').map((s) => s.trim()).filter(Boolean); }
    }
    const item = await db.create('pricing', {
      courseName,
      price: Number(price),
      duration: duration || '',
      description: description || '',
      image: image || '',
      features: feats,
      displayOrder: Number(displayOrder || 0),
      active: active !== 'false' && active !== false
    });
    res.status(201).json({ success: true, message: 'Pricing created', data: item });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await db.getById('pricing', req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Pricing not found' });

    const payload = { ...req.body };
    if (payload.price !== undefined) payload.price = Number(payload.price);
    if (payload.displayOrder !== undefined) payload.displayOrder = Number(payload.displayOrder);
    if (payload.features && typeof payload.features === 'string') {
      try { payload.features = JSON.parse(payload.features); }
      catch { payload.features = payload.features.split('\n').map((s) => s.trim()).filter(Boolean); }
    }
    const item = await db.update('pricing', req.params.id, payload);
    res.json({ success: true, message: 'Pricing updated', data: item });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const ok = await db.remove('pricing', req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Pricing not found' });
    res.json({ success: true, message: 'Pricing deleted' });
  } catch (err) {
    next(err);
  }
};
