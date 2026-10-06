/**
 * Location page CMS.
 * Sheets/JSON are the source of truth. locations.js is the idempotent seed and outage fallback.
 * Display pricing and display timings never feed the booking price list or booking slots.
 */
const db = require('./db');
const { applyLocationFields } = require('../utils/geo');
const { sanitizeHtml } = require('../utils/sanitizeHtml');
const { mapsEmbedUrl, MAIN_BRANCH } = require('../config/mainBranch');
const {
  LOCATIONS,
  branchSeedRows,
  getLocation,
  listPublicCards,
  localBusinessJsonLd,
  faqPageJsonLd,
  breadcrumbJsonLd
} = require('../content/locations');

const DISPLAY_PRICE_HINTS = [
  { test: /doorstep/i, price: 4500, duration: 'Distance-based', sessions: '' },
  { test: /advance|advanced/i, price: 2500, duration: '10 or 15 classes', sessions: '' },
  { test: /basic scooty/i, price: 2500, duration: '15 classes', sessions: 15 },
  { test: /bike/i, price: 2500, duration: '', sessions: '' },
  { test: /rto/i, price: 2800, duration: '', sessions: '' }
];

const DEFAULT_TIMING = {
  opening: '7:00 AM',
  closing: '7:00 PM',
  workingDays: 'Monday – Sunday',
  weekend: '',
  special: '',
  slotDuration: '1 hour'
};

let seedReady = false;
let seedPending = null;
let cachedCards = null;

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return [];
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* line list */ }
    return value.split('\n').map((line) => line.trim()).filter(Boolean);
  }
  return [];
}

function asObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch { /* ignore */ }
  }
  return {};
}

