/**
 * Seekho 2 Wheeler AI — deterministic chatbot (Phase 7 extension).
 * Extends existing Q&A matcher; does not rebuild the widget.
 *
 * Rules:
 * - Courses / branches / women / booking / phones from existing SSOTs — never hard-code copies.
 * - Official phones only: 9748481630, 7980108587 (block 7980110273).
 * - Never promise automatic Scooty → Bike progression.
 * - Every Phase 7 FAQ ends with a CTA (cta_label + cta_href).
 */
const db = require('./db');
const { sanitizeHtml, parseBool } = require('../utils/sanitizeHtml');
const { pickBest, parseKeywords, composeMatchText } = require('./chatbotMatch');
const { getDoorstepConfig } = require('./doorstep');
const {
  chatbotBranchList,
  chatbotBranchDetail,
  listPublicCards,
  getLocation
} = require('../content/locations');
const {
  chatbotCourseList,
  chatbotCourseDetail,
  getCourse,
  resolveSlug
} = require('../content/courses');
const { chatbotWomenBlurb, WOMEN_TRAINING } = require('../content/womenTraining');

const OFFICIAL_PHONES = ['9748481630', '7980108587'];
const BLOCKED_PHONES = new Set(['7980110273']);

const COURSE_SLUG_ALIASES = {
  'scooty-basic': 'basic-scooty',
  scooty: 'basic-scooty',
  'scooty-training': 'basic-scooty',
  'basic-scooty-training': 'basic-scooty',
  'advanced-scooty-training': 'advanced-scooty',
  'advance-scooty': 'advanced-scooty',
  bike: 'bike-training',
  doorstep: 'doorstep-training',
  'doorstep-scooty-and-bike-training': 'doorstep-training',
  rto: 'rto-preparation',
  'rto-practice': 'rto-preparation',
  'rto-license-and-exam-assistance': 'rto-preparation',
  ladies: 'basic-scooty',
  'ladies-training': 'basic-scooty'
};

const DEFAULT_QUICK = [
  { label: 'Courses', prompt: 'What courses do you offer?' },
  { label: 'Centres', prompt: 'Where are your training centres?' },
  { label: 'Women', prompt: 'Do you provide training for women?' },
  { label: 'Beginners', prompt: 'Can a complete beginner learn?' },
  { label: 'Booking', prompt: 'How do I book a training slot?' },
  { label: 'Contact', prompt: 'How can I contact you?' }
];

const FALLBACK_MESSAGE =
  "I don't have verified information about that yet. I can help with Seekho's courses, seven training centres, women's training, timings, booking, and official contact details. Prefer to speak with us? Use Call or WhatsApp below.";

const CONFIG_SEED = {
  id: 'default',
  bot_name: 'Seekho 2 Wheeler AI',
  greeting: 'How can we help you?',
  welcome_heading: 'How can we help you?',
  fallback_message: FALLBACK_MESSAGE,
  match_threshold: 3,
  phone: '',
  whatsapp: '',
  quick_replies_json: DEFAULT_QUICK
};

/**
 * Phase 7 required FAQ seed (10). Answers use SSOT placeholders only.
 * cta_label / cta_href use real site routes.
 */
