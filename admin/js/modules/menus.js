import { api, toast, confirm, openModal, closeModal, escapeHtml, addBtn, uiIcon, ICONS } from '../admin.js';

let rows = [];

function groupLabel(group) {
  return group === 'courses-dropdown' ? 'Courses menu' : 'Header';
}

function typeLabel(type) {
  if (type === 'dropdown') return 'Opens a menu';
  if (type === 'special') return 'Special page';
  return 'Normal link';
}

export default async function render(container) {
  container.innerHTML = '<div class="loading"><div class="loading__spinner"></div> Loading menu…</div>';
  await load(container);
}

async function load(container) {
  const { data } = await api('/admin/frontend-menus');
  rows = data || [];
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">Website Menu</h2>
        <p class="page-header__subtitle">Choose the links in the site header. Hidden items stay saved and drop out of the menu.</p>
      </div>
      ${addBtn('Add menu item', 'addMenuBtn')}
    </div>
    <div class="card"><div class="card__body" style="padding:0;">
      <div class="table-wrap table-responsive"><table class="data-table"><thead><tr>
        <th>Menu item</th><th>Visibility</th><th>Order</th><th>Link</th><th>Actions</th>
      </tr></thead><tbody>
      ${rows.map((row) => `<tr data-id="${escapeHtml(row.id)}">
        <td><strong>${escapeHtml(row.label)}</strong><br><small>${uiIcon(row.menuGroup === 'courses-dropdown' ? 'book' : 'menu')}<span>${escapeHtml(groupLabel(row.menuGroup))}</span>${row.isExternal ? ` · ${escapeHtml('External')}` : ''}</small></td>
        <td>${row.active !== false ? '<span class="badge badge--active">Shown</span>' : '<span class="badge badge--inactive">Hidden</span>'}</td>
        <td>${escapeHtml(row.displayOrder)}</td>
        <td><small>${escapeHtml(row.href)}</small></td>
        <td><div class="table-actions">
          <button class="btn btn--sm btn--outline" data-action="toggle" type="button" title="${row.active !== false ? 'Hide' : 'Show'}">${ICONS.toggle}<span>${row.active !== false ? 'Hide' : 'Show'}</span></button>
          <button class="btn btn--sm btn--outline" data-action="edit" type="button" title="Edit">${ICONS.edit}<span>Edit</span></button>
          <button class="btn btn--sm btn--danger" data-action="delete" type="button" title="Delete">${ICONS.delete}<span>Delete</span></button>
        </div></td>
      </tr>`).join('')}
      </tbody></table></div>
    </div></div>`;
  document.getElementById('addMenuBtn')?.addEventListener('click', () => form(container, null));
  container.querySelectorAll('tbody tr').forEach((tr) => {
    const row = rows.find((item) => item.id === tr.dataset.id);
    tr.querySelector('[data-action="edit"]')?.addEventListener('click', () => form(container, row));
    tr.querySelector('[data-action="toggle"]')?.addEventListener('click', async () => {
      await api(`/admin/frontend-menus/${row.id}`, { method: 'PUT', json: { ...row, active: row.active === false } });
      toast(row.active === false ? 'Menu shown' : 'Menu hidden', 'success');
      await load(container);
    });
    tr.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      if (!(await confirm(`Delete menu “${row.label}”?`))) return;
      await api(`/admin/frontend-menus/${row.id}`, { method: 'DELETE' });
      toast('Menu deleted', 'success');
      await load(container);
    });
  });
}

function form(container, row) {
  const isEdit = !!row;
  openModal({
    title: isEdit ? 'Edit menu item' : 'Add menu item',
    size: 'lg',
    body: `<form id="menuForm">
      <section class="form-section">
        <h3 class="form-section__title">${uiIcon('menu')}<span>Menu item</span></h3>
        <p class="form-section__hint">The label visitors see in the header.</p>
        <div class="form-grid">
          <div class="form-group"><label>Label</label><input class="form-control" name="label" required value="${escapeHtml(row?.label || '')}"></div>
          <div class="form-group"><label>Link</label><input class="form-control" name="href" value="${escapeHtml(row?.href || '/')}"></div>
          <div class="form-group"><label>Where it appears</label>
            <select class="form-control" name="menuGroup">
              <option value="header" ${row?.menuGroup !== 'courses-dropdown' ? 'selected' : ''}>Header</option>
              <option value="courses-dropdown" ${row?.menuGroup === 'courses-dropdown' ? 'selected' : ''}>Courses menu</option>
            </select>
          </div>
          <div class="form-group"><label>Link type</label>
            <select class="form-control" name="pageType">
              ${['link', 'dropdown', 'special'].map((type) => `<option value="${type}" ${(row?.pageType || 'link') === type ? 'selected' : ''}>${typeLabel(type)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Special page link name</label><input class="form-control" name="specialSlug" value="${escapeHtml(row?.specialSlug || '')}" placeholder="poojas-special"></div>
          <div class="form-group"><label>Display order</label><input class="form-control" name="displayOrder" type="number" value="${escapeHtml(row?.displayOrder ?? 0)}"></div>
        </div>
      </section>
      <section class="form-section">
        <h3 class="form-section__title">${uiIcon('eye')}<span>Visibility</span></h3>
        <div class="form-grid">
          <div class="form-group"><label class="form-check"><input type="checkbox" name="active" ${row?.active !== false ? 'checked' : ''}> Show in the menu</label></div>
          <div class="form-group"><label class="form-check"><input type="checkbox" name="isExternal" ${row?.isExternal ? 'checked' : ''}> External link</label></div>
          <div class="form-group"><label class="form-check"><input type="checkbox" name="openNewTab" ${row?.openNewTab ? 'checked' : ''}> Open in a new tab</label></div>
        </div>
      </section>
    </form>`,
    footer: `<button class="btn btn--outline" id="cancelMenu" type="button">Cancel</button><button class="btn btn--primary" id="saveMenu" type="button">Save</button>`
  });
  document.getElementById('cancelMenu').addEventListener('click', closeModal);
  document.getElementById('saveMenu').addEventListener('click', async () => {
    const formEl = document.getElementById('menuForm');
    if (!formEl.reportValidity()) return;
    const fd = new FormData(formEl);
    const body = {
      label: fd.get('label'),
      href: fd.get('href'),
      menuGroup: fd.get('menuGroup'),
      pageType: fd.get('pageType'),
      specialSlug: fd.get('specialSlug'),
      displayOrder: Number(fd.get('displayOrder') || 0),
      active: formEl.querySelector('[name="active"]').checked,
      isExternal: formEl.querySelector('[name="isExternal"]').checked,
      openNewTab: formEl.querySelector('[name="openNewTab"]').checked
    };
    try {
      if (isEdit) await api(`/admin/frontend-menus/${row.id}`, { method: 'PUT', json: body });
      else await api('/admin/frontend-menus', { method: 'POST', json: body });
      closeModal();
      toast('Menu saved', 'success');
      await load(container);
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}
