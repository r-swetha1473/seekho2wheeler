import { api, toast, confirm, escapeHtml, addBtn, uiIcon, ICONS } from '../admin.js';

const TABS = [
  ['basic', 'Location', 'pin'],
  ['content', 'Page', 'page'],
  ['pricing', 'Display Pricing', 'pricing'],
  ['timing', 'Visitor Timing', 'clock'],
  ['faqs', 'FAQs', 'faq'],
  ['seo', 'Search & Share', 'search'],
  ['settings', 'Page Settings', 'settings']
];

const SECTION_LABELS = {
  hero: 'Hero',
  why: 'Why this branch',
  highlights: 'Highlights',
  training: 'Courses on the page',
  whoCanLearn: 'Who can learn',
  pricing: 'Display pricing',
  timing: 'Visitor timing',
  howToReach: 'How to reach',
  gallery: 'Gallery',
  women: 'Ladies training',
  reviews: 'Reviews',
  faq: 'FAQs',
  cta: 'Button',
  floatingReviews: 'Floating reviews'
};

let rows = [];

export default async function render(container) {
  container.innerHTML = '<div class="loading"><div class="loading__spinner"></div> Loading locations…</div>';
  await loadList(container);
}

async function loadList(container) {
  const { data } = await api('/admin/locations');
  rows = data || [];
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">Locations / Branches</h2>
        <p class="page-header__subtitle">Edit each branch page, the fees visitors see, and the hours on that page. Course prices and booking times stay in Courses and the booking form.</p>
      </div>
      ${addBtn('Add Location', 'addLocationBtn')}
    </div>
    <div class="card"><div class="card__body" style="padding:0;">
      ${rows.length ? table() : `<div class="empty-state"><div class="empty-state__icon">${uiIcon('pin')}</div><div class="empty-state__title">No locations yet</div><p class="empty-state__text">Add a branch to show it on the website and in booking.</p></div>`}
    </div></div>`;
  document.getElementById('addLocationBtn')?.addEventListener('click', () => showEditor(container, blank()));
  container.querySelectorAll('tbody tr[data-id]').forEach((tr) => {
    const row = rows.find((item) => item.branchId === tr.dataset.id);
    tr.querySelector('[data-action="edit"]')?.addEventListener('click', () => showEditor(container, row));
    tr.querySelector('[data-action="toggle"]')?.addEventListener('click', () => toggle(container, row));
    tr.querySelector('[data-action="delete"]')?.addEventListener('click', () => remove(container, row));
  });
}

function table() {
  return `<div class="table-wrap table-responsive"><table class="data-table"><thead><tr>
    <th>Location</th><th>Visibility</th><th>Featured</th><th>Order</th><th>Actions</th>
  </tr></thead><tbody>
  ${rows.map((row) => `<tr data-id="${escapeHtml(row.branchId)}">
    <td><strong>${escapeHtml(row.shortName || row.branchName)}</strong><br><small>/locations/${escapeHtml(row.slug)}</small></td>
    <td>${row.active !== false ? '<span class="badge badge--active">Visible</span>' : '<span class="badge badge--inactive">Hidden</span>'}</td>
    <td>${row.featured ? '<span class="badge badge--active">Featured</span>' : '<span class="badge badge--read">Standard</span>'}</td>
    <td>${escapeHtml(row.displayOrder ?? '')}</td>
    <td><div class="table-actions">
      <button class="btn btn--sm btn--outline" data-action="edit" type="button" title="Edit">${ICONS.edit}<span>Edit</span></button>
      <button class="btn btn--sm btn--outline" data-action="toggle" type="button" title="${row.active !== false ? 'Hide this location' : 'Show this location'}">${ICONS.toggle}<span>${row.active !== false ? 'Hide' : 'Show'}</span></button>
      <button class="btn btn--sm btn--danger" data-action="delete" type="button" title="Delete">${ICONS.delete}<span>Delete</span></button>
    </div></td>
  </tr>`).join('')}
  </tbody></table></div>`;
}

function blank() {
  return {
    branchId: '',
    name: '',
    shortName: '',
    slug: '',
    area: '',
    address: '',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '',
    mapsLink: '',
    latitude: '',
    longitude: '',
    phone: '',
    whatsapp: '',
    phones: [],
    availableCourses: [],
    trainingAvailable: [],
    image: '',
    active: true,
    featured: false,
    displayOrder: rows.length + 1,
    heroEyebrow: '',
    heroHeading: '',
    heroSubtitle: '',
    introHtml: '',
    whyTitle: '',
    whyBody: '',
    highlights: [],
    whoCanLearn: [],
    howToReach: [],
    womenTitle: '',
    womenBody: '',
    faqs: [],
    pricing: [],
    timing: { opening: '7:00 AM', closing: '7:00 PM', workingDays: 'Monday – Sunday', weekend: '', special: '', slotDuration: '1 hour' },
    ctaText: 'Book Training',
    ctaLink: '/pages/booking.html',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    galleryCategory: '',
    placeId: '',
    landmark: '',
    establishedLabel: '',
    pageTitle: '',
    sections: []
  };
}

function lines(list) {
  return (list || []).map((item) => (typeof item === 'string' ? item : '')).join('\n');
}

function highlightLines(list) {
  return (list || []).map((item) => [item.title, item.text, item.icon].filter(Boolean).join(' | ')).join('\n');
}

function showEditor(container, row) {
  const isEdit = !!row.branchId;
  const timing = row.timing || {};
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">${isEdit ? 'Edit location' : 'Add location'}</h2>
        <p class="page-header__subtitle">${isEdit ? 'Renaming this centre does not change its booking link.' : 'Bookings will use a fixed branch id for this location.'}</p>
      </div>
      <button class="btn btn--outline" id="backLocations" type="button">Back</button>
    </div>
    <div class="editor-tabs" id="locTabs">
      ${TABS.map(([id, label, icon], index) => `<button type="button" class="btn btn--sm ${index === 0 ? 'btn--primary' : 'btn--outline'}" data-tab="${id}">${uiIcon(icon)}<span>${label}</span></button>`).join('')}
    </div>
    <form id="locForm" class="card"><div class="card__body">
      <div class="editor-panel" data-panel="basic">
        ${section('pin', 'Location details', 'Name and address shown for this branch.', `
          ${field('Branch name', 'name', row.branchName || row.name, true)}
          ${field('Name on the page', 'shortName', row.shortName)}
          ${field('Page link', 'slug', row.slug)}
          ${field('Area', 'area', row.area)}
          ${field('City', 'city', row.city)}
          ${field('State', 'state', row.state)}
          ${field('Pincode', 'pincode', row.pincode)}
          <div class="form-group form-group--full"><label>Address</label><textarea class="form-control" name="address" rows="2" required>${escapeHtml(row.address || '')}</textarea></div>
          ${field('Google Maps link', 'mapsLink', row.mapsLink)}
          ${field('Latitude', 'latitude', row.latitude)}
          ${field('Longitude', 'longitude', row.longitude)}
        `)}
        ${section('phone', 'Contact', 'Phone and WhatsApp numbers for this branch.', `
          ${field('Phone', 'phone', row.phone)}
          ${field('WhatsApp', 'whatsapp', row.whatsapp)}
          <div class="form-group form-group--full"><label>Numbers on the page</label><textarea class="form-control" name="phones" rows="2">${escapeHtml((row.phones || []).join('\n'))}</textarea><p class="form-hint">One number per line.</p></div>
        `)}
        ${section('book', 'Courses', 'Courses listed for this branch. This does not change course prices.', `
          <div class="form-group form-group--full"><label>Courses at this branch</label><textarea class="form-control" name="availableCourses" rows="3">${escapeHtml(lines(row.availableCourses || row.trainingAvailable))}</textarea><p class="form-hint">One course name per line.</p></div>
        `)}
        ${section('eye', 'Visibility', 'Choose where this branch appears.', `
          ${field('Display order', 'displayOrder', row.displayOrder, false, 'number')}
          <div class="form-group"><label class="form-check"><input type="checkbox" name="active" ${row.active !== false ? 'checked' : ''}> Show on the website</label></div>
          <div class="form-group"><label class="form-check"><input type="checkbox" name="featured" ${row.featured ? 'checked' : ''}> Featured branch</label></div>
        `)}
      </div>
      <div class="editor-panel" data-panel="content" hidden>
        ${section('page', 'Hero', 'The first thing visitors see on the location page.', `
          ${field('Page title', 'pageTitle', row.pageTitle)}
          ${field('Small line above the heading', 'heroEyebrow', row.hero && row.hero.eyebrow)}
          ${field('Main heading', 'heroHeading', row.hero && row.hero.h1)}
          <div class="form-group form-group--full"><label>Subtitle</label><textarea class="form-control" name="heroSubtitle" rows="2">${escapeHtml((row.hero && row.hero.subtitle) || '')}</textarea></div>
          <div class="form-group form-group--full"><label>Introduction</label><textarea class="form-control" name="introHtml" rows="3">${escapeHtml(row.introHtml || '')}</textarea></div>
        `)}
        ${section('pin', 'Why this branch', 'A short reason to train at this centre.', `
          ${field('Section heading', 'whyTitle', row.why && row.why.title)}
          <div class="form-group form-group--full"><label>Why train here</label><textarea class="form-control" name="whyBody" rows="4">${escapeHtml((row.why && row.why.body) || '')}</textarea></div>
          <div class="form-group form-group--full"><label>Highlights</label><textarea class="form-control" name="highlights" rows="5">${escapeHtml(highlightLines(row.highlights))}</textarea><p class="form-hint">One per line: Title | Text | icon class</p></div>
          ${field('Landmark', 'landmark', row.landmark)}
          ${field('Opened or established line', 'establishedLabel', row.establishedLabel)}
        `)}
        ${section('book', 'Courses and visitors', 'Lists shown on the page.', `
          <div class="form-group form-group--full"><label>Courses listed on the page</label><textarea class="form-control" name="training" rows="4">${escapeHtml(lines(row.trainingAvailable))}</textarea></div>
          <div class="form-group form-group--full"><label>Who can learn</label><textarea class="form-control" name="whoCanLearn" rows="4">${escapeHtml(lines(row.whoCanLearn))}</textarea></div>
          <div class="form-group form-group--full"><label>How to reach</label><textarea class="form-control" name="howToReach" rows="4">${escapeHtml(lines(row.howToReach))}</textarea></div>
        `)}
        ${section('star', 'Ladies training', 'Optional section for women learners.', `
          ${field('Heading', 'womenTitle', row.women && row.women.title)}
          <div class="form-group form-group--full"><label>Text</label><textarea class="form-control" name="womenBody" rows="3">${escapeHtml((row.women && row.women.body) || '')}</textarea></div>
        `)}
        ${section('link', 'Button', 'The main action on this page.', `
          ${field('Button text', 'ctaText', row.ctaText)}
          ${field('Button link', 'ctaLink', row.ctaLink)}
        `)}
      </div>
      <div class="editor-panel" data-panel="pricing" hidden>
        ${section('pricing', 'Display pricing', 'Fees shown on this location page. Booking still uses the course price.', `
          <div class="form-group form-group--full">
            <div id="priceRows" class="repeat-list"></div>
            <button class="btn btn--sm btn--outline" id="addPrice" type="button">${ICONS.plus}<span>Add fee</span></button>
          </div>
        `)}
      </div>
      <div class="editor-panel" data-panel="timing" hidden>
        ${section('clock', 'Visitor timing', 'Hours shown on this page. Booking time slots stay the same.', `
          ${field('Opens', 'opening', timing.opening)}
          ${field('Closes', 'closing', timing.closing)}
          ${field('Open days', 'workingDays', timing.workingDays)}
          ${field('Weekend hours', 'weekend', timing.weekend)}
          ${field('Extra hours note', 'special', timing.special)}
          ${field('Session length label', 'slotDuration', timing.slotDuration)}
        `)}
      </div>
      <div class="editor-panel" data-panel="faqs" hidden>
        ${section('faq', 'FAQs', 'Questions visitors see on this location page.', `
          <div class="form-group form-group--full">
            <div id="faqRows" class="repeat-list"></div>
            <button class="btn btn--sm btn--outline" id="addFaq" type="button">${ICONS.plus}<span>Add FAQ</span></button>
          </div>
        `)}
      </div>
      <div class="editor-panel" data-panel="seo" hidden>
        ${section('search', 'Search listing', 'Title and description used by search engines.', `
          ${field('Search title', 'seoTitle', row.seo && row.seo.title)}
          <div class="form-group form-group--full"><label>Search description</label><textarea class="form-control" name="seoDescription" rows="3">${escapeHtml((row.seo && row.seo.description) || '')}</textarea></div>
          ${field('Search keywords', 'seoKeywords', (row.seo && row.seo.keywords || []).join(', '))}
        `)}
        ${section('link', 'Link preview', 'Title, description, and image when the page is shared.', `
          ${field('Share title', 'ogTitle', row.ogTitle)}
          <div class="form-group form-group--full"><label>Share description</label><textarea class="form-control" name="ogDescription" rows="2">${escapeHtml(row.ogDescription || '')}</textarea></div>
          ${field('Share image link', 'ogImage', row.ogImage)}
        `)}
      </div>
      <div class="editor-panel" data-panel="settings" hidden>
        ${section('image', 'Gallery', 'Photos for this branch come from the matching gallery album.', `
          ${field('Gallery album', 'galleryCategory', row.galleryCategory)}
          ${field('Google Place ID', 'placeId', row.placeId)}
        `)}
        ${section('settings', 'Page sections', 'Turn sections on or off and set their order. Hidden sections stay saved.', `
          <div class="form-group form-group--full"><div id="sectionRows" class="repeat-list"></div></div>
        `)}
      </div>
      <div class="form-actions">
        <button class="btn btn--primary" id="saveLocation" type="button">${isEdit ? 'Save location' : 'Create location'}</button>
        <button class="btn btn--outline" id="cancelLocation" type="button">Cancel</button>
      </div>
    </div></form>`;

  paintPrices(row.pricing || []);
  paintFaqs(row.faqs || []);
  paintSections(row.sections || []);
  document.getElementById('addPrice').addEventListener('click', () => {
    document.getElementById('priceRows').insertAdjacentHTML('beforeend', priceRow({}));
  });
  document.getElementById('addFaq').addEventListener('click', () => {
    document.getElementById('faqRows').insertAdjacentHTML('beforeend', faqRow({}));
  });
  container.addEventListener('click', (event) => {
    if (event.target.matches('[data-remove]')) event.target.closest('.repeat-row')?.remove();
  });
  document.getElementById('locTabs').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-tab]');
    if (!btn) return;
    document.querySelectorAll('#locTabs [data-tab]').forEach((el) => {
      el.classList.toggle('btn--primary', el === btn);
      el.classList.toggle('btn--outline', el !== btn);
    });
    document.querySelectorAll('.editor-panel').forEach((panel) => {
      panel.hidden = panel.dataset.panel !== btn.dataset.tab;
    });
  });
  document.getElementById('backLocations').addEventListener('click', () => loadList(container));
  document.getElementById('cancelLocation').addEventListener('click', () => loadList(container));
  document.getElementById('saveLocation').addEventListener('click', () => save(container, row));
}

