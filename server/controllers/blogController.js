const slugify = require('slugify');
const db = require('../services/db');
const { processAndSave, deleteUpload } = require('../services/upload');
const { sanitizeHtml, parseBool } = require('../utils/sanitizeHtml');
const { mergeArticle, mergePublicList, getArticle } = require('../content/blogs');

function makeSlug(title, existingSlug) {
  return existingSlug || slugify(title, { lower: true, strict: true });
}

function isPublicBlog(b) {
  if (!b) return false;
  if (b.status === 'draft' || b.status === 'archived') return false;
  if (b.scheduledAt && new Date(b.scheduledAt) > new Date()) return false;
  return true;
}

exports.listPublic = async (req, res, next) => {
  try {
    let blogs = await db.getAll('blogs');
    blogs = blogs.filter(isPublicBlog);
    let merged = mergePublicList(blogs).filter(isPublicBlog);
    merged.sort((a, b) => {
      const ao = a.sortOrder || 99;
      const bo = b.sortOrder || 99;
      if (ao !== bo) return ao - bo;
      return new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt);
    });
    if (req.query.limit) merged = merged.slice(0, Number(req.query.limit));
    // List cards: omit heavy branch payloads
    const data = merged.map((b) => {
      const { branches, sections, takeaways, intro, ...card } = b;
      return card;
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getBySlug = async (req, res, next) => {
  try {
    const blogs = await db.getAll('blogs');
    let found = blogs.find((b) => b.slug === req.params.slug);
    if (!found) {
      const ssot = getArticle(req.params.slug);
      if (ssot) found = ssot;
    }
    if (!found || !isPublicBlog({ ...found, status: found.status || 'published' })) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    const merged = mergeArticle(found);
    res.json({
      success: true,
      data: {
        ...merged,
        content: sanitizeHtml(merged.content || '')
      }
    });
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
    const { title, content, metaTitle, metaDescription, status, scheduledAt, category, shortDescription, galleryCategory } = req.body;
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
      content: sanitizeHtml(content),
      featuredImage,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || '',
      category: category || '',
      shortDescription: shortDescription || metaDescription || '',
      galleryCategory: galleryCategory || '',
      status: status || 'published',
      scheduledAt: scheduledAt || null,
      publishedAt: status === 'scheduled' ? null : new Date().toISOString(),
      title_bold: parseBool(req.body.title_bold)
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
    if (payload.content !== undefined) payload.content = sanitizeHtml(payload.content);
    if (payload.title_bold !== undefined) payload.title_bold = parseBool(payload.title_bold);
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
