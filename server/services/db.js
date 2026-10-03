/**
 * Database layer
 * - Google Sheets = primary storage when GOOGLE_SHEETS_ENABLED=true
 * - Local JSON = development only (when Sheets is disabled)
 *
 * Production bookings/enquiries are NEVER written to local JSON or /tmp.
 */
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const local = require('./localStore');
const { createGoogleAuth } = require('./googleAuth');
const { AppError, publicSheetsMessage, isMissingTabError } = require('../utils/httpError');

let sheetsClient = null;
let sheetsAuthMeta = null;
let sheetsInitPromise = null;
let spreadsheetMeta = null;
const ensuredTabs = new Set();
const ensureTabPromises = new Map();
const readCache = new Map();
const CACHE_TTL = process.env.VERCEL ? 120 * 1000 : 30 * 1000;

/** Tabs that must live permanently in Google Sheets (never /tmp or local in prod mode) */
const PERMANENT_SHEETS = new Set([
  'bookings',
  'enquiries',
  'branches',
  'pricing',
  'blogs',
  'testimonials', // Reviews
  'banners',
  'gallery',
  'faqs',
  'settings',
  'notifications',
  'visits',
  'admins',
  'doorstep_pricing',
  'home_sections',
  'detail_pages',
  'why_choose',
  'chatbot_qa',
  'chatbot_unanswered',
  'chatbot_config',
  'updates',
  'page_copy'
]);

/** Canonical column order per sheet (first write / empty sheet) */
const SHEET_HEADERS = {
  bookings: ['id', 'name', 'phone', 'email', 'courseId', 'courseName', 'branchId', 'branchName', 'date', 'timeSlot', 'message', 'status', 'createdAt', 'updatedAt'],
  enquiries: ['id', 'name', 'phone', 'email', 'message', 'status', 'createdAt', 'updatedAt'],
  branches: ['id', 'name', 'area', 'address', 'mapsLink', 'latitude', 'longitude', 'phone', 'whatsapp', 'availableCourses', 'trainerCount', 'image', 'active', 'createdAt', 'updatedAt'],
  pricing: ['id', 'name', 'slug', 'description', 'price', 'classes', 'image_url', 'badge', 'is_active', 'sort_order', 'title_bold', 'features', 'courseName', 'duration', 'image', 'displayOrder', 'active', 'created_at', 'updated_at', 'createdAt', 'updatedAt'],
  blogs: ['id', 'title', 'slug', 'featuredImage', 'metaTitle', 'metaDescription', 'content', 'shortDescription', 'category', 'galleryCategory', 'status', 'scheduledAt', 'publishedAt', 'title_bold', 'createdAt', 'updatedAt'],
  testimonials: ['id', 'name', 'headline', 'review', 'rating', 'photo', 'videoUrl', 'type', 'displayOrder', 'active', 'title_bold', 'createdAt', 'updatedAt'],
  banners: ['id', 'title', 'subtitle', 'ctaText', 'ctaLink', 'image', 'displayOrder', 'active', 'title_bold', 'createdAt', 'updatedAt'],
  gallery: ['id', 'title', 'category', 'image', 'displayOrder', 'active', 'title_bold', 'createdAt', 'updatedAt'],
  faqs: ['id', 'question', 'answer', 'displayOrder', 'active', 'title_bold', 'createdAt', 'updatedAt'],
  settings: ['id', 'siteName', 'tagline', 'phones', 'whatsapp', 'email', 'address', 'gmb_url', 'latitude', 'longitude', 'map_embed_url', 'facebookUrl', 'instagramUrl', 'youtubeUrl', 'googleRating', 'facebookRating', 'reviewCount', 'workingHours', 'trainedCandidates', 'foundedYear', 'tagline_bold', 'header_cta_text', 'header_cta_link', 'footer_cta_title', 'footer_cta_text', 'footer_cta_button', 'copyright_text', 'logo_subline', 'createdAt', 'updatedAt'],
  notifications: ['id', 'type', 'title', 'message', 'refId', 'read', 'createdAt', 'updatedAt'],
  visits: ['id', 'date', 'count', 'createdAt', 'updatedAt'],
  admins: ['id', 'email', 'password', 'name', 'role', 'active', 'createdAt', 'updatedAt'],
  doorstep_pricing: ['id', 'base_km', 'base_price', 'max_km', 'max_price', 'per_km_extra', 'pricing_mode', 'out_of_range_message', 'created_at', 'updated_at'],
  home_sections: ['id', 'key', 'title', 'subtitle', 'description', 'image_url', 'features_json', 'link_slug', 'is_active', 'sort_order', 'title_bold', 'created_at', 'updated_at'],
  detail_pages: ['id', 'slug', 'title', 'hero_image_url', 'body_html', 'seo_title', 'seo_description', 'is_active', 'created_at', 'updated_at'],
  why_choose: ['id', 'title', 'description', 'icon', 'is_active', 'sort_order', 'title_bold', 'link_slug', 'created_at', 'updated_at'],
  chatbot_qa: ['id', 'question', 'keywords', 'answer', 'category', 'is_active', 'sort_order', 'cta_label', 'cta_href', 'created_at', 'updated_at'],
  chatbot_unanswered: ['id', 'message', 'created_at'],
  chatbot_config: ['id', 'bot_name', 'greeting', 'welcome_heading', 'fallback_message', 'match_threshold', 'phone', 'whatsapp', 'quick_replies_json', 'created_at', 'updated_at'],
  updates: ['id', 'title', 'message', 'link_url', 'image_url', 'start_date', 'end_date', 'is_active', 'sort_order', 'created_at', 'updated_at'],
  page_copy: ['id', 'page', 'slot', 'title', 'subtitle', 'body_html', 'cta_text', 'cta_link', 'is_active', 'sort_order', 'created_at', 'updated_at']
};

