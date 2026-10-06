import { api, toast, confirm, escapeHtml, addBtn, uiIcon, ICONS } from '../admin.js';
import { imageFieldHtml, bindImageFields } from '../imageField.js';

const TYPES = [
  ['hero', 'Hero'],
  ['description', 'Description'],
  ['bullets', 'Bullet list'],
  ['features', 'Features'],
  ['benefits', 'Benefits'],
  ['pricing', 'Pricing'],
  ['timing', 'Timing'],
  ['faq', 'Questions'],
  ['cta', 'Button']
];
let rows = [];

export default async function render(container) {
  container.innerHTML = '<div class="loading"><div class="loading__spinner"></div> Loading special pages…</div>';
  await load(container);
}

async function load(container) {
  const { data } = await api('/admin/special-pages');
  rows = data || [];
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">Special Pages</h2>
        <p class="page-header__subtitle">Create an offer page. Publishing it adds the page to the website menu.</p>
      </div>
      ${addBtn('Add special page', 'addSpecialBtn')}
    </div>
    <div class="card"><div class="card__body" style="padding:0;">
      ${rows.length ? `<div class="table-wrap table-responsive"><table class="data-table"><thead><tr>
        <th>Page</th><th>Status</th><th>Order</th><th>Actions</th>
      </tr></thead><tbody>
      ${rows.map((row) => `<tr data-id="${escapeHtml(row.id)}">
        <td><strong>${escapeHtml(row.name)}</strong><br><small>/special/${escapeHtml(row.slug)}</small></td>
        <td>${row.published && row.active !== false ? '<span class="badge badge--active">Published</span>' : '<span class="badge badge--inactive">Draft</span>'}</td>
        <td>${escapeHtml(row.displayOrder)}</td>
        <td><div class="table-actions">
          ${row.published && row.active !== false ? `<a class="btn btn--sm btn--outline" href="/special/${escapeHtml(row.slug)}" target="_blank" rel="noopener">${uiIcon('eye')}<span>Preview</span></a>` : ''}
          <button class="btn btn--sm btn--outline" data-action="edit" type="button">${ICONS.edit}<span>Edit</span></button>
          <button class="btn btn--sm btn--danger" data-action="delete" type="button">${ICONS.delete}<span>Delete</span></button>
        </div></td>
      </tr>`).join('')}
      </tbody></table></div>` : `<div class="empty-state"><div class="empty-state__icon">${uiIcon('spark')}</div><div class="empty-state__title">No special pages yet</div><p class="empty-state__text">Add an offer page when you want a new public link.</p></div>`}
    </div></div>`;
  document.getElementById('addSpecialBtn')?.addEventListener('click', () => editor(container, null));
  container.querySelectorAll('tbody tr').forEach((tr) => {
    const row = rows.find((item) => item.id === tr.dataset.id);
    tr.querySelector('[data-action="edit"]')?.addEventListener('click', () => editor(container, row));
    tr.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      if (!(await confirm(`Delete “${row.name}”?`))) return;
      await api(`/admin/special-pages/${row.id}`, { method: 'DELETE' });
      toast('Special page deleted', 'success');
      await load(container);
    });
  });
}

function field(label, name, value, type) {
  return `<div class="form-group"><label>${label}</label><input class="form-control" name="${name}" ${type ? `type="${type}"` : ''} value="${escapeHtml(value ?? '')}"></div>`;
}

function block(icon, title, hint, inner) {
  return `<section class="form-section form-group--full">
    <h3 class="form-section__title">${uiIcon(icon)}<span>${escapeHtml(title)}</span></h3>
    ${hint ? `<p class="form-section__hint">${escapeHtml(hint)}</p>` : ''}
    <div class="form-grid">${inner}</div>
  </section>`;
}

function editor(container, row) {
  const page = row || {
    name: '', menuLabel: '', slug: '', active: true, published: false, displayOrder: rows.length + 1,
    seoTitle: '', seoDescription: '', ogTitle: '', ogDescription: '', ogImage: '',
    heroHeading: '', heroSubheading: '', heroDescription: '', heroImage: '',
    ctaText: 'Book Now', ctaLink: '/pages/booking.html', price: '', originalPrice: '', offerText: '',
    timingText: '', daysText: '', sections: []
  };
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">${row ? 'Edit special page' : 'New special page'}</h2>
        <p class="page-header__subtitle">Fill in the offer, then publish it when it should appear on the site.</p>
      </div>
      <div class="form-actions">
        ${page.slug && page.published && page.active !== false ? `<a class="btn btn--outline" href="/special/${escapeHtml(page.slug)}" target="_blank" rel="noopener">${uiIcon('eye')}<span>Preview</span></a>` : ''}
        <button class="btn btn--outline" id="backSpecials" type="button">Back</button>
      </div>
    </div>
    <form id="specialForm" class="card"><div class="card__body">
      ${block('spark', 'Special page', 'Name and link for this offer.', `
        ${field('Page name', 'name', page.name)}
        ${field('Menu label', 'menuLabel', page.menuLabel)}
        ${field('Page link', 'slug', page.slug)}
        ${field('Display order', 'displayOrder', page.displayOrder, 'number')}
      `)}
      ${block('image', 'Hero', 'The opening of the page.', `
        ${field('Heading', 'heroHeading', page.heroHeading)}
        ${field('Subheading', 'heroSubheading', page.heroSubheading)}
        <div class="form-group form-group--full"><label>Description</label><textarea class="form-control" name="heroDescription" rows="3">${escapeHtml(page.heroDescription || '')}</textarea></div>
        ${imageFieldHtml({ name: 'heroImage', label: 'Hero image', value: page.heroImage, category: 'pages' })}
      `)}
      ${block('tag', 'Offer and pricing', 'The price visitors see on this page.', `
        ${field('Offer price', 'price', page.price)}
        ${field('Original price', 'originalPrice', page.originalPrice)}
        ${field('Offer text', 'offerText', page.offerText)}
      `)}
      ${block('clock', 'Timing', 'When this offer is available.', `
        ${field('Hours', 'timingText', page.timingText)}
        ${field('Days', 'daysText', page.daysText)}
      `)}
      ${block('link', 'Call to action', 'The button on this page.', `
        ${field('Button text', 'ctaText', page.ctaText)}
        ${field('Button link', 'ctaLink', page.ctaLink)}
      `)}
      ${block('page', 'Content sections', 'Show, hide, or reorder the blocks on the page.', `
        <div class="form-group form-group--full">
          <div id="specialSections" class="repeat-list"></div>
          <button class="btn btn--sm btn--outline" id="addSection" type="button">${ICONS.plus}<span>Add section</span></button>
        </div>
      `)}
      ${block('search', 'Search listing', 'How this page appears in search results.', `
        ${field('Search title', 'seoTitle', page.seoTitle)}
        <div class="form-group form-group--full"><label>Search description</label><textarea class="form-control" name="seoDescription" rows="2">${escapeHtml(page.seoDescription || '')}</textarea></div>
        ${field('Share title', 'ogTitle', page.ogTitle)}
        ${field('Share description', 'ogDescription', page.ogDescription)}
        ${imageFieldHtml({ name: 'ogImage', label: 'Share image', value: page.ogImage, category: 'pages' })}
      `)}
      ${block('check', 'Publishing', 'A published page is public and can appear in the menu.', `
        <div class="form-group"><label class="form-check"><input type="checkbox" name="active" ${page.active !== false ? 'checked' : ''}> Visible</label></div>
        <div class="form-group"><label class="form-check"><input type="checkbox" name="published" ${page.published ? 'checked' : ''}> Published</label></div>
      `)}
      <div class="form-actions">
        <button class="btn btn--primary" id="saveSpecial" type="button">Save page</button>
        <button class="btn btn--outline" id="cancelSpecial" type="button">Cancel</button>
      </div>
    </div></form>`;
  const mount = document.getElementById('specialSections');
  (page.sections || []).forEach((section) => mount.insertAdjacentHTML('beforeend', sectionEditor(section)));
  document.getElementById('addSection').addEventListener('click', () => {
    mount.insertAdjacentHTML('beforeend', sectionEditor({ key: 'bullets', type: 'bullets', enabled: true, order: mount.children.length + 1, heading: '', items: [] }));
  });
  mount.addEventListener('click', (event) => {
    if (event.target.matches('[data-remove]')) event.target.closest('.card')?.remove();
  });
  bindImageFields(container);
  document.getElementById('backSpecials').addEventListener('click', () => load(container));
  document.getElementById('cancelSpecial').addEventListener('click', () => load(container));
  document.getElementById('saveSpecial').addEventListener('click', () => save(container, page));
}

