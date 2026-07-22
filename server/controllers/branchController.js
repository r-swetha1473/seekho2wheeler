const db = require('../services/db');
const { processAndSave, deleteUpload } = require('../services/upload');

exports.listPublic = async (req, res, next) => {
  try {
    let branches = await db.getAll('branches');
    branches = branches.filter((b) => b.active !== false);

    const q = (req.query.q || req.query.search || '').toLowerCase().trim();
    if (q) {
      branches = branches.filter(
        (b) =>
          (b.name || '').toLowerCase().includes(q) ||
          (b.address || '').toLowerCase().includes(q) ||
          (b.area || '').toLowerCase().includes(q)
      );
    }
    res.json({ success: true, data: branches });
  } catch (err) {
    next(err);
  }
};

exports.listAdmin = async (req, res, next) => {
  try {
    const branches = await db.getAll('branches');
    res.json({ success: true, data: branches });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const {
      name, address, area, mapsLink, phone, whatsapp, availableCourses, trainerCount, active
    } = req.body;
    if (!name || !address) {
      return res.status(400).json({ success: false, message: 'Branch name and address are required' });
    }

    let image = req.body.image || '';
    if (req.file) image = await processAndSave(req.file, 'branches');

    let courses = availableCourses || [];
    if (typeof courses === 'string') {
      try { courses = JSON.parse(courses); } catch { courses = courses.split(',').map((s) => s.trim()); }
    }

    const branch = await db.create('branches', {
      name,
      area: area || '',
      address,
      mapsLink: mapsLink || '',
      phone: phone || '',
      whatsapp: whatsapp || phone || '',
      availableCourses: courses,
      trainerCount: Number(trainerCount || 0),
      image,
      active: active !== 'false' && active !== false
    });
    res.status(201).json({ success: true, message: 'Branch created', data: branch });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await db.getById('branches', req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Branch not found' });

    const payload = { ...req.body };
    if (req.file) {
      if (existing.image) await deleteUpload(existing.image);
      payload.image = await processAndSave(req.file, 'branches');
    }
    if (payload.availableCourses && typeof payload.availableCourses === 'string') {
      try { payload.availableCourses = JSON.parse(payload.availableCourses); }
      catch { payload.availableCourses = payload.availableCourses.split(',').map((s) => s.trim()); }
    }
    if (payload.trainerCount !== undefined) payload.trainerCount = Number(payload.trainerCount);

    const branch = await db.update('branches', req.params.id, payload);
    res.json({ success: true, message: 'Branch updated', data: branch });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const existing = await db.getById('branches', req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Branch not found' });
    if (existing.image) await deleteUpload(existing.image);
    await db.remove('branches', req.params.id);
    res.json({ success: true, message: 'Branch deleted' });
  } catch (err) {
    next(err);
  }
};