const QA_SEED = [
  {
    id: 'qa-p7-cycling',
    question: 'Can I learn cycling first?',
    keywords:
      'cycling, cycle, without cycle, non-cyclist, learn cycling first, know cycle, balance cycle, scooty without cycle',
    answer:
      'You do not need to learn cycling first. Basic Scooty at Seekho starts from absolute basics — no cycle balancing is required. Non-cyclists and beginners are welcome.',
    category: 'Beginners',
    is_active: true,
    sort_order: 1,
    cta_label: 'View Basic Scooty',
    cta_href: '/courses/basic-scooty'
  },
  {
    id: 'qa-p7-centres',
    question: 'Where are your training centres?',
    keywords:
      'centres, centers, branches, locations, where, training centre, tollygunge, barasat, new town, sodepur, rabindra sarobar, howrah, patuli, lalit cinema, swiss park',
    answer:
      'Seekho has seven Kolkata centres: {{branches.list}}. Barasat landmark: Lalit Cinema. Rabindra Sarobar landmark: Swiss Park, opposite Bhawani Cinema. Open a location page for maps and training details.',
    category: 'Location',
    is_active: true,
    sort_order: 2,
    cta_label: 'View Locations',
    cta_href: '/pages/branches.html'
  },
  {
    id: 'qa-p7-bike',
    question: 'Do you provide bike training?',
    keywords: 'bike training, motorcycle, bike course, provide bike, clutch, gear',
    answer:
      'Yes. {{course:bike-training.detail}} Basic cycle balancing is required for Bike Training. Seekho does not promise automatic progression from scooty training to bike training.',
    category: 'Courses',
    is_active: true,
    sort_order: 3,
    cta_label: 'View Bike Training',
    cta_href: '/courses/bike-training'
  },
  {
    id: 'qa-p7-courses',
    question: 'What courses do you offer?',
    keywords: 'courses, programs, course list, what courses, training programs, offer',
    answer:
      'We currently offer: {{courses.names}}. Ask about Basic Scooty, Advanced Scooty (10 or 15 classes), Bike Training, Doorstep Training or RTO Preparation for details.',
    category: 'Courses',
    is_active: true,
    sort_order: 4,
    cta_label: 'View Courses',
    cta_href: '/pages/courses.html'
  },
  {
    id: 'qa-p7-women',
    question: 'Do you provide training for women?',
    keywords: 'women, ladies, female, women training, ladies training, women riders, empowerment',
    answer: '{{women.detail}}',
    category: 'Women',
    is_active: true,
    sort_order: 5,
    cta_label: "Women's Training",
    cta_href: '/women-training'
  },
  {
    id: 'qa-p7-timings',
    question: 'What are the class timings?',
    keywords: 'timings, timing, class timings, hours, open, slot, schedule, morning, evening, working hours',
    answer:
      'We are open {{settings.workingHours}}. Flexible morning and evening slots are available — confirm your slot when you book.',
    category: 'Timings',
    is_active: true,
    sort_order: 6,
    cta_label: 'Book Training',
    cta_href: '/pages/booking.html'
  },
  {
    id: 'qa-p7-onetoone',
    question: 'Do you provide one-to-one training?',
    keywords: 'one-to-one, one to one, 1 to 1, personal trainer, private, individual, doorstep',
    answer:
      'Yes. Doorstep Training is personalised one-to-one training at your location (within 10 km of Netaji Metro Station). Price is distance-based via the doorstep calculator — not a fixed chatbot price.',
    category: 'Doorstep',
    is_active: true,
    sort_order: 7,
    cta_label: 'Check Doorstep & Book',
    cta_href: '/pages/booking.html?course=doorstep-training'
  },
  {
    id: 'qa-p7-beginner',
    question: 'Can a complete beginner learn?',
    keywords: 'beginner, complete beginner, absolute beginner, zero experience, first time, never ridden',
    answer:
      'Yes. Complete beginners are welcome. Basic Scooty needs no cycle balancing. Women beginners can also see Women\'s Training at Seekho 2 Wheeler. {{women.statistic}}',
    category: 'Beginners',
    is_active: true,
    sort_order: 8,
    cta_label: 'Book Training',
    cta_href: '/pages/booking.html?course=basic-scooty'
  },
  {
    id: 'qa-p7-booking',
    question: 'How do I book a training slot?',
    keywords: 'book, booking, register, slot, appointment, enrol, enroll, reservation, how to book',
    answer:
      'Use Register & Book on our website to choose a course, branch, date and time. You can also Call {{settings.phone}} or WhatsApp {{settings.whatsapp}}.',
    category: 'Booking',
    is_active: true,
    sort_order: 9,
    cta_label: 'Book Training',
    cta_href: '/pages/booking.html'
  },
  {
    id: 'qa-p7-contact',
    question: 'How can I contact you?',
    keywords: 'contact, phone, call, whatsapp, number, email, reach you',
    answer: 'Call {{settings.phone}} or WhatsApp {{settings.whatsapp}}. You can also email {{settings.email}}.',
    category: 'Contact',
    is_active: true,
    sort_order: 10,
    cta_label: 'Contact Page',
    cta_href: '/pages/contact.html'
  },
  /* Extra course helpers (SSOT) — not replacing the Phase 7 ten */
  {
    id: 'qa-advanced-scooty',
    question: 'What is Advanced Scooty?',
    keywords: 'advanced scooty, advance scooty, advanced course, busy road',
    answer: '{{course:advanced-scooty.detail}}',
    category: 'Courses',
    is_active: true,
    sort_order: 11,
    cta_label: 'View Advanced Scooty',
    cta_href: '/courses/advanced-scooty'
  },
  {
    id: 'qa-doorstep',
    question: 'How does doorstep training pricing work?',
    keywords: 'doorstep, home training, km, kilometre, come to you, doorstep price',
    answer:
      'Doorstep training is {{doorstep.base_price}} up to {{doorstep.base_km}} km, then extra per km, capped at {{doorstep.max_price}} (max {{doorstep.max_km}} km). Use the booking calculator for your estimate.',
    category: 'Doorstep',
    is_active: true,
    sort_order: 12,
    cta_label: 'Check Doorstep Price',
    cta_href: '/pages/booking.html?course=doorstep-training'
  },
  {
    id: 'qa-rto-prep',
    question: 'What is RTO Preparation?',
    keywords: 'rto, rto preparation, rto practice, license, driving test',
    answer:
      '{{course:rto-preparation.detail}} Seekho does not guarantee that you will pass an RTO test.',
    category: 'Courses',
    is_active: true,
    sort_order: 13,
    cta_label: 'View RTO Preparation',
    cta_href: '/courses/rto-preparation'
  },
  {
    id: 'qa-scooty-bike-progression',
    question: 'Does scooty training automatically lead to bike training?',
    keywords:
      'scooty to bike, scooty → bike, automatic progression, upgrade to bike, after scooty bike, progress to bike',
    answer:
      'No. Completing scooty training does not automatically qualify you for bike training. Bike Training is a separate programme and requires basic cycle balancing. See each course page for requirements, then book the course you need.',
    category: 'Courses',
    is_active: true,
    sort_order: 14,
    cta_label: 'View Courses',
    cta_href: '/pages/courses.html'
  }
];

