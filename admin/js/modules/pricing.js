import {
  api, toast, confirm, openModal, closeModal,
  escapeHtml, formatCurrency, statusBadge, setupImagePreview, imagePreview,
  prepareImageFiles, renderUploadProgress, clearUploadProgress,
  iconBtn, addBtn
} from '../admin.js';
import { richTextField, titleBoldToggle, syncRichText, validateRichText } from '../richtext.js';

let items = [];

export default async function render(container) {
  container.innerHTML = '<div class="loading"><div class="loading__spinner"></div> Loading courses…</div>';
  await loadPricing(container);
}

async function loadPricing(container) {
  try {
    const { data } = await api('/admin/pricing');
    items = data;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2 class="page-header__title">Courses</h2>
          <p class="page-header__subtitle">Image, description, price and class count — new courses appear on the site automatically</p>
        </div>
        ${addBtn('Add Course', 'addPricingBtn')}
      </div>

      <div class="card">
        <div class="card__body" style="padding:0;">
          ${items.length ? pricingTable() : emptyState()}
        </div>
      </div>
    `;

    document.getElementById('addPricingBtn')?.addEventListener('click', () => showForm(null, container));
    bindEvents(container);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__title">Error</div><p class="empty-state__text">${escapeHtml(err.message)}</p></div>`;
  }
}

function emptyState() {
  return `<div class="empty-state"><div class="empty-state__icon">🎓</div><div class="empty-state__title">No courses yet</div><p class="empty-state__text">Add a course with name, description, amount and number of classes.</p></div>`;
}

function courseName(p) {
  return p.name || p.courseName || '';
}

