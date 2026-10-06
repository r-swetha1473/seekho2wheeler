const slugify = require('slugify');
const { parseBool } = require('../utils/sanitizeHtml');

function makeSlug(name, existingSlug) {
  const raw = String(existingSlug || name || '').trim();
  return slugify(raw, { lower: true, strict: true }) || `course-${Date.now()}`;
}

function parsePrice(raw) {
  if (raw === undefined || raw === null || raw === '') {
    return { ok: false, message: 'Amount is required' };
  }
  const str = String(raw).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(str)) {
    return { ok: false, message: 'Amount must be a number with up to 2 decimal places (e.g. 3999.50)' };
  }
  const n = Number(str);
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, message: 'Amount must be 0 or greater' };
  }
  return { ok: true, value: Math.round(n * 100) / 100 };
}

function parseClasses(raw) {
  if (raw === undefined || raw === null || raw === '') {
    return { ok: false, message: 'Number of classes is required' };
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1 || !Number.isInteger(n)) {
    return { ok: false, message: 'Number of classes must be a whole number of at least 1' };
  }
  return { ok: true, value: n };
}

function classesFromLegacyDuration(duration) {
  const nums = String(duration || '').match(/\d+/g);
  if (!nums || !nums.length) return 15;
  return Math.max(1, parseInt(nums[nums.length - 1], 10) || 15);
}

function normalizeCourse(row) {
  if (!row) return null;
  const name = String(row.name || row.courseName || '').trim();
  const slug = String(row.slug || '').trim() || makeSlug(name);
  const classesParsed = row.classes !== undefined && row.classes !== ''
    ? parseInt(String(row.classes), 10)
    : classesFromLegacyDuration(row.duration);
  const classes = Number.isFinite(classesParsed) && classesParsed >= 1 ? classesParsed : 15;
  const priceRaw = Number(row.price);
  const price = Number.isFinite(priceRaw) ? Math.round(priceRaw * 100) / 100 : 0;
  const image_url = String(row.image_url || row.image || '').trim();
  const is_active = (row.is_active === undefined || row.is_active === '')
    ? row.active !== false
    : parseBool(row.is_active, row.active !== false);
  const sort_order = Number(row.sort_order ?? row.displayOrder ?? 0) || 0;
  const badge = String(row.badge || '').trim();
  const created_at = row.created_at || row.createdAt || '';
  const updated_at = row.updated_at || row.updatedAt || '';

  return {
    ...row,
    id: row.id,
    name,
    courseName: name,
    slug,
    description: row.description || '',
    price,
    classes,
    image_url,
    image: image_url,
    badge,
    is_active,
    active: is_active,
    sort_order,
    displayOrder: sort_order,
    title_bold: parseBool(row.title_bold),
    features: Array.isArray(row.features) ? row.features : (row.features ? [row.features] : []),
    duration: `${classes} classes`,
    classes_label: `${classes} classes`,
    created_at,
    updated_at,
    createdAt: created_at,
    updatedAt: updated_at
  };
}

function toSheetRow(data) {
  const name = String(data.name || data.courseName || '').trim();
  const classes = data.classes;
  const price = data.price;
  const image_url = data.image_url !== undefined && data.image_url !== null
    ? String(data.image_url)
    : String(data.image || '');
  const is_active = data.is_active !== undefined ? data.is_active : data.active !== false;
  const sort_order = data.sort_order !== undefined ? data.sort_order : data.displayOrder;
  const now = new Date().toISOString();
  const row = {
    name,
    slug: data.slug,
    description: data.description || '',
    price,
    classes,
    image_url,
    badge: data.badge || '',
    is_active,
    sort_order: Number(sort_order || 0),
    title_bold: Boolean(data.title_bold),
    features: data.features || [],
    courseName: name,
    duration: `${classes} classes`,
    image: image_url,
    displayOrder: Number(sort_order || 0),
    active: is_active,
    created_at: data.created_at || data.createdAt || now,
    updated_at: now,
    createdAt: data.createdAt || data.created_at || now,
    updatedAt: now
  };
  if (data.id) row.id = data.id;
  return row;
}

async function uniqueSlug(db, base, excludeId) {
  const all = (await db.getAll('pricing')).map(normalizeCourse);
  let slug = base;
  let i = 2;
  while (all.some((c) => c.slug === slug && String(c.id) !== String(excludeId || ''))) {
    slug = `${base}-${i}`;
    i += 1;
  }
  return slug;
}

module.exports = {
  makeSlug,
  parsePrice,
  parseClasses,
  normalizeCourse,
  toSheetRow,
  uniqueSlug
};