function parseQuick(raw) {
  let list = raw;
  if (typeof list === 'string' && list.trim()) {
    try {
      list = JSON.parse(list);
    } catch {
      list = DEFAULT_QUICK;
    }
  }
  if (!Array.isArray(list) || !list.length) return DEFAULT_QUICK.slice();
  return list
    .map((row) => ({
      label: String(row.label || '').trim(),
      prompt: String(row.prompt || '').trim()
    }))
    .filter((row) => row.label && row.prompt);
}

function normalizePhones(raw) {
  const list = Array.isArray(raw)
    ? raw
    : String(raw || '')
        .split(/[,|·]/)
        .map((x) => x.trim())
        .filter(Boolean);
  const cleaned = list
    .map((p) => String(p).replace(/\D/g, ''))
    .filter((digits) => digits && !BLOCKED_PHONES.has(digits))
    .map((digits) => {
      const match = OFFICIAL_PHONES.find((o) => o === digits || digits.endsWith(o));
      return match || null;
    })
    .filter(Boolean);
  const unique = [...new Set(cleaned)];
  return unique.length ? unique : [...OFFICIAL_PHONES];
}

function normalizeWhatsapp(raw, phones) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits && !BLOCKED_PHONES.has(digits)) {
    const match = OFFICIAL_PHONES.find((o) => o === digits || digits.endsWith(o));
    if (match) return match;
  }
  return phones[0] || OFFICIAL_PHONES[0];
}

