import {
  api, toast, confirm, openModal, closeModal,
  escapeHtml, formatCurrency, statusBadge,
  iconBtn, addBtn
} from '../admin.js';

let items = [];

export default async function render(container) {
  container.innerHTML = '<div class="loading"><div class="loading__spinner"></div> Loading pricing…</div>';
  await loadPricing(container);
}

async function loadPricing(container) {
  try {
    const { data } = await api('/admin/pricing');
    items = data;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2 class="page-header__title">Pricing</h2>
          <p class="page-header__subtitle">Manage course pricing plans</p>
        </div>
        ${addBtn('Add Plan', 'addPricingBtn')}
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
  return `<div class="empty-state"><div class="empty-state__icon">💰</div><div class="empty-state__title">No pricing plans</div><p class="empty-state__text">Add course pricing to display on the website.</p></div>`;
}

function pricingTable() {
  return `
    <div class="table-wrap table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Course</th>
            <th>Price</th>
            <th>Features</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((p) => `
            <tr data-id="${escapeHtml(p.id)}">
              <td>${p.displayOrder ?? '—'}</td>
              <td><strong>${escapeHtml(p.courseName)}</strong><br><small style="color:var(--text-muted)">${escapeHtml((p.description || '').slice(0, 50))}</small></td>
              <td>${formatCurrency(p.price)}</td>
              <td>${Array.isArray(p.features) ? p.features.length + ' items' : '—'}</td>
              <td>${p.active !== false ? statusBadge('active') : statusBadge('inactive')}</td>
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
    const item = items.find((p) => p.id === id);

    row.querySelector('[data-action="edit"]')?.addEventListener('click', () => showForm(item, container));
    row.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      const ok = await confirm(`Delete pricing plan "${item.courseName}"?`);
      if (!ok) return;
      try {
        await api(`/admin/pricing/${id}`, { method: 'DELETE' });
        toast('Pricing deleted', 'success');
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

  openModal({
    title: isEdit ? 'Edit Pricing Plan' : 'Add Pricing Plan',
    size: 'lg',
    body: `
      <form id="pricingForm">
        <div class="form-grid">
          <div class="form-group">
            <label>Course Name <span class="required">*</span></label>
            <input class="form-control" name="courseName" required value="${escapeHtml(item?.courseName || '')}">
          </div>
          <div class="form-group">
            <label>Price (₹) <span class="required">*</span></label>
            <input class="form-control" type="number" name="price" required min="0" value="${item?.price ?? ''}">
          </div>
          <div class="form-group">
            <label>Duration</label>
            <input class="form-control" name="duration" placeholder="e.g. 10–15 Days" value="${escapeHtml(item?.duration || '')}">
          </div>
          <div class="form-group">
            <label>Display Order</label>
            <input class="form-control" type="number" name="displayOrder" value="${item?.displayOrder ?? items.length + 1}">
          </div>
          <div class="form-group">
            <label class="form-check"><input type="checkbox" name="active" ${item?.active !== false ? 'checked' : ''}> Active</label>
          </div>
          <div class="form-group form-group--full">
            <label>Description</label>
            <textarea class="form-control" name="description" rows="2">${escapeHtml(item?.description || '')}</textarea>
          </div>
          <div class="form-group form-group--full">
            <label>Features</label>
            <textarea class="form-control" name="features" rows="5" placeholder="One feature per line">${escapeHtml(features)}</textarea>
            <p class="form-hint">Enter one feature per line</p>
          </div>
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn--outline" id="cancelPricing">Cancel</button>
      <button class="btn btn--primary" id="savePricing">${isEdit ? 'Update' : 'Create'}</button>
    `
  });

  document.getElementById('cancelPricing').addEventListener('click', closeModal);

  document.getElementById('savePricing').addEventListener('click', async () => {
    const form = document.getElementById('pricingForm');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const featuresRaw = form.features.value.trim();
    const feats = featuresRaw ? featuresRaw.split('\n').map((s) => s.trim()).filter(Boolean) : [];

    const payload = {
      courseName: form.courseName.value,
      price: Number(form.price.value),
      duration: form.duration?.value || '',
      description: form.description.value,
      displayOrder: Number(form.displayOrder.value || 0),
      active: form.querySelector('[name="active"]').checked,
      features: feats
    };

    const btn = document.getElementById('savePricing');
    btn.disabled = true;

    try {
      if (isEdit) {
        await api(`/admin/pricing/${item.id}`, { method: 'PUT', json: payload });
        toast('Pricing updated', 'success');
      } else {
        await api('/admin/pricing', { method: 'POST', json: payload });
        toast('Pricing created', 'success');
      }
      closeModal();
      await loadPricing(container);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}
