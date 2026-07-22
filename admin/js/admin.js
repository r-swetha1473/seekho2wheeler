export const TOKEN_KEY = 'seekho_admin_token';

const ROUTE_TITLES = {
  dashboard: 'Dashboard',
  banners: 'Banners',
  gallery: 'Gallery',
  blogs: 'Blogs',
  branches: 'Branches',
  pricing: 'Pricing',
  bookings: 'Bookings',
  enquiries: 'Enquiries',
  faqs: 'FAQs',
  testimonials: 'Testimonials',
  settings: 'Settings'
};

const MODULES = {
  dashboard: () => import('./modules/dashboard.js'),
  banners: () => import('./modules/banners.js'),
  gallery: () => import('./modules/gallery.js'),
  blogs: () => import('./modules/blogs.js'),
  branches: () => import('./modules/branches.js'),
  pricing: () => import('./modules/pricing.js'),
  bookings: () => import('./modules/bookings.js'),
  enquiries: () => import('./modules/enquiries.js'),
  faqs: () => import('./modules/faqs.js'),
  testimonials: () => import('./modules/testimonials.js'),
  settings: () => import('./modules/settings.js')
};

let currentAdmin = null;
let confirmResolve = null;

/* ========== API ========== */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  window.location.href = '/admin/login.html';
}

export async function api(path, options = {}) {
  const { method = 'GET', body, json, formData, headers = {}, onProgress } = options;
  const token = getToken();

  const base = (typeof window !== 'undefined' && window.SEEKHO_CONFIG && window.SEEKHO_CONFIG.API_BASE_URL)
    ? String(window.SEEKHO_CONFIG.API_BASE_URL).replace(/\/$/, '')
    : '';
  const url = `${base}/api${path}`;

  // XHR path when upload progress is needed
  if (formData && typeof onProgress === 'function') {
    return apiUploadXhr(url, { method, formData, token, onProgress });
  }

  const opts = { method, headers: { ...headers } };
  if (token) opts.headers.Authorization = `Bearer ${token}`;

  if (formData) {
    opts.body = formData;
  } else if (json !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(json);
  } else if (body) {
    opts.body = body;
  }

  const res = await fetch(url, opts);
  let data;
  try {
    data = await res.json();
  } catch {
    data = { success: false, message: 'Invalid server response' };
  }

  if (res.status === 401) {
    logout();
    throw new Error('Session expired');
  }

  if (!res.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }

  return data;
}

function apiUploadXhr(url, { method = 'POST', formData, token, onProgress }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const pct = Math.round((e.loaded / e.total) * 100);
      onProgress(pct, e.loaded, e.total);
    };

    xhr.onload = () => {
      let data;
      try {
        data = JSON.parse(xhr.responseText || '{}');
      } catch {
        data = { success: false, message: 'Invalid server response' };
      }
      if (xhr.status === 401) {
        logout();
        reject(new Error('Session expired'));
        return;
      }
      if (xhr.status >= 400 || data.success === false) {
        reject(new Error(data.message || `Request failed (${xhr.status})`));
        return;
      }
      resolve(data);
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Validate a File is an image ≤ 5MB. Throws Error. */
export function validateImageFile(file, { maxBytes = MAX_IMAGE_BYTES } = {}) {
  if (!file) throw new Error('No image selected');
  if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed');
  if (file.size > maxBytes) {
    throw new Error('Image must be 5MB or smaller');
  }
  return true;
}

/**
 * Compress large images in the browser (canvas → JPEG/WebP).
 * Skips tiny files. Returns a File ready for FormData.
 */
export async function compressImageFile(file, opts = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.82,
    minBytesToCompress = 700 * 1024
  } = opts;

  validateImageFile(file);
  if (file.size < minBytesToCompress) return file;

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else canvas.toBlob((b2) => resolve(b2), 'image/jpeg', quality);
      },
      'image/webp',
      quality
    );
  });

  if (!blob) return file;
  if (blob.size >= file.size) return file;

  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const name = file.name.replace(/\.[^.]+$/, '') + `.${ext}`;
  return new File([blob], name, { type: blob.type, lastModified: Date.now() });
}

export async function prepareImageFiles(fileList, compressOpts) {
  const files = Array.from(fileList || []);
  const out = [];
  for (const f of files) {
    validateImageFile(f);
    out.push(await compressImageFile(f, compressOpts));
  }
  return out;
}