function normalizeConfig(row) {
  const src = { ...CONFIG_SEED, ...(row || {}) };
  const th = Number(src.match_threshold);
  const greeting =
    String(src.welcome_heading || src.greeting || '').trim() || CONFIG_SEED.greeting;
  return {
    id: src.id || 'default',
    bot_name: String(src.bot_name || '').trim() || CONFIG_SEED.bot_name,
    greeting,
    welcome_heading: greeting,
    fallback_message: String(src.fallback_message || '').trim() || CONFIG_SEED.fallback_message,
    match_threshold: Number.isFinite(th) && th >= 0 ? th : 3,
    phone: String(src.phone || '').trim(),
    whatsapp: String(src.whatsapp || '').trim(),
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
    sort_order: Number(row.sort_order || 0),
    cta_label: String(row.cta_label || '').trim(),
    cta_href: String(row.cta_href || '').trim()
  };
}

function formatInr(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return String(n ?? '');
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function firstPhone(settings) {
  const phones = normalizePhones(settings && settings.phones);
  return phones[0] || OFFICIAL_PHONES[0];
}

function formatPhoneList(settings) {
  return normalizePhones(settings && settings.phones).join(' / ');
}

function activeBranches(rows) {
  return (rows || []).filter((b) => b && b.active !== false);
}

function formatBranchList(rows, cards) {
  if (cards && cards.length) return cards.map((card) => card.name).filter(Boolean).join(', ');
  const fromSsot = chatbotBranchList();
  if (fromSsot) return fromSsot;
  return (
    activeBranches(rows)
      .map((b) => {
        const name = String(b.name || b.area || '').trim();
        const addr = String(b.address || '').trim();
        if (name && addr) return `${name} — ${addr}`;
        return name || addr;
      })
      .filter(Boolean)
      .join('; ') || 'see the Branches page on our website'
  );
}

async function loadContext() {
  const { getAll } = db;
  const [courseRows, settingRows, branchRows] = await Promise.all([
    getAll('pricing'),
    getAll('settings'),
    getAll('branches')
  ]);
  const { listPublicCards: listCourses } = require('../content/courses');
  const courses = listCourses(courseRows);
  const rawSettings = settingRows[0] || {};
  const phones = normalizePhones(rawSettings.phones);
  const settings = {
    ...rawSettings,
    phones,
    phone: phones.join(' / '),
    whatsapp: normalizeWhatsapp(rawSettings.whatsapp, phones),
    email: rawSettings.email || 'info@seekhoacademy.com',
    workingHours: rawSettings.workingHours || 'Mon – Sun: 7:00 AM – 7:00 PM',
    address: rawSettings.address || ''
  };
  let locationCards = [];
  try {
    locationCards = await require('./locationCms').listPublic();
  } catch {
    locationCards = listPublicCards();
  }
  const branches = locationCards.length ? locationCards : listPublicCards();
  let doorstep = {};
  try {
    doorstep = await getDoorstepConfig();
  } catch {
    doorstep = {};
  }
  return {
    courses,
    settings,
    doorstep,
    branches,
    locationCards: branches,
    branchRows: activeBranches(branchRows),
    women: WOMEN_TRAINING
  };
}

function branchDetailText(ctx, slug) {
  const key = String(slug || '').toLowerCase();
  const cards = (ctx && (ctx.locationCards || ctx.branches)) || [];
  const loc = cards.find((card) => String(card.slug || '').toLowerCase() === key || String(card.name || '').toLowerCase() === key);
  if (loc && loc.address) {
    const courses = (loc.trainingAvailable || []).length ? loc.trainingAvailable.join(', ') : 'Confirm courses when booking';
    return `${loc.name} (${loc.establishedLabel || ''}). Landmark/area: ${loc.landmark || loc.area || ''}. Address: ${loc.address}. Training: ${courses}. Page: /locations/${loc.slug}`;
  }
  return chatbotBranchDetail(slug);
}

function lookupCourse(courses, slug) {
  const key = COURSE_SLUG_ALIASES[slug] || resolveSlug(slug) || slug;
  return (
    courses.find((c) => c.slug === key) ||
    courses.find((c) => (c.slug || '') === slug) ||
    courses.find((c) => (c.slug || '').includes(slug)) ||
    null
  );
}

function resolvePlaceholder(path, ctx) {
  const parts = String(path || '').trim().split('.');
  if (parts[0] === 'courses' && parts[1] === 'names') {
    return (
      chatbotCourseList() ||
      ctx.courses.map((c) => c.name).filter(Boolean).join(', ') ||
      'our training programmes'
    );
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
    if (field === 'detail') {
      return chatbotCourseDetail(slug) || '';
    }
    const course = lookupCourse(ctx.courses, slug) || getCourse(slug);
    if (!course) return '';
    if (field === 'price') {
      if (course.isDoorstep) return 'distance-based (doorstep calculator)';
      return formatInr(course.price != null ? course.price : course.priceFrom);
    }
    if (field === 'classes') return String(course.classesLabel || course.classes_label || course.classes || '');
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
    if (key === 'phone' || key === 'phones') return formatPhoneList(ctx.settings);
    const v = ctx.settings[key];
    if (Array.isArray(v)) return v.join(', ');
    return v != null && String(v).trim() !== '' ? String(v) : '';
  }
  if (parts[0] === 'branches') {
    if (parts[1] === 'list' || parts[1] === 'names') return formatBranchList(ctx.branches, ctx.locationCards);
    if (parts[1] === 'detail' && parts[2]) return branchDetailText(ctx, parts[2]);
    if (parts[1]) return branchDetailText(ctx, parts[1]);
    return '';
  }
  if (parts[0] === 'women') {
    if (parts[1] === 'detail') return chatbotWomenBlurb();
    if (parts[1] === 'book') return WOMEN_TRAINING.bookCta.href;
    if (parts[1] === 'page') return '/women-training';
    if (parts[1] === 'statistic') return WOMEN_TRAINING.statistic;
    return chatbotWomenBlurb();
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
  if (db.allowRuntimeSeed && !db.allowRuntimeSeed()) return;
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
    if (db.allowRuntimeSeed && !db.allowRuntimeSeed()) return normalizeConfig(CONFIG_SEED);
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
    bot_name:
      payload.bot_name !== undefined ? String(payload.bot_name || '').trim() : current.bot_name,
    greeting:
      payload.greeting !== undefined
        ? String(payload.greeting || '').trim()
        : payload.welcome_heading !== undefined
          ? String(payload.welcome_heading || '').trim()
          : current.greeting,
    welcome_heading:
      payload.welcome_heading !== undefined
        ? String(payload.welcome_heading || '').trim()
        : payload.greeting !== undefined
          ? String(payload.greeting || '').trim()
          : current.welcome_heading,
    fallback_message:
      payload.fallback_message !== undefined
        ? sanitizeHtml(payload.fallback_message)
        : current.fallback_message,
    match_threshold:
      payload.match_threshold !== undefined ? Number(payload.match_threshold) : current.match_threshold,
    phone: payload.phone !== undefined ? String(payload.phone || '').trim() : current.phone,
    whatsapp:
      payload.whatsapp !== undefined ? String(payload.whatsapp || '').trim() : current.whatsapp,
    quick_replies_json:
      payload.quick_replies !== undefined ? parseQuick(payload.quick_replies) : current.quick_replies,
    updated_at: new Date().toISOString()
  };
  if (!next.greeting) next.greeting = CONFIG_SEED.greeting;
  if (!next.welcome_heading) next.welcome_heading = next.greeting;
  const saved = await db.update('chatbot_config', current.id, next);
  return { ok: true, data: normalizeConfig(saved || next) };
}

async function listQa(includeInactive) {
  await ensureConfigTab();
  let rows = await db.getAll('chatbot_qa');
  const now = new Date().toISOString();
  if (db.allowRuntimeSeed && !db.allowRuntimeSeed()) {
    let items = rows.map(normalizeQa).filter(Boolean);
    if (!includeInactive) items = items.filter((i) => i.is_active !== false);
    items.sort((a, b) => a.sort_order - b.sort_order);
    return items;
  }
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
    cta_label: String(payload.cta_label || '').trim(),
    cta_href: String(payload.cta_href || '').trim(),
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
    sort_order: payload.sort_order !== undefined ? Number(payload.sort_order || 0) : current.sort_order,
    cta_label: payload.cta_label !== undefined ? String(payload.cta_label || '').trim() : current.cta_label,
    cta_href: payload.cta_href !== undefined ? String(payload.cta_href || '').trim() : current.cta_href
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
  return raw
    .slice(-8)
    .map((row) => ({
      role: row && row.role === 'bot' ? 'bot' : 'user',
      text: String((row && (row.text || row.message)) || '')
        .trim()
        .slice(0, 500)
    }))
    .filter((row) => row.text);
}

function buildContacts(ctx, config) {
  const phones = normalizePhones(config.phone || ctx.settings.phones);
  const phone = phones[0] || firstPhone(ctx.settings);
  const whatsapp = normalizeWhatsapp(config.whatsapp || ctx.settings.whatsapp, phones);
  return {
    phone,
    phones,
    whatsapp,
    call_href: `tel:${phone}`,
    whatsapp_href: `https://wa.me/91${String(whatsapp).replace(/\D/g, '').slice(-10)}`
  };
}

function buildCta(item) {
  if (!item) return null;
  const label = String(item.cta_label || '').trim();
  const href = String(item.cta_href || '').trim();
  if (!label || !href) return null;
  return { label, href };
}

async function ask(message, { logMiss = true, history } = {}) {
  const text = String(message || '').trim().slice(0, 500);
  if (!text) return { ok: false, message: 'Please type a question' };
  const [config, items, ctx] = await Promise.all([getConfig(), listQa(false), loadContext()]);
  const matchText = composeMatchText(text, sanitizeHistory(history));
  const picked = pickBest(matchText, items, config.match_threshold);
  const contacts = buildContacts(ctx, config);

  if (!picked.matched) {
    if (logMiss) await logUnanswered(text);
    return {
      ok: true,
      matched: false,
      score: picked.score,
      answer: interpolate(config.fallback_message, ctx),
      category: null,
      question: null,
      cta: null,
      actions: [
        { type: 'call', label: 'Call', href: contacts.call_href },
        { type: 'whatsapp', label: 'WhatsApp', href: contacts.whatsapp_href }
      ],
      bot_name: config.bot_name,
      quick_replies: config.quick_replies,
      contacts
    };
  }

  const cta = buildCta(picked.item);
  return {
    ok: true,
    matched: true,
    score: picked.score,
    answer: interpolate(picked.item.answer, ctx),
    category: picked.item.category,
    question: picked.item.question,
    id: picked.item.id,
    cta,
    actions: cta ? [{ type: 'cta', label: cta.label, href: cta.href }] : [],
    bot_name: config.bot_name,
    quick_replies: config.quick_replies,
    contacts
  };
}

/** Seed rows for sync-content / local JSON (idempotent upsert by id). */
function chatbotConfigSeedRow(now = new Date().toISOString()) {
  return {
    ...CONFIG_SEED,
    created_at: now,
    updated_at: now
  };
}

function chatbotQaSeedRows(now = new Date().toISOString()) {
  return QA_SEED.map((q) => ({
    ...q,
    created_at: now,
    updated_at: now
  }));
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
  QA_SEED,
  OFFICIAL_PHONES,
  chatbotConfigSeedRow,
  chatbotQaSeedRows,
  normalizePhones
};
