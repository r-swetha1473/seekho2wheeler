import {
  api, toast, confirm, openModal, closeModal,
  escapeHtml, statusBadge, setupImagePreview, imagePreview,
  prepareImageFiles, renderUploadProgress, clearUploadProgress,
  iconBtn, addBtn
} from '../admin.js';

let branches = [];

export default async function render(container) {
  container.innerHTML = '<div class="loading"><div class="loading__spinner"></div> Loading branches…</div>';
  await loadBranches(container);
}

async function loadBranches(container) {
  try {
    const { data } = await api('/admin/branches');
    branches = data;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2 class="page-header__title">Branches</h2>
          <p class="page-header__subtitle">Manage training center locations</p>
        </div>
        ${addBtn('Add Branch', 'addBranchBtn')}
      </div>

      <div class="card">
        <div class="card__body" style="padding:0;">
          ${branches.length ? branchTable() : emptyState()}
        </div>
      </div>
    `;

    document.getElementById('addBranchBtn')?.addEventListener('click', () => showForm(null, container));
    bindEvents(container);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__title">Error</div><p class="empty-state__text">${escapeHtml(err.message)}</p></div>`;
  }
}

function emptyState() {
  return `<div class="empty-state"><div class="empty-state__icon">🏢</div><div class="empty-state__title">No branches</div><p class="empty-state__text">Add your first training center location.</p></div>`;
}

function branchTable() {
  return `
    <div class="table-wrap table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Area</th>
            <th>Phone</th>
            <th>Courses</th>
            <th>Trainers</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${branches.map((b) => `
            <tr data-id="${escapeHtml(b.id)}">
              <td>${b.image ? `<img class="data-table__thumb" src="${escapeHtml(b.image)}" alt="" onerror="this.src='/images/placeholder.webp'">` : '—'}</td>
              <td><strong>${escapeHtml(b.name)}</strong></td>
              <td>${escapeHtml(b.area || '—')}</td>
              <td>${escapeHtml(b.phone || '—')}</td>
              <td>${Array.isArray(b.availableCourses) ? b.availableCourses.length : 0}</td>
              <td>${b.trainerCount ?? 0}</td>
              <td>${b.active !== false ? statusBadge('active') : statusBadge('inactive')}</td>
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
    const branch = branches.find((b) => b.id === id);

    row.querySelector('[data-action="edit"]')?.addEventListener('click', () => showForm(branch, container));
    row.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      const ok = await confirm(`Delete branch "${branch.name}"?`);
      if (!ok) return;
      try {
        await api(`/admin/branches/${id}`, { method: 'DELETE' });
        toast('Branch deleted', 'success');
        await loadBranches(container);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

function showForm(branch, container) {
  const isEdit = !!branch;
  const courses = Array.isArray(branch?.availableCourses) ? branch.availableCourses.join(', ') : '';

  openModal({
    title: isEdit ? 'Edit Branch' : 'Add Branch',
    size: 'lg',
    body: `
      <form id="branchForm">
        <div class="form-grid">
          <div class="form-group">
            <label>Name <span class="required">*</span></label>
            <input class="form-control" name="name" required value="${escapeHtml(branch?.name || '')}">
          </div>
          <div class="form-group">
            <label>Area</label>
            <input class="form-control" name="area" value="${escapeHtml(branch?.area || '')}">
          </div>
          <div class="form-group form-group--full">
            <label>Address <span class="required">*</span></label>
            <textarea class="form-control" name="address" required rows="2">${escapeHtml(branch?.address || '')}</textarea>
          </div>
          <div class="form-group form-group--full">
            <label>Google Maps Link</label>
            <input class="form-control" name="mapsLink" value="${escapeHtml(branch?.mapsLink || '')}" placeholder="https://maps.google.com/...">
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input class="form-control" name="phone" value="${escapeHtml(branch?.phone || '')}">
          </div>
          <div class="form-group">
            <label>WhatsApp</label>
            <input class="form-control" name="whatsapp" value="${escapeHtml(branch?.whatsapp || '')}">
          </div>
          <div class="form-group">
            <label>Trainer Count</label>
            <input class="form-control" type="number" name="trainerCount" min="0" value="${branch?.trainerCount ?? 0}">
          </div>
          <div class="form-group">
            <label class="form-check"><input type="checkbox" name="active" ${branch?.active !== false ? 'checked' : ''}> Active</label>
          </div>
          <div class="form-group form-group--full">
            <label>Available Courses</label>
            <input class="form-control" name="availableCourses" value="${escapeHtml(courses)}" placeholder="Scooty Training, Bike Training (comma-separated)">
            <p class="form-hint">Separate course names with commas</p>
          </div>
          <div class="form-group form-group--full">
            <label>Branch Image</label>
            <input class="form-control" type="file" name="image" accept="image/jpeg,image/png,image/webp,image/gif">
            <p class="form-hint">Max 5MB · Cloudinary URL stored in Sheets</p>
            <div id="branchPreview">${branch?.image ? imagePreview(branch.image) : ''}</div>
          </div>
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn--outline" id="cancelBranch">Cancel</button>
      <button class="btn btn--primary" id="saveBranch">${isEdit ? 'Update' : 'Create'}</button>
    `
  });

  setupImagePreview(document.querySelector('#branchForm input[name="image"]'), document.getElementById('branchPreview'));
  document.getElementById('cancelBranch').addEventListener('click', closeModal);

  document.getElementById('saveBranch').addEventListener('click', async () => {
    const form = document.getElementById('branchForm');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const fd = new FormData(form);
    fd.set('active', form.querySelector('[name="active"]').checked ? 'true' : 'false');

    const coursesRaw = form.availableCourses.value.trim();
    if (coursesRaw) {
      const arr = coursesRaw.split(',').map((s) => s.trim()).filter(Boolean);
      fd.set('availableCourses', JSON.stringify(arr));
    }

    const btn = document.getElementById('saveBranch');
    btn.disabled = true;
    const progressEl = document.getElementById('uploadProgressSlot') || document.getElementById('branchPreview');

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
        await api(`/admin/branches/${branch.id}`, opts);
        toast('Branch updated', 'success');
      } else {
        await api('/admin/branches', opts);
        toast('Branch created', 'success');
      }
      clearUploadProgress(progressEl);
      closeModal();
      await loadBranches(container);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}
