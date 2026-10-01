const db = require('./db');
const { sanitizeHtml, stripHtml, parseBool } = require('../utils/sanitizeHtml');
const CONTENT_LIMITS = require('../contentLimits');

const DOORSTEP_FEATURES = [
  { icon: '🛵', text: 'Scooty + Bike Training' },
  { icon: '📍', text: 'Up to 10 KM from Netaji metro' },
  { icon: '👨‍🏫', text: 'Personal Trainer at Your Location' },
  { icon: '📅', text: '15-Session Standard Package' },
  { icon: '⚙️', text: 'Customisable Duration & Schedule' }
];

const DOORSTEP_SEED = {
  id: 'home-doorstep',
  key: 'doorstep',
  title: 'DOORSTEP TRAINING',
  subtitle: 'Learn to Ride. We Come to You.',
  description: 'Learn scooty or bike from the comfort of your own neighbourhood with personalised, one-on-one doorstep training.',
  image_url: '/images/courses/seekho-05.webp',
  features_json: DOORSTEP_FEATURES,
  link_slug: 'doorstep-training',
  is_active: true,
  sort_order: 2,
  title_bold: false
};

const WHY_CHOOSE_SEED = {
  id: 'home-why-choose',
  key: 'why_choose',
  title: 'Training Built For Real Confidence',
  subtitle: 'Why Choose Seekho',
  description: 'Patient trainers, flexible slots, and guided road practice — everything you need to ride independently.',
  image_url: '',
  features_json: [],
  link_slug: '',
  is_active: true,
  sort_order: 1,
  title_bold: false
};

const SECTION_SEEDS = [DOORSTEP_SEED, WHY_CHOOSE_SEED];

