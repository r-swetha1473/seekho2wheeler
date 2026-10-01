const db = require('./db');
const { sanitizeHtml, stripHtml, parseBool } = require('../utils/sanitizeHtml');
const CONTENT_LIMITS = require('../contentLimits');

const WHY_ITEMS_SEED = [
  { id: 'why-1', title: 'Non-Cyclists Welcome', description: 'Special programs for those who never rode a cycle before.', icon: 'fa-solid fa-person-rays', sort_order: 1 },
  { id: 'why-2', title: 'Women-First Environment', description: 'Female-friendly batches with supportive, patient trainers.', icon: 'fa-solid fa-venus', sort_order: 2 },
  { id: 'why-3', title: 'Real Traffic Practice', description: 'Guided sessions on actual Kolkata roads with expert supervision.', icon: 'fa-solid fa-road', sort_order: 3 },
  { id: 'why-4', title: 'Flexible Timing', description: 'Morning and evening slots across 4 branches in Kolkata.', icon: 'fa-solid fa-clock', sort_order: 4 },
  { id: 'why-5', title: 'Patient Experienced Trainers', description: 'Step-by-step guidance until you feel road-ready.', icon: 'fa-solid fa-chalkboard-user', sort_order: 5 },
  { id: 'why-6', title: 'Multiple Vehicles', description: 'Practice on academy scooties and bikes at every branch.', icon: 'fa-solid fa-motorcycle', sort_order: 6 }
];

function normalizeItem(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title || '',
    description: row.description || '',
    icon: row.icon || '',
    is_active: row.is_active !== false,
    sort_order: Number(row.sort_order || 0),
    title_bold: parseBool(row.title_bold),
    link_slug: String(row.link_slug || '').trim(),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function toSheetRow(data) {
  const now = new Date().toISOString();
  const row = {
    title: data.title,
    description: data.description,
    icon: data.icon || '',
    is_active: data.is_active !== false,
    sort_order: Number(data.sort_order || 0),
    title_bold: parseBool(data.title_bold),
    link_slug: String(data.link_slug || '').trim(),
    created_at: data.created_at || now,
    updated_at: now
  };
  if (data.id) row.id = data.id;
  return row;
}

function validateItem(title, description) {
  const titleLen = stripHtml(title || '').length;
  if (!titleLen) return { ok: false, message: 'Title is required' };
  if (titleLen > CONTENT_LIMITS.titleMax) {
    return { ok: false, message: `Title must be at most ${CONTENT_LIMITS.titleMax} characters (currently ${titleLen}).` };
  }
  const descLen = stripHtml(description || '').length;
  if (!descLen) return { ok: false, message: 'Description is required' };
  if (descLen > CONTENT_LIMITS.descriptionMax) {
    return { ok: false, message: `Description must be at most ${CONTENT_LIMITS.descriptionMax} characters (currently ${descLen}).` };
  }
  return { ok: true };
}

async function ensureTab() {
  if (db.allowRuntimeSeed && !db.allowRuntimeSeed()) return;
  if (typeof db.ensureSheetTab === 'function') {
    await db.ensureSheetTab('why_choose');
  }
}

async function listItems(includeInactive = true) {
  await ensureTab();
  let rows = await db.getAll('why_choose');
  if (!rows.length && !(db.allowRuntimeSeed && !db.allowRuntimeSeed())) {
    const now = new Date().toISOString();
    for (const seed of WHY_ITEMS_SEED) {
      await db.create('why_choose', toSheetRow({
        ...seed,
        is_active: true,
        title_bold: false,
        link_slug: '',
        created_at: now
      }));
    }
    rows = await db.getAll('why_choose');
  }
  let items = rows.map(normalizeItem).filter(Boolean);
  if (!includeInactive) items = items.filter((i) => i.is_active !== false);
  items.sort((a, b) => a.sort_order - b.sort_order);
  return items;
}

async function createItem(payload) {
  const title = sanitizeHtml(payload.title || '');
  const description = sanitizeHtml(payload.description || '');
  const copy = validateItem(title, description);
  if (!copy.ok) return copy;
  const existing = await listItems(true);
  const sort_order = payload.sort_order !== undefined && payload.sort_order !== ''
    ? Number(payload.sort_order)
    : existing.length + 1;
  const created = await db.create('why_choose', toSheetRow({
    title,
    description,
    icon: String(payload.icon || '').trim(),
    is_active: payload.is_active !== undefined ? parseBool(payload.is_active, true) : true,
    sort_order,
    title_bold: parseBool(payload.title_bold),
    link_slug: payload.link_slug
  }));
  return { ok: true, data: normalizeItem(created) };
}

async function updateItem(id, payload) {
  const all = await listItems(true);
  const current = all.find((i) => String(i.id) === String(id));
  if (!current) return { ok: false, status: 404, message: 'Item not found' };
  const title = payload.title !== undefined ? sanitizeHtml(payload.title) : current.title;
  const description = payload.description !== undefined ? sanitizeHtml(payload.description) : current.description;
  const copy = validateItem(title, description);
  if (!copy.ok) return copy;
  const next = {
    ...current,
    title,
    description,
    icon: payload.icon !== undefined ? String(payload.icon || '').trim() : current.icon,
    is_active: payload.is_active !== undefined ? parseBool(payload.is_active, true) : current.is_active,
    sort_order: payload.sort_order !== undefined ? Number(payload.sort_order || 0) : current.sort_order,
    title_bold: payload.title_bold !== undefined ? parseBool(payload.title_bold) : current.title_bold,
    link_slug: payload.link_slug !== undefined ? String(payload.link_slug || '').trim() : current.link_slug,
    created_at: current.created_at
  };
  const saved = await db.update('why_choose', id, toSheetRow(next));
  return { ok: true, data: normalizeItem(saved) };
}

async function removeItem(id) {
  return db.remove('why_choose', id);
}

module.exports = {
  listItems,
  createItem,
  updateItem,
  removeItem,
  validateItem
};
