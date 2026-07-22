import {
  api, toast, confirm, openModal, closeModal,
  escapeHtml, statusBadge, setupImagePreview, setupMultiImagePreview, imagePreview,
  iconBtn, addBtn
} from '../admin.js';

const CATEGORIES = [
  'Scooty Training',
  'Bike Training',
  'Women Riders',
  'Student Success',
  'Road Practice',
  'Branch Activities'
];

let items = [];

export default async function render(container) {
  container.innerHTML = '<div class="loading"><div class="loading__spinner"></div> Loading gallery…</div>';
  await loadGallery(container);
}

async function loadGallery(container, category = 'all') {
  try {
    const { data } = await api('/admin/gallery');
    items = data;

    const filtered = category === 'all' ? items : items.filter((g) => g.category === category);

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2 class="page-header__title">Gallery</h2>
          <p class="page-header__subtitle">Manage training photos by category</p>
        </div>
        ${addBtn('Upload Images', 'uploadBtn')}
      </div>

      <div class="filters-bar">
        <select id="categoryFilter">
          <option value="all"${category === 'all' ? ' selected' : ''}>All Categories</option>
          ${CATEGORIES.map((c) => `<option value="${escapeHtml(c)}"${category === c ? ' selected' : ''}>${escapeHtml(c)}</option>`).join('')}
        </select>
        <span style="color:var(--text-muted);font-size:0.875rem;">${filtered.length} image(s)</span>
      </div>

      ${filtered.length ? galleryGrid(filtered) : emptyState()}
    `;

    document.getElementById('uploadBtn').addEventListener('click', () => showUploadForm());
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
      loadGallery(container, e.target.value);
    });
    bindGridEvents(container, filtered);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__title">Error</div><p class="empty-state__text">${escapeHtml(err.message)}</p></div>`;
  }
}

function emptyState() {
  return `<div class="card"><div class="card__body"><div class="empty-state"><div class="empty-state__icon">📷</div><div class="empty-state__title">No gallery images</div><p class="empty-state__text">Upload photos to showcase your training sessions.</p></div></div></div>`;
}

