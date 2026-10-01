const slugify = require('slugify');
const OUR_MISSION_PLACEHOLDER = '<p>Details coming soon</p>';
const db = require('./db');
const { sanitizeHtml, stripHtml, parseBool } = require('../utils/sanitizeHtml');

const DEFAULT_PAGES = [
  {
    id: 'page-doorstep-training',
    slug: 'doorstep-training',
    title: 'DOORSTEP TRAINING',
    hero_image_url: '/images/courses/seekho-05.webp',
    body_html: '',
    seo_title: 'Doorstep Training | Seekho Two Wheeler Academy',
    seo_description: 'Learn scooty or bike at your location. Doorstep training from Seekho Two Wheeler Academy, Kolkata.',
    is_active: true
  },
  {
    id: 'page-our-mission',
    slug: 'our-mission',
    title: 'Our Mission',
    hero_image_url: '/images/thumbs/seekho-01.webp',
    body_html: OUR_MISSION_PLACEHOLDER,
    seo_title: 'Our Mission | Seekho Two Wheeler Academy',
    seo_description: 'Empowering every learner to ride independently and safely on Kolkata roads.',
    is_active: true
  },
  {
    id: 'page-our-journey',
    slug: 'our-journey',
    title: 'Our Journey',
    hero_image_url: '',
    body_html: '',
    seo_title: 'Our Journey | Seekho Two Wheeler Academy',
    seo_description: 'From 2018 to today — Seekho Two Wheeler Academy in Kolkata.',
    is_active: true
  },
  {
    id: 'page-women-empowerment',
    slug: 'women-empowerment',
    title: 'Women Empowerment',
    hero_image_url: '/images/thumbs/seekho-07.webp',
    body_html: '',
    seo_title: 'Women Empowerment | Seekho Two Wheeler Academy',
    seo_description: 'Ladies batches and supportive training for women riders in Kolkata.',
    is_active: true
  },
  {
    id: 'page-our-story',
    slug: 'our-story',
    title: 'Our Story',
    hero_image_url: '/images/thumbs/seekho-02.webp',
    body_html: '',
    seo_title: 'Our Story | Seekho Two Wheeler Academy',
    seo_description: 'How Seekho Two Wheeler Academy grew across Kolkata.',
    is_active: true
  }
];

function makeSlug(title, existingSlug) {
  const raw = String(existingSlug || title || '').trim();
  return slugify(raw, { lower: true, strict: true }) || `page-${Date.now()}`;
}

function hasBody(html) {
  return Boolean(stripHtml(html || ''));
}

