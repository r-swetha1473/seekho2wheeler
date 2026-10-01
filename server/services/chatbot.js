const db = require('./db');
const { sanitizeHtml, parseBool } = require('../utils/sanitizeHtml');
const { pickBest, parseKeywords, composeMatchText } = require('./chatbotMatch');
const { normalizeCourse } = require('./courses');
const { getDoorstepConfig } = require('./doorstep');

const COURSE_SLUG_ALIASES = {
  'scooty-basic': 'scooty-training',
  scooty: 'scooty-training',
  bike: 'bike-training',
  ladies: 'ladies-training'
};

const DEFAULT_QUICK = [
  { label: 'Courses', prompt: 'What courses do you offer?' },
  { label: 'Pricing', prompt: 'What is the price of scooty training?' },
  { label: 'Doorstep', prompt: 'How does doorstep training pricing work?' },
  { label: 'Timings', prompt: 'What are your timings?' },
  { label: 'Location', prompt: 'Where are you located?' },
  { label: 'Contact', prompt: 'How can I contact you?' }
];

const CONFIG_SEED = {
  id: 'default',
  fallback_message: 'I don\'t have verified information about that. I can help you with Seekho\'s training, branches, timings, booking, and other available website information. Call {{settings.phone}} or WhatsApp {{settings.whatsapp}}.',
  match_threshold: 3,
  greeting: 'Hi! Ask about courses, fees, doorstep training, timings or location.',
  quick_replies_json: DEFAULT_QUICK
};

const QA_SEED = [
  {
    id: 'qa-scooty-price',
    question: 'What is the price of scooty training?',
    keywords: 'scooty, price, fees, cost, charges, scooty training, course fees, scooty course',
    answer: 'Scooty training is {{course:scooty-training.price}} for {{course:scooty-training.classes}} classes.',
    category: 'Pricing',
    is_active: true,
    sort_order: 1
  },
  {
    id: 'qa-courses',
    question: 'What courses do you offer?',
    keywords: 'courses, programs, course list, training programs, what courses',
    answer: 'We currently offer: {{courses.names}}. Ask about a course name for its fee and class count.',
    category: 'Courses',
    is_active: true,
    sort_order: 2
  },
  {
    id: 'qa-doorstep',
    question: 'How does doorstep training pricing work?',
    keywords: 'doorstep, home training, km, kilometre, come to you, doorstep price',
    answer: 'Doorstep training is {{doorstep.base_price}} up to {{doorstep.base_km}} km, then extra per km, capped at {{doorstep.max_price}} (max {{doorstep.max_km}} km).',
    category: 'Doorstep',
    is_active: true,
    sort_order: 3
  },
  {
    id: 'qa-timings',
    question: 'What are your timings?',
    keywords: 'timing, timings, hours, open, slot, schedule, working hours, sunday, saturday, weekend, monday',
    answer: 'We are open {{settings.workingHours}}.',
    category: 'Timings',
    is_active: true,
    sort_order: 4
  },
  {
    id: 'qa-bike-price',
    question: 'What is the price of bike training?',
    keywords: 'bike, motorcycle, price, fees, cost, bike training, bike course',
    answer: 'Bike training is {{course:bike-training.price}} for {{course:bike-training.classes}} classes.',
    category: 'Pricing',
    is_active: true,
    sort_order: 7
  },
  {
    id: 'qa-ladies-price',
    question: 'What is the price of ladies training?',
    keywords: 'ladies, women, ladies training, ladies batch, women training, price, fees',
    answer: 'Ladies training is {{course:ladies-training.price}} for {{course:ladies-training.classes}} classes.',
    category: 'Pricing',
    is_active: true,
    sort_order: 8
  },
  {
    id: 'qa-booking',
    question: 'How do I book a training slot?',
    keywords: 'book, booking, register, slot, appointment, enrol, enroll, reservation',
    answer: 'You can book online on the Register & Book page, or call {{settings.phone}} / WhatsApp {{settings.whatsapp}}.',
    category: 'Booking',
    is_active: true,
    sort_order: 9
  },
  {
    id: 'qa-branches',
    question: 'What branches do you have?',
    keywords: 'branches, branch list, centres, centers, locations, tollygunge, new town, barasat, sodepur',
    answer: 'Our branches: {{branches.list}}.',
    category: 'Location',
    is_active: true,
    sort_order: 10
  },
  {
    id: 'qa-email',
    question: 'What is your email?',
    keywords: 'email, mail, e-mail',
    answer: 'You can email us at {{settings.email}}.',
    category: 'Contact',
    is_active: true,
    sort_order: 11
  },
  {
    id: 'qa-location',
    question: 'Where are you located?',
    keywords: 'location, address, where, branch, kolkata, map',
    answer: 'Seekho Two Wheeler Academy is in {{settings.address}}. We have multiple Kolkata branches — see the Branches page for maps.',
    category: 'Location',
    is_active: true,
    sort_order: 5
  },
  {
    id: 'qa-contact',
    question: 'How can I contact you?',
    keywords: 'contact, phone, call, whatsapp, number, email',
    answer: 'Call {{settings.phone}} or WhatsApp {{settings.whatsapp}}.',
    category: 'Contact',
    is_active: true,
    sort_order: 6
  }
];