function cacheGet(key) {
  const hit = readCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.time > CACHE_TTL) {
    readCache.delete(key);
    return null;
  }
  return hit.data;
}

function cacheSet(key, data) {
  readCache.set(key, { time: Date.now(), data });
}

function bustCache(sheet) {
  if (sheet) readCache.delete(sheet);
  else readCache.clear();
}

function serialize(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function deserialize(val) {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  if (typeof val === 'string' && val !== '' && !Number.isNaN(Number(val)) && /^-?\d+(\.\d+)?$/.test(val)) {
    // keep ids/phones as strings; only coerce plain displayOrder/price/rating-like numbers when header known later
    return val;
  }
  return val ?? '';
}

function sheetPick(obj, ...names) {
  const lookup = {};
  Object.keys(obj || {}).forEach((k) => {
    lookup[String(k).toLowerCase().replace(/[\s-]+/g, '_')] = obj[k];
  });
  for (const name of names) {
    const key = String(name).toLowerCase().replace(/[\s-]+/g, '_');
    if (Object.prototype.hasOwnProperty.call(lookup, key) && lookup[key] !== '' && lookup[key] != null) {
      return lookup[key];
    }
  }
  return undefined;
}

function parseSheetBool(value, defaultValue = true) {
  if (value === true || value === false) return value;
  if (value === undefined || value === null || value === '') return defaultValue;
  const s = String(value).trim().toLowerCase();
  if (['false', '0', 'no', 'n', 'off'].includes(s)) return false;
  if (['true', '1', 'yes', 'y', 'on'].includes(s)) return true;
  return defaultValue;
}

/** Map alternate Sheet column names onto the canonical API fields. */
function applyHeaderAliases(sheet, obj) {
  if (!obj) return obj;
  if (sheet === 'banners') {
    const title = sheetPick(obj, 'title', 'banner_title', 'heading');
    const subtitle = sheetPick(obj, 'subtitle', 'banner_subtitle', 'description');
    const ctaText = sheetPick(obj, 'ctaText', 'cta_text', 'button_text');
    const ctaLink = sheetPick(obj, 'ctaLink', 'cta_link', 'button_link', 'url');
    const image = sheetPick(obj, 'image', 'image_url', 'banner_image');
    const displayOrder = sheetPick(obj, 'displayOrder', 'display_order', 'sort_order');
    const active = sheetPick(obj, 'active', 'is_active');
    const titleBold = sheetPick(obj, 'title_bold', 'titleBold');
    if (title !== undefined) obj.title = title;
    if (subtitle !== undefined) obj.subtitle = subtitle;
    if (ctaText !== undefined) obj.ctaText = ctaText;
    if (ctaLink !== undefined) obj.ctaLink = ctaLink;
    if (image !== undefined) obj.image = image;
    if (displayOrder !== undefined) obj.displayOrder = displayOrder;
    if (active !== undefined) obj.active = active;
    if (titleBold !== undefined) obj.title_bold = titleBold;
  }
  if (sheet === 'pricing') {
    const name = sheetPick(obj, 'name', 'courseName', 'course_name', 'title');
    const slug = sheetPick(obj, 'slug');
    const image = sheetPick(obj, 'image_url', 'image');
    const active = sheetPick(obj, 'is_active', 'active');
    const sortOrder = sheetPick(obj, 'sort_order', 'displayOrder', 'display_order');
    const classes = sheetPick(obj, 'classes');
    if (name !== undefined) {
      obj.name = name;
      obj.courseName = name;
    }
    if (slug !== undefined) obj.slug = slug;
    if (image !== undefined) {
      obj.image_url = image;
      obj.image = image;
    }
    if (active !== undefined) {
      obj.is_active = active;
      obj.active = active;
    }
    if (sortOrder !== undefined) {
      obj.sort_order = sortOrder;
      obj.displayOrder = sortOrder;
    }
    if (classes !== undefined) obj.classes = classes;
  }
  if (sheet === 'home_sections') {
    const imageUrl = sheetPick(obj, 'image_url', 'image', 'imageUrl');
    if (imageUrl !== undefined) obj.image_url = imageUrl;
    const features = sheetPick(obj, 'features_json', 'features');
    if (features !== undefined) obj.features_json = features;
  }
  if (sheet === 'page_copy') {
    const title = sheetPick(obj, 'title', 'heading');
    const subtitle = sheetPick(obj, 'subtitle');
    const body = sheetPick(obj, 'body_html', 'body', 'html', 'description');
    const ctaText = sheetPick(obj, 'cta_text', 'ctaText', 'button_text');
    const ctaLink = sheetPick(obj, 'cta_link', 'ctaLink', 'button_link');
    const page = sheetPick(obj, 'page');
    const slot = sheetPick(obj, 'slot');
    if (title !== undefined) obj.title = title;
    if (subtitle !== undefined) obj.subtitle = subtitle;
    if (body !== undefined) obj.body_html = body;
    if (ctaText !== undefined) obj.cta_text = ctaText;
    if (ctaLink !== undefined) obj.cta_link = ctaLink;
    if (page !== undefined) obj.page = page;
    if (slot !== undefined) obj.slot = slot;
  }
  if (sheet === 'detail_pages') {
    const body = sheetPick(obj, 'body_html', 'body', 'html', 'content');
    if (body !== undefined) obj.body_html = body;
    const image = sheetPick(obj, 'hero_image_url', 'image_url', 'image');
    if (image !== undefined) obj.hero_image_url = image;
  }
  return obj;
}

function coerceRow(sheet, obj) {
  applyHeaderAliases(sheet, obj);
  const numeric = new Set(['price', 'displayOrder', 'rating', 'trainerCount', 'count', 'googleRating', 'facebookRating', 'reviewCount', 'classes', 'sort_order', 'base_km', 'base_price', 'max_km', 'max_price', 'per_km_extra', 'match_threshold', 'latitude', 'longitude']);
  const bools = new Set(['active', 'title_bold', 'tagline_bold', 'is_active']);
  Object.keys(obj).forEach((k) => {
    if (numeric.has(k) && obj[k] !== '' && obj[k] != null && String(obj[k]).trim() !== '' && !Number.isNaN(Number(obj[k]))) {
      obj[k] = Number(obj[k]);
    }
    if (bools.has(k)) {
      obj[k] = parseSheetBool(obj[k], k === 'active' || k === 'is_active');
    }
  });
  return obj;
}

/** Extract spreadsheet ID from raw ID or Google Sheets URL */
function parseSpreadsheetId(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  const fromUrl = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (fromUrl) return fromUrl[1];
  return value;
}

function sheetsConfigured() {
  return Boolean(config.sheets && config.sheets.ready);
}

/** True when app should use local JSON (dev only) */
function useLocalStore() {
  return !sheetsConfigured();
}

async function getSheetsApi() {
  if (!sheetsConfigured()) return null;
  if (sheetsClient) return sheetsClient;
  if (!sheetsInitPromise) {
    sheetsInitPromise = (async () => {
      const result = await createGoogleAuth({ debug: false });
      sheetsAuthMeta = result;
      sheetsClient = google.sheets({ version: 'v4', auth: result.auth });
      return sheetsClient;
    })().catch((err) => {
      sheetsInitPromise = null;
      throw err;
    });
  }
  return sheetsInitPromise;
}

function getSheetsAuthMeta() {
  return sheetsAuthMeta;
}

function sheetsStatus(err) {
  return Number(err && (err.code || err.status || (err.response && err.response.status)));
}

function isQuotaError(err) {
  const status = sheetsStatus(err);
  const msg = String((err && err.message) || '');
  return status === 429 || /quota|rate limit|too many requests|userRateLimitExceeded/i.test(msg);
}

function wrapSheetsError(err, fallbackStatus = 503) {
  if (err instanceof AppError) return err;
  const status = isQuotaError(err) ? 429 : fallbackStatus;
  const wrapped = new AppError(err.message || 'Google Sheets error', status, publicSheetsMessage(err));
  return wrapped;
}

function allowRuntimeSeed() {
  return !process.env.VERCEL;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function sheetsValuesGet(api, range) {
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await api.spreadsheets.values.get({
        spreadsheetId: config.sheets.spreadsheetId,
        range
      });
    } catch (err) {
      lastErr = err;
      if (isQuotaError(err) && attempt < 3) {
        await sleep(350 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

function headersLookValid(row, expected) {
  if (!row || !row.length) return false;
  const lower = row.map((c) => String(c || '').trim().toLowerCase());
  return expected.some((h) => lower.includes(String(h).toLowerCase()));
}

async function loadSpreadsheetMeta(api, force = false) {
  if (!spreadsheetMeta || force) {
    const meta = await api.spreadsheets.get({ spreadsheetId: config.sheets.spreadsheetId });
    spreadsheetMeta = meta.data;
  }
  return spreadsheetMeta;
}

/**
 * Create a missing tab and/or header row at runtime (self-heal).
 * Spreadsheet-not-found cannot be healed — that is a config error.
 */
async function ensureSheetTab(sheet) {
  if (useLocalStore()) return;
  if (ensuredTabs.has(sheet)) return;
  if (ensureTabPromises.has(sheet)) return ensureTabPromises.get(sheet);

  const work = (async () => {
    const api = await getSheetsApi();
    if (!api) throw new AppError('Google Sheets is not configured', 503, publicSheetsMessage({ message: 'Google Sheets is not configured' }));

    const headers = SHEET_HEADERS[sheet] || ['id'];
    let meta;
    try {
      meta = await loadSpreadsheetMeta(api);
    } catch (err) {
      throw wrapSheetsError(err);
    }

    const titles = (meta.sheets || []).map((s) => s.properties && s.properties.title);
    if (!titles.includes(sheet)) {
      try {
        await api.spreadsheets.batchUpdate({
          spreadsheetId: config.sheets.spreadsheetId,
          requestBody: { requests: [{ addSheet: { properties: { title: sheet } } }] }
        });
        console.warn(`[db] Created missing sheet tab "${sheet}"`);
      } catch (err) {
        const msg = String(err.message || '');
        if (!/already exists|duplicate/i.test(msg)) throw wrapSheetsError(err);
      }
      spreadsheetMeta = null;
    }

    try {
      const res = await api.spreadsheets.values.get({
        spreadsheetId: config.sheets.spreadsheetId,
        range: `${sheet}!1:1`
      });
      const existing = (res.data.values && res.data.values[0]) || [];
      if (!headersLookValid(existing, headers)) {
        await api.spreadsheets.values.update({
          spreadsheetId: config.sheets.spreadsheetId,
          range: `${sheet}!A1`,
          valueInputOption: 'RAW',
          requestBody: { values: [headers] }
        });
        console.warn(`[db] Wrote header row for "${sheet}"`);
      } else {
        const missing = headers.filter((h) => !existing.includes(h));
        if (missing.length) {
          const merged = [...existing, ...missing];
          await api.spreadsheets.values.update({
            spreadsheetId: config.sheets.spreadsheetId,
            range: `${sheet}!A1`,
            valueInputOption: 'RAW',
            requestBody: { values: [merged] }
          });
          console.warn(`[db] Added missing headers on "${sheet}": ${missing.join(', ')}`);
        }
      }
    } catch (err) {
      if (isMissingTabError(err)) {
        await api.spreadsheets.values.update({
          spreadsheetId: config.sheets.spreadsheetId,
          range: `${sheet}!A1`,
          valueInputOption: 'RAW',
          requestBody: { values: [headers] }
        });
      } else {
        throw wrapSheetsError(err);
      }
    }

    ensuredTabs.add(sheet);
  })();

  ensureTabPromises.set(sheet, work);
  try {
    await work;
  } finally {
    ensureTabPromises.delete(sheet);
  }
}

function rowsFromValues(sheet, values) {
  if (!values || values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = deserialize(row[i] ?? '');
    });
    return coerceRow(sheet, obj);
  }).filter((r) => r.id || r.email || r.courseName || r.name || r.title || r.question || r.base_km || r.key || r.slug || r.fallback_message || r.keywords || r.page);
}

async function readFromSheets(sheet) {
  const api = await getSheetsApi();
  if (!api) throw new AppError('Google Sheets is not configured', 503, publicSheetsMessage({ message: 'Google Sheets is not configured' }));

  try {
    const res = await sheetsValuesGet(api, `${sheet}!A:Z`);
    return rowsFromValues(sheet, res.data.values || []);
  } catch (err) {
    if (isMissingTabError(err)) {
      await ensureSheetTab(sheet);
      const res = await sheetsValuesGet(api, `${sheet}!A:Z`);
      return rowsFromValues(sheet, res.data.values || []);
    }
    throw wrapSheetsError(err);
  }
}

async function writeAllToSheets(sheet, rows) {
  const api = await getSheetsApi();
  if (!api) throw new AppError('Google Sheets is not configured', 503, publicSheetsMessage({ message: 'Google Sheets is not configured' }));

  await ensureSheetTab(sheet);

  const headers = SHEET_HEADERS[sheet] || (rows[0] ? Object.keys(rows[0]) : ['id']);
  const values = [
    headers,
    ...rows.map((r) => headers.map((h) => serialize(r[h])))
  ];

  await api.spreadsheets.values.clear({
    spreadsheetId: config.sheets.spreadsheetId,
    range: `${sheet}!A:Z`
  });

  await api.spreadsheets.values.update({
    spreadsheetId: config.sheets.spreadsheetId,
    range: `${sheet}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values }
  });

  return rows;
}

async function appendToSheets(sheet, row) {
  const api = await getSheetsApi();
  if (!api) throw new AppError('Google Sheets is not configured', 503, publicSheetsMessage({ message: 'Google Sheets is not configured' }));

  await ensureSheetTab(sheet);

  let existing;
  try {
    existing = await readFromSheets(sheet);
  } catch (err) {
    existing = [];
  }

  const headers = SHEET_HEADERS[sheet] || Object.keys(row);
  if (existing.length === 0) {
    await writeAllToSheets(sheet, [row]);
    return row;
  }

  await api.spreadsheets.values.append({
    spreadsheetId: config.sheets.spreadsheetId,
    range: `${sheet}!A:Z`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [headers.map((h) => serialize(row[h]))] }
  });
  return row;
}

const db = {
  isSheetsMode: sheetsConfigured,
  useLocalStore,
  allowRuntimeSeed,

  async getAll(sheet) {
    const cached = cacheGet(sheet);
    if (cached) return cached;

    if (useLocalStore()) {
      const rows = await local.getAll(sheet);
      cacheSet(sheet, rows);
      return rows;
    }

    try {
      const rows = await readFromSheets(sheet);
      cacheSet(sheet, rows);
      return rows;
    } catch (err) {
      console.error(`[db] Sheets READ failed for "${sheet}":`, err.message);
      // When Sheets is the production store, never hide failures with local seed JSON.
      if (PERMANENT_SHEETS.has(sheet) || sheet === 'admins') {
        throw wrapSheetsError(err);
      }
      try {
        const rows = await local.getAll(sheet);
        console.warn(`[db] Serving local/seed fallback for "${sheet}" (read-only display).`);
        cacheSet(sheet, rows);
        return rows;
      } catch {
        throw wrapSheetsError(err);
      }
    }
  },

  async getById(sheet, id) {
    const rows = await this.getAll(sheet);
    return rows.find((r) => String(r.id) === String(id)) || null;
  },

  async create(sheet, payload) {
    bustCache(sheet);
    const row = {
      id: payload.id || uuidv4(),
      ...payload,
      createdAt: payload.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (useLocalStore()) {
      return local.create(sheet, row);
    }

    try {
      await appendToSheets(sheet, row);
      bustCache(sheet);
      return row;
    } catch (err) {
      console.error(`[db] Sheets CREATE failed for "${sheet}":`, err.message);
      if (sheet === 'bookings' || sheet === 'enquiries' || PERMANENT_SHEETS.has(sheet)) {
        throw wrapSheetsError(err);
      }
      throw err;
    }
  },

  async update(sheet, id, payload) {
    bustCache(sheet);

    if (useLocalStore()) {
      return local.update(sheet, id, payload);
    }

    try {
      const all = await readFromSheets(sheet);
      const idx = all.findIndex((r) => String(r.id) === String(id));
      if (idx === -1) return null;
      all[idx] = {
        ...all[idx],
        ...payload,
        id: all[idx].id,
        updatedAt: new Date().toISOString()
      };
      await writeAllToSheets(sheet, all);
      bustCache(sheet);
      return all[idx];
    } catch (err) {
      console.error(`[db] Sheets UPDATE failed for "${sheet}":`, err.message);
      throw new Error('Unable to update Google Sheets. Please try again.');
    }
  },

  async remove(sheet, id) {
    bustCache(sheet);

    if (useLocalStore()) {
      return local.remove(sheet, id);
    }

    try {
      const all = await readFromSheets(sheet);
      const next = all.filter((r) => String(r.id) !== String(id));
      if (next.length === all.length) return false;
      await writeAllToSheets(sheet, next);
      bustCache(sheet);
      return true;
    } catch (err) {
      console.error(`[db] Sheets DELETE failed for "${sheet}":`, err.message);
      throw new Error('Unable to delete from Google Sheets. Please try again.');
    }
  },

  async replaceAll(sheet, rows) {
    bustCache(sheet);
    if (useLocalStore()) {
      return local.replaceAll(sheet, rows);
    }
    await writeAllToSheets(sheet, rows);
    bustCache(sheet);
    return rows;
  }
};

module.exports = db;
module.exports.bustCache = bustCache;
module.exports.parseSpreadsheetId = parseSpreadsheetId;
module.exports.SHEET_HEADERS = SHEET_HEADERS;
module.exports.sheetsConfigured = sheetsConfigured;
module.exports.useLocalStore = useLocalStore;
module.exports.allowRuntimeSeed = allowRuntimeSeed;
module.exports.getSheetsAuthMeta = getSheetsAuthMeta;
module.exports.ensureSheetTab = ensureSheetTab;
