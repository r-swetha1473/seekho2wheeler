import {
  api, toast, confirm, openModal, closeModal,
  escapeHtml, statusBadge, setupImagePreview, imagePreview,
  prepareImageFiles, renderUploadProgress, clearUploadProgress,
  iconBtn, addBtn
} from '../admin.js';

export default async function render(container) {
  container.innerHTML = '<div class="loading"><div class="loading__spinner"></div> Loading updates…</div>';
  try {
    const { data } = await api('/admin/updates');
    paint(container, data || []);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__title">Error</div><p class="empty-state__text">${escapeHtml(err.message)}</p></div>`;
  }
}

function todayYmd() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

function scheduleState(item) {
  if (item.is_active === false) return 'inactive';
  const today = todayYmd();
  const start = String(item.start_date || '').slice(0, 10);
  const end = String(item.end_date || '').slice(0, 10);
  if (start && today < start) return 'scheduled';
  if (end && today > end) return 'expired';
  return 'live';
}

function paint(container, items) {
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">Updates</h2>
        <p class="page-header__subtitle">Optional announcements. These are not shown on the public home page unless you ask for that later.</p>
      </div>
      ${addBtn('Add update', 'addUpdateBtn')}
    </div>
    <div class="card">
      <div class="card__body" style="padding:0">
        ${sorted.length ? table(sorted) : '<div class="empty-state"><p>No updates yet. Add one when the client shares the copy.</p></div>'}
      </div>
    </div>
  `;
  document.getElementById('addUpdateBtn')?.addEventListener('click', () => showForm(null, container, sorted));
  bindRows(container, sorted);
}

function table(sorted) {
  return `
    <div class="table-wrap table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Title</th>
            <th>Schedule</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map((item, idx) => `
            <tr data-id="${escapeHtml(item.id)}">
              <td>${item.sort_order}</td>
              <td><strong>${escapeHtml(item.title)}</strong></td>
              <td>${escapeHtml(item.start_date || '—')} → ${escapeHtml(item.end_date || '—')}</td>
              <td>${statusBadge(scheduleState(item))}</td>
              <td>
                <div class="table-actions">
                  <button type="button" class="btn btn--outline btn--sm" data-move="up" ${idx === 0 ? 'disabled' : ''}>Up</button>
                  <button type="button" class="btn btn--outline btn--sm" data-move="down" ${idx === sorted.length - 1 ? 'disabled' : ''}>Down</button>
                  ${iconBtn('view', 'Preview')}
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

function bindRows(container, sorted) {
  container.querySelectorAll('tbody tr[data-id]').forEach((row) => {
    const id = row.dataset.id;
    const item = sorted.find((x) => String(x.id) === String(id));
    if (!item) return;
    row.querySelector('[data-action="edit"]')?.addEventListener('click', () => showForm(item, container, sorted));
    row.querySelector('[data-action="view"]')?.addEventListener('click', () => showPreview(item));
    row.querySelector('[data-action="toggle"]')?.addEventListener('click', async () => {
      try {
        await api(`/admin/updates/${id}`, { method: 'PUT', json: { is_active: item.is_active !== false ? false : true } });
        toast('Updated', 'success');
        await render(container);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
    row.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      const ok = await confirm(`Delete “${item.title}”?`);
      if (!ok) return;
      try {
        await api(`/admin/updates/${id}`, { method: 'DELETE' });
        toast('Deleted', 'success');
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
          await api(`/admin/updates/${a.id}`, { method: 'PUT', json: { sort_order: b.sort_order } });
          await api(`/admin/updates/${b.id}`, { method: 'PUT', json: { sort_order: a.sort_order } });
          toast('Order updated', 'success');
          await render(container);
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    });
  });
}

function showPreview(item) {
  const img = item.image_url
    ? `<img src="${escapeHtml(item.image_url)}" alt="" style="width:100%;max-height:140px;object-fit:cover;border-radius:8px;margin-bottom:0.5rem">`
    : '';
  const link = item.link_url
    ? `<p><a href="${escapeHtml(item.link_url)}" target="_blank" rel="noopener">Open link</a></p>`
    : '';
  openModal({
    title: 'Visitor preview',
    body: `
      <p class="form-hint">Preview of an announcement card. This is not shown on the public website right now.</p>
      <div class="card" style="border:1px solid var(--border);padding:0.85rem">
        ${img}
        <strong>${escapeHtml(item.title)}</strong>
        <div class="rich-html" style="margin-top:0.4rem">${item.message || ''}</div>
        ${link}
      </div>
    `,
    footer: '<button class="btn btn--primary" id="closeUpdatePreview">Close</button>'
  });
  document.getElementById('closeUpdatePreview')?.addEventListener('click', closeModal);
}

function showForm(item, container, items) {
  const isEdit = !!item;
  openModal({
    title: isEdit ? 'Edit update' : 'Add update',
    size: 'lg',
    body: `
      <form id="updateForm">
        <div class="form-grid">
          <div class="form-group form-group--full">
            <label>Title <span class="required">*</span></label>
            <input class="form-control" name="title" required value="${escapeHtml(item?.title || '')}">
          </div>
          <div class="form-group form-group--full">
            <label>Message <span class="required">*</span></label>
            <textarea class="form-control" name="message" required rows="4">${escapeHtml(item?.message || '')}</textarea>
          </div>
          <div class="form-group form-group--full">
            <label>Link URL</label>
            <input class="form-control" name="link_url" value="${escapeHtml(item?.link_url || '')}" placeholder="https://… or /pages/booking.html">
            <p class="form-hint">Optional. Must be https or a site path starting with /.</p>
          </div>
          <div class="form-group">
            <label>Start date</label>
            <input class="form-control" type="date" name="start_date" value="${escapeHtml(item?.start_date || '')}">
          </div>
          <div class="form-group">
            <label>End date</label>
            <input class="form-control" type="date" name="end_date" value="${escapeHtml(item?.end_date || '')}">
            <p class="form-hint">Leave both empty to show whenever the update is active.</p>
          </div>
          <div class="form-group">
            <label>Display order</label>
            <input class="form-control" type="number" name="sort_order" value="${escapeHtml(String(item?.sort_order ?? items.length + 1))}">
          </div>
          <div class="form-group">
            <label class="form-check"><input type="checkbox" name="is_active" ${item?.is_active !== false ? 'checked' : ''}> Active</label>
          </div>
          <div class="form-group form-group--full">
            <label>Flyer / image (optional)</label>
            <input class="form-control" type="file" name="image" accept="image/jpeg,image/png,image/webp,image/gif">
            <p class="form-hint">Optional poster. Client wrote “fly”; this field covers a flyer image.</p>
            <div id="updatePreview">${item?.image_url ? imagePreview(item.image_url) : ''}</div>
          </div>
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn--outline" type="button" id="cancelUpdate">Cancel</button>
      <button class="btn btn--primary" type="button" id="saveUpdate">${isEdit ? 'Update' : 'Create'}</button>
    `
  });

  setupImagePreview(document.querySelector('#updateForm input[name="image"]'), document.getElementById('updatePreview'));
  document.getElementById('cancelUpdate').addEventListener('click', closeModal);
  document.getElementById('saveUpdate').addEventListener('click', async () => {
    const form = document.getElementById('updateForm');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const fd = new FormData(form);
    fd.set('is_active', form.querySelector('[name="is_active"]').checked ? 'true' : 'false');
    const btn = document.getElementById('saveUpdate');
    btn.disabled = true;
    const progressEl = document.getElementById('uploadProgressSlot') || document.getElementById('updatePreview');
    try {
      const fileInput = form.querySelector('[name="image"]');
      if (fileInput?.files?.[0]) {
        const [compressed] = await prepareImageFiles(fileInput.files, { maxWidth: 1200, maxHeight: 900 });
        fd.set('image', compressed, compressed.name);
      }
      const opts = {
        method: isEdit ? 'PUT' : 'POST',
        formData: fd,
        onProgress: (pct) => renderUploadProgress(progressEl, pct)
      };
      if (isEdit) await api(`/admin/updates/${item.id}`, opts);
      else await api('/admin/updates', opts);
      clearUploadProgress(progressEl);
      toast(isEdit ? 'Update saved' : 'Update created', 'success');
      closeModal();
      await render(container);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}
