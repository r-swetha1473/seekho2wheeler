const { processAndSave } = require('../services/upload');
const CONTENT_LIMITS = require('../contentLimits');
const {
  listSections,
  getSectionByKey,
  saveSectionByKey
} = require('../services/homeSections');

exports.getLimits = (req, res) => {
  res.json({ success: true, data: CONTENT_LIMITS });
};

function noStore(res) {
  res.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
}

exports.getPublicByKey = async (req, res, next) => {
  try {
    const section = await getSectionByKey(req.params.key);
    noStore(res);
    if (!section || section.is_active === false) {
      return res.json({ success: true, data: null, limits: CONTENT_LIMITS });
    }
    res.json({ success: true, data: section, limits: CONTENT_LIMITS });
  } catch (err) {
    next(err);
  }
};

exports.listPublic = async (req, res, next) => {
  try {
    noStore(res);
    const data = (await listSections()).filter((s) => s && s.is_active !== false);
    res.json({ success: true, data, limits: CONTENT_LIMITS });
  } catch (err) {
    next(err);
  }
};

exports.getAdminByKey = async (req, res, next) => {
  try {
    const section = await getSectionByKey(req.params.key);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Home section not found' });
    }
    res.json({ success: true, data: section, limits: CONTENT_LIMITS });
  } catch (err) {
    next(err);
  }
};

exports.listAdmin = async (req, res, next) => {
  try {
    const data = await listSections();
    res.json({ success: true, data, limits: CONTENT_LIMITS });
  } catch (err) {
    next(err);
  }
};

exports.updateByKey = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (req.file) {
      payload.image_url = await processAndSave(req.file, 'home');
    }
    const result = await saveSectionByKey(req.params.key, payload);
    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.message });
    }
    res.json({ success: true, message: 'Doorstep section saved', data: result.data, limits: CONTENT_LIMITS });
  } catch (err) {
    next(err);
  }
};