function field(label, name, value, required, type) {
  return `<div class="form-group"><label>${label}${required ? ' <span class="required">*</span>' : ''}</label><input class="form-control" name="${name}" ${type ? `type="${type}"` : ''} ${required ? 'required' : ''} value="${escapeHtml(value ?? '')}"></div>`;
}

function section(icon, title, hint, inner) {
  return `<section class="form-section">
    <h3 class="form-section__title">${uiIcon(icon)}<span>${escapeHtml(title)}</span></h3>
    ${hint ? `<p class="form-section__hint">${escapeHtml(hint)}</p>` : ''}
    <div class="form-grid">${inner}</div>
  </section>`;
}

function priceRow(item) {
  return `<div class="repeat-row repeat-row--price">
    <input class="form-control" data-k="name" placeholder="Course" value="${escapeHtml(item.name || '')}">
    <input class="form-control" data-k="price" placeholder="Price" value="${escapeHtml(item.price ?? '')}">
    <input class="form-control" data-k="offerPrice" placeholder="Offer" value="${escapeHtml(item.offerPrice ?? '')}">
    <input class="form-control" data-k="duration" placeholder="Duration" value="${escapeHtml(item.duration || '')}">
    <input class="form-control" data-k="sessions" placeholder="Sessions" value="${escapeHtml(item.sessions ?? '')}">
    <input class="form-control" data-k="displayOrder" type="number" placeholder="Order" value="${escapeHtml(item.displayOrder ?? '')}">
    <label class="form-check"><input type="checkbox" data-k="active" ${item.active !== false ? 'checked' : ''}> Show</label>
    <button class="btn btn--sm btn--danger" type="button" data-remove>Remove</button>
  </div>`;
}

