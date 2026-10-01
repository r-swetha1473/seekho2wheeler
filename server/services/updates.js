const db = require('./db');
const { sanitizeHtml, parseBool, stripHtml } = require('../utils/sanitizeHtml');
const { parseHttpsUrl } = require('../utils/geo');

function todayYmd(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function ymd(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === '') return '';
  return String(raw).trim().slice(0, 10);
}

function parseDay(raw, label) {
  const v = ymd(raw);
  if (!v) return { ok: true, value: '' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return { ok: false, message: `${label} must be YYYY-MM-DD` };
  }
  return { ok: true, value: v };
}

function parseLink(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return { ok: true, value: '' };
  }
  const u = String(raw).trim();
  if (u.startsWith('/') && !u.startsWith('//')) return { ok: true, value: u };
  return parseHttpsUrl(u, 'Link URL');
}

/**
 * Empty start/end = open-ended. Inclusive calendar comparison in local dates.
 */
function isScheduledLive(row, today = todayYmd()) {
  if (!row || row.is_active === false) return false;
  const start = ymd(row.start_date);
  const end = ymd(row.end_date);
  if (start && today < start) return false;
  if (end && today > end) return false;
  return true;
}

function normalize(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title || '',
    message: row.message || '',
    link_url: row.link_url || '',
    image_url: row.image_url || '',
    start_date: ymd(row.start_date),
    end_date: ymd(row.end_date),
    is_active: row.is_active !== false,
    sort_order: Number(row.sort_order || 0),
    created_at: row.created_at || row.createdAt || ''
  };
}

async function ensureTab() {
  if (db.allowRuntimeSeed && !db.allowRuntimeSeed()) return;
  if (typeof db.ensureSheetTab === 'function') {
    await db.ensureSheetTab('updates');
  }
}

async function listAll() {
  await ensureTab();
  const rows = await db.getAll('updates');
  return rows.map(normalize).filter(Boolean).sort((a, b) => a.sort_order - b.sort_order);
}

async function listPublic() {
  const today = todayYmd();
  return (await listAll()).filter((row) => isScheduledLive(row, today));
}

function buildFields(payload, existing) {
  const title = String(payload.title != null ? payload.title : (existing && existing.title) || '').trim();
  const message = sanitizeHtml(payload.message != null ? payload.message : (existing && existing.message) || '');
  if (!title) return { ok: false, message: 'Title is required' };
  if (!stripHtml(message)) {
    return { ok: false, message: 'Message is required' };
  }

  const start = parseDay(payload.start_date !== undefined ? payload.start_date : existing && existing.start_date, 'Start date');
  if (!start.ok) return start;
  const end = parseDay(payload.end_date !== undefined ? payload.end_date : existing && existing.end_date, 'End date');
  if (!end.ok) return end;
  if (start.value && end.value && end.value < start.value) {
    return { ok: false, message: 'End date cannot be before start date' };
  }

  const link = parseLink(payload.link_url !== undefined ? payload.link_url : existing && existing.link_url);
  if (!link.ok) return link;

  const now = new Date().toISOString();
  const row = {
    title,
    message,
    link_url: link.value,
    image_url: payload.image_url !== undefined ? payload.image_url : (existing && existing.image_url) || '',
    start_date: start.value,
    end_date: end.value,
    is_active: payload.is_active !== undefined ? parseBool(payload.is_active, true) : (existing ? existing.is_active !== false : true),
    sort_order: payload.sort_order !== undefined
      ? Number(payload.sort_order)
      : (existing ? existing.sort_order : 0),
    created_at: (existing && existing.created_at) || now,
    updated_at: now
  };
  if (existing && existing.id) row.id = existing.id;
  return { ok: true, row };
}

async function createItem(payload) {
  const all = await listAll();
  const next = {
    ...payload,
    sort_order: payload.sort_order !== undefined ? payload.sort_order : all.length + 1
  };
  const built = buildFields(next, null);
  if (!built.ok) return built;
  const created = await db.create('updates', built.row);
  return { ok: true, data: normalize(created) };
}

async function updateItem(id, payload) {
  const all = await listAll();
  const current = all.find((i) => String(i.id) === String(id));
  if (!current) return { ok: false, status: 404, message: 'Update not found' };
  const built = buildFields(payload, current);
  if (!built.ok) return built;
  const saved = await db.update('updates', id, built.row);
  return { ok: true, data: normalize(saved || built.row) };
}

async function removeItem(id) {
  return db.remove('updates', id);
}

module.exports = {
  todayYmd,
  isScheduledLive,
  parseLink,
  parseDay,
  listAll,
  listPublic,
  createItem,
  updateItem,
  removeItem,
  normalize
};