function digits(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

function uniquePhones(list) {
  const out = [];
  (list || []).forEach((phone) => {
    const d = digits(phone);
    if (d && !out.includes(d)) out.push(d);
  });
  return out;
}

function hintForCourse(name) {
  return DISPLAY_PRICE_HINTS.find((row) => row.test.test(String(name || ''))) || null;
}

function defaultSections(loc) {
  const name = loc.displayName || loc.name || 'this centre';
  return [
    { key: 'hero', enabled: true, order: 1, heading: '', subheading: '' },
    { key: 'why', enabled: true, order: 2, heading: (loc.why && loc.why.title) || `Why Train at ${name}`, subheading: '' },
    { key: 'highlights', enabled: true, order: 3, heading: `Highlights of ${name}`, subheading: 'What Makes This Branch Different' },
    { key: 'training', enabled: true, order: 4, heading: 'Training Available', subheading: '' },
    { key: 'whoCanLearn', enabled: true, order: 5, heading: 'Who Can Learn Here', subheading: '' },
    { key: 'pricing', enabled: true, order: 6, heading: 'Training Fees', subheading: 'Display prices for this centre. The fee charged at booking follows the course you select.' },
    { key: 'timing', enabled: true, order: 7, heading: 'Centre Timings', subheading: 'Visitor information. Your booking slot is chosen from the academy timetable when you register.' },
    { key: 'howToReach', enabled: true, order: 8, heading: 'How to Reach', subheading: 'Directions' },
    { key: 'gallery', enabled: true, order: 9, heading: `${name} Gallery`, subheading: 'Photos' },
    { key: 'women', enabled: true, order: 10, heading: (loc.women && loc.women.title) || `Women Learning at ${name}`, subheading: '' },
    { key: 'reviews', enabled: true, order: 11, heading: 'Learner Reviews', subheading: '' },
    { key: 'faq', enabled: true, order: 12, heading: `${name} Questions`, subheading: 'FAQ' },
    { key: 'cta', enabled: true, order: 13, heading: `Ready to Train at ${name}?`, subheading: 'Book a slot or call us on the official Seekho numbers.' },
    { key: 'floatingReviews', enabled: !!loc.showFloatingReviews, order: 14, heading: '', subheading: '' }
  ];
}

function pageRowFromStatic(loc, branchId, now) {
  const pricing = (loc.trainingAvailable || []).map((name, index) => {
    const hint = hintForCourse(name);
    return {
      name,
      price: hint ? hint.price : '',
      offerPrice: '',
      duration: hint ? hint.duration : '',
      sessions: hint ? hint.sessions : '',
      displayOrder: index + 1,
      active: true
    };
  });
  return {
    id: `loc-${loc.slug}`,
    branchId,
    slug: loc.slug,
    active: true,
    displayOrder: LOCATIONS.findIndex((item) => item.slug === loc.slug) + 1,
    featured: !!loc.isMainBranch,
    shortName: loc.displayName || loc.name,
    landmark: loc.landmark || '',
    establishedLabel: loc.establishedLabel || '',
    pageTitle: (loc.seo && loc.seo.title) || '',
    heroEyebrow: (loc.hero && loc.hero.eyebrow) || '',
    heroHeading: (loc.hero && loc.hero.h1) || '',
    heroSubtitle: (loc.hero && loc.hero.subtitle) || '',
    introHtml: '',
    whyTitle: (loc.why && loc.why.title) || '',
    whyBody: (loc.why && loc.why.body) || '',
    highlightsJson: loc.usps || [],
    trainingJson: loc.trainingAvailable || [],
    whoCanLearnJson: loc.whoCanLearn || [],
    howToReachJson: loc.howToReach || [],
    phonesJson: loc.phones || [],
    womenTitle: (loc.women && loc.women.title) || '',
    womenBody: (loc.women && loc.women.body) || '',
    faqsJson: loc.faqs || [],
    pricingJson: pricing,
    timingJson: { ...DEFAULT_TIMING },
    ctaText: 'Book Training',
    ctaLink: `/pages/booking.html?branchId=${encodeURIComponent(branchId)}&branch=${encodeURIComponent(loc.slug)}`,
    seoTitle: (loc.seo && loc.seo.title) || '',
    seoDescription: (loc.seo && loc.seo.description) || '',
    seoKeywords: ((loc.seo && loc.seo.keywords) || []).join(', '),
    ogTitle: (loc.seo && loc.seo.title) || '',
    ogDescription: (loc.seo && loc.seo.description) || '',
    ogImage: '',
    galleryCategory: loc.galleryCategory || '',
    mapsLink: loc.mapsLink || '',
    placeId: loc.placeId || '',
    sectionsJson: defaultSections(loc),
    createdAt: now,
    updatedAt: now
  };
}

function normalizeSections(raw, fallbackName) {
  const incoming = asArray(raw).map((row) => ({
    key: String(row.key || '').trim(),
    enabled: row.enabled !== false && row.enabled !== 'false',
    order: Number(row.order || row.displayOrder || 0),
    heading: String(row.heading || ''),
    subheading: String(row.subheading || '')
  })).filter((row) => row.key);
  const defaults = defaultSections({ displayName: fallbackName || 'this centre', why: {}, women: {} });
  const byKey = new Map(incoming.map((row) => [row.key, row]));
  defaults.forEach((row) => {
    if (!byKey.has(row.key)) byKey.set(row.key, row);
  });
  return Array.from(byKey.values()).sort((a, b) => a.order - b.order || a.key.localeCompare(b.key));
}

function normalizePricing(raw) {
  return asArray(raw).map((row, index) => {
    if (typeof row === 'string') {
      const hint = hintForCourse(row);
      return {
        name: row,
        price: hint ? hint.price : '',
        offerPrice: '',
        duration: hint ? hint.duration : '',
        sessions: hint ? hint.sessions : '',
        displayOrder: index + 1,
        active: true
      };
    }
    return {
      name: String(row.name || row.course || '').trim(),
      price: row.price === '' || row.price == null ? '' : Number(row.price),
      offerPrice: row.offerPrice === '' || row.offerPrice == null ? '' : Number(row.offerPrice),
      duration: String(row.duration || ''),
      sessions: row.sessions === '' || row.sessions == null ? '' : row.sessions,
      displayOrder: Number(row.displayOrder || index + 1),
      active: row.active !== false && row.active !== 'false'
    };
  }).filter((row) => row.name);
}

function normalizeTiming(raw) {
  const src = asObject(raw);
  return {
    opening: String(src.opening || DEFAULT_TIMING.opening),
    closing: String(src.closing || DEFAULT_TIMING.closing),
    workingDays: String(src.workingDays || src.days || DEFAULT_TIMING.workingDays),
    weekend: String(src.weekend || ''),
    special: String(src.special || ''),
    slotDuration: String(src.slotDuration || DEFAULT_TIMING.slotDuration)
  };
}

function normalizeHighlights(raw) {
  return asArray(raw).map((row) => {
    if (typeof row === 'string') {
      const [title, text, icon] = row.split('|').map((part) => part.trim());
      return { icon: icon || 'fa-solid fa-check', title: title || row, text: text || '' };
    }
    return {
      icon: String(row.icon || 'fa-solid fa-check'),
      title: String(row.title || ''),
      text: String(row.text || row.body || '')
    };
  }).filter((row) => row.title);
}

function normalizeFaqs(raw) {
  return asArray(raw).map((row) => ({
    q: String(row.q || row.question || '').trim(),
    a: String(row.a || row.answer || '').trim()
  })).filter((row) => row.q && row.a);
}

function stringList(raw) {
  return asArray(raw).map((item) => (typeof item === 'string' ? item : String(item.name || item.text || ''))).map((item) => item.trim()).filter(Boolean);
}

function isMain(page, branch) {
  const placeId = (page && page.placeId) || '';
  if (placeId && placeId === MAIN_BRANCH.placeId) return true;
  return !!((page && page.featured) && String(page.slug) === 'tollygunge');
}

function viewFromParts(page, branch) {
  const shortName = page.shortName || (branch && branch.area) || (branch && branch.name) || page.slug;
  const branchId = (branch && branch.id) || page.branchId || '';
  const phones = uniquePhones([
    ...asArray(page.phonesJson),
    branch && branch.phone,
    branch && branch.whatsapp
  ]);
  const sections = normalizeSections(page.sectionsJson, shortName);
  const mapsLink = page.mapsLink || (branch && branch.mapsLink) || '';
  const main = isMain(page, branch);
  return {
    slug: page.slug,
    shortName,
    branchName: (branch && branch.name) || shortName,
    branchId,
    area: (branch && branch.area) || '',
    address: (branch && branch.address) || '',
    city: (branch && branch.city) || '',
    state: (branch && branch.state) || '',
    pincode: (branch && branch.pincode) || '',
    landmark: page.landmark || '',
    establishedLabel: page.establishedLabel || '',
    phones,
    whatsapp: digits(branch && branch.whatsapp) || phones[0] || '',
    mapsLink,
    embedUrl: main ? mapsEmbedUrl(MAIN_BRANCH) : '',
    placeId: page.placeId || '',
    isMainBranch: main,
    galleryCategory: page.galleryCategory || '',
    image: (branch && branch.image) || '',
    trainingAvailable: stringList(page.trainingJson),
    hero: {
      eyebrow: page.heroEyebrow || '',
      h1: page.heroHeading || shortName,
      subtitle: page.heroSubtitle || ''
    },
    why: { title: page.whyTitle || '', body: page.whyBody || '' },
    introHtml: sanitizeHtml(page.introHtml || ''),
    highlights: normalizeHighlights(page.highlightsJson),
    whoCanLearn: stringList(page.whoCanLearnJson),
    howToReach: stringList(page.howToReachJson),
    women: { title: page.womenTitle || '', body: page.womenBody || '' },
    faqs: normalizeFaqs(page.faqsJson),
    pricing: normalizePricing(page.pricingJson),
    timing: normalizeTiming(page.timingJson),
    ctaText: page.ctaText || 'Book Training',
    ctaLink: page.ctaLink || `/pages/booking.html?branchId=${encodeURIComponent(branchId)}&branch=${encodeURIComponent(page.slug)}`,
    seo: {
      title: page.seoTitle || page.pageTitle || `${shortName} | Seekho`,
      description: page.seoDescription || page.heroSubtitle || '',
      keywords: String(page.seoKeywords || '').split(',').map((item) => item.trim()).filter(Boolean)
    },
    ogTitle: page.ogTitle || page.seoTitle || page.pageTitle || '',
    ogDescription: page.ogDescription || page.seoDescription || '',
    ogImage: page.ogImage || '',
    pageTitle: page.pageTitle || '',
    sections,
    showFloatingReviews: sections.some((row) => row.key === 'floatingReviews' && row.enabled !== false),
    active: page.active !== false && (!branch || branch.active !== false),
    featured: page.featured === true || page.featured === 'true',
    displayOrder: Number(page.displayOrder || (branch && branch.displayOrder) || 0),
    source: 'cms'
  };
}

function viewFromStatic(loc) {
  const branchId = `branch-loc-${loc.slug}`;
  const page = pageRowFromStatic(loc, branchId, '');
  const seed = branchSeedRows().find((row) => row.id === branchId) || {};
  return viewFromParts(page, {
    id: branchId,
    name: loc.branchName,
    area: loc.area,
    address: loc.address,
    phone: (loc.phones || [])[0] || '',
    whatsapp: loc.whatsapp || '',
    mapsLink: loc.mapsLink || '',
    active: true,
    city: seed.city || '',
    state: seed.state || '',
    pincode: seed.pincode || '',
    image: ''
  });
}

function toCard(view) {
  return {
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
    isMainBranch: !!view.isMainBranch,
    image: view.image || '',
    featured: !!view.featured,
    displayOrder: view.displayOrder || 0,
    active: view.active !== false,
    howToReach: view.howToReach || [],
    embedUrl: view.embedUrl || ''
  };
}

function sortViews(views) {
  return views.slice().sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0) || String(a.shortName).localeCompare(String(b.shortName)));
}