function sectionEditor(section) {
  const items = (section.items || []).map((item) => `${item.title || ''}|${item.text || ''}`).join('\n');
  return `<div class="card" style="padding:0.75rem">
    <div class="form-grid">
      <div class="form-group"><label>Section type</label><select class="form-control" data-k="type">${TYPES.map(([type, label]) => `<option value="${type}" ${(section.type || section.key) === type ? 'selected' : ''}>${label}</option>`).join('')}</select></div>
      <div class="form-group"><label>Order</label><input class="form-control" data-k="order" type="number" value="${escapeHtml(section.order ?? 0)}"></div>
      <div class="form-group"><label class="form-check"><input type="checkbox" data-k="enabled" ${section.enabled !== false ? 'checked' : ''}> Show this section</label></div>
      <div class="form-group"><label>Heading</label><input class="form-control" data-k="heading" value="${escapeHtml(section.heading || '')}"></div>
      <div class="form-group"><label>Subheading</label><input class="form-control" data-k="subheading" value="${escapeHtml(section.subheading || '')}"></div>
      <div class="form-group form-group--full"><label>Items</label><textarea class="form-control" data-k="items" rows="3" placeholder="Title | Text">${escapeHtml(items)}</textarea><p class="form-hint">One item per line: Title | Text</p></div>
      <div class="form-group"><button class="btn btn--sm btn--danger" type="button" data-remove>Remove section</button></div>
    </div>
  </div>`;
}