function parseQuick(raw) {
  let list = raw;
  if (typeof list === 'string' && list.trim()) {
    try { list = JSON.parse(list); } catch { list = DEFAULT_QUICK; }
  }
  if (!Array.isArray(list) || !list.length) return DEFAULT_QUICK.slice();
  return list.map((row) => ({
    label: String(row.label || '').trim(),
    prompt: String(row.prompt || '').trim()
  })).filter((row) => row.label && row.prompt);
}

function normalizeConfig(row) {
  const src = { ...CONFIG_SEED, ...(row || {}) };
  const th = Number(src.match_threshold);
  return {
    id: src.id || 'default',
    fallback_message: String(src.fallback_message || '').trim() || CONFIG_SEED.fallback_message,
    match_threshold: Number.isFinite(th) && th >= 0 ? th : 3,
    greeting: String(src.greeting || '').trim() || CONFIG_SEED.greeting,
    quick_replies: parseQuick(src.quick_replies_json ?? src.quick_replies)
  };
}

function normalizeQa(row) {
  if (!row) return null;
  return {
    id: row.id,
    question: row.question || '',
    keywords: parseKeywords(row.keywords).join(', '),
    answer: row.answer || '',
    category: row.category || '',
    is_active: row.is_active !== false,
    sort_order: Number(row.sort_order || 0)
  };
}

