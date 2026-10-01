const db = require('../services/db');
const { processAndSave, deleteUpload } = require('../services/upload');
const { sanitizeHtml, parseBool } = require('../utils/sanitizeHtml');

function sortByOrder(items) {
  return [...items].sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
}

function pickField(row, ...names) {
  const lookup = {};
  Object.keys(row || {}).forEach((k) => {
    lookup[String(k).toLowerCase().replace(/[\s-]+/g, '_')] = row[k];
  });
  for (const name of names) {
    const key = String(name).toLowerCase().replace(/[\s-]+/g, '_');
    if (Object.prototype.hasOwnProperty.call(lookup, key) && lookup[key] !== '' && lookup[key] != null) {
      return lookup[key];
    }
  }
  return undefined;
}

function normalizeBanner(row) {
  if (!row) return null;
  const activeRaw = pickField(row, 'active', 'is_active');
  const active = activeRaw === undefined ? row.active !== false : parseBool(activeRaw, true);
  return {
    ...row,
    id: row.id,
    title: String(pickField(row, 'title', 'banner_title', 'heading') ?? row.title ?? ''),
    subtitle: String(pickField(row, 'subtitle', 'banner_subtitle') ?? row.subtitle ?? ''),
    ctaText: String(pickField(row, 'ctaText', 'cta_text', 'button_text') ?? row.ctaText ?? ''),
    ctaLink: String(pickField(row, 'ctaLink', 'cta_link', 'button_link') ?? row.ctaLink ?? ''),
    image: String(pickField(row, 'image', 'image_url', 'banner_image') ?? row.image ?? ''),
    displayOrder: Number(pickField(row, 'displayOrder', 'display_order', 'sort_order') ?? row.displayOrder ?? 0),
    active,
    title_bold: parseBool(pickField(row, 'title_bold', 'titleBold') ?? row.title_bold)
  };
}

function noStore(res) {
  res.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
}

exports.listPublic = async (req, res, next) => {
  try {
    const banners = await db.getAll('banners');
    const active = sortByOrder(banners.map(normalizeBanner).filter((b) => b && b.active !== false));
    noStore(res);
    res.json({ success: true, data: active });
  } catch (err) {
    next(err);
  }
};

exports.listAdmin = async (req, res, next) => {
  try {
    const banners = sortByOrder((await db.getAll('banners')).map(normalizeBanner).filter(Boolean));
    noStore(res);
    res.json({ success: true, data: banners });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { title, subtitle, ctaText, ctaLink, displayOrder, active } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Banner title is required' });

    let image = req.body.image || '';
    if (req.file) image = await processAndSave(req.file, 'banners');

    const banner = await db.create('banners', {
      title,
      subtitle: sanitizeHtml(subtitle || ''),
      ctaText: ctaText || 'Book Training',
      ctaLink: ctaLink || '/pages/booking.html',
      image,
      displayOrder: Number(displayOrder || 0),
      active: active !== 'false' && active !== false,
      title_bold: parseBool(req.body.title_bold)
    });
    res.status(201).json({ success: true, message: 'Banner created', data: banner });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await db.getById('banners', req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Banner not found' });

    const payload = { ...req.body };
    if (req.file) {
      if (existing.image) await deleteUpload(existing.image);
      payload.image = await processAndSave(req.file, 'banners');
    }
    if (payload.displayOrder !== undefined) payload.displayOrder = Number(payload.displayOrder);
    if (payload.active !== undefined) payload.active = payload.active !== 'false' && payload.active !== false;
    if (payload.subtitle !== undefined) payload.subtitle = sanitizeHtml(payload.subtitle);
    if (payload.title_bold !== undefined) payload.title_bold = parseBool(payload.title_bold);

    const banner = await db.update('banners', req.params.id, payload);
    res.json({ success: true, message: 'Banner updated', data: banner });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const existing = await db.getById('banners', req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Banner not found' });
    if (existing.image) await deleteUpload(existing.image);
    await db.remove('banners', req.params.id);
    res.json({ success: true, message: 'Banner deleted' });
  } catch (err) {
    next(err);
  }
};

exports.reorder = async (req, res, next) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) {
      return res.status(400).json({ success: false, message: 'Order array is required' });
    }
    await Promise.all(
      order.map((id, index) => db.update('banners', id, { displayOrder: index + 1 }))
    );
    res.json({ success: true, message: 'Banner order updated' });
  } catch (err) {
    next(err);
  }
};
