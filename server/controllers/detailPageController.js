const { processAndSave } = require('../services/upload');
const {
  listPages,
  getBySlug,
  publicPayload,
  createPage,
  updatePage,
  removePage
} = require('../services/detailPages');

exports.getPublic = async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').trim();
    const page = slug ? await getBySlug(slug) : null;
    const payload = publicPayload(page, slug);
    res.json({ success: true, ...payload });
  } catch (err) {
    next(err);
  }
};

exports.listAdmin = async (req, res, next) => {
  try {
    const data = await listPages();
    data.sort((a, b) => String(a.title).localeCompare(String(b.title)));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (req.file) payload.hero_image_url = await processAndSave(req.file, 'pages');
    const result = await createPage(payload);
    if (!result.ok) return res.status(400).json({ success: false, message: result.message });
    res.status(201).json({ success: true, message: 'Detail page created', data: result.data });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (req.file) payload.hero_image_url = await processAndSave(req.file, 'pages');
    const result = await updatePage(req.params.id, payload);
    if (!result.ok) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }
    res.json({ success: true, message: 'Detail page updated', data: result.data });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const ok = await removePage(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Page not found' });
    res.json({ success: true, message: 'Detail page deleted' });
  } catch (err) {
    next(err);
  }
};