function parseFeatures(raw) {
  let list = raw;
  if (typeof list === 'string' && list.trim()) {
    try {
      list = JSON.parse(list);
    } catch {
      list = list.split('\n').map((line) => line.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(list)) return [];
  return list.map((item) => {
    if (typeof item === 'string') return { icon: '', text: item.trim(), detail: '' };
    const detailRaw = item && item.detail != null && String(item.detail).trim() !== ''
      ? item.detail
      : (item && item.description) || '';
    return {
      icon: String(item && item.icon != null ? item.icon : '').trim(),
      text: String(item && item.text != null ? item.text : '').trim(),
      detail: sanitizeHtml(String(detailRaw || '').trim())
    };
  }).filter((item) => item.icon || item.text || item.detail);
}

function validateCopy(description, features) {
  const descLen = stripHtml(description || '').length;
  if (descLen > CONTENT_LIMITS.descriptionMax) {
    return {
      ok: false,
      message: `Short description must be at most ${CONTENT_LIMITS.descriptionMax} characters (currently ${descLen}).`
    };
  }
  const feats = parseFeatures(features);
  for (let i = 0; i < feats.length; i += 1) {
    const n = feats[i].text.length;
    if (n > CONTENT_LIMITS.featureLineMax) {
      return {
        ok: false,
        message: `Feature ${i + 1} title must be at most ${CONTENT_LIMITS.featureLineMax} characters (currently ${n}).`
      };
    }
    const detailLen = stripHtml(feats[i].detail || '').length;
    if (detailLen > CONTENT_LIMITS.featureDetailMax) {
      return {
        ok: false,
        message: `Feature ${i + 1} details must be at most ${CONTENT_LIMITS.featureDetailMax} characters (currently ${detailLen}).`
      };
    }
  }
  return { ok: true, features: feats };
}

function normalizeSection(row) {
  if (!row) return null;
  const features = parseFeatures(row.features_json ?? row.features);
  return {
    id: row.id,
    key: row.key,
    title: row.title || '',
    subtitle: row.subtitle || '',
    description: row.description || '',
    image_url: row.image_url || '',
    features,
    link_slug: row.link_slug || '',
    is_active: row.is_active !== false,
    sort_order: Number(row.sort_order || 0),
    title_bold: parseBool(row.title_bold),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function toSheetRow(data) {
  const now = new Date().toISOString();
  return {
    id: data.id,
    key: data.key,
    title: data.title,
    subtitle: data.subtitle,
    description: data.description,
    image_url: data.image_url,
    features_json: parseFeatures(data.features_json ?? data.features),
    link_slug: data.link_slug,
    is_active: data.is_active !== false,
    sort_order: Number(data.sort_order || 0),
    title_bold: parseBool(data.title_bold),
    created_at: data.created_at || now,
    updated_at: now
  };
}

async function ensureTab() {
  if (db.allowRuntimeSeed && !db.allowRuntimeSeed()) return;
  if (typeof db.ensureSheetTab === 'function') {
    await db.ensureSheetTab('home_sections');
  }
}

async function listSections() {
  await ensureTab();
  let rows = await db.getAll('home_sections');
  if (db.allowRuntimeSeed && !db.allowRuntimeSeed()) {
    const mapped = rows.map(normalizeSection).filter(Boolean);
    const keys = new Set(mapped.map((r) => r.key));
    SECTION_SEEDS.forEach((seed) => {
      if (!keys.has(seed.key)) {
        mapped.push({ ...normalizeSection(seed), from_seed: true });
        return;
      }
      const i = mapped.findIndex((r) => r.key === seed.key);
      if (i < 0) return;
      const cur = mapped[i];
      mapped[i] = {
        ...cur,
        title: cur.title && String(cur.title).replace(/<[^>]+>/g, '').trim() ? cur.title : seed.title,
        subtitle: cur.subtitle && String(cur.subtitle).trim() ? cur.subtitle : seed.subtitle,
        description: cur.description && String(cur.description).replace(/<[^>]+>/g, '').trim() ? cur.description : seed.description,
        image_url: cur.image_url || seed.image_url,
        features: (cur.features && cur.features.length) ? cur.features : parseFeatures(seed.features_json),
        link_slug: cur.link_slug || seed.link_slug
      };
    });
    return mapped.sort((a, b) => a.sort_order - b.sort_order);
  }
  for (const seed of SECTION_SEEDS) {
    if (!rows.some((r) => r.key === seed.key)) {
      const created = await db.create('home_sections', toSheetRow(seed));
      rows = [...rows, created];
    }
  }
  return rows.map(normalizeSection).filter(Boolean).sort((a, b) => a.sort_order - b.sort_order);
}

async function getSectionByKey(key) {
  const sections = await listSections();
  return sections.find((s) => s.key === key) || null;
}

async function saveSectionByKey(key, payload) {
  const current = await getSectionByKey(key);
  if (!current) {
    return { ok: false, message: 'Home section not found' };
  }

  const title = payload.title !== undefined ? sanitizeHtml(payload.title) : current.title;
  const subtitle = payload.subtitle !== undefined ? sanitizeHtml(payload.subtitle) : current.subtitle;
  const description = payload.description !== undefined ? sanitizeHtml(payload.description) : current.description;
  const featuresRaw = payload.features_json !== undefined ? payload.features_json : (payload.features !== undefined ? payload.features : current.features);

  const copy = validateCopy(description, featuresRaw);
  if (!copy.ok) return copy;

  if (!stripHtml(title)) {
    return { ok: false, message: 'Heading is required' };
  }

  const next = {
    ...current,
    title,
    subtitle,
    description,
    features_json: copy.features.map((f) => ({
      icon: f.icon,
      text: f.text,
      detail: sanitizeHtml(f.detail || '')
    })),
    image_url: payload.image_url !== undefined ? payload.image_url : current.image_url,
    link_slug: payload.link_slug !== undefined ? String(payload.link_slug || '').trim() : current.link_slug,
    is_active: payload.is_active !== undefined ? parseBool(payload.is_active, true) : current.is_active,
    sort_order: payload.sort_order !== undefined ? Number(payload.sort_order || 0) : current.sort_order,
    title_bold: payload.title_bold !== undefined ? parseBool(payload.title_bold) : current.title_bold,
    created_at: current.created_at
  };

  const row = toSheetRow(next);
  const raw = await db.getAll('home_sections');
  const inSheet = raw.find((r) => String(r.id) === String(current.id))
    || raw.find((r) => r.key === key);
  if (!inSheet) {
    const created = await db.create('home_sections', row);
    return { ok: true, data: normalizeSection(created) };
  }
  const saved = await db.update('home_sections', inSheet.id, { ...row, id: inSheet.id });
  return { ok: true, data: normalizeSection(saved || row) };
}

module.exports = {
  CONTENT_LIMITS,
  DOORSTEP_SEED,
  WHY_CHOOSE_SEED,
  parseFeatures,
  validateCopy,
  normalizeSection,
  listSections,
  getSectionByKey,
  saveSectionByKey
};
