import {
  api, toast, confirm, openModal, closeModal,
  escapeHtml, statusBadge,
  iconBtn, addBtn
} from '../admin.js';
import { richTextField, titleBoldToggle, syncRichText, validateRichText, bindRichText } from '../richtext.js';

function strip(html) {
  return (window.SeekhoSanitize && window.SeekhoSanitize.stripHtml)
    ? window.SeekhoSanitize.stripHtml(html)
    : String(html || '').replace(/<[^>]+>/g, ' ').trim();
}

export default async function render(container) {
  container.innerHTML = '<div class="loading"><div class="loading__spinner"></div> Loading Why Choose…</div>';
  try {
    const { data, limits } = await api('/admin/why-choose');
    paint(container, data.section, data.items || [], limits || { titleMax: 40, descriptionMax: 120 });
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__title">Error</div><p class="empty-state__text">${escapeHtml(err.message)}</p></div>`;
  }
}

function paint(container, section, items, limits) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">Why Choose Seekho</h2>
        <p class="page-header__subtitle">Section heading from home_sections; items from the why_choose sheet</p>
      </div>
      ${addBtn('Add item', 'addWhyItemBtn')}
    </div>

    <div class="card" style="margin-bottom:1.25rem">
      <div class="card__header"><h3 class="card__title">Section heading</h3></div>
      <div class="card__body">
        <form id="whySectionForm">
          <div class="form-grid">
            <div class="form-group form-group--full">
              <label>Eyebrow / subheading</label>
              ${richTextField({ name: 'subtitle', value: section?.subtitle || '', minHeight: '56px' })}
            </div>
            <div class="form-group form-group--full">
              <label>Heading</label>
              ${richTextField({ name: 'title', value: section?.title || '', required: true, minHeight: '72px' })}
              ${titleBoldToggle({ checked: !!section?.title_bold, label: 'Bold heading (if using plain title)' })}
            </div>
            <div class="form-group form-group--full">
              <label>Short description</label>
              ${richTextField({ name: 'description', value: section?.description || '', required: true, minHeight: '90px' })}
              <p class="char-count" id="whySectionDescCount"></p>
            </div>
            <div class="form-group">
              <label class="form-check"><input type="checkbox" name="is_active" ${section?.is_active !== false ? 'checked' : ''}> Show on home page</label>
            </div>
          </div>
          <button type="submit" class="btn btn--primary" style="margin-top:1rem">Save heading</button>
        </form>
      </div>
    </div>

    <div class="card">
      <div class="card__body" style="padding:0">
        ${items.length ? itemsTable(items) : `<div class="empty-state"><div class="empty-state__title">No items</div><p class="empty-state__text">Add reasons visitors should choose Seekho.</p></div>`}
      </div>
    </div>
  `;

  bindRichText(container);
  bindSectionForm(container, limits);
  document.getElementById('addWhyItemBtn')?.addEventListener('click', () => showItemForm(null, container, items, limits));
  bindItemEvents(container, items, limits);
  updateSectionDescCount(limits);
  container.querySelectorAll('#whySectionForm [data-richtext] .richtext__editor').forEach((ed) => {
    ed.addEventListener('input', () => updateSectionDescCount(limits));
  });
}

function itemsTable(items) {
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
  return `
    <div class="table-wrap table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Icon</th>
            <th>Title</th>
            <th>Slug</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map((item, idx) => `
            <tr data-id="${escapeHtml(item.id)}">
              <td>${item.sort_order}</td>
              <td><code style="font-size:0.75rem">${escapeHtml(item.icon || '—')}</code></td>
              <td><strong>${escapeHtml(strip(item.title))}</strong><br><small style="color:var(--text-muted)">${escapeHtml(strip(item.description).slice(0, 48))}</small></td>
              <td>${item.link_slug ? `<code>/p/${escapeHtml(item.link_slug)}</code>` : '—'}</td>
              <td>${item.is_active !== false ? statusBadge('active') : statusBadge('inactive')}</td>
              <td>
                <div class="table-actions">
                  <button type="button" class="btn btn--outline btn--sm" data-move="up" ${idx === 0 ? 'disabled' : ''}>Up</button>
                  <button type="button" class="btn btn--outline btn--sm" data-move="down" ${idx === sorted.length - 1 ? 'disabled' : ''}>Down</button>
                  ${iconBtn('edit', 'Edit')}
                  ${iconBtn('toggle', item.is_active !== false ? 'Deactivate' : 'Activate')}
                  ${iconBtn('delete', 'Delete')}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function updateSectionDescCount(limits) {
  const form = document.getElementById('whySectionForm');
  const el = document.getElementById('whySectionDescCount');
  if (!form || !el) return;
  syncRichText(form);
  const n = strip(form.description.value).length;
  el.textContent = `${n} / ${limits.descriptionMax} characters`;
  el.classList.toggle('char-count--over', n > limits.descriptionMax);
}

function bindSectionForm(container, limits) {
  document.getElementById('whySectionForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    syncRichText(form);
    if (!validateRichText(form)) {
      toast('Heading and short description are required.', 'warning');
      return;
    }
    if (strip(form.description.value).length > limits.descriptionMax) {
      toast(`Short description must be at most ${limits.descriptionMax} characters.`, 'error');
      return;
    }
    const fd = new FormData();
    fd.set('title', form.title.value);
    fd.set('subtitle', form.subtitle.value);
    fd.set('description', form.description.value);
    fd.set('is_active', form.querySelector('[name="is_active"]').checked ? 'true' : 'false');
    fd.set('title_bold', form.querySelector('[name="title_bold"]').checked ? 'true' : 'false');
    try {
      await api('/admin/home-sections/why_choose', { method: 'PUT', formData: fd });
      toast('Section heading saved', 'success');
      await render(container);
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

function bindItemEvents(container, items, limits) {
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
  container.querySelectorAll('tbody tr[data-id]').forEach((row) => {
    const id = row.dataset.id;
    const item = items.find((p) => p.id === id);
    row.querySelector('[data-action="edit"]')?.addEventListener('click', () => showItemForm(item, container, items, limits));
    row.querySelector('[data-action="toggle"]')?.addEventListener('click', async () => {
      try {
        await api(`/admin/why-choose/${id}`, { method: 'PUT', json: { is_active: item.is_active !== false ? false : true } });
        toast(item.is_active !== false ? 'Item deactivated' : 'Item activated', 'success');
        await render(container);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
    row.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      const ok = await confirm(`Delete “${strip(item.title)}”?`);
      if (!ok) return;
      try {
        await api(`/admin/why-choose/${id}`, { method: 'DELETE' });
        toast('Item deleted', 'success');
        await render(container);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
    row.querySelectorAll('[data-move]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const dir = e.currentTarget.dataset.move === 'up' ? -1 : 1;
        const i = sorted.findIndex((x) => x.id === id);
        const j = i + dir;
        if (j < 0 || j >= sorted.length) return;
        const a = sorted[i];
        const b = sorted[j];
        try {
          await api(`/admin/why-choose/${a.id}`, { method: 'PUT', json: { sort_order: b.sort_order } });
          await api(`/admin/why-choose/${b.id}`, { method: 'PUT', json: { sort_order: a.sort_order } });
          toast('Order updated', 'success');
          await render(container);
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    });
  });
}

function showItemForm(item, container, items, limits) {
  const isEdit = !!item;
  openModal({
    title: isEdit ? 'Edit item' : 'Add item',
    size: 'lg',
    body: `
      <form id="whyItemForm">
        <div class="form-grid">
          <div class="form-group form-group--full">
            <label>Title <span class="required">*</span></label>
            ${richTextField({ name: 'title', value: item?.title || '', required: true, minHeight: '64px' })}
            ${titleBoldToggle({ checked: !!item?.title_bold })}
            <p class="char-count" id="whyTitleCount"></p>
          </div>
          <div class="form-group form-group--full">
            <label>Description <span class="required">*</span></label>
            ${richTextField({ name: 'description', value: item?.description || '', required: true, minHeight: '90px' })}
            <p class="char-count" id="whyDescCount"></p>
          </div>
          <div class="form-group">
            <label>Icon</label>
            <input class="form-control" name="icon" value="${escapeHtml(item?.icon || '')}" placeholder="fa-solid fa-star or 🛵">
            <p class="form-hint">Font Awesome class or an emoji</p>
          </div>
          <div class="form-group">
            <label>Detail page slug (optional)</label>
            <input class="form-control" name="link_slug" value="${escapeHtml(item?.link_slug || '')}" placeholder="e.g. non-cyclists-welcome">
            <p class="form-hint">If set, the card links to /p/slug. Create the page under Detail Pages.</p>
          </div>
          <div class="form-group">
            <label>Display order</label>
            <input class="form-control" type="number" name="sort_order" value="${escapeHtml(String(item?.sort_order ?? items.length + 1))}">
          </div>
          <div class="form-group">
            <label class="form-check"><input type="checkbox" name="is_active" ${item?.is_active !== false ? 'checked' : ''}> Active</label>
          </div>
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn--outline" id="cancelWhyItem">Cancel</button>
      <button class="btn btn--primary" id="saveWhyItem">${isEdit ? 'Update' : 'Create'}</button>
    `
  });

  const form = document.getElementById('whyItemForm');
  const bump = () => {
    syncRichText(form);
    const t = document.getElementById('whyTitleCount');
    const d = document.getElementById('whyDescCount');
    const tn = strip(form.title.value).length;
    const dn = strip(form.description.value).length;
    if (t) {
      t.textContent = `${tn} / ${limits.titleMax} characters`;
      t.classList.toggle('char-count--over', tn > limits.titleMax);
    }
    if (d) {
      d.textContent = `${dn} / ${limits.descriptionMax} characters`;
      d.classList.toggle('char-count--over', dn > limits.descriptionMax);
    }
  };
  form.querySelectorAll('.richtext__editor').forEach((ed) => ed.addEventListener('input', bump));
  bump();

  document.getElementById('cancelWhyItem').addEventListener('click', closeModal);
  document.getElementById('saveWhyItem').addEventListener('click', async () => {
    syncRichText(form);
    if (!validateRichText(form)) {
      toast('Title and description are required.', 'warning');
      return;
    }
    if (strip(form.title.value).length > limits.titleMax) {
      toast(`Title must be at most ${limits.titleMax} characters.`, 'error');
      return;
    }
    if (strip(form.description.value).length > limits.descriptionMax) {
      toast(`Description must be at most ${limits.descriptionMax} characters.`, 'error');
      return;
    }
    const payload = {
      title: form.title.value,
      description: form.description.value,
      icon: form.icon.value.trim(),
      link_slug: form.link_slug.value.trim(),
      sort_order: Number(form.sort_order.value || 0),
      is_active: form.querySelector('[name="is_active"]').checked,
      title_bold: form.querySelector('[name="title_bold"]').checked
    };
    try {
      if (isEdit) await api(`/admin/why-choose/${item.id}`, { method: 'PUT', json: payload });
      else await api('/admin/why-choose', { method: 'POST', json: payload });
      toast(isEdit ? 'Item updated' : 'Item created', 'success');
      closeModal();
      await render(container);
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}
