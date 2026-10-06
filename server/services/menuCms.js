/**
 * Public website navigation. Header labels in page_copy stay as a fallback
 * only when this API cannot be reached.
 */
const db = require('./db');

const MENU_SEED = [
  { id: 'menu-home', label: 'Home', href: '/', menuGroup: 'header', isExternal: false, openNewTab: false, active: true, displayOrder: 1, pageType: 'link', specialSlug: '' },
  { id: 'menu-about', label: 'About Us', href: '/pages/about.html', menuGroup: 'header', isExternal: false, openNewTab: false, active: true, displayOrder: 2, pageType: 'link', specialSlug: '' },
  { id: 'menu-courses', label: 'Courses', href: '/pages/courses.html', menuGroup: 'header', isExternal: false, openNewTab: false, active: true, displayOrder: 3, pageType: 'dropdown', specialSlug: '' },
  { id: 'menu-branches', label: 'Branches', href: '/pages/branches.html', menuGroup: 'header', isExternal: false, openNewTab: false, active: true, displayOrder: 4, pageType: 'link', specialSlug: '' },
  { id: 'menu-gallery', label: 'Gallery', href: '/pages/gallery.html', menuGroup: 'header', isExternal: false, openNewTab: false, active: true, displayOrder: 5, pageType: 'link', specialSlug: '' },
  { id: 'menu-blog', label: 'Blog', href: '/pages/blog.html', menuGroup: 'header', isExternal: false, openNewTab: false, active: true, displayOrder: 6, pageType: 'link', specialSlug: '' },
  { id: 'menu-reviews', label: 'Reviews', href: '/pages/reviews.html', menuGroup: 'header', isExternal: false, openNewTab: false, active: true, displayOrder: 7, pageType: 'link', specialSlug: '' },
  { id: 'menu-contact', label: 'Contact', href: '/pages/contact.html', menuGroup: 'header', isExternal: false, openNewTab: false, active: true, displayOrder: 8, pageType: 'link', specialSlug: '' },
  { id: 'menu-dd-scooty', label: 'Scooty Training', href: '/pages/courses.html#scooty', menuGroup: 'courses-dropdown', isExternal: false, openNewTab: false, active: true, displayOrder: 1, pageType: 'link', specialSlug: '' },
  { id: 'menu-dd-bike', label: 'Bike Training', href: '/pages/courses.html#bike', menuGroup: 'courses-dropdown', isExternal: false, openNewTab: false, active: true, displayOrder: 2, pageType: 'link', specialSlug: '' },
  { id: 'menu-dd-ladies', label: 'Ladies Training', href: '/women-training', menuGroup: 'courses-dropdown', isExternal: false, openNewTab: false, active: true, displayOrder: 3, pageType: 'link', specialSlug: '' },
  { id: 'menu-dd-ev', label: 'Electric Vehicle', href: '/pages/courses.html#ev', menuGroup: 'courses-dropdown', isExternal: false, openNewTab: false, active: true, displayOrder: 4, pageType: 'link', specialSlug: '' },
  { id: 'menu-dd-road', label: 'Road Practice', href: '/pages/courses.html#road', menuGroup: 'courses-dropdown', isExternal: false, openNewTab: false, active: true, displayOrder: 5, pageType: 'link', specialSlug: '' },
  { id: 'menu-dd-rto', label: 'RTO Practice', href: '/pages/courses.html#rto', menuGroup: 'courses-dropdown', isExternal: false, openNewTab: false, active: true, displayOrder: 6, pageType: 'link', specialSlug: '' }
];

function sortMenus(rows) {
  return rows.slice().sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0) || String(a.label).localeCompare(String(b.label)));
}

function publicItem(row) {
  const specialSlug = String(row.specialSlug || '').trim();
  const pageType = row.pageType || (specialSlug ? 'special' : 'link');
  const href = pageType === 'special' && specialSlug ? `/special/${specialSlug}` : String(row.href || '');
  return {
    id: row.id,
    label: row.label || '',
    href,
    menuGroup: row.menuGroup || 'header',
    isExternal: row.isExternal === true || row.isExternal === 'true',
    openNewTab: row.openNewTab === true || row.openNewTab === 'true',
    active: row.active !== false && row.active !== 'false',
    displayOrder: Number(row.displayOrder || 0),
    pageType,
    specialSlug
  };
}

async function ensureMenuSeed() {
  if (typeof db.ensureSheetTab === 'function') await db.ensureSheetTab('frontend_menus');
  const rows = await db.getAll('frontend_menus');
  const ids = new Set(rows.map((row) => String(row.id)));
  const now = new Date().toISOString();
  for (const seed of MENU_SEED) {
    if (ids.has(seed.id)) continue;
    await db.create('frontend_menus', { ...seed, createdAt: now, updatedAt: now });
  }
}

function validateMenu(body) {
  const label = String(body.label || '').trim();
  if (!label) return { ok: false, message: 'Menu label is required' };
  const menuGroup = body.menuGroup === 'courses-dropdown' ? 'courses-dropdown' : 'header';
  const pageType = ['link', 'dropdown', 'special'].includes(body.pageType) ? body.pageType : 'link';
  const specialSlug = String(body.specialSlug || '').trim().toLowerCase();
  let href = String(body.href || '').trim();
  const isExternal = body.isExternal === true || body.isExternal === 'true';
  if (pageType === 'special') {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(specialSlug)) {
      return { ok: false, message: 'Special page slug is required' };
    }
    href = `/special/${specialSlug}`;
  } else if (isExternal) {
    if (!/^https:\/\//i.test(href)) return { ok: false, message: 'External links must start with https://' };
  } else if (!href.startsWith('/')) {
    return { ok: false, message: 'Internal links must start with /' };
  }
  if (/^\s*javascript:/i.test(href)) return { ok: false, message: 'That link is not allowed' };
  return {
    ok: true,
    data: {
      label,
      href,
      menuGroup,
      isExternal: pageType === 'special' ? false : isExternal,
      openNewTab: body.openNewTab === true || body.openNewTab === 'true',
      active: body.active !== false && body.active !== 'false',
      displayOrder: Number(body.displayOrder || 0),
      pageType,
      specialSlug: pageType === 'special' ? specialSlug : ''
    }
  };
}

async function listAdmin() {
  await ensureMenuSeed();
  const rows = await db.getAll('frontend_menus');
  return sortMenus(rows.map(publicItem));
}

async function listPublic() {
  try {
    const rows = await listAdmin();
    return rows.filter((row) => row.active !== false);
  } catch (err) {
    console.error('[menuCms] public menu fallback:', err.message);
    return null;
  }
}

async function createMenu(body) {
  const check = validateMenu(body);
  if (!check.ok) return check;
  const row = await db.create('frontend_menus', check.data);
  return { ok: true, data: publicItem(row) };
}

async function updateMenu(id, body) {
  const existing = await db.getById('frontend_menus', id);
  if (!existing) return { ok: false, status: 404, message: 'Menu item not found' };
  const merged = { ...publicItem(existing), ...body, id: existing.id };
  const check = validateMenu(merged);
  if (!check.ok) return check;
  const row = await db.update('frontend_menus', id, check.data);
  return { ok: true, data: publicItem(row) };
}

async function removeMenu(id) {
  const existing = await db.getById('frontend_menus', id);
  if (!existing) return { ok: false, status: 404, message: 'Menu item not found' };
  await db.remove('frontend_menus', id);
  return { ok: true };
}

module.exports = {
  MENU_SEED,
  ensureMenuSeed,
  listAdmin,
  listPublic,
  createMenu,
  updateMenu,
  removeMenu,
  publicItem
};
