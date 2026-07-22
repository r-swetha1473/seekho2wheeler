/* Seekho — shared frontend utilities (production-ready API layer) */
const Seekho = (() => {
  const cfg = window.SEEKHO_CONFIG || {};
  const API_BASE = String(cfg.API_BASE_URL || cfg.API_BASE || '').replace(/\/$/, '');
  const API = `${API_BASE}/api`;
  const cache = new Map();
  const CACHE_TTL = 60 * 1000;
  const MAX_RETRIES = 2;

  function toast(message, type = 'success', title = '') {
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    const titles = { success: 'Success', error: 'Error', warning: 'Warning', info: 'Info' };
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.innerHTML = `
      <div>
        <div class="toast__title">${title || titles[type] || 'Notice'}</div>
        <div class="toast__msg">${message}</div>
      </div>`;
    wrap.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 280);
    }, 3800);
  }

  function dialog({ title, message, type = 'info', confirmText = 'OK', cancelText = null, onConfirm }) {
    let overlay = document.querySelector('.dialog-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'dialog-overlay';
      document.body.appendChild(overlay);
    }
    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
    const colors = { success: 'var(--success)', error: 'var(--error)', warning: 'var(--warning)', info: 'var(--primary-dark)' };
    overlay.innerHTML = `
      <div class="dialog" role="dialog" aria-modal="true">
        <div class="dialog__icon" style="color:${colors[type]}"><i class="fa-solid ${icons[type]}"></i></div>
        <div class="dialog__title">${title}</div>
        <div class="dialog__msg">${message}</div>
        <div class="dialog__actions">
          ${cancelText ? `<button class="btn btn--outline" data-action="cancel">${cancelText}</button>` : ''}
          <button class="btn btn--primary" data-action="confirm">${confirmText}</button>
        </div>
      </div>`;
    overlay.classList.add('open');
    overlay.querySelector('[data-action="confirm"]').onclick = () => {
      overlay.classList.remove('open');
      if (onConfirm) onConfirm();
    };
    const cancelBtn = overlay.querySelector('[data-action="cancel"]');
    if (cancelBtn) cancelBtn.onclick = () => overlay.classList.remove('open');
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function api(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const cacheKey = method === 'GET' ? path : null;
    const retries = options.retries ?? (method === 'GET' ? MAX_RETRIES : 0);

    if (cacheKey && cache.has(cacheKey) && !options.nocache) {
      const hit = cache.get(cacheKey);
      if (Date.now() - hit.time < CACHE_TTL) return hit.data;
    }

    const headers = { ...(options.headers || {}) };
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    const url = `${API}${path}`;
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        if (attempt > 0) {
          console.warn(`[Seekho API] retry ${attempt}/${retries}`, url);
          await sleep(400 * attempt);
        }

        const res = await fetch(url, {
          ...options,
          headers,
          body: options.body instanceof FormData || typeof options.body === 'string'
            ? options.body
            : options.body
              ? JSON.stringify(options.body)
              : undefined
        });

        const contentType = res.headers.get('content-type') || '';
        let data;
        if (contentType.includes('application/json')) {
          data = await res.json();
        } else {
          const text = await res.text();
          console.error('[Seekho API] Non-JSON response', { url, status: res.status, preview: text.slice(0, 180) });
          throw new Error(
            res.status === 404
              ? 'API endpoint not found. Deployment may be missing the server.'
              : 'Unable to reach server. Please try again.'
          );
        }

        if (!res.ok || data.success === false) {
          throw new Error(data.message || `Request failed (${res.status})`);
        }

        if (cacheKey) cache.set(cacheKey, { time: Date.now(), data });
        return data;
      } catch (err) {
        lastError = err;
        console.error('[Seekho API]', { url, attempt, message: err.message });
        if (attempt === retries) break;
      }
    }

    throw lastError || new Error('Unable to reach server. Please try again.');
  }

  function clearCache(prefix = '') {
    if (!prefix) return cache.clear();
    [...cache.keys()].forEach((k) => {
      if (k.startsWith(prefix)) cache.delete(k);
    });
  }

  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return [...root.querySelectorAll(sel)]; }

  function formatPrice(n) {
    return `₹${Number(n).toLocaleString('en-IN')}`;
  }

  function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function stars(n = 5) {
    return '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
  }

  function siteUrl() {
    return (cfg.SITE_URL || window.location.origin || '').replace(/\/$/, '');
  }

  function lazyImages(root = document) {
    qsa('img[data-src]', root).forEach((img) => {
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }

  const PLACEHOLDER = '/images/placeholder.webp';

  function isCloudinaryUrl(src) {
    return typeof src === 'string' && src.includes('res.cloudinary.com');
  }

  /** Insert Cloudinary transform after /upload/ */
  function cloudinaryTransform(src, transform) {
    if (!isCloudinaryUrl(src)) return src;
    const marker = '/upload/';
    const idx = src.indexOf(marker);
    if (idx < 0) return src;
    // Avoid stacking if already has our responsive prefix
    const after = src.slice(idx + marker.length);
    if (after.startsWith('f_auto,q_auto')) {
      return src.replace(/\/upload\/[^/]+\//, `/upload/${transform}/`);
    }
    return `${src.slice(0, idx + marker.length)}${transform}/${after}`;
  }

  function responsiveSrcSet(src, widths = [400, 800, 1200, 1600]) {
    if (!isCloudinaryUrl(src)) return '';
    return widths
      .map((w) => `${cloudinaryTransform(src, `f_auto,q_auto,c_limit,w_${w}`)} ${w}w`)
      .join(', ');
  }

  function bindImageFallbacks(root = document) {
    qsa('img', root).forEach((img) => {
      if (img.dataset.fallbackBound) return;
      img.dataset.fallbackBound = '1';
      img.addEventListener('error', () => {
        if (img.dataset.fallbackApplied) return;
        img.dataset.fallbackApplied = '1';
        img.removeAttribute('srcset');
        img.src = PLACEHOLDER;
        img.classList.add('img-fallback');
      });
    });
  }

  function safeImg(src, alt, opts = {}) {
    const {
      w = 800,
      h = 600,
      className = 'img-cover',
      lazy = true,
      priority = false,
      sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px'
    } = opts;
    const url = src || PLACEHOLDER;
    const loading = priority || !lazy ? '' : 'loading="lazy"';
    const displaySrc = isCloudinaryUrl(url)
      ? cloudinaryTransform(url, `f_auto,q_auto,c_limit,w_${Math.min(w, 1600)}`)
      : url;
    const srcset = responsiveSrcSet(url);
    const srcsetAttr = srcset ? `srcset="${srcset}" sizes="${sizes}"` : '';
    return `<img src="${displaySrc}" ${srcsetAttr} alt="${String(alt || '').replace(/"/g, '&quot;')}" width="${w}" height="${h}" ${loading} decoding="async" class="${className}" data-fallback="${PLACEHOLDER}">`;
  }

  function openLightbox(src, alt = '') {
    let box = qs('.lightbox');
    if (!box) {
      box = document.createElement('div');
      box.className = 'lightbox';
      box.innerHTML = `<button class="lightbox__close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button><div class="lightbox__frame"><img alt=""></div>`;
      document.body.appendChild(box);
      box.querySelector('.lightbox__close').onclick = () => box.classList.remove('open');
      box.onclick = (e) => { if (e.target === box) box.classList.remove('open'); };
    }
    const img = box.querySelector('img');
    img.src = src || PLACEHOLDER;
    img.alt = alt;
    img.onerror = () => { img.src = PLACEHOLDER; };
    box.classList.add('open');
  }

  function initHeader() {
    const header = qs('.site-header');
    const toggle = qs('.nav-toggle');
    const nav = qs('.nav');
    const topBtn = qs('.float-top');

    window.addEventListener('scroll', () => {
      if (header) header.classList.toggle('scrolled', window.scrollY > 20);
      if (topBtn) topBtn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    if (toggle && nav) {
      toggle.addEventListener('click', () => nav.classList.toggle('open'));
    }

    qsa('.nav__dropdown > a').forEach((a) => {
      a.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024) {
          e.preventDefault();
          a.parentElement.classList.toggle('open');
        }
      });
    });

    if (topBtn) topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    const path = location.pathname.replace(/\/$/, '') || '/';
    qsa('.nav a').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const clean = href.replace(location.origin, '');
      if (path === '/' && (clean === '/' || clean.endsWith('index.html'))) a.classList.add('active');
      else if (path !== '/' && clean.includes(path.split('/').pop())) a.classList.add('active');
    });
  }

  function initFaq(container) {
    if (!container) return;
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.faq-item__q');
      if (!btn) return;
      const item = btn.parentElement;
      const open = item.classList.contains('open');
      qsa('.faq-item', container).forEach((i) => i.classList.remove('open'));
      if (!open) item.classList.add('open');
    });
  }

  async function trackVisit() {
    try {
      if (sessionStorage.getItem('seekho_visited')) return;
      await api('/visits', { method: 'POST', body: {}, retries: 0 });
      sessionStorage.setItem('seekho_visited', '1');
    } catch { /* silent */ }
  }

  async function loadSettings() {
    try {
      const res = await api('/settings');
      window.SEEKHO_SETTINGS = res.data;
      applySettings(res.data);
      return res.data;
    } catch (err) {
      console.error('[Seekho] settings failed', err.message);
      return null;
    }
  }

  function applySettings(s) {
    if (!s) return;
    qsa('[data-whatsapp]').forEach((el) => {
      const num = s.whatsapp || '9748481630';
      if (el.tagName === 'A') el.href = `https://wa.me/91${num}`;
    });
    qsa('[data-social="facebook"]').forEach((el) => { if (s.facebookUrl) el.href = s.facebookUrl; });
    qsa('[data-social="instagram"]').forEach((el) => { if (s.instagramUrl) el.href = s.instagramUrl; });
    qsa('[data-social="youtube"]').forEach((el) => { if (s.youtubeUrl) el.href = s.youtubeUrl; });
    qsa('[data-setting="trainedCandidates"]').forEach((el) => { el.textContent = s.trainedCandidates || '5000+'; });
    qsa('[data-setting="foundedYear"]').forEach((el) => { el.textContent = s.foundedYear || '2018'; });
    qsa('[data-setting="googleRating"]').forEach((el) => { el.textContent = s.googleRating || '4.9'; });
    qsa('[data-setting="facebookRating"]').forEach((el) => { el.textContent = s.facebookRating || '4.8'; });
    qsa('[data-setting="reviewCount"]').forEach((el) => { el.textContent = `${s.reviewCount || 500}+`; });
  }

  function hideLoader() {
    const loader = qs('.page-loader');
    if (loader) {
      requestAnimationFrame(() => loader.classList.add('hidden'));
      setTimeout(() => loader.remove(), 400);
    }
  }

  function validateForm(form) {
    let ok = true;
    qsa('[required]', form).forEach((field) => {
      const group = field.closest('.form-group');
      const valid = field.checkValidity() && String(field.value).trim() !== '';
      if (group) group.classList.toggle('has-error', !valid);
      if (!valid) ok = false;
    });
    const phone = form.querySelector('[name="phone"]');
    if (phone) {
      const digits = phone.value.replace(/\D/g, '').slice(-10);
      const valid = /^[6-9]\d{9}$/.test(digits);
      const group = phone.closest('.form-group');
      if (group) group.classList.toggle('has-error', !valid);
      if (!valid) ok = false;
    }
    return ok;
  }

  function sectionError(container, message, onRetry) {
    if (!container) return;
    container.innerHTML = `
      <div class="empty-state api-fallback">
        <p>${message}</p>
        ${onRetry ? '<button type="button" class="btn btn--outline btn--sm api-retry-btn">Retry</button>' : ''}
      </div>`;
    const btn = container.querySelector('.api-retry-btn');
    if (btn && onRetry) btn.addEventListener('click', onRetry);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    lazyImages();
    bindImageFallbacks();
    trackVisit();
    loadSettings().finally(hideLoader);
    if (window.AOS) AOS.init({ duration: 650, once: true, offset: 60 });
  });

  const mo = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.tagName === 'IMG') bindImageFallbacks(node.parentElement || document);
        else if (node.querySelectorAll) bindImageFallbacks(node);
      });
    });
  });
  if (typeof MutationObserver !== 'undefined') {
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  return {
    api, toast, dialog, qs, qsa, formatPrice, formatDate, stars,
    lazyImages, openLightbox, initFaq, loadSettings, validateForm,
    clearCache, hideLoader, bindImageFallbacks, safeImg, PLACEHOLDER,
    sectionError, siteUrl, API_BASE
  };
})();

window.Seekho = Seekho;