function formatInr(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return String(n ?? '');
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function firstPhone(settings) {
  const p = settings && settings.phones;
  if (Array.isArray(p) && p[0]) return String(p[0]);
  if (typeof p === 'string' && p.trim()) return p.split(',')[0].trim();
  return String((settings && settings.whatsapp) || '');
}

function activeBranches(rows) {
  return (rows || []).filter((b) => b && b.active !== false);
}

function formatBranchList(rows) {
  return activeBranches(rows).map((b) => {
    const name = String(b.name || b.area || '').trim();
    const addr = String(b.address || '').trim();
    if (name && addr) return `${name} — ${addr}`;
    return name || addr;
  }).filter(Boolean).join('; ') || 'see the Branches page on our website';
}

async function loadContext() {
  const { getAll } = db;
  const [courseRows, settingRows, branchRows] = await Promise.all([
    getAll('pricing'),
    getAll('settings'),
    getAll('branches')
  ]);
  const courses = courseRows.map(normalizeCourse).filter((c) => c && c.is_active !== false);
  const settings = settingRows[0] || {};
  const branches = activeBranches(branchRows);
  let doorstep = {};
  try {
    doorstep = await getDoorstepConfig();
  } catch {
    doorstep = {};
  }
  return { courses, settings, doorstep, branches };
}

function lookupCourse(courses, slug) {
  const key = COURSE_SLUG_ALIASES[slug] || slug;
  return courses.find((c) => c.slug === key) || courses.find((c) => (c.slug || '').includes(slug));
}

function resolvePlaceholder(path, ctx) {
  const parts = String(path || '').trim().split('.');
  if (parts[0] === 'courses' && parts[1] === 'names') {
    return ctx.courses.map((c) => c.name).filter(Boolean).join(', ') || 'our training programmes';
  }
  if (parts[0] === 'course' || (parts[0] && parts[0].startsWith('course:'))) {
    let slug;
    let field;
    if (parts[0].startsWith('course:')) {
      const rest = parts[0].slice(7);
      slug = rest;
      field = parts[1];
    } else {
      slug = parts[1];
      field = parts[2];
    }
    const course = lookupCourse(ctx.courses, slug);
    if (!course) return '';
    if (field === 'price') return formatInr(course.price);
    if (field === 'classes') return String(course.classes);
    if (field === 'name') return course.name || '';
    return course[field] != null ? String(course[field]) : '';
  }
  if (parts[0] === 'doorstep') {
    const v = ctx.doorstep[parts[1]];
    if (parts[1] && String(parts[1]).includes('price')) return formatInr(v);
    return v != null ? String(v) : '';
  }
  if (parts[0] === 'settings') {
    const key = parts[1];
    if (key === 'phone' || key === 'phones') return firstPhone(ctx.settings);
    const v = ctx.settings[key];
    if (Array.isArray(v)) return v.join(', ');
    return v != null && String(v).trim() !== '' ? String(v) : '';
  }
  if (parts[0] === 'branches') {
    if (parts[1] === 'list' || parts[1] === 'names') return formatBranchList(ctx.branches);
    return '';
  }
  return '';
}

function interpolate(template, ctx) {
  return String(template || '').replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, inner) => {
    const key = String(inner).trim();
    let path = key;
    if (key.startsWith('course:')) {
      path = `course:${key.slice(7)}`;
    }
    return resolvePlaceholder(path, ctx);
  });
}

async function ensureConfigTab() {
  if (typeof db.ensureSheetTab === 'function') {
    await db.ensureSheetTab('chatbot_config');
    await db.ensureSheetTab('chatbot_qa');
    await db.ensureSheetTab('chatbot_unanswered');
  }
}

