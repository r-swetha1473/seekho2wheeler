const { processAndSave } = require('../services/upload');

const CATEGORIES = new Set([
  'banners', 'gallery', 'blogs', 'branches', 'testimonials',
  'pages', 'courses', 'home', 'updates', 'general'
]);

exports.create = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please choose an image.' });
    }
    const category = CATEGORIES.has(req.body.category) ? req.body.category : 'general';
    const url = await processAndSave(req.file, category);
    res.json({ success: true, data: { url } });
  } catch (err) {
    next(err);
  }
};