function pricingTable() {
  return `
    <div class="table-wrap table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Image</th>
            <th>Course</th>
            <th>Price</th>
            <th>Classes</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((p) => `
            <tr data-id="${escapeHtml(p.id)}">
              <td>${p.sort_order ?? p.displayOrder ?? '—'}</td>
              <td>${(p.image_url || p.image) ? `<img class="data-table__thumb" src="${escapeHtml(p.image_url || p.image)}" alt="" onerror="this.src='/images/placeholder.webp'">` : '—'}</td>
              <td>
                <strong>${escapeHtml(courseName(p))}</strong>
                ${p.badge ? `<br><span class="badge badge--new">${escapeHtml(p.badge)}</span>` : ''}
                <br><small style="color:var(--text-muted)">${escapeHtml((window.SeekhoSanitize ? window.SeekhoSanitize.stripHtml(p.description || '') : p.description || '').slice(0, 50))}</small>
              </td>
              <td>${formatCurrency(p.price)}</td>
              <td>${escapeHtml(String(p.classes ?? '—'))}</td>
              <td>${p.is_active !== false ? statusBadge('active') : statusBadge('inactive')}</td>
              <td>
                <div class="table-actions">
                  ${iconBtn('edit', 'Edit')}
                  ${iconBtn('toggle', p.is_active !== false ? 'Deactivate' : 'Activate')}
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
    const item = items.find((p) => p.id === id);

    row.querySelector('[data-action="edit"]')?.addEventListener('click', () => showForm(item, container));
    row.querySelector('[data-action="toggle"]')?.addEventListener('click', async () => {
      try {
        const fd = new FormData();
        fd.append('is_active', item.is_active !== false ? 'false' : 'true');
        await api(`/admin/pricing/${id}`, { method: 'PUT', formData: fd });
        toast(item.is_active !== false ? 'Course deactivated' : 'Course activated', 'success');
        await loadPricing(container);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
    row.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      const ok = await confirm(`Delete course "${courseName(item)}"?`);
      if (!ok) return;
      try {
        await api(`/admin/pricing/${id}`, { method: 'DELETE' });
        toast('Course deleted', 'success');
        await loadPricing(container);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

function showForm(item, container) {
  const isEdit = !!item;
  const features = Array.isArray(item?.features) ? item.features.join('\n') : '';
  const priceVal = item?.price != null ? Number(item.price).toFixed(2) : '';

  openModal({
    title: isEdit ? 'Edit Course' : 'Add Course',
    size: 'lg',
    body: `
      <form id="pricingForm">
        <div class="form-grid">
          <div class="form-group form-group--full">
            <label>Name <span class="required">*</span></label>
            <input class="form-control" name="name" required value="${escapeHtml(courseName(item) || '')}">
            ${titleBoldToggle({ checked: !!item?.title_bold, label: 'Bold course name' })}
          </div>
          <div class="form-group">
            <label>Amount (₹) <span class="required">*</span></label>
            <input class="form-control" type="number" name="price" required min="0" step="0.01" value="${escapeHtml(priceVal)}" placeholder="3999.50">
            <p class="form-hint">Decimal allowed, e.g. 3999.50</p>
          </div>
          <div class="form-group">
            <label>Number of Classes <span class="required">*</span></label>
            <input class="form-control" type="number" name="classes" required min="1" step="1" value="${item?.classes ?? ''}" placeholder="10">
            <p class="form-hint">Shown on the site as “N classes”</p>
          </div>
          <div class="form-group">
            <label>Badge (optional)</label>
            <input class="form-control" name="badge" value="${escapeHtml(item?.badge || '')}" placeholder="e.g. Popular">
          </div>
          <div class="form-group">
            <label>Display order</label>
            <input class="form-control" type="number" name="sort_order" value="${item?.sort_order ?? items.length + 1}">
          </div>
          <div class="form-group">
            <label class="form-check"><input type="checkbox" name="is_active" ${item?.is_active !== false ? 'checked' : ''}> Active</label>
          </div>
          <div class="form-group form-group--full">
            <label>Description <span class="required">*</span></label>
            ${richTextField({ name: 'description', value: item?.description || '', required: true, minHeight: '120px' })}
          </div>
          <div class="form-group form-group--full">
            <label>Features (optional)</label>
            <textarea class="form-control" name="features" rows="4" placeholder="One feature per line">${escapeHtml(features)}</textarea>
          </div>
          <div class="form-group form-group--full">
            <label>Image (optional)</label>
            <input class="form-control" type="file" name="image" accept="image/jpeg,image/png,image/webp,image/gif">
            <p class="form-hint">Max 5MB · Cloudinary URL stored in Sheets</p>
            <div id="pricingPreview">${item?.image_url || item?.image ? imagePreview(item.image_url || item.image) : ''}</div>
          </div>
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn--outline" id="cancelPricing">Cancel</button>
      <button class="btn btn--primary" id="savePricing">${isEdit ? 'Update' : 'Create'}</button>
    `
  });

  setupImagePreview(document.querySelector('#pricingForm input[name="image"]'), document.getElementById('pricingPreview'));
  document.getElementById('cancelPricing').addEventListener('click', closeModal);

  document.getElementById('savePricing').addEventListener('click', async () => {
    const form = document.getElementById('pricingForm');
    syncRichText(form);
    if (!form.checkValidity() || !validateRichText(form)) {
      form.reportValidity();
      toast('Please fill Name, Description, Amount and Number of Classes.', 'warning');
      return;
    }

    const price = form.price.value.trim();
    if (!/^\d+(\.\d{1,2})?$/.test(price)) {
      toast('Amount must have at most 2 decimal places.', 'error');
      return;
    }
    const classes = Number(form.classes.value);
    if (!Number.isInteger(classes) || classes < 1) {
      toast('Number of classes must be a whole number of at least 1.', 'error');
      return;
    }

    const fd = new FormData();
    fd.set('name', form.name.value.trim());
    fd.set('description', form.description.value);
    fd.set('price', price);
    fd.set('classes', String(classes));
    fd.set('badge', form.badge.value.trim());
    fd.set('sort_order', form.sort_order.value);
    fd.set('is_active', form.querySelector('[name="is_active"]').checked ? 'true' : 'false');
    fd.set('title_bold', form.querySelector('[name="title_bold"]').checked ? 'true' : 'false');
    fd.set('features', form.features.value);

    const btn = document.getElementById('savePricing');
    btn.disabled = true;
    const progressEl = document.getElementById('uploadProgressSlot') || document.getElementById('pricingPreview');

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
      if (isEdit) {
        await api(`/admin/pricing/${item.id}`, opts);
        toast('Course updated', 'success');
      } else {
        await api('/admin/pricing', opts);
        toast('Course created', 'success');
      }
      clearUploadProgress(progressEl);
      closeModal();
      await loadPricing(container);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}