export function renderUploadProgress(container, pct, label = 'Uploading') {
  if (!container) return;
  const safe = Math.max(0, Math.min(100, Number(pct) || 0));
  container.innerHTML = `
    <div class="upload-progress" role="progressbar" aria-valuenow="${safe}" aria-valuemin="0" aria-valuemax="100">
      <div class="upload-progress__bar" style="width:${safe}%"></div>
      <span class="upload-progress__label">${label}… ${safe}%</span>
    </div>`;
}

export function clearUploadProgress(container) {
  if (container) container.innerHTML = '';
}

/* ========== UTILITIES ========== */
export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function formatCurrency(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

export function statusBadge(status) {
  const s = (status || '').toLowerCase();
  const cls = ['pending', 'confirmed', 'completed', 'cancelled', 'new', 'read', 'resolved', 'active', 'inactive', 'published', 'draft', 'scheduled'].includes(s)
    ? s : 'read';
  return `<span class="badge badge--${cls}">${escapeHtml(status || '—')}</span>`;
}

export function imagePreview(src, square) {
  if (!src) return '';
  const cls = square ? ' image-preview--square image-preview--contain' : '';
  return `<div class="image-preview${cls}"><img src="${escapeHtml(src)}" alt="Preview" onerror="this.src='/images/placeholder.webp'"></div>`;
}

export function setupImagePreview(input, container, opts = {}) {
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      validateImageFile(file);
    } catch (err) {
      toast(err.message, 'error');
      input.value = '';
      return;
    }
    const url = URL.createObjectURL(file);
    const extra = opts.square ? ' image-preview--square' : opts.ratio === '43' ? ' image-preview--43' : opts.ratio === 'blog' ? ' image-preview--blog' : '';
    const sizeKb = Math.round(file.size / 1024);
    container.innerHTML = `
      <div class="image-preview${extra}"><img src="${url}" alt="Preview"></div>
      <p class="form-hint form-hint--preview">${escapeHtml(file.name)} · ${sizeKb} KB (max 5MB)</p>
      <div class="upload-progress-slot" id="${opts.progressId || 'uploadProgressSlot'}"></div>`;
  });
}

export function setupMultiImagePreview(input, container) {
  input.addEventListener('change', () => {
    container.innerHTML = '';
    const files = Array.from(input.files || []);
    for (const file of files) {
      try {
        validateImageFile(file);
      } catch (err) {
        toast(err.message, 'error');
        input.value = '';
        container.innerHTML = '';
        return;
      }
    }
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      container.innerHTML += `<div class="image-preview image-preview--square"><img src="${url}" alt="Preview"></div>`;
    });
    container.insertAdjacentHTML(
      'beforeend',
      `<p class="form-hint form-hint--preview">${files.length} image(s) selected · max 5MB each</p>
       <div class="upload-progress-slot" id="uploadProgressSlot"></div>`
    );
  });
}

/* ========== ICON BUTTONS ========== */
export const ICONS = {
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  delete: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
  view: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  toggle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>'
};

export function iconBtn(action, title, extraAttrs = '') {
  const icon = ICONS[action] || '';
  return `<button type="button" class="btn-icon btn-icon--${action}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}" data-action="${action}"${extraAttrs}>${icon}</button>`;
}

export function addBtn(label, id) {
  return `<button type="button" class="btn btn--primary" id="${id}">${ICONS.plus}<span>${escapeHtml(label)}</span></button>`;
}

/* ========== TOAST ========== */
export function toast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

/* ========== CONFIRM ========== */
export function confirm(message, title = 'Confirm', okLabel = 'Delete') {
  return new Promise((resolve) => {
    confirmResolve = resolve;
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmOk').textContent = okLabel;
    document.getElementById('confirmBackdrop').classList.add('show');
  });
}

function closeConfirm(result) {
  document.getElementById('confirmBackdrop').classList.remove('show');
  if (confirmResolve) {
    confirmResolve(result);
    confirmResolve = null;
  }
}

/* ========== MODAL ========== */
export function openModal({ title, body, footer, size }) {
  const backdrop = document.getElementById('modalBackdrop');
  const modal = document.getElementById('modal');
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = body;
  document.getElementById('modalFooter').innerHTML = footer || '';
  modal.classList.toggle('modal--lg', size === 'lg');
  backdrop.classList.add('show');
}