function faqRow(item) {
  return `<div class="repeat-row repeat-row--faq">
    <input class="form-control" data-k="q" placeholder="Question" value="${escapeHtml(item.q || '')}">
    <input class="form-control" data-k="a" placeholder="Answer" value="${escapeHtml(item.a || '')}">
    <button class="btn btn--sm btn--danger" type="button" data-remove>Remove</button>
  </div>`;
}

function sectionRow(item) {
  return `<div class="repeat-row repeat-row--faq">
    <strong>${escapeHtml(SECTION_LABELS[item.key] || item.key)}</strong>
    <input class="form-control" data-k="heading" placeholder="Heading" value="${escapeHtml(item.heading || '')}">
    <input class="form-control" data-k="order" type="number" value="${escapeHtml(item.order ?? '')}">
    <label class="form-check"><input type="checkbox" data-k="enabled" ${item.enabled !== false ? 'checked' : ''}> Show on page</label>
    <input type="hidden" data-k="key" value="${escapeHtml(item.key)}">
    <input type="hidden" data-k="subheading" value="${escapeHtml(item.subheading || '')}">
  </div>`;
}

function paintPrices(list) { document.getElementById('priceRows').innerHTML = (list.length ? list : [{}]).map(priceRow).join(''); }
function paintFaqs(list) { document.getElementById('faqRows').innerHTML = (list.length ? list : [{}]).map(faqRow).join(''); }
function paintSections(list) { document.getElementById('sectionRows').innerHTML = list.map(sectionRow).join(''); }

