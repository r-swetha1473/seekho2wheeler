import {
  api, toast, confirm,
  escapeHtml, formatDate, statusBadge,
  iconBtn
} from '../admin.js';

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

export default async function render(container) {
  container.innerHTML = '<div class="loading"><div class="loading__spinner"></div> Loading bookings…</div>';
  await loadBookings(container);
}

async function loadBookings(container, status = '') {
  try {
    const path = status ? `/admin/bookings?status=${encodeURIComponent(status)}` : '/admin/bookings';
    const { data } = await api(path);

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2 class="page-header__title">Bookings</h2>
          <p class="page-header__subtitle">Manage training session bookings</p>
        </div>
      </div>

      <div class="filters-bar">
        <select id="statusFilter">
          <option value="">All Statuses</option>
          ${STATUSES.map((s) => `<option value="${s}"${status === s ? ' selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
        </select>
        <span style="color:var(--text-muted);font-size:0.875rem;">${data.length} booking(s)</span>
      </div>

      <div class="card">
        <div class="card__body" style="padding:0;">
          ${data.length ? bookingTable(data) : emptyState()}
        </div>
      </div>
    `;

    document.getElementById('statusFilter').addEventListener('change', (e) => {
      loadBookings(container, e.target.value);
    });
    bindEvents(container, data);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__title">Error</div><p class="empty-state__text">${escapeHtml(err.message)}</p></div>`;
  }
}

function emptyState() {
  return `<div class="empty-state"><div class="empty-state__icon">📅</div><div class="empty-state__title">No bookings found</div><p class="empty-state__text">Bookings from the website will appear here.</p></div>`;
}

function bookingTable(bookings) {
  return `
    <div class="table-wrap table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Course</th>
            <th>Branch</th>
            <th>Date & Time</th>
            <th>Contact</th>
            <th>Status</th>
            <th>Submitted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${bookings.map((b) => `
            <tr data-id="${escapeHtml(b.id)}">
              <td><strong>${escapeHtml(b.name)}</strong>${b.message ? `<br><small style="color:var(--text-muted)">${escapeHtml(b.message.slice(0, 40))}${b.message.length > 40 ? '…' : ''}</small>` : ''}</td>
              <td>${escapeHtml(b.courseName)}</td>
              <td>${escapeHtml(b.branchName)}</td>
              <td>${escapeHtml(b.date || '—')}<br><small>${escapeHtml(b.timeSlot || '')}</small></td>
              <td>${escapeHtml(b.phone)}${b.email ? `<br><small>${escapeHtml(b.email)}</small>` : ''}</td>
              <td>${statusBadge(b.status)}</td>
              <td>${formatDate(b.createdAt)}</td>
              <td>
                <div class="table-actions">
                  <select class="form-control table-actions__select" data-action="status">
                    ${STATUSES.map((s) => `<option value="${s}"${b.status === s ? ' selected' : ''}>${s}</option>`).join('')}
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

function bindEvents(container, bookings) {
  container.querySelectorAll('tbody tr[data-id]').forEach((row) => {
    const id = row.dataset.id;
    const booking = bookings.find((b) => b.id === id);

    row.querySelector('[data-action="status"]')?.addEventListener('change', async (e) => {
      const newStatus = e.target.value;
      if (newStatus === booking.status) return;
      try {
        await api(`/admin/bookings/${id}/status`, {
          method: 'PATCH',
          json: { status: newStatus }
        });
        toast('Status updated', 'success');
        booking.status = newStatus;
      } catch (err) {
        toast(err.message, 'error');
        e.target.value = booking.status;
      }
    });

    row.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      const ok = await confirm(`Delete booking from ${booking.name}?`);
      if (!ok) return;
      try {
        await api(`/admin/bookings/${id}`, { method: 'DELETE' });
        toast('Booking deleted', 'success');
        const status = document.getElementById('statusFilter')?.value || '';
        await loadBookings(container, status);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}
