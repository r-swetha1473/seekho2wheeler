const { google } = require('googleapis');
const config = require('../config');
const local = require('./localStore');

let sheetsClient = null;
const readCache = new Map();
const CACHE_TTL = 45 * 1000;

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

function getAuth() {
  if (!config.sheets.enabled || !config.sheets.clientEmail || !config.sheets.privateKey) {
    return null;
  }
  return new google.auth.JWT(
    config.sheets.clientEmail,
    null,
    config.sheets.privateKey,
    ['https://www.googleapis.com/auth/spreadsheets']
  );
}

async function getSheets() {
  if (!config.sheets.enabled) return null;
  if (sheetsClient) return sheetsClient;
  const auth = getAuth();
  if (!auth) return null;
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

/**
 * Primary database interface.
 * Uses Google Sheets when enabled; otherwise local JSON files.
 * Sheet names map 1:1 to local JSON stores.
 */
const db = {
  async getAll(sheet) {
    const cached = cacheGet(sheet);
    if (cached) return cached;

    const api = await getSheets();
    if (!api) {
      const rows = await local.getAll(sheet);
      cacheSet(sheet, rows);
      return rows;
    }
    try {
      const res = await api.spreadsheets.values.get({
        spreadsheetId: config.sheets.spreadsheetId,
        range: `${sheet}!A:Z`
      });
      const values = res.data.values || [];
      if (values.length < 2) {
        cacheSet(sheet, []);
        return [];
      }
      const headers = values[0];
      const rows = values.slice(1).map((row) => {
        const obj = {};
        headers.forEach((h, i) => {
          let val = row[i] ?? '';
          if (val === 'true') val = true;
          else if (val === 'false') val = false;
          else if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
            try { val = JSON.parse(val); } catch { /* keep string */ }
          }
          obj[h] = val;
        });
        return obj;
      });
      cacheSet(sheet, rows);
      return rows;
    } catch (err) {
      console.warn(`[db] Sheets read failed for ${sheet}, using local:`, err.message);
      const rows = await local.getAll(sheet);
      cacheSet(sheet, rows);
      return rows;
    }
  },

  async getById(sheet, id) {
    const rows = await this.getAll(sheet);
    return rows.find((r) => String(r.id) === String(id)) || null;
  },

  async create(sheet, payload) {
    bustCache(sheet);
    const api = await getSheets();
    const row = await local.create(sheet, payload);
    if (!api) return row;

    try {
      const existing = await this.getAll(sheet);
      const headers = Object.keys(row);
      if (existing.length === 0) {
        await api.spreadsheets.values.update({
          spreadsheetId: config.sheets.spreadsheetId,
          range: `${sheet}!A1`,
          valueInputOption: 'RAW',
          requestBody: { values: [headers, headers.map((h) => serialize(row[h]))] }
        });
      } else {
        await api.spreadsheets.values.append({
          spreadsheetId: config.sheets.spreadsheetId,
          range: `${sheet}!A:Z`,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          requestBody: { values: [headers.map((h) => serialize(row[h]))] }
        });
      }
    } catch (err) {
      console.warn(`[db] Sheets write failed for ${sheet}:`, err.message);
    }
    return row;
  },

  async update(sheet, id, payload) {
    bustCache(sheet);
    const row = await local.update(sheet, id, payload);
    if (!row) return null;

    const api = await getSheets();
    if (!api) return row;

    try {
      const all = await local.getAll(sheet);
      const headers = all.length ? Object.keys(all[0]) : Object.keys(row);
      const values = [headers, ...all.map((r) => headers.map((h) => serialize(r[h])))];
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
    } catch (err) {
      console.warn(`[db] Sheets update failed for ${sheet}:`, err.message);
    }
    return row;
  },

  async remove(sheet, id) {
    bustCache(sheet);
    const ok = await local.remove(sheet, id);
    if (!ok) return false;

    const api = await getSheets();
    if (!api) return true;

    try {
      const all = await local.getAll(sheet);
      if (!all.length) {
        await api.spreadsheets.values.clear({
          spreadsheetId: config.sheets.spreadsheetId,
          range: `${sheet}!A:Z`
        });
        return true;
      }
      const headers = Object.keys(all[0]);
      const values = [headers, ...all.map((r) => headers.map((h) => serialize(r[h])))];
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
    } catch (err) {
      console.warn(`[db] Sheets delete failed for ${sheet}:`, err.message);
    }
    return true;
  },

  async replaceAll(sheet, rows) {
    bustCache(sheet);
    return local.replaceAll(sheet, rows);
  }
};

function serialize(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

module.exports = db;
module.exports.bustCache = bustCache;
