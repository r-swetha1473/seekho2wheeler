const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../data');
const SHEETS = [
  'banners',
  'gallery',
  'blogs',
  'branches',
  'pricing',
  'bookings',
  'enquiries',
  'faqs',
  'testimonials',
  'settings',
  'visits',
  'admins',
  'notifications'
];

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  SHEETS.forEach((name) => {
    const file = path.join(DATA_DIR, `${name}.json`);
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify([], null, 2));
    }
  });
}

function readSheet(name) {
  ensureDataFiles();
  const file = path.join(DATA_DIR, `${name}.json`);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function writeSheet(name, data) {
  ensureDataFiles();
  const file = path.join(DATA_DIR, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return data;
}

async function getAll(sheet) {
  return readSheet(sheet);
}

async function getById(sheet, id) {
  const rows = readSheet(sheet);
  return rows.find((r) => String(r.id) === String(id)) || null;
}

async function create(sheet, payload) {
  const rows = readSheet(sheet);
  const row = {
    id: payload.id || uuidv4(),
    ...payload,
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  rows.push(row);
  writeSheet(sheet, rows);
  return row;
}

async function update(sheet, id, payload) {
  const rows = readSheet(sheet);
  const idx = rows.findIndex((r) => String(r.id) === String(id));
  if (idx === -1) return null;
  rows[idx] = {
    ...rows[idx],
    ...payload,
    id: rows[idx].id,
    updatedAt: new Date().toISOString()
  };
  writeSheet(sheet, rows);
  return rows[idx];
}

async function remove(sheet, id) {
  const rows = readSheet(sheet);
  const next = rows.filter((r) => String(r.id) !== String(id));
  if (next.length === rows.length) return false;
  writeSheet(sheet, next);
  return true;
}

async function replaceAll(sheet, rows) {
  writeSheet(sheet, rows);
  return rows;
}

module.exports = {
  SHEETS,
  ensureDataFiles,
  getAll,
  getById,
  create,
  update,
  remove,
  replaceAll,
  readSheet,
  writeSheet
};