export function closeModal() {
  document.getElementById('modalBackdrop').classList.remove('show');
}

/* ========== NOTIFICATIONS ========== */
export async function loadNotifications() {
  try {
    const { data } = await api('/admin/notifications');
    const unread = data.filter((n) => !n.read).length;
    const badge = document.getElementById('notifBadge');
    badge.textContent = unread > 99 ? '99+' : unread;
    badge.dataset.count = unread;

    const list = document.getElementById('notifList');
    if (!data.length) {
      list.innerHTML = '<div class="notif-panel__empty">No notifications yet</div>';
      return;
    }

    list.innerHTML = data.map((n) => `
      <div class="notif-item${n.read ? '' : ' notif-item--unread'}" data-id="${escapeHtml(n.id)}" data-type="${escapeHtml(n.type)}">
        <div class="notif-item__title">${escapeHtml(n.title)}</div>
        <div class="notif-item__msg">${escapeHtml(n.message)}</div>
        <div class="notif-item__time">${formatDate(n.createdAt)}</div>
      </div>
    `).join('');

    list.querySelectorAll('.notif-item').forEach((item) => {
      item.addEventListener('click', async () => {
        if (!item.classList.contains('notif-item--unread')) return;
        try {
          await api(`/admin/notifications/${item.dataset.id}/read`, { method: 'PATCH' });
          item.classList.remove('notif-item--unread');
          loadNotifications();
        } catch { /* ignore */ }
      });
    });
  } catch { /* ignore */ }
}

/* ========== ROUTER ========== */
let currentModule = null;

async function navigate() {
  const route = (location.hash.slice(1) || 'dashboard').split('?')[0];
  const loader = MODULES[route] || MODULES.dashboard;
  const actualRoute = MODULES[route] ? route : 'dashboard';

  document.querySelectorAll('.admin-nav__item[data-route]').forEach((el) => {
    el.classList.toggle('active', el.dataset.route === actualRoute);
  });

  document.getElementById('pageTitle').textContent = ROUTE_TITLES[actualRoute] || 'Dashboard';

  const container = document.getElementById('adminContent');
  container.innerHTML = '<div class="loading"><div class="loading__spinner"></div> Loading…</div>';

  closeSidebar();

  try {
    const mod = await loader();
    currentModule = mod;
    await mod.default(container);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__title">Error loading page</div><p class="empty-state__text">${escapeHtml(err.message)}</p><button class="btn btn--primary" onclick="location.reload()">Retry</button></div>`;
  }
}

/* ========== SIDEBAR ========== */
function closeSidebar() {
  document.getElementById('adminSidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
}

/* ========== INIT ========== */
async function init() {
  if (!getToken()) {
    window.location.href = '/admin/login.html';
    return;
  }

  try {
    const { data } = await api('/auth/me');
    currentAdmin = data;
    const userText = data.email || 'Admin';
    document.getElementById('topbarUser').textContent = userText;
    document.getElementById('sidebarUser').textContent = userText;
  } catch {
    return;
  }

  window.addEventListener('hashchange', navigate);
  navigate();
  loadNotifications();

  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });

  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('adminSidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('show');
  });

  document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);

  document.getElementById('notifBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('notifPanel').classList.toggle('show');
    loadNotifications();
  });

  document.addEventListener('click', () => {
    document.getElementById('notifPanel').classList.remove('show');
  });

  document.getElementById('notifPanel').addEventListener('click', (e) => e.stopPropagation());

  document.getElementById('markAllRead').addEventListener('click', async () => {
    try {
      await api('/admin/notifications/all/read', { method: 'PATCH' });
      loadNotifications();
      toast('All notifications marked as read', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalBackdrop').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.getElementById('confirmCancel').addEventListener('click', () => closeConfirm(false));
  document.getElementById('confirmOk').addEventListener('click', () => closeConfirm(true));
  document.getElementById('confirmBackdrop').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeConfirm(false);
  });
}

window.AdminApp = {
  api, toast, confirm, openModal, closeModal,
  escapeHtml, formatDate, formatCurrency, statusBadge,
  imagePreview, setupImagePreview, setupMultiImagePreview,
  validateImageFile, compressImageFile, prepareImageFiles,
  renderUploadProgress, clearUploadProgress,
  iconBtn, addBtn, ICONS,
  getToken, logout, loadNotifications
};

init();
