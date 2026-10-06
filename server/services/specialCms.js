/**
 * One special-page record renders through SpecialPageTemplate at /special/:slug.
 */
const slugify = require('slugify');
const db = require('./db');
const { sanitizeHtml } = require('../utils/sanitizeHtml');

const RESERVED = new Set(['admin', 'api', 'locations', 'pages', 'courses', 'special', 'blog', 'women-training', 'p', 'uploads', 'css', 'js', 'images']);

const DEFAULT_SECTIONS = [
  { key: 'hero', type: 'hero', enabled: true, order: 1, heading: '', subheading: '', body: '', items: [] },
  { key: 'intro', type: 'description', enabled: true, order: 2, heading: '', subheading: '', body: '', items: [] },
  { key: 'bullets', type: 'bullets', enabled: true, order: 3, heading: 'Highlights', subheading: '', body: '', items: [] },
  { key: 'features', type: 'features', enabled: true, order: 4, heading: 'What You Get', subheading: '', body: '', items: [] },
  { key: 'benefits', type: 'benefits', enabled: true, order: 5, heading: 'Benefits', subheading: '', body: '', items: [] },
  { key: 'pricing', type: 'pricing', enabled: true, order: 6, heading: 'Special Price', subheading: '', body: '', items: [] },
  { key: 'timing', type: 'timing', enabled: true, order: 7, heading: 'Offer Timing', subheading: '', body: '', items: [] },
  { key: 'faq', type: 'faq', enabled: true, order: 8, heading: 'Questions', subheading: '', body: '', items: [] },
  { key: 'cta', type: 'cta', enabled: true, order: 9, heading: '', subheading: '', body: '', items: [] }
];

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* ignore */ }
  }
  return [];
}

function cleanSlug(value, fallback) {
  return slugify(String(value || fallback || '').trim(), { lower: true, strict: true });
}

function normalizeSections(raw) {
  const incoming = asArray(raw);
  const byKey = new Map();
  incoming.forEach((row, index) => {
    const key = String(row.key || row.type || '').trim();
    if (!key) return;
    const items = asArray(row.items).map((item) => {
      if (typeof item === 'string') return { title: item, text: '' };
      return {
        title: String(item.title || item.q || item.question || '').trim(),
        text: String(item.text || item.a || item.answer || item.body || '').trim()
      };
    }).filter((item) => item.title || item.text);
    byKey.set(key, {
      key,
      type: String(row.type || key),
      enabled: row.enabled !== false && row.enabled !== 'false',
      order: Number(row.order || index + 1),
      heading: String(row.heading || ''),
      subheading: String(row.subheading || ''),
      body: sanitizeHtml(row.body || ''),
      items
    });
  });
  DEFAULT_SECTIONS.forEach((row) => {
    const hasType = Array.from(byKey.values()).some((item) => item.type === row.type || item.key === row.key);
    if (!hasType) byKey.set(row.key, { ...row, items: [] });
  });
  return Array.from(byKey.values()).sort((a, b) => a.order - b.order || a.key.localeCompare(b.key));
}

