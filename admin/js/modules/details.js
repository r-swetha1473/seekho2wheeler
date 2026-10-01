import {
  api, toast, confirm, openModal, closeModal,
  escapeHtml, statusBadge, setupImagePreview, imagePreview,
  prepareImageFiles, renderUploadProgress, clearUploadProgress,
  iconBtn, addBtn
} from '../admin.js';
import { richTextField, syncRichText } from '../richtext.js';

let pages = [];

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default async function render(container) {
  container.innerHTML = '<div class="loading"><div class="loading__spinner"></div> Loading detail pages…</div>';
  await loadPages(container);
}

async function loadPages(container) {
  try {
    const { data } = await api('/admin/detail-pages');
    pages = data;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2 class="page-header__title">Detail Pages</h2>
          <p class="page-header__subtitle">Full content for clickable cards. Empty body shows “Details coming soon” on the site — not a 404.</p>
        </div>
        ${addBtn('Add page', 'addDetailPageBtn')}
      </div>

      <div class="card">
        <div class="card__body" style="padding:0;">
          ${pages.length ? pagesTable() : emptyState()}
        </div>
      </div>
    `;

    document.getElementById('addDetailPageBtn')?.addEventListener('click', () => showForm(null, container));
    bindEvents(container);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__title">Error</div><p class="empty-state__text">${escapeHtml(err.message)}</p></div>`;
  }
}

function emptyState() {
  return `<div class="empty-state"><div class="empty-state__icon">📄</div><div class="empty-state__title">No detail pages</div><p class="empty-state__text">Create a page, then set a card’s link slug to match.</p></div>`;
}

function pagesTable() {
  return `
    <div class="table-wrap table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Title</th>
            <th>Slug / URL</th>
            <th>Body</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${pages.map((p) => {
            const preview = window.SeekhoSanitize ? window.SeekhoSanitize.stripHtml(p.body_html || '') : (p.body_html || '');
            return `
            <tr data-id="${escapeHtml(p.id)}">
              <td>${p.hero_image_url ? `<img class="data-table__thumb" src="${escapeHtml(p.hero_image_url)}" alt="" onerror="this.src='/images/placeholder.webp'">` : '—'}</td>
              <td><strong>${escapeHtml(p.title)}</strong></td>
              <td><code style="font-size:0.8rem">/p/${escapeHtml(p.slug)}</code></td>
              <td>${preview ? escapeHtml(preview.slice(0, 60)) + (preview.length > 60 ? '…' : '') : '<em>Coming soon</em>'}</td>
              <td>${p.is_active !== false ? statusBadge('active') : statusBadge('inactive')}</td>
              <td>
                <div class="table-actions">
                  ${iconBtn('edit', 'Edit')}
                  ${iconBtn('toggle', p.is_active !== false ? 'Deactivate' : 'Activate')}
                  ${iconBtn('delete', 'Delete')}
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function bindEvents(container) {
  container.querySelectorAll('tbody tr[data-id]').forEach((row) => {
    const id = row.dataset.id;
    const item = pages.find((p) => p.id === id);

    row.querySelector('[data-action="edit"]')?.addEventListener('click', () => showForm(item, container));
    row.querySelector('[data-action="toggle"]')?.addEventListener('click', async () => {
      try {
        const fd = new FormData();
        fd.append('is_active', item.is_active !== false ? 'false' : 'true');
        await api(`/admin/detail-pages/${id}`, { method: 'PUT', formData: fd });
        toast(item.is_active !== false ? 'Page deactivated' : 'Page activated', 'success');
        await loadPages(container);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
    row.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      const ok = await confirm(`Delete detail page “${item.title}”?`);
      if (!ok) return;
      try {
        await api(`/admin/detail-pages/${id}`, { method: 'DELETE' });
        toast('Page deleted', 'success');
        await loadPages(container);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

function showForm(item, container) {
  const isEdit = !!item;
  openModal({
    title: isEdit ? 'Edit detail page' : 'Add detail page',
    size: 'lg',
    body: `
      <form id="detailPageForm">
        <div class="form-grid">
          <div class="form-group form-group--full">
            <label>Title <span class="required">*</span></label>
            <input class="form-control" name="title" required value="${escapeHtml(item?.title || '')}">
          </div>
          <div class="form-group">
            <label>Slug</label>
            <input class="form-control" name="slug" value="${escapeHtml(item?.slug || '')}" placeholder="auto from title">
            <p class="form-hint">Public URL: /p/your-slug — must be unique</p>
          </div>
          <div class="form-group">
            <label class="form-check"><input type="checkbox" name="is_active" ${item?.is_active !== false ? 'checked' : ''}> Active</label>
          </div>
          <div class="form-group form-group--full">
            <label>SEO title</label>
            <input class="form-control" name="seo_title" value="${escapeHtml(item?.seo_title || '')}">
          </div>
          <div class="form-group form-group--full">
            <label>SEO description</label>
            <textarea class="form-control" name="seo_description" rows="2">${escapeHtml(item?.seo_description || '')}</textarea>
          </div>
          <div class="form-group form-group--full">
            <label>Body (leave empty for “Details coming soon”)</label>
            ${richTextField({ name: 'body_html', value: item?.body_html || '', minHeight: '180px' })}
          </div>
          <div class="form-group form-group--full">
            <label>Hero image</label>
            <input class="form-control" type="file" name="image" accept="image/jpeg,image/png,image/webp,image/gif">
            <p class="form-hint">Max 5MB · Cloudinary URL stored in Sheets</p>
            <div id="detailPagePreview">${item?.hero_image_url ? imagePreview(item.hero_image_url) : ''}</div>
          </div>
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn--outline" id="cancelDetailPage">Cancel</button>
      <button class="btn btn--primary" id="saveDetailPage">${isEdit ? 'Update' : 'Create'}</button>
    `
  });

  const form = document.getElementById('detailPageForm');
  let slugManual = Boolean(item?.slug);
  form.title.addEventListener('input', () => {
    if (slugManual) return;
    form.slug.value = slugify(form.title.value);
  });
  form.slug.addEventListener('input', () => { slugManual = true; });

  setupImagePreview(form.querySelector('[name="image"]'), document.getElementById('detailPagePreview'));
  document.getElementById('cancelDetailPage').addEventListener('click', closeModal);

  document.getElementById('saveDetailPage').addEventListener('click', async () => {
    syncRichText(form);
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const fd = new FormData();
    fd.set('title', form.title.value.trim());
    fd.set('slug', form.slug.value.trim());
    fd.set('seo_title', form.seo_title.value.trim());
    fd.set('seo_description', form.seo_description.value.trim());
    fd.set('body_html', form.body_html.value);
    fd.set('is_active', form.querySelector('[name="is_active"]').checked ? 'true' : 'false');

    const btn = document.getElementById('saveDetailPage');
    btn.disabled = true;
    const progressEl = document.getElementById('detailPagePreview');
    try {
      const fileInput = form.querySelector('[name="image"]');
      if (fileInput?.files?.[0]) {
        const [compressed] = await prepareImageFiles(fileInput.files, { maxWidth: 1600, maxHeight: 900 });
        fd.set('image', compressed, compressed.name);
      }
      const opts = {
        method: isEdit ? 'PUT' : 'POST',
        formData: fd,
        onProgress: (pct) => renderUploadProgress(progressEl, pct)
      };
      if (isEdit) await api(`/admin/detail-pages/${item.id}`, opts);
      else await api('/admin/detail-pages', opts);
      clearUploadProgress(progressEl);
      toast(isEdit ? 'Page updated' : 'Page created', 'success');
      closeModal();
      await loadPages(container);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}