async function getConfig() {
  await ensureConfigTab();
  let rows = await db.getAll('chatbot_config');
  if (!rows.length) {
    const created = await db.create('chatbot_config', {
      ...CONFIG_SEED,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    return normalizeConfig(created);
  }
  return normalizeConfig(rows[0]);
}

async function saveConfig(payload) {
  const current = await getConfig();
  const next = {
    id: current.id,
    fallback_message: payload.fallback_message !== undefined
      ? sanitizeHtml(payload.fallback_message)
      : current.fallback_message,
    match_threshold: payload.match_threshold !== undefined
      ? Number(payload.match_threshold)
      : current.match_threshold,
    greeting: payload.greeting !== undefined ? String(payload.greeting || '').trim() : current.greeting,
    quick_replies_json: payload.quick_replies !== undefined
      ? parseQuick(payload.quick_replies)
      : current.quick_replies,
    updated_at: new Date().toISOString()
  };
  const saved = await db.update('chatbot_config', current.id, next);
  return { ok: true, data: normalizeConfig(saved || next) };
}

async function listQa(includeInactive) {
  await ensureConfigTab();
  let rows = await db.getAll('chatbot_qa');
  const now = new Date().toISOString();
  if (!rows.length) {
    for (const seed of QA_SEED) {
      await db.create('chatbot_qa', { ...seed, created_at: now, updated_at: now });
    }
    rows = await db.getAll('chatbot_qa');
  } else {
    const have = new Set(rows.map((r) => String(r.id || '')));
    let added = false;
    for (const seed of QA_SEED) {
      if (!have.has(String(seed.id))) {
        await db.create('chatbot_qa', { ...seed, created_at: now, updated_at: now });
        added = true;
      }
    }
    if (added) rows = await db.getAll('chatbot_qa');
  }
  let items = rows.map(normalizeQa).filter(Boolean);
  if (!includeInactive) items = items.filter((i) => i.is_active !== false);
  items.sort((a, b) => a.sort_order - b.sort_order);
  return items;
}

async function createQa(payload) {
  const question = String(payload.question || '').trim();
  const answer = sanitizeHtml(payload.answer || '');
  if (!question || !answer) return { ok: false, message: 'Question and answer are required' };
  const existing = await listQa(true);
  const created = await db.create('chatbot_qa', {
    question,
    keywords: String(payload.keywords || '').trim(),
    answer,
    category: String(payload.category || '').trim(),
    is_active: payload.is_active !== undefined ? parseBool(payload.is_active, true) : true,
    sort_order: payload.sort_order !== undefined ? Number(payload.sort_order) : existing.length + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  return { ok: true, data: normalizeQa(created) };
}

async function updateQa(id, payload) {
  const all = await listQa(true);
  const current = all.find((i) => String(i.id) === String(id));
  if (!current) return { ok: false, status: 404, message: 'Q&A not found' };
  const next = {
    ...current,
    question: payload.question !== undefined ? String(payload.question || '').trim() : current.question,
    keywords: payload.keywords !== undefined ? String(payload.keywords || '').trim() : current.keywords,
    answer: payload.answer !== undefined ? sanitizeHtml(payload.answer) : current.answer,
    category: payload.category !== undefined ? String(payload.category || '').trim() : current.category,
    is_active: payload.is_active !== undefined ? parseBool(payload.is_active, true) : current.is_active,
    sort_order: payload.sort_order !== undefined ? Number(payload.sort_order || 0) : current.sort_order
  };
  if (!next.question || !next.answer) return { ok: false, message: 'Question and answer are required' };
  const saved = await db.update('chatbot_qa', id, next);
  return { ok: true, data: normalizeQa(saved) };
}

async function removeQa(id) {
  return db.remove('chatbot_qa', id);
}

async function logUnanswered(message) {
  try {
    await db.create('chatbot_unanswered', {
      message: String(message || '').slice(0, 500),
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('[chatbot] unanswered log failed:', err.message);
  }
}

async function listUnanswered() {
  await ensureConfigTab();
  const rows = await db.getAll('chatbot_unanswered');
  return rows
    .map((r) => ({ id: r.id, message: r.message, created_at: r.created_at || r.createdAt }))
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .slice(0, 100);
}

function sanitizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(-8).map((row) => ({
    role: row && row.role === 'bot' ? 'bot' : 'user',
    text: String((row && (row.text || row.message)) || '').trim().slice(0, 500)
  })).filter((row) => row.text);
}

async function ask(message, { logMiss = true, history } = {}) {
  const text = String(message || '').trim().slice(0, 500);
  if (!text) return { ok: false, message: 'Please type a question' };
  const [config, items, ctx] = await Promise.all([getConfig(), listQa(false), loadContext()]);
  const matchText = composeMatchText(text, sanitizeHistory(history));
  const picked = pickBest(matchText, items, config.match_threshold);
  const contacts = {
    phone: firstPhone(ctx.settings),
    whatsapp: String(ctx.settings.whatsapp || firstPhone(ctx.settings) || '')
  };
  if (!picked.matched) {
    if (logMiss) await logUnanswered(text);
    return {
      ok: true,
      matched: false,
      score: picked.score,
      answer: interpolate(config.fallback_message, ctx),
      category: null,
      question: null,
      quick_replies: config.quick_replies,
      contacts
    };
  }
  return {
    ok: true,
    matched: true,
    score: picked.score,
    answer: interpolate(picked.item.answer, ctx),
    category: picked.item.category,
    question: picked.item.question,
    id: picked.item.id,
    quick_replies: config.quick_replies,
    contacts
  };
}

module.exports = {
  getConfig,
  saveConfig,
  listQa,
  createQa,
  updateQa,
  removeQa,
  listUnanswered,
  ask,
  interpolate,
  CONFIG_SEED,
  QA_SEED
};
