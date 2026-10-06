const { processAndSave } = require('../services/upload');
const locationCms = require('../services/locationCms');

function readBody(req) {
  const body = { ...req.body };
  if (typeof body.payload === 'string') {
    try {
      return { ...JSON.parse(body.payload), image: body.image };
    } catch {
      return body;
    }
  }
  ['highlights', 'training', 'whoCanLearn', 'howToReach', 'phones', 'faqs', 'pricing', 'sections', 'timing', 'availableCourses'].forEach((key) => {
    if (typeof body[key] === 'string') {
      try { body[key] = JSON.parse(body[key]); } catch { /* keep */ }
    }
  });
  return body;
}

exports.listPublic = async (req, res, next) => {
  try {
    const data = await locationCms.listPublic();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getPublic = async (req, res, next) => {
  try {
    const result = await locationCms.resolve(req.params.slug);
    if (!result || result.status !== 'ok') {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    const view = result.view;
    res.json({
      success: true,
      data: {
        slug: view.slug,
        name: view.shortName,
        branchName: view.branchName,
        branchId: view.branchId,
        area: view.area,
        address: view.address,
        landmark: view.landmark,
        establishedLabel: view.establishedLabel,
        phones: view.phones,
        whatsapp: view.whatsapp,
        mapsLink: view.mapsLink,
        trainingAvailable: view.trainingAvailable,
        href: `/locations/${view.slug}`,
        galleryCategory: view.galleryCategory,
        isMainBranch: view.isMainBranch,
        faqs: view.faqs,
        howToReach: view.howToReach,
        pricing: view.pricing,
        timing: view.timing,
        seo: view.seo,
        hero: view.hero
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.listAdmin = async (req, res, next) => {
  try {
    const data = await locationCms.listAdmin();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const body = readBody(req);
    if (req.file) body.image = await processAndSave(req.file, 'branches');
    const result = await locationCms.saveLocation(null, body, { isCreate: true });
    if (!result.ok) return res.status(result.status || 400).json({ success: false, message: result.message });
    res.status(201).json({ success: true, message: 'Location created', data: result.data });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const body = readBody(req);
    if (req.file) body.image = await processAndSave(req.file, 'branches');
    if (Object.keys(body).length === 1 && Object.prototype.hasOwnProperty.call(body, 'active')) {
      const result = await locationCms.setActive(req.params.id, body.active !== false && body.active !== 'false');
      if (!result.ok) return res.status(result.status || 400).json({ success: false, message: result.message });
      const data = await locationCms.listAdmin();
      return res.json({ success: true, message: 'Location updated', data: data.find((row) => row.branchId === req.params.id) || null });
    }
    const result = await locationCms.saveLocation(req.params.id, body, { isCreate: false });
    if (!result.ok) return res.status(result.status || 400).json({ success: false, message: result.message });
    res.json({ success: true, message: 'Location updated', data: result.data });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const result = await locationCms.removeLocation(req.params.id);
    if (!result.ok) return res.status(result.status || 400).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message, deactivated: !!result.deactivated });
  } catch (err) {
    next(err);
  }
};
