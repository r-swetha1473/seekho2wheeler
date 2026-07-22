import {
  api, toast, confirm, openModal, closeModal,
  escapeHtml, statusBadge, setupImagePreview, imagePreview,
  iconBtn, addBtn
} from '../admin.js';

let banners = [];

export default async function render(container) {
  container.innerHTML = '<div class="loading"><div class="loading__spinner"></div> Loading banners…</div>';
  await loadBanners(container);
}

async function loadBanners(container) {
  try {
    const { data } = await api('/admin/banners');
    banners = data;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2 class="page-header__title">Banners</h2>
          <p class="page-header__subtitle">Manage homepage hero banners</p>
        </div>
        ${addBtn('Add Banner', 'addBannerBtn')}
      </div>

      <div class="card">
        <div class="card__body" style="padding:0;">
          ${banners.length ? bannerTable() : emptyState()}
        </div>
      </div>
    `;

    document.getElementById('addBannerBtn')?.addEventListener('click', () => showForm());
    bindTableEvents(container);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__title">Error</div><p class="empty-state__text">${escapeHtml(err.message)}</p></div>`;
  }
}

function emptyState() {
  return `<div class="empty-state"><div class="empty-state__icon">🖼️</div><div class="empty-state__title">No banners yet</div><p class="empty-state__text">Add your first homepage banner to get started.</p></div>`;
}

function bannerTable() {
  return `
    <div class="table-wrap table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Image</th>
            <th>Title</th>
            <th>Subtitle</th>
            <th>CTA</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${banners.map((b, i) => `
            <tr data-id="${escapeHtml(b.id)}">
              <td>
                <div class="reorder-btns">
                  <button type="button" data-move="up" data-idx="${i}" ${i === 0 ? 'disabled' : ''}>▲</button>
                  <button type="button" data-move="down" data-idx="${i}" ${i === banners.length - 1 ? 'disabled' : ''}>▼</button>
                </div>
              </td>
              <td>${b.image ? `<img class="data-table__thumb" src="${escapeHtml(b.image)}" alt="" onerror="this.src='/images/placeholder.webp'">` : '—'}</td>
              <td><strong>${escapeHtml(b.title)}</strong></td>
              <td>${escapeHtml(b.subtitle || '—')}</td>
              <td>${escapeHtml(b.ctaText || '—')}</td>
              <td>${b.active !== false ? statusBadge('active') : statusBadge('inactive')}</td>
              <td>
                <div class="table-actions">
                  ${iconBtn('edit', 'Edit')}
                  ${iconBtn('toggle', b.active !== false ? 'Deactivate' : 'Activate')}
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

function bindTableEvents(container) {
  container.querySelectorAll('[data-move]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const idx = Number(btn.dataset.idx);
      const dir = btn.dataset.move;
      const newIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= banners.length) return;

      const reordered = [...banners];
      [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];

      try {
        await api('/admin/banners/reorder', {
          method: 'POST',
          json: { order: reordered.map((b) => b.id) }
        });
        toast('Order updated', 'success');
        await loadBanners(container);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });

  container.querySelectorAll('tbody tr[data-id]').forEach((row) => {
    const id = row.dataset.id;
    const banner = banners.find((b) => b.id === id);

    row.querySelector('[data-action="edit"]')?.addEventListener('click', () => showForm(banner));
    row.querySelector('[data-action="toggle"]')?.addEventListener('click', async () => {
      try {
        const fd = new FormData();
        fd.append('active', banner.active !== false ? 'false' : 'true');
        await api(`/admin/banners/${id}`, { method: 'PUT', formData: fd });
        toast(banner.active !== false ? 'Banner deactivated' : 'Banner activated', 'success');
        await loadBanners(container);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
    row.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      const ok = await confirm('Delete this banner? This cannot be undone.');
      if (!ok) return;
      try {
        await api(`/admin/banners/${id}`, { method: 'DELETE' });
        toast('Banner deleted', 'success');
        await loadBanners(container);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

function showForm(banner = null) {
  const isEdit = !!banner;
  openModal({
    title: isEdit ? 'Edit Banner' : 'Add Banner',
    size: 'lg',
    body: `
      <form id="bannerForm">
        <div class="form-grid">
          <div class="form-group form-group--full">
            <label>Title <span class="required">*</span></label>
            <input class="form-control" name="title" required value="${escapeHtml(banner?.title || '')}">
          </div>
          <div class="form-group form-group--full">
            <label>Subtitle</label>
            <input class="form-control" name="subtitle" value="${escapeHtml(banner?.subtitle || '')}">
          </div>
          <div class="form-group">
            <label>CTA Text</label>
            <input class="form-control" name="ctaText" value="${escapeHtml(banner?.ctaText || 'Book Training')}">
          </div>
          <div class="form-group">
            <label>CTA Link</label>
            <input class="form-control" name="ctaLink" value="${escapeHtml(banner?.ctaLink || '/pages/booking.html')}">
          </div>
          <div class="form-group">
            <label>Display Order</label>
            <input class="form-control" type="number" name="displayOrder" value="${banner?.displayOrder ?? banners.length + 1}">
          </div>
          <div class="form-group">
            <label class="form-check"><input type="checkbox" name="active" ${banner?.active !== false ? 'checked' : ''}> Active</label>
          </div>
          <div class="form-group form-group--full">
            <label>Image ${isEdit ? '' : '<span class="required">*</span>'}</label>
            <input class="form-control" type="file" name="image" accept="image/*" ${isEdit ? '' : 'required'}>
            <div id="bannerPreview">${banner?.image ? imagePreview(banner.image) : ''}</div>
          </div>
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn--outline" id="cancelBanner">Cancel</button>
      <button class="btn btn--primary" id="saveBanner">${isEdit ? 'Update' : 'Create'}</button>
    `
  });

  setupImagePreview(document.querySelector('#bannerForm input[name="image"]'), document.getElementById('bannerPreview'));
  document.getElementById('cancelBanner').addEventListener('click', closeModal);

  document.getElementById('saveBanner').addEventListener('click', async () => {
    const form = document.getElementById('bannerForm');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const fd = new FormData(form);
    fd.set('active', form.querySelector('[name="active"]').checked ? 'true' : 'false');

    const saveBtn = document.getElementById('saveBanner');
    saveBtn.disabled = true;

    try {
      if (isEdit) {
        await api(`/admin/banners/${banner.id}`, { method: 'PUT', formData: fd });
        toast('Banner updated', 'success');
      } else {
        await api('/admin/banners', { method: 'POST', formData: fd });
        toast('Banner created', 'success');
      }
      closeModal();
      const container = document.getElementById('adminContent');
      await loadBanners(container);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      saveBtn.disabled = false;
    }
  });
}
