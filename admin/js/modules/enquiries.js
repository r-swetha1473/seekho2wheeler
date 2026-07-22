import {
  api, toast, confirm,
  escapeHtml, formatDate, statusBadge,
  iconBtn
} from '../admin.js';

const STATUSES = ['new', 'read', 'resolved'];

export default async function render(container) {
  container.innerHTML = '<div class="loading"><div class="loading__spinner"></div> Loading enquiries…</div>';
  await loadEnquiries(container);
}

async function loadEnquiries(container) {
  try {
    const { data } = await api('/admin/enquiries');

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2 class="page-header__title">Enquiries</h2>
          <p class="page-header__subtitle">Contact form submissions from visitors</p>
        </div>
      </div>

      <div class="card">
        <div class="card__body" style="padding:0;">
          ${data.length ? enquiryTable(data) : emptyState()}
        </div>
      </div>
    `;

    bindEvents(container, data);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__title">Error</div><p class="empty-state__text">${escapeHtml(err.message)}</p></div>`;
  }
}

function emptyState() {
  return `<div class="empty-state"><div class="empty-state__icon">💬</div><div class="empty-state__title">No enquiries yet</div><p class="empty-state__text">Contact form messages will appear here.</p></div>`;
}

function enquiryTable(enquiries) {
  return `
    <div class="table-wrap table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>Message</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${enquiries.map((e) => `
            <tr data-id="${escapeHtml(e.id)}">
              <td><strong>${escapeHtml(e.name)}</strong></td>
              <td>${escapeHtml(e.phone)}${e.email ? `<br><small>${escapeHtml(e.email)}</small>` : ''}</td>
              <td style="max-width:280px;">${escapeHtml(e.message)}</td>
              <td>${statusBadge(e.status || 'new')}</td>
              <td>${formatDate(e.createdAt)}</td>
              <td>
                <div class="table-actions">
                  <select class="form-control table-actions__select" data-action="status">
                    ${STATUSES.map((s) => `<option value="${s}"${(e.status || 'new') === s ? ' selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
                  </select>
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

function bindEvents(container, enquiries) {
  container.querySelectorAll('tbody tr[data-id]').forEach((row) => {
    const id = row.dataset.id;
    const enquiry = enquiries.find((e) => e.id === id);

    row.querySelector('[data-action="status"]')?.addEventListener('change', async (e) => {
      const newStatus = e.target.value;
      try {
        await api(`/admin/enquiries/${id}/status`, {
          method: 'PATCH',
          json: { status: newStatus }
        });
        toast('Status updated', 'success');
        enquiry.status = newStatus;
      } catch (err) {
        toast(err.message, 'error');
        e.target.value = enquiry.status || 'new';
      }
    });

    row.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      const ok = await confirm(`Delete enquiry from ${enquiry.name}?`);
      if (!ok) return;
      try {
        await api(`/admin/enquiries/${id}`, { method: 'DELETE' });
        toast('Enquiry deleted', 'success');
        await loadEnquiries(container);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}