function galleryGrid(filtered) {
  return `
    <div class="gallery-admin-grid">
      ${filtered.map((g, i) => {
        const globalIdx = items.findIndex((x) => x.id === g.id);
        return `
          <div class="gallery-admin-item" data-id="${escapeHtml(g.id)}">
            <img class="gallery-admin-item__img" src="${escapeHtml(g.image)}" alt="${escapeHtml(g.title || '')}">
            <div class="gallery-admin-item__body">
              <div class="gallery-admin-item__title">${escapeHtml(g.title || g.category)}</div>
              <div class="gallery-admin-item__meta">${escapeHtml(g.category)} · Order ${g.displayOrder ?? '—'}</div>
              <div class="gallery-admin-item__actions">
                <div class="reorder-btns" style="flex-direction:row;">
                  <button type="button" data-move="up" data-idx="${globalIdx}" ${globalIdx === 0 ? 'disabled' : ''}>◀</button>
                  <button type="button" data-move="down" data-idx="${globalIdx}" ${globalIdx === items.length - 1 ? 'disabled' : ''}>▶</button>
                </div>
                ${iconBtn('edit', 'Edit')}
                ${iconBtn('delete', 'Delete')}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function bindGridEvents(container, filtered) {
  container.querySelectorAll('[data-move]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const idx = Number(btn.dataset.idx);
      const dir = btn.dataset.move;
      const newIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= items.length) return;

      const reordered = [...items];
      [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];

      try {
        await api('/admin/gallery/reorder', {
          method: 'POST',
          json: { order: reordered.map((g) => g.id) }
        });
        toast('Order updated', 'success');
        const cat = document.getElementById('categoryFilter')?.value || 'all';
        await loadGallery(container, cat);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });

  container.querySelectorAll('.gallery-admin-item').forEach((el) => {
    const id = el.dataset.id;
    const item = items.find((g) => g.id === id);

    el.querySelector('[data-action="edit"]')?.addEventListener('click', () => showEditForm(item, container));
    el.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      const ok = await confirm('Delete this gallery image?');
      if (!ok) return;
      try {
        await api(`/admin/gallery/${id}`, { method: 'DELETE' });
        toast('Image deleted', 'success');
        const cat = document.getElementById('categoryFilter')?.value || 'all';
        await loadGallery(container, cat);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

function showUploadForm() {
  openModal({
    title: 'Upload Gallery Images',
    size: 'lg',
    body: `
      <form id="uploadForm">
        <div class="form-group">
          <label>Category <span class="required">*</span></label>
          <select class="form-control" name="category" required>
            ${CATEGORIES.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Title (optional, applies to all)</label>
          <input class="form-control" name="title" placeholder="Leave blank to use category name">
        </div>
        <div class="form-group">
          <label>Images <span class="required">*</span></label>
          <input class="form-control" type="file" name="images" accept="image/*" multiple required>
          <p class="form-hint">Select up to 20 images at once</p>
          <div class="image-preview-grid" id="multiPreview"></div>
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn--outline" id="cancelUpload">Cancel</button>
      <button class="btn btn--primary" id="doUpload">Upload</button>
    `
  });

  setupMultiImagePreview(document.querySelector('#uploadForm input[name="images"]'), document.getElementById('multiPreview'));
  document.getElementById('cancelUpload').addEventListener('click', closeModal);

  document.getElementById('doUpload').addEventListener('click', async () => {
    const form = document.getElementById('uploadForm');
    const fileInput = form.querySelector('[name="images"]');
    if (!fileInput.files.length) {
      toast('Please select at least one image', 'warning');
      return;
    }

    const fd = new FormData();
    fd.append('category', form.category.value);
    fd.append('title', form.title.value);
    Array.from(fileInput.files).forEach((f) => fd.append('images', f));

    const btn = document.getElementById('doUpload');
    btn.disabled = true;

    try {
      const res = await api('/admin/gallery', { method: 'POST', formData: fd });
      toast(res.message || 'Images uploaded', 'success');
      closeModal();
      await loadGallery(document.getElementById('adminContent'));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}

function showEditForm(item, container) {
  openModal({
    title: 'Edit Gallery Item',
    body: `
      <form id="editGalleryForm">
        <div class="form-group">
          <label>Title</label>
          <input class="form-control" name="title" value="${escapeHtml(item.title || '')}">
        </div>
        <div class="form-group">
          <label>Category</label>
          <select class="form-control" name="category">
            ${CATEGORIES.map((c) => `<option value="${escapeHtml(c)}"${item.category === c ? ' selected' : ''}>${escapeHtml(c)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Display Order</label>
          <input class="form-control" type="number" name="displayOrder" value="${item.displayOrder ?? 0}">
        </div>
        <div class="form-group">
          <label class="form-check"><input type="checkbox" name="active" ${item.active !== false ? 'checked' : ''}> Active</label>
        </div>
        <div class="form-group">
          <label>Replace Image</label>
          <input class="form-control" type="file" name="image" accept="image/*">
          <div id="editPreview">${item.image ? imagePreview(item.image) : ''}</div>
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn--outline" id="cancelEdit">Cancel</button>
      <button class="btn btn--primary" id="saveEdit">Save</button>
    `
  });

  setupImagePreview(document.querySelector('#editGalleryForm input[name="image"]'), document.getElementById('editPreview'));
  document.getElementById('cancelEdit').addEventListener('click', closeModal);

  document.getElementById('saveEdit').addEventListener('click', async () => {
    const form = document.getElementById('editGalleryForm');
    const fd = new FormData(form);
    fd.set('active', form.querySelector('[name="active"]').checked ? 'true' : 'false');

    try {
      await api(`/admin/gallery/${item.id}`, { method: 'PUT', formData: fd });
      toast('Gallery item updated', 'success');
      closeModal();
      const cat = document.getElementById('categoryFilter')?.value || 'all';
      await loadGallery(container, cat);
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}