async function save(container, page) {
  const form = document.getElementById('specialForm');
  const fd = new FormData(form);
  const val = (name) => String(fd.get(name) || '').trim();
  const sections = Array.from(document.querySelectorAll('#specialSections .card')).map((card, index) => {
    const read = (key) => card.querySelector(`[data-k="${key}"]`);
    const type = read('type').value;
    return {
      key: `${type}-${index + 1}`,
      type,
      enabled: read('enabled').checked,
      order: Number(read('order').value || index + 1),
      heading: read('heading').value,
      subheading: read('subheading').value,
      items: String(read('items').value || '').split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
        const [title, text] = line.split('|');
        return { title: (title || '').trim(), text: (text || '').trim() };
      })
    };
  });
  const body = {
    name: val('name'),
    menuLabel: val('menuLabel'),
    slug: val('slug'),
    displayOrder: Number(val('displayOrder') || 0),
    active: form.querySelector('[name="active"]').checked,
    published: form.querySelector('[name="published"]').checked,
    heroHeading: val('heroHeading'),
    heroSubheading: val('heroSubheading'),
    heroDescription: val('heroDescription'),
    heroImage: val('heroImage'),
    price: val('price'),
    originalPrice: val('originalPrice'),
    offerText: val('offerText'),
    timingText: val('timingText'),
    daysText: val('daysText'),
    ctaText: val('ctaText'),
    ctaLink: val('ctaLink'),
    seoTitle: val('seoTitle'),
    seoDescription: val('seoDescription'),
    ogTitle: val('ogTitle'),
    ogDescription: val('ogDescription'),
    ogImage: val('ogImage'),
    sections
  };
  try {
    if (page.id) await api(`/admin/special-pages/${page.id}`, { method: 'PUT', json: body });
    else await api('/admin/special-pages', { method: 'POST', json: body });
    toast('Special page saved', 'success');
    await load(container);
  } catch (err) {
    toast(err.message, 'error');
  }
}