function normalizePage(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: String(row.slug || '').trim(),
    title: row.title || '',
    hero_image_url: row.hero_image_url || '',
    body_html: row.body_html || '',
    seo_title: row.seo_title || '',
    seo_description: row.seo_description || '',
    is_active: row.is_active !== false,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function toSheetRow(data) {
  const now = new Date().toISOString();
  const row = {
    slug: data.slug,
    title: data.title,
    hero_image_url: data.hero_image_url || '',
    body_html: data.body_html || '',
    seo_title: data.seo_title || '',
    seo_description: data.seo_description || '',
    is_active: data.is_active !== false,
    created_at: data.created_at || now,
    updated_at: now
  };
  if (data.id) row.id = data.id;
  return row;
}

async function ensureTab() {
  if (typeof db.ensureSheetTab === 'function') {
    await db.ensureSheetTab('detail_pages');
  }
}

async function listPages() {
  if (!(db.allowRuntimeSeed && !db.allowRuntimeSeed())) {
    await ensureTab();
  }
  let rows = await db.getAll('detail_pages');
  if (!rows.length && !(db.allowRuntimeSeed && !db.allowRuntimeSeed())) {
    const now = new Date().toISOString();
    for (const seed of DEFAULT_PAGES) {
      await db.create('detail_pages', { ...seed, created_at: now, updated_at: now });
    }
    rows = await db.getAll('detail_pages');
  }
  if (!(db.allowRuntimeSeed && !db.allowRuntimeSeed())) {
    rows = await ensureOurMissionRow(rows);
  }
  return rows.map(normalizePage).filter((p) => p && p.slug);
}

async function ensureOurMissionRow(rows) {
  const seed = DEFAULT_PAGES.find((p) => p.slug === 'our-mission');
  let mission = rows.find((r) => r.slug === 'our-mission');
  if (!mission && seed) {
    const created = await db.create('detail_pages', { ...seed, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    return [...rows, created];
  }
  if (mission && !hasBody(mission.body_html)) {
    await db.update('detail_pages', mission.id, { body_html: OUR_MISSION_PLACEHOLDER });
    return db.getAll('detail_pages');
  }
  return rows;
}

async function uniqueSlug(base, excludeId) {
  const all = await listPages();
  let slug = base;
  let i = 2;
  while (all.some((p) => p.slug === slug && String(p.id) !== String(excludeId || ''))) {
    slug = `${base}-${i}`;
    i += 1;
  }
  return slug;
}

async function getBySlug(slug) {
  const pages = await listPages();
  const needle = String(slug || '').trim().toLowerCase();
  if (!needle) return null;
  return pages.find((p) => String(p.slug || '').trim().toLowerCase() === needle) || null;
}

async function getById(id) {
  const pages = await listPages();
  return pages.find((p) => String(p.id) === String(id)) || null;
}

function publicPayload(page, slugParam) {
  if (!page || page.is_active === false) {
    return {
      found: false,
      comingSoon: false,
      data: null,
      slug: slugParam || ''
    };
  }
  return {
    found: true,
    comingSoon: !hasBody(page.body_html),
    data: page
  };
}

async function createPage(payload) {
  const title = String(payload.title || '').trim();
  if (!title) return { ok: false, message: 'Title is required' };
  const slug = await uniqueSlug(makeSlug(title, payload.slug));
  const row = toSheetRow({
    title,
    slug,
    hero_image_url: payload.hero_image_url || '',
    body_html: sanitizeHtml(payload.body_html || ''),
    seo_title: String(payload.seo_title || '').trim(),
    seo_description: String(payload.seo_description || '').trim(),
    is_active: payload.is_active !== undefined ? parseBool(payload.is_active, true) : true
  });
  const created = await db.create('detail_pages', row);
  return { ok: true, data: normalizePage(created) };
}

async function updatePage(id, payload) {
  const current = await getById(id);
  if (!current) return { ok: false, message: 'Page not found', status: 404 };
  const title = payload.title !== undefined ? String(payload.title || '').trim() : current.title;
  if (!title) return { ok: false, message: 'Title is required' };
  let slug = current.slug;
  if (payload.slug !== undefined || payload.title !== undefined) {
    slug = await uniqueSlug(makeSlug(title, payload.slug !== undefined ? payload.slug : current.slug), current.id);
  }
  const next = {
    ...current,
    title,
    slug,
    hero_image_url: payload.hero_image_url !== undefined ? payload.hero_image_url : current.hero_image_url,
    body_html: payload.body_html !== undefined ? sanitizeHtml(payload.body_html) : current.body_html,
    seo_title: payload.seo_title !== undefined ? String(payload.seo_title || '').trim() : current.seo_title,
    seo_description: payload.seo_description !== undefined ? String(payload.seo_description || '').trim() : current.seo_description,
    is_active: payload.is_active !== undefined ? parseBool(payload.is_active, true) : current.is_active,
    created_at: current.created_at
  };
  const saved = await db.update('detail_pages', id, toSheetRow(next));
  return { ok: true, data: normalizePage(saved) };
}

async function removePage(id) {
  return db.remove('detail_pages', id);
}

module.exports = {
  makeSlug,
  listPages,
  getBySlug,
  uniqueSlug,
  publicPayload,
  createPage,
  updatePage,
  removePage,
  hasBody
};
