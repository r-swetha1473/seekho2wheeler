const { processAndSave } = require('../services/upload');
const specialCms = require('../services/specialCms');

function readBody(req) {
  const body = { ...req.body };
  if (typeof body.payload === 'string') {
    try {
      const parsed = JSON.parse(body.payload);
      return parsed;
    } catch {
      return body;
    }
  }
  if (typeof body.sections === 'string') {
    try { body.sections = JSON.parse(body.sections); } catch { /* keep */ }
  }
  return body;
}

exports.listPublic = async (req, res, next) => {
  try {
    const data = await specialCms.listPublic();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getPublic = async (req, res, next) => {
  try {
    const page = await specialCms.getBySlug(req.params.slug, { publicOnly: true });
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    res.json({ success: true, data: page });
  } catch (err) {
    next(err);
  }
};

exports.listAdmin = async (req, res, next) => {
  try {
    const data = await specialCms.listAdmin();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const body = readBody(req);
    if (req.file) body.heroImage = await processAndSave(req.file, 'pages');
    const result = await specialCms.createPage(body);
    if (!result.ok) return res.status(400).json({ success: false, message: result.message });
    res.status(201).json({ success: true, message: 'Special page created', data: result.data });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const body = readBody(req);
    if (req.file) body.heroImage = await processAndSave(req.file, 'pages');
    const result = await specialCms.updatePage(req.params.id, body);
    if (!result.ok) return res.status(result.status || 400).json({ success: false, message: result.message });
    res.json({ success: true, message: 'Special page updated', data: result.data });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const result = await specialCms.removePage(req.params.id);
    if (!result.ok) return res.status(result.status || 400).json({ success: false, message: result.message });
    res.json({ success: true, message: 'Special page deleted' });
  } catch (err) {
    next(err);
  }
};