function splitLines(value) {
  return String(value || '').split('\n').map((line) => line.trim()).filter(Boolean);
}

function readRepeat(id, keys) {
  return Array.from(document.querySelectorAll(`#${id} .repeat-row`)).map((row, index) => {
    const item = {};
    keys.forEach((key) => {
      const el = row.querySelector(`[data-k="${key}"]`);
      if (!el) return;
      item[key] = el.type === 'checkbox' ? el.checked : el.value;
    });
    if (!item.displayOrder) item.displayOrder = index + 1;
    return item;
  }).filter((item) => item.name || item.q || item.key);
}

async function save(container, row) {
  const form = document.getElementById('locForm');
  if (!form.reportValidity()) return;
  const fd = new FormData(form);
  const val = (name) => String(fd.get(name) || '').trim();
  const highlights = splitLines(val('highlights')).map((line) => {
    const [title, text, icon] = line.split('|').map((part) => part.trim());
    return { title, text: text || '', icon: icon || 'fa-solid fa-check' };
  });
  const body = {
    name: val('name'),
    shortName: val('shortName'),
    slug: val('slug'),
    area: val('area'),
    address: val('address'),
    city: val('city'),
    state: val('state'),
    pincode: val('pincode'),
    mapsLink: val('mapsLink'),
    latitude: val('latitude'),
    longitude: val('longitude'),
    phone: val('phone'),
    whatsapp: val('whatsapp'),
    phones: splitLines(val('phones')),
    availableCourses: splitLines(val('availableCourses')),
    active: form.querySelector('[name="active"]').checked,
    featured: form.querySelector('[name="featured"]').checked,
    displayOrder: Number(val('displayOrder') || 0),
    pageTitle: val('pageTitle'),
    heroEyebrow: val('heroEyebrow'),
    heroHeading: val('heroHeading'),
    heroSubtitle: val('heroSubtitle'),
    introHtml: val('introHtml'),
    whyTitle: val('whyTitle'),
    whyBody: val('whyBody'),
    highlights,
    training: splitLines(val('training')),
    whoCanLearn: splitLines(val('whoCanLearn')),
    howToReach: splitLines(val('howToReach')),
    landmark: val('landmark'),
    establishedLabel: val('establishedLabel'),
    womenTitle: val('womenTitle'),
    womenBody: val('womenBody'),
    ctaText: val('ctaText'),
    ctaLink: val('ctaLink'),
    faqs: readRepeat('faqRows', ['q', 'a']),
    pricing: readRepeat('priceRows', ['name', 'price', 'offerPrice', 'duration', 'sessions', 'displayOrder', 'active']),
    timing: {
      opening: val('opening'),
      closing: val('closing'),
      workingDays: val('workingDays'),
      weekend: val('weekend'),
      special: val('special'),
      slotDuration: val('slotDuration')
    },
    seoTitle: val('seoTitle'),
    seoDescription: val('seoDescription'),
    seoKeywords: val('seoKeywords'),
    ogTitle: val('ogTitle'),
    ogDescription: val('ogDescription'),
    ogImage: val('ogImage'),
    galleryCategory: val('galleryCategory'),
    placeId: val('placeId'),
    sections: readRepeat('sectionRows', ['key', 'heading', 'subheading', 'order', 'enabled']).map((item) => ({
      ...item,
      enabled: item.enabled !== false && item.enabled !== 'false',
      order: Number(item.order || 0)
    }))
  };
  const btn = document.getElementById('saveLocation');
  btn.disabled = true;
  try {
    if (row.branchId) await api(`/admin/locations/${row.branchId}`, { method: 'PUT', json: body });
    else await api('/admin/locations', { method: 'POST', json: body });
    toast('Location saved', 'success');
    await loadList(container);
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function toggle(container, row) {
  try {
    await api(`/admin/locations/${row.branchId}`, { method: 'PUT', json: { active: row.active === false } });
    toast(row.active === false ? 'Location enabled' : 'Location disabled', 'success');
    await loadList(container);
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function remove(container, row) {
  const ok = await confirm(`Delete or deactivate "${row.shortName || row.branchName}"? Bookings keep this branch id.`);
  if (!ok) return;
  try {
    const res = await api(`/admin/locations/${row.branchId}`, { method: 'DELETE' });
    toast(res.message || 'Updated', 'success');
    await loadList(container);
  } catch (err) {
    toast(err.message, 'error');
  }
}
