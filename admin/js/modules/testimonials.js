import {
  api, toast, confirm, openModal, closeModal,
  escapeHtml, statusBadge, setupImagePreview, imagePreview,
  iconBtn, addBtn
} from '../admin.js';

let items = [];

export default async function render(container) {
  container.innerHTML = '<div class="loading"><div class="loading__spinner"></div> Loading testimonials…</div>';
  await loadTestimonials(container);
}

async function loadTestimonials(container) {
  try {
    const { data } = await api('/admin/testimonials');
    items = data;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2 class="page-header__title">Testimonials</h2>
          <p class="page-header__subtitle">Student reviews and success stories</p>
        </div>
        ${addBtn('Add Review', 'addTestimonialBtn')}
      </div>

      <div class="card">
        <div class="card__body" style="padding:0;">
          ${items.length ? testimonialTable() : emptyState()}
        </div>
      </div>
    `;

    document.getElementById('addTestimonialBtn')?.addEventListener('click', () => showForm(null, container));
    bindEvents(container);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__title">Error</div><p class="empty-state__text">${escapeHtml(err.message)}</p></div>`;
  }
}

function emptyState() {
  return `<div class="empty-state"><div class="empty-state__icon">⭐</div><div class="empty-state__title">No testimonials</div><p class="empty-state__text">Add student reviews to build trust.</p></div>`;
}

function stars(rating) {
  const r = Math.min(5, Math.max(0, Number(rating || 0)));
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

function testimonialTable() {
  return `
    <div class="table-wrap table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Photo</th>
            <th>Name</th>
            <th>Headline</th>
            <th>Rating</th>
            <th>Type</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((t) => `
            <tr data-id="${escapeHtml(t.id)}">
              <td>${t.photo ? `<img class="data-table__thumb data-table__thumb--square" src="${escapeHtml(t.photo)}" alt="" onerror="this.src='/images/placeholder.webp'">` : '—'}</td>
              <td><strong>${escapeHtml(t.name)}</strong></td>
              <td>${escapeHtml(t.headline || '—')}</td>
              <td style="color:var(--primary-dark);">${stars(t.rating)}</td>
              <td>${escapeHtml(t.type || 'text')}</td>
              <td>${t.active !== false ? statusBadge('active') : statusBadge('inactive')}</td>
              <td>
                <div class="table-actions">
                  ${iconBtn('edit', 'Edit')}
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

function bindEvents(container) {
  container.querySelectorAll('tbody tr[data-id]').forEach((row) => {
    const id = row.dataset.id;
    const item = items.find((t) => t.id === id);

    row.querySelector('[data-action="edit"]')?.addEventListener('click', () => showForm(item, container));
    row.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      const ok = await confirm(`Delete testimonial from ${item.name}?`);
      if (!ok) return;
      try {
        await api(`/admin/testimonials/${id}`, { method: 'DELETE' });
        toast('Testimonial deleted', 'success');
        await loadTestimonials(container);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

function showForm(item, container) {
  const isEdit = !!item;

  openModal({
    title: isEdit ? 'Edit Testimonial' : 'Add Testimonial',
    size: 'lg',
    body: `
      <form id="testimonialForm">
        <div class="form-grid">
          <div class="form-group">
            <label>Name <span class="required">*</span></label>
            <input class="form-control" name="name" required value="${escapeHtml(item?.name || '')}">
          </div>
          <div class="form-group">
            <label>Headline</label>
            <input class="form-control" name="headline" value="${escapeHtml(item?.headline || '')}" placeholder="e.g. Learned in 7 days">
          </div>
          <div class="form-group">
            <label>Rating</label>
            <select class="form-control" name="rating">
              ${[5, 4, 3, 2, 1].map((r) => `<option value="${r}"${Number(item?.rating || 5) === r ? ' selected' : ''}>${r} Stars</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Type</label>
            <select class="form-control" name="type" id="testimonialType">
              <option value="text"${(item?.type || 'text') === 'text' ? ' selected' : ''}>Text Review</option>
              <option value="video"${item?.type === 'video' ? ' selected' : ''}>Video Review</option>
            </select>
          </div>
          <div class="form-group form-group--full" id="videoUrlGroup" style="${item?.type === 'video' ? '' : 'display:none'}">
            <label>Video URL</label>
            <input class="form-control" name="videoUrl" value="${escapeHtml(item?.videoUrl || '')}" placeholder="YouTube or video link">
          </div>
          <div class="form-group form-group--full">
            <label>Review <span class="required">*</span></label>
            <textarea class="form-control" name="review" required rows="4">${escapeHtml(item?.review || '')}</textarea>
          </div>
          <div class="form-group">
            <label>Display Order</label>
            <input class="form-control" type="number" name="displayOrder" value="${item?.displayOrder ?? items.length + 1}">
          </div>
          <div class="form-group">
            <label class="form-check"><input type="checkbox" name="active" ${item?.active !== false ? 'checked' : ''}> Active</label>
          </div>
          <div class="form-group form-group--full">
            <label>Photo</label>
            <input class="form-control" type="file" name="photo" accept="image/*">
            <div id="testimonialPreview">${item?.photo ? imagePreview(item.photo, true) : ''}</div>
          </div>
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn--outline" id="cancelTestimonial">Cancel</button>
      <button class="btn btn--primary" id="saveTestimonial">${isEdit ? 'Update' : 'Create'}</button>
    `
  });

  document.getElementById('testimonialType').addEventListener('change', (e) => {
    document.getElementById('videoUrlGroup').style.display = e.target.value === 'video' ? '' : 'none';
  });

  setupImagePreview(document.querySelector('#testimonialForm input[name="photo"]'), document.getElementById('testimonialPreview'));
  document.getElementById('cancelTestimonial').addEventListener('click', closeModal);

  document.getElementById('saveTestimonial').addEventListener('click', async () => {
    const form = document.getElementById('testimonialForm');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const fd = new FormData(form);
    fd.set('active', form.querySelector('[name="active"]').checked ? 'true' : 'false');

    const btn = document.getElementById('saveTestimonial');
    btn.disabled = true;

    try {
      if (isEdit) {
        await api(`/admin/testimonials/${item.id}`, { method: 'PUT', formData: fd });
        toast('Testimonial updated', 'success');
      } else {
        await api('/admin/testimonials', { method: 'POST', formData: fd });
        toast('Testimonial created', 'success');
      }
      closeModal();
      await loadTestimonials(container);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}