async function ensureSeeded() {
  if (seedReady) return;
  if (!seedPending) {
    seedPending = runSeed()
      .then(() => { seedReady = true; })
      .finally(() => { seedPending = null; });
  }
  return seedPending;
}

function normBranchName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/sarovar/g, 'sarobar')
    .replace(/branch/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function findBookingBranch(branches, loc) {
  const slug = loc.slug;
  const bySlug = branches.find((row) => String(row.locationSlug || '').toLowerCase() === slug && !String(row.id).startsWith('branch-loc-'));
  if (bySlug) return bySlug;
  const wanted = new Set([normBranchName(loc.branchName), normBranchName(loc.displayName), normBranchName(loc.name), normBranchName(slug)]);
  return branches.find((row) => !String(row.id).startsWith('branch-loc-') && wanted.has(normBranchName(row.name))) || null;
}

async function runSeed() {
  const now = new Date().toISOString();
  let branches = [];
  let pages = [];
  try {
    if (typeof db.ensureSheetTab === 'function') {
      await db.ensureSheetTab('branches');
      await db.ensureSheetTab('location_pages');
      await db.ensureSheetTab('frontend_menus');
      await db.ensureSheetTab('special_pages');
    }
    branches = await db.getAll('branches');
    pages = await db.getAll('location_pages');
  } catch (err) {
    console.error('[locationCms] seed read failed:', err.message);
    throw err;
  }

  const bookings = await db.getAll('bookings');
  const usedIds = new Set(bookings.map((row) => String(row.branchId || '')));
  const duplicates = branches.filter((row) => {
    if (!String(row.id).startsWith('branch-loc-') || usedIds.has(String(row.id))) return false;
    const loc = {
      slug: String(row.locationSlug || row.id.replace(/^branch-loc-/, '')),
      branchName: row.name,
      displayName: row.name,
      name: row.name
    };
    if (findBookingBranch(branches, loc)) return true;
    const phone = String(row.phone || '').replace(/\D/g, '');
    return phone.length < 10 && row.active === false;
  });
  if (duplicates.length) {
    const drop = new Set(duplicates.map((row) => String(row.id)));
    branches = branches.filter((row) => !drop.has(String(row.id)));
    await db.replaceAll('branches', branches);
  }

  const seeds = branchSeedRows(now);
  for (const loc of LOCATIONS) {
    const seed = seeds.find((row) => row.locationSlug === loc.slug);
    let branch = findBookingBranch(branches, loc);
    if (!branch) {
      const preferred = `branch-loc-${loc.slug}`;
      branch = branches.find((row) => String(row.id) === preferred) || null;
      if (!branch) {
        branch = await db.create('branches', seed);
        branches.push(branch);
      }
    }
    const patch = {};
    ['locationSlug', 'displayOrder', 'featured', 'city', 'state', 'pincode'].forEach((key) => {
      if (isBlank(branch[key]) && seed && !isBlank(seed[key])) patch[key] = seed[key];
    });
    if (Object.keys(patch).length) {
      const updated = await db.update('branches', branch.id, patch);
      if (updated) Object.assign(branch, updated);
    }

    const page = pages.find((row) => String(row.slug || '').toLowerCase() === loc.slug);
    if (!page) {
      const created = await db.create('location_pages', pageRowFromStatic(loc, branch.id, now));
      pages.push(created);
    } else if (String(page.branchId) !== String(branch.id)) {
      const updated = await db.update('location_pages', page.id, { branchId: branch.id });
      if (updated) Object.assign(page, updated);
    }
  }

  await seedMenus();
}

async function seedMenus() {
  const { MENU_SEED, ensureMenuSeed } = require('./menuCms');
  await ensureMenuSeed(MENU_SEED);
}

async function loadViews({ includeInactive = false } = {}) {
  await ensureSeeded();
  const [pages, branches] = await Promise.all([
    db.getAll('location_pages'),
    db.getAll('branches')
  ]);
  const branchById = new Map(branches.map((row) => [String(row.id), row]));
  const views = [];
  const seen = new Set();
  pages.forEach((page) => {
    if (!page || !page.slug) return;
    const branch = branchById.get(String(page.branchId)) || null;
    const view = viewFromParts(page, branch);
    seen.add(view.slug);
    if (!includeInactive && view.active === false) return;
    views.push(view);
  });
  if (!pages.length) {
    return sortViews(LOCATIONS.map(viewFromStatic));
  }
  LOCATIONS.forEach((loc) => {
    if (seen.has(loc.slug)) return;
    const inactive = pages.some((page) => String(page.slug).toLowerCase() === loc.slug && page.active === false);
    if (inactive) return;
    views.push(viewFromStatic(loc));
  });
  return sortViews(views);
}

async function listPublic() {
  try {
    const views = await loadViews({ includeInactive: false });
    cachedCards = views.map(toCard);
    return cachedCards;
  } catch (err) {
    console.error('[locationCms] public list fallback:', err.message);
    cachedCards = listPublicCards();
    return cachedCards;
  }
}

async function listAdmin() {
  const views = await loadViews({ includeInactive: true });
  const [pages, branches] = await Promise.all([
    db.getAll('location_pages'),
    db.getAll('branches')
  ]);
  return views.map((view) => {
    const page = pages.find((row) => row.slug === view.slug) || {};
    const branch = branches.find((row) => String(row.id) === String(view.branchId)) || {};
    return {
      ...view,
      pageId: page.id || '',
      trainerCount: branch.trainerCount || 0,
      availableCourses: branch.availableCourses || view.trainingAvailable,
      latitude: branch.latitude || '',
      longitude: branch.longitude || '',
      phone: branch.phone || '',
      image: branch.image || ''
    };
  });
}

async function resolve(slug) {
  const key = String(slug || '').toLowerCase().trim();
  if (!key) return { status: 'missing' };
  try {
    await ensureSeeded();
    const pages = await db.getAll('location_pages');
    const page = pages.find((row) => String(row.slug || '').toLowerCase() === key);
    if (page) {
      const branches = await db.getAll('branches');
      const branch = branches.find((row) => String(row.id) === String(page.branchId)) || null;
      const view = viewFromParts(page, branch);
      if (view.active === false) return { status: 'inactive', view };
      return { status: 'ok', view };
    }
  } catch (err) {
    console.error('[locationCms] resolve fallback:', err.message);
    const loc = getLocation(key);
    if (loc) return { status: 'ok', view: viewFromStatic(loc) };
    return { status: 'missing' };
  }
  const loc = getLocation(key);
  if (loc) return { status: 'ok', view: viewFromStatic(loc) };
  return { status: 'missing' };
}

function schemaFor(view, origin) {
  const loc = {
    slug: view.slug,
    displayName: view.shortName,
    isMainBranch: view.isMainBranch,
    seo: view.seo,
    phones: view.phones,
    address: view.address,
    placeId: view.placeId,
    mapsLink: view.mapsLink,
    faqs: view.faqs
  };
  return [localBusinessJsonLd(loc, origin), faqPageJsonLd(loc), breadcrumbJsonLd(loc, origin)];
}

function cleanSlug(value, fallback) {
  const slugify = require('slugify');
  const raw = String(value || fallback || '').trim();
  return slugify(raw, { lower: true, strict: true });
}

function validateContent(body) {
  const name = String(body.name || body.branchName || '').trim();
  const address = String(body.address || '').trim();
  if (!name) return { ok: false, message: 'Location name is required' };
  if (!address) return { ok: false, message: 'Address is required' };
  const geo = applyLocationFields({
    mapsLink: body.mapsLink,
    latitude: body.latitude,
    longitude: body.longitude
  });
  if (!geo.ok) return geo;
  const slug = cleanSlug(body.slug, name);
  if (!slug) return { ok: false, message: 'A valid slug is required' };
  return { ok: true, name, address, slug, geo };
}

async function saveLocation(branchId, body, { isCreate = false } = {}) {
  const check = validateContent(body);
  if (!check.ok) return check;
  await ensureSeeded();
  const pages = await db.getAll('location_pages');
  const branches = await db.getAll('branches');
  const slugTaken = pages.some((row) => String(row.slug).toLowerCase() === check.slug && String(row.branchId) !== String(branchId || ''));
  if (slugTaken) return { ok: false, message: 'That slug is already used by another location' };

  const now = new Date().toISOString();
  let id = branchId;
  if (isCreate) {
    const preferred = `branch-loc-${check.slug}`;
    id = branches.some((row) => String(row.id) === preferred) ? `branch-${Date.now()}` : preferred;
    await db.create('branches', {
      id,
      name: check.name,
      area: body.area || '',
      address: check.address,
      mapsLink: check.geo.mapsLink || body.mapsLink || '',
      latitude: check.geo.latitude,
      longitude: check.geo.longitude,
      phone: digits(body.phone),
      whatsapp: digits(body.whatsapp) || digits(body.phone),
      availableCourses: asArray(body.availableCourses),
      trainerCount: Number(body.trainerCount || 0),
      image: body.image || '',
      active: body.active !== false && body.active !== 'false',
      locationSlug: check.slug,
      displayOrder: Number(body.displayOrder || pages.length + 1),
      featured: body.featured === true || body.featured === 'true',
      city: body.city || '',
      state: body.state || '',
      pincode: body.pincode || '',
      createdAt: now,
      updatedAt: now
    });
    await db.create('location_pages', contentPayload(id, check, body, now, true));
  } else {
    const branch = branches.find((row) => String(row.id) === String(id));
    if (!branch) return { ok: false, status: 404, message: 'Branch not found' };
    await db.update('branches', id, {
      name: check.name,
      area: body.area != null ? body.area : branch.area,
      address: check.address,
      mapsLink: body.mapsLink != null ? (check.geo.mapsLink || '') : branch.mapsLink,
      latitude: body.latitude != null ? check.geo.latitude : branch.latitude,
      longitude: body.longitude != null ? check.geo.longitude : branch.longitude,
      phone: body.phone != null ? digits(body.phone) : branch.phone,
      whatsapp: body.whatsapp != null ? (digits(body.whatsapp) || digits(body.phone)) : branch.whatsapp,
      availableCourses: body.availableCourses != null ? asArray(body.availableCourses) : branch.availableCourses,
      trainerCount: body.trainerCount != null ? Number(body.trainerCount || 0) : branch.trainerCount,
      image: body.image != null ? body.image : branch.image,
      active: body.active !== false && body.active !== 'false',
      locationSlug: check.slug,
      displayOrder: body.displayOrder != null ? Number(body.displayOrder) : branch.displayOrder,
      featured: body.featured === true || body.featured === 'true',
      city: body.city != null ? body.city : branch.city,
      state: body.state != null ? body.state : branch.state,
      pincode: body.pincode != null ? body.pincode : branch.pincode
    });
    const page = pages.find((row) => String(row.branchId) === String(id));
    const payload = contentPayload(id, check, body, now, false);
    if (page) await db.update('location_pages', page.id, payload);
    else await db.create('location_pages', { ...payload, id: `loc-${check.slug}`, createdAt: now });
  }
  cachedCards = null;
  const admin = await listAdmin();
  return { ok: true, data: admin.find((row) => String(row.branchId) === String(id)) || null };
}

function contentPayload(branchId, check, body, now, isCreate) {
  const shortName = String(body.shortName || check.name).trim();
  const sections = body.sections != null ? normalizeSections(body.sections, shortName) : (body.sectionsJson != null ? normalizeSections(body.sectionsJson, shortName) : null);
  const row = {
    branchId,
    slug: check.slug,
    active: body.active !== false && body.active !== 'false',
    displayOrder: Number(body.displayOrder || 0),
    featured: body.featured === true || body.featured === 'true',
    shortName,
    landmark: body.landmark || '',
    establishedLabel: body.establishedLabel || '',
    pageTitle: body.pageTitle || '',
    heroEyebrow: body.heroEyebrow || '',
    heroHeading: body.heroHeading || '',
    heroSubtitle: body.heroSubtitle || '',
    introHtml: sanitizeHtml(body.introHtml || ''),
    whyTitle: body.whyTitle || '',
    whyBody: body.whyBody || '',
    highlightsJson: normalizeHighlights(body.highlights != null ? body.highlights : body.highlightsJson),
    trainingJson: stringList(body.training != null ? body.training : body.trainingJson),
    whoCanLearnJson: stringList(body.whoCanLearn != null ? body.whoCanLearn : body.whoCanLearnJson),
    howToReachJson: stringList(body.howToReach != null ? body.howToReach : body.howToReachJson),
    phonesJson: uniquePhones(body.phones != null ? body.phones : body.phonesJson),
    womenTitle: body.womenTitle || '',
    womenBody: body.womenBody || '',
    faqsJson: normalizeFaqs(body.faqs != null ? body.faqs : body.faqsJson),
    pricingJson: normalizePricing(body.pricing != null ? body.pricing : body.pricingJson),
    timingJson: normalizeTiming(body.timing != null ? body.timing : body.timingJson),
    ctaText: body.ctaText || 'Book Training',
    ctaLink: body.ctaLink || `/pages/booking.html?branchId=${encodeURIComponent(branchId)}&branch=${encodeURIComponent(check.slug)}`,
    seoTitle: body.seoTitle || '',
    seoDescription: body.seoDescription || '',
    seoKeywords: body.seoKeywords || '',
    ogTitle: body.ogTitle || '',
    ogDescription: body.ogDescription || '',
    ogImage: body.ogImage || '',
    galleryCategory: body.galleryCategory || '',
    mapsLink: check.geo.mapsLink || body.mapsLink || '',
    placeId: body.placeId || '',
    updatedAt: now
  };
  if (sections) row.sectionsJson = sections;
  else if (isCreate) row.sectionsJson = defaultSections({ displayName: shortName, why: { title: row.whyTitle }, women: { title: row.womenTitle }, showFloatingReviews: false });
  return row;
}

async function setActive(branchId, active) {
  await ensureSeeded();
  const branches = await db.getAll('branches');
  const branch = branches.find((row) => String(row.id) === String(branchId));
  if (!branch) return { ok: false, status: 404, message: 'Location not found' };
  await db.update('branches', branch.id, { active: !!active });
  const pages = await db.getAll('location_pages');
  const page = pages.find((row) => String(row.branchId) === String(branch.id));
  if (page) await db.update('location_pages', page.id, { active: !!active });
  cachedCards = null;
  return { ok: true };
}

async function removeLocation(branchId) {
  await ensureSeeded();
  const branches = await db.getAll('branches');
  const branch = branches.find((row) => String(row.id) === String(branchId));
  if (!branch) return { ok: false, status: 404, message: 'Location not found' };
  const bookings = await db.getAll('bookings');
  const used = bookings.some((row) => String(row.branchId) === String(branch.id));
  const pages = await db.getAll('location_pages');
  const page = pages.find((row) => String(row.branchId) === String(branch.id));
  if (used) {
    await db.update('branches', branch.id, { active: false });
    if (page) await db.update('location_pages', page.id, { active: false });
    cachedCards = null;
    return { ok: true, deactivated: true, message: 'Location deactivated because existing bookings use this branch id' };
  }
  if (page) await db.remove('location_pages', page.id);
  await db.remove('branches', branch.id);
  cachedCards = null;
  return { ok: true, deactivated: false, message: 'Location deleted' };
}

function getCachedCards() {
  return cachedCards;
}

module.exports = {
  ensureSeeded,
  listPublic,
  listAdmin,
  resolve,
  schemaFor,
  saveLocation,
  setActive,
  removeLocation,
  getCachedCards,
  toCard,
  DEFAULT_TIMING
};
