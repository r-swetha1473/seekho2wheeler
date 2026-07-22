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

let sheetsClient = null;
let sheetsAuthMeta = null;
let sheetsInitPromise = null;
const readCache = new Map();
const CACHE_TTL = 30 * 1000;

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
  'admins'
]);

/** Canonical column order per sheet (first write / empty sheet) */
const SHEET_HEADERS = {
  bookings: ['id', 'name', 'phone', 'email', 'courseId', 'courseName', 'branchId', 'branchName', 'date', 'timeSlot', 'message', 'status', 'createdAt', 'updatedAt'],
  enquiries: ['id', 'name', 'phone', 'email', 'message', 'status', 'createdAt', 'updatedAt'],
  branches: ['id', 'name', 'area', 'address', 'mapsLink', 'phone', 'whatsapp', 'availableCourses', 'trainerCount', 'image', 'active', 'createdAt', 'updatedAt'],
  pricing: ['id', 'courseName', 'price', 'duration', 'description', 'image', 'features', 'displayOrder', 'active', 'createdAt', 'updatedAt'],
  blogs: ['id', 'title', 'slug', 'featuredImage', 'metaTitle', 'metaDescription', 'content', 'status', 'scheduledAt', 'publishedAt', 'createdAt', 'updatedAt'],
  testimonials: ['id', 'name', 'headline', 'review', 'rating', 'photo', 'videoUrl', 'type', 'displayOrder', 'active', 'createdAt', 'updatedAt'],
  banners: ['id', 'title', 'subtitle', 'ctaText', 'ctaLink', 'image', 'displayOrder', 'active', 'createdAt', 'updatedAt'],
  gallery: ['id', 'title', 'category', 'image', 'displayOrder', 'active', 'createdAt', 'updatedAt'],
  faqs: ['id', 'question', 'answer', 'displayOrder', 'active', 'createdAt', 'updatedAt'],
  settings: ['id', 'siteName', 'tagline', 'phones', 'whatsapp', 'email', 'address', 'facebookUrl', 'instagramUrl', 'youtubeUrl', 'googleRating', 'facebookRating', 'reviewCount', 'workingHours', 'trainedCandidates', 'foundedYear', 'createdAt', 'updatedAt'],
  notifications: ['id', 'type', 'title', 'message', 'refId', 'read', 'createdAt', 'updatedAt'],
  visits: ['id', 'date', 'count', 'createdAt', 'updatedAt'],
  admins: ['id', 'email', 'password', 'name', 'role', 'active', 'createdAt', 'updatedAt']
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

function coerceRow(sheet, obj) {
  const numeric = new Set(['price', 'displayOrder', 'rating', 'trainerCount', 'count', 'googleRating', 'facebookRating', 'reviewCount']);
  Object.keys(obj).forEach((k) => {
    if (numeric.has(k) && obj[k] !== '' && obj[k] != null && !Number.isNaN(Number(obj[k]))) {
      obj[k] = Number(obj[k]);
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

function rowsFromValues(sheet, values) {
  if (!values || values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = deserialize(row[i] ?? '');
    });
    return coerceRow(sheet, obj);
  }).filter((r) => r.id || r.email || r.courseName || r.name || r.title || r.question);
}

async function readFromSheets(sheet) {
  const api = await getSheetsApi();
  if (!api) throw new Error('Google Sheets is not configured');

  const res = await api.spreadsheets.values.get({
    spreadsheetId: config.sheets.spreadsheetId,
    range: `${sheet}!A:Z`
  });
  return rowsFromValues(sheet, res.data.values || []);
}

async function writeAllToSheets(sheet, rows) {
  const api = await getSheetsApi();
  if (!api) throw new Error('Google Sheets is not configured');

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
  if (!api) throw new Error('Google Sheets is not configured');

  let existing;
  try {
    existing = await readFromSheets(sheet);
  } catch (err) {
    // Tab may be empty / missing header
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
      // Content sheets: allow read-only seed fallback so the site still renders.
      // Bookings/enquiries: never fall back — return empty / surface error upstream.
      if (sheet === 'bookings' || sheet === 'enquiries') {
        throw new Error('Unable to load data from Google Sheets. Please try again shortly.');
      }
      // Dev-safety: if somehow seed-defaults exist, use for display-only content
      try {
        const rows = await local.getAll(sheet);
        console.warn(`[db] Serving local/seed fallback for "${sheet}" (read-only display).`);
        cacheSet(sheet, rows);
        return rows;
      } catch {
        throw err;
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
        throw new Error('Unable to save to Google Sheets. Your submission was not stored locally. Please try again.');
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
module.exports.getSheetsAuthMeta = getSheetsAuthMeta;
