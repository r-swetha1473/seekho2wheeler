const slugify = require('slugify');
const db = require('../services/db');
const { processAndSave, deleteUpload } = require('../services/upload');

function makeSlug(title, existingSlug) {
  return existingSlug || slugify(title, { lower: true, strict: true });
}

exports.listPublic = async (req, res, next) => {
  try {
    const now = new Date();
    let blogs = await db.getAll('blogs');
    blogs = blogs.filter((b) => {
      if (b.status === 'draft') return false;
      if (b.scheduledAt && new Date(b.scheduledAt) > now) return false;
      return b.status !== 'archived';
    });
    blogs.sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
    if (req.query.limit) blogs = blogs.slice(0, Number(req.query.limit));
    res.json({ success: true, data: blogs });
  } catch (err) {
    next(err);
  }
};

exports.getBySlug = async (req, res, next) => {
  try {
    const blogs = await db.getAll('blogs');
    const blog = blogs.find((b) => b.slug === req.params.slug);
    if (!blog || blog.status === 'draft') {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    res.json({ success: true, data: blog });
  } catch (err) {
    next(err);
  }
};

exports.listAdmin = async (req, res, next) => {
  try {
    const blogs = await db.getAll('blogs');
    blogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: blogs });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { title, content, metaTitle, metaDescription, status, scheduledAt } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    let featuredImage = req.body.featuredImage || '';
    if (req.file) featuredImage = await processAndSave(req.file, 'blogs');

    const slug = makeSlug(title, req.body.slug);
    const blogs = await db.getAll('blogs');
    if (blogs.some((b) => b.slug === slug)) {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }

    const blog = await db.create('blogs', {
      title,
      slug,
      content,
      featuredImage,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || '',
      status: status || 'published',
      scheduledAt: scheduledAt || null,
      publishedAt: status === 'scheduled' ? null : new Date().toISOString()
    });
    res.status(201).json({ success: true, message: 'Blog created', data: blog });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await db.getById('blogs', req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Blog not found' });

    const payload = { ...req.body };
    if (payload.title && !payload.slug) payload.slug = makeSlug(payload.title);
    if (req.file) {
      if (existing.featuredImage) await deleteUpload(existing.featuredImage);
      payload.featuredImage = await processAndSave(req.file, 'blogs');
    }
    const blog = await db.update('blogs', req.params.id, payload);
    res.json({ success: true, message: 'Blog updated', data: blog });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const existing = await db.getById('blogs', req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Blog not found' });
    if (existing.featuredImage) await deleteUpload(existing.featuredImage);
    await db.remove('blogs', req.params.id);
    res.json({ success: true, message: 'Blog deleted' });
  } catch (err) {
    next(err);
  }
};