function normalize(row) {
  if (!row) return null;
  const slug = cleanSlug(row.slug, row.name);
  return {
    id: row.id,
    name: row.name || '',
    menuLabel: row.menuLabel || row.name || '',
    slug,
    active: row.active !== false,
    published: row.published === true || row.published === 'true',
    displayOrder: Number(row.displayOrder || 0),
    seoTitle: row.seoTitle || '',
    seoDescription: row.seoDescription || '',
    ogTitle: row.ogTitle || row.seoTitle || '',
    ogDescription: row.ogDescription || row.seoDescription || '',
    ogImage: row.ogImage || '',
    heroHeading: row.heroHeading || '',
    heroSubheading: row.heroSubheading || '',
    heroDescription: row.heroDescription || '',
    heroImage: row.heroImage || '',
    ctaText: row.ctaText || '',
    ctaLink: row.ctaLink || '/pages/booking.html',
    price: row.price === '' || row.price == null ? '' : Number(row.price),
    originalPrice: row.originalPrice === '' || row.originalPrice == null ? '' : Number(row.originalPrice),
    offerText: row.offerText || '',
    timingText: row.timingText || '',
    daysText: row.daysText || '',
    sections: normalizeSections(row.sectionsJson),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function payloadFrom(body, existing) {
  const name = String(body.name || (existing && existing.name) || '').trim();
  const slug = cleanSlug(body.slug != null ? body.slug : (existing && existing.slug), name);
  if (!name) return { ok: false, message: 'Page name is required' };
  if (!slug || RESERVED.has(slug)) return { ok: false, message: 'Choose a different slug' };
  const ctaLink = String(body.ctaLink != null ? body.ctaLink : (existing && existing.ctaLink) || '/pages/booking.html').trim();
  if (ctaLink && !/^(\/|https:\/\/|mailto:|tel:)/i.test(ctaLink)) {
    return { ok: false, message: 'CTA link must be a site path or https URL' };
  }
  const data = {
    name,
    menuLabel: String(body.menuLabel != null ? body.menuLabel : name).trim() || name,
    slug,
    active: body.active !== false && body.active !== 'false',
    published: body.published === true || body.published === 'true',
    displayOrder: Number(body.displayOrder != null ? body.displayOrder : (existing && existing.displayOrder) || 0),
    seoTitle: body.seoTitle != null ? body.seoTitle : (existing && existing.seoTitle) || '',
    seoDescription: body.seoDescription != null ? body.seoDescription : (existing && existing.seoDescription) || '',
    ogTitle: body.ogTitle != null ? body.ogTitle : (existing && existing.ogTitle) || '',
    ogDescription: body.ogDescription != null ? body.ogDescription : (existing && existing.ogDescription) || '',
    ogImage: body.ogImage != null ? body.ogImage : (existing && existing.ogImage) || '',
    heroHeading: body.heroHeading != null ? body.heroHeading : (existing && existing.heroHeading) || name,
    heroSubheading: body.heroSubheading != null ? body.heroSubheading : (existing && existing.heroSubheading) || '',
    heroDescription: body.heroDescription != null ? body.heroDescription : (existing && existing.heroDescription) || '',
    heroImage: body.heroImage != null ? body.heroImage : (existing && existing.heroImage) || '',
    ctaText: body.ctaText != null ? body.ctaText : (existing && existing.ctaText) || 'Book Now',
    ctaLink: ctaLink || '/pages/booking.html',
    price: body.price === '' || body.price == null ? '' : Number(body.price),
    originalPrice: body.originalPrice === '' || body.originalPrice == null ? '' : Number(body.originalPrice),
    offerText: body.offerText != null ? body.offerText : (existing && existing.offerText) || '',
    timingText: body.timingText != null ? body.timingText : (existing && existing.timingText) || '',
    daysText: body.daysText != null ? body.daysText : (existing && existing.daysText) || '',
    sectionsJson: normalizeSections(body.sections != null ? body.sections : body.sectionsJson || (existing && existing.sections) || DEFAULT_SECTIONS)
  };
  if (!data.seoTitle) data.seoTitle = `${name} | Seekho Two Wheeler Academy`;
  if (!data.ogTitle) data.ogTitle = data.seoTitle;
  if (!data.ogDescription) data.ogDescription = data.seoDescription || data.heroDescription || '';
  return { ok: true, data };
}

async function listAdmin() {
  if (typeof db.ensureSheetTab === 'function') await db.ensureSheetTab('special_pages');
  const rows = await db.getAll('special_pages');
  return rows.map(normalize).filter(Boolean).sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
}

async function listPublic() {
  const rows = await listAdmin();
  return rows.filter((row) => row.active !== false && row.published === true);
}

async function getBySlug(slug, { publicOnly = false } = {}) {
  const key = cleanSlug(slug, slug);
  const rows = publicOnly ? await listPublic() : await listAdmin();
  return rows.find((row) => row.slug === key) || null;
}

async function syncMenu(page) {
  const menus = await db.getAll('frontend_menus');
  const href = `/special/${page.slug}`;
  const visible = page.active !== false && page.published === true;
  const existing = menus.find((row) => String(row.specialSlug || '') === page.slug || (row.pageType === 'special' && row.href === href));
  if (!existing) {
    if (!visible) return;
    await db.create('frontend_menus', {
      id: `menu-special-${page.slug}`,
      label: page.menuLabel || page.name,
      href,
      menuGroup: 'header',
      isExternal: false,
      openNewTab: false,
      active: true,
      displayOrder: Number(page.displayOrder) || 50,
      pageType: 'special',
      specialSlug: page.slug
    });
    return;
  }
  await db.update('frontend_menus', existing.id, {
    label: page.menuLabel || page.name,
    href,
    pageType: 'special',
    specialSlug: page.slug,
    active: visible
  });
}

async function createPage(body) {
  const check = payloadFrom(body, null);
  if (!check.ok) return check;
  const rows = await listAdmin();
  if (rows.some((row) => row.slug === check.data.slug)) return { ok: false, message: 'That slug is already used' };
  const row = await db.create('special_pages', check.data);
  const page = normalize(row);
  await syncMenu(page);
  return { ok: true, data: page };
}

async function updatePage(id, body) {
  const rows = await db.getAll('special_pages');
  const existing = rows.find((row) => String(row.id) === String(id));
  if (!existing) return { ok: false, status: 404, message: 'Special page not found' };
  const current = normalize(existing);
  const check = payloadFrom(body, current);
  if (!check.ok) return check;
  const clash = rows.some((row) => String(row.id) !== String(id) && cleanSlug(row.slug, row.name) === check.data.slug);
  if (clash) return { ok: false, message: 'That slug is already used' };
  const row = await db.update('special_pages', id, check.data);
  const page = normalize(row);
  await syncMenu(page);
  return { ok: true, data: page };
}

async function removePage(id) {
  const rows = await db.getAll('special_pages');
  const existing = rows.find((row) => String(row.id) === String(id));
  if (!existing) return { ok: false, status: 404, message: 'Special page not found' };
  const page = normalize(existing);
  await db.remove('special_pages', id);
  const menus = await db.getAll('frontend_menus');
  const menu = menus.find((row) => String(row.specialSlug || '') === page.slug);
  if (menu && (menu.pageType === 'special' || String(menu.id).startsWith('menu-special-'))) {
    await db.remove('frontend_menus', menu.id);
  } else if (menu) {
    await db.update('frontend_menus', menu.id, { active: false });
  }
  return { ok: true };
}

module.exports = {
  DEFAULT_SECTIONS,
  listAdmin,
  listPublic,
  getBySlug,
  createPage,
  updatePage,
  removePage,
  normalize
};
