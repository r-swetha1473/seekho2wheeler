import { api, escapeHtml, formatDate, statusBadge, toast } from '../admin.js';

export default async function render(container) {
  try {
    const { data } = await api('/admin/stats');

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2 class="page-header__title">Dashboard</h2>
          <p class="page-header__subtitle">Overview of your academy website</p>
        </div>
      </div>

      <div class="stats-grid">
        ${statCard('Total Bookings', data.totalBookings, 'primary', '📅')}
        ${statCard("Today's Bookings", data.todaysBookings, 'success', '📆')}
        ${statCard('Enquiries', data.totalEnquiries, 'warning', '💬')}
        ${statCard('Branches', data.totalBranches, 'info', '🏢')}
        ${statCard('Gallery Images', data.totalGalleryImages, 'primary', '🖼️')}
        ${statCard('Blog Posts', data.totalBlogs, 'info', '📝')}
        ${statCard('Reviews', data.totalReviews, 'success', '⭐')}
        ${statCard('Website Visits', data.totalWebsiteVisits, 'warning', '👁️')}
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card__header">
            <h3 class="card__title">Recent Bookings</h3>
            <a href="#bookings" class="btn btn--sm btn--outline">View all</a>
          </div>
          <div class="card__body" style="padding:0;">
            ${recentBookingsTable(data.recentBookings)}
          </div>
        </div>

        <div class="card">
          <div class="card__header">
            <h3 class="card__title">Recent Enquiries</h3>
            <a href="#enquiries" class="btn btn--sm btn--outline">View all</a>
          </div>
          <div class="card__body" style="padding:0;">
            ${recentEnquiriesTable(data.recentEnquiries)}
          </div>
        </div>
      </div>
    `;

    if (data.unreadNotifications > 0) {
      const badge = document.getElementById('notifBadge');
      if (badge) {
        badge.textContent = data.unreadNotifications;
        badge.dataset.count = data.unreadNotifications;
      }
    }
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__title">Failed to load dashboard</div><p class="empty-state__text">${escapeHtml(err.message)}</p></div>`;
  }
}

function statCard(label, value, type, icon) {
  return `
    <div class="stat-card">
      <div class="stat-card__icon stat-card__icon--${type}">${icon}</div>
      <div>
        <div class="stat-card__value">${value ?? 0}</div>
        <div class="stat-card__label">${escapeHtml(label)}</div>
      </div>
    </div>
  `;
}

function recentBookingsTable(items) {
  if (!items?.length) {
    return '<div class="empty-state"><p class="empty-state__text">No bookings yet</p></div>';
  }
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Name</th><th>Course</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>
          ${items.map((b) => `
            <tr>
              <td>${escapeHtml(b.name)}</td>
              <td>${escapeHtml(b.courseName)}</td>
              <td>${escapeHtml(b.date || '—')}</td>
              <td>${statusBadge(b.status)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function recentEnquiriesTable(items) {
  if (!items?.length) {
    return '<div class="empty-state"><p class="empty-state__text">No enquiries yet</p></div>';
  }
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Name</th><th>Message</th><th>Date</th></tr></thead>
        <tbody>
          ${items.map((e) => `
            <tr>
              <td>${escapeHtml(e.name)}</td>
              <td>${escapeHtml((e.message || '').slice(0, 60))}${(e.message || '').length > 60 ? '…' : ''}</td>
              <td>${formatDate(e.createdAt)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
