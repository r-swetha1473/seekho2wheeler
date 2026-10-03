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

  function sanitizeHtml(html) {
    if (window.SeekhoSanitize && typeof window.SeekhoSanitize.sanitizeHtml === 'function') {
      return window.SeekhoSanitize.sanitizeHtml(html);
    }
    return String(html || '');
  }

  function stripHtml(html) {
    if (window.SeekhoSanitize && typeof window.SeekhoSanitize.stripHtml === 'function') {
      return window.SeekhoSanitize.stripHtml(html);
    }
    return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function formatTitle(text, bold) {
    if (window.SeekhoSanitize && typeof window.SeekhoSanitize.formatTitle === 'function') {
      return window.SeekhoSanitize.formatTitle(text, bold);
    }
    const safe = String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    return bold ? `<strong>${safe}</strong>` : safe;
  }

  function courseDetailHref(c) {
    if (c && c.detailPath) return c.detailPath;
    const slug = String((c && (c.slug || c.bookingSlug || '')) || '').trim();
    if (!slug) return '/pages/courses.html';
    return `/courses/${encodeURIComponent(slug)}`;
  }

  function sectionCardHref(section) {
    const slug = (section && section.link_slug) || '';
    if (!slug) return '/pages/detail.html';
    if (String(slug).toLowerCase() === 'doorstep-training') return '/courses/doorstep-training';
    return `/p/${encodeURIComponent(slug)}`;
  }

  function classesLabel(c) {
    if (c && (c.classes_label || c.classesLabel)) return c.classes_label || c.classesLabel;
    const n = Number(c && c.classes);
    const count = Number.isFinite(n) && n >= 1 ? n : 1;
    return `${count} classes`;
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

    const liveCms = path.startsWith('/admin/')
      || /^\/(banners|home-sections|page-copy|settings|why-choose|updates)(\/|$)/.test(path);
    if (cacheKey && !liveCms && cache.has(cacheKey) && !options.nocache) {
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
          cache: options.cache || 'no-store',
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

        if (cacheKey && !liveCms) cache.set(cacheKey, { time: Date.now(), data });
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
    return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      const [setRes, copyRes] = await Promise.all([
        api('/settings'),
        api('/page-copy').catch(() => ({ data: [] }))
      ]);
      window.SEEKHO_SETTINGS = setRes.data;
      applyPageCopy(copyRes.data);
      applySettings(setRes.data);
      return setRes.data;
    } catch (err) {
      console.error('[Seekho] settings failed', err.message);
      return null;
    }
  }

  function applyPageCopy(items) {
    const map = {};
    (items || []).forEach((r) => {
      if (r && r.is_active !== false && r.page && r.slot) map[`${r.page}.${r.slot}`] = r;
    });
    window.SEEKHO_COPY = map;
    qsa('[data-copy]').forEach((el) => {
      const key = el.getAttribute('data-copy');
      const fieldAttr = el.getAttribute('data-copy-field');
      const field = fieldAttr || 'title';
      const row = map[key];
      if (!row) return;
      const hrefField = el.getAttribute('data-copy-href');
      if (hrefField && row[hrefField] && el.tagName === 'A') el.setAttribute('href', row[hrefField]);
      if (!fieldAttr && hrefField) return;
      const val = row[field];
      if (val == null || String(val).trim() === '') return;
      let html = sanitizeHtml(val);
      const inlineHost = /^(P|LABEL|SPAN|H1|H2|H3|H4|STRONG|BUTTON)$/.test(el.tagName);
      if (field === 'body_html' && inlineHost) {
        html = html.replace(/^\s*<p[^>]*>/i, '').replace(/<\/p>\s*$/i, '');
      }
      el.innerHTML = html;
    });
  }

  function isHttpsUrl(u) {
    try {
      return new URL(String(u)).protocol === 'https:';
    } catch {
      return false;
    }
  }

  function escapeAttr(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function hasLatLng(lat, lng) {
    const ls = String(lat ?? '').trim();
    const gs = String(lng ?? '').trim();
    if (!ls || !gs) return false;
    const a = Number(ls);
    const b = Number(gs);
    return Number.isFinite(a) && a >= -90 && a <= 90 && Number.isFinite(b) && b >= -180 && b <= 180;
  }

  function mapsDirectionsUrl(lat, lng) {
    if (!hasLatLng(lat, lng)) return '';
    return `https://www.google.com/maps/dir/?api=1&destination=${Number(lat)},${Number(lng)}`;
  }

  function mapsEmbedUrl(lat, lng) {
    if (!hasLatLng(lat, lng)) return '';
    return `https://maps.google.com/maps?q=${Number(lat)},${Number(lng)}&z=15&output=embed`;
  }

  function branchMapsHref(b) {
    if (!b) return '';
    if (b.mapsLink && isHttpsUrl(b.mapsLink)) return b.mapsLink;
    return mapsDirectionsUrl(b.latitude, b.longitude);
  }

  function branchMapButtonsHtml(b) {
    const map = branchMapsHref(b);
    const dir = mapsDirectionsUrl(b && b.latitude, b && b.longitude);
    const parts = [];
    if (map) {
      parts.push(`<a href="${escapeAttr(map)}" target="_blank" rel="noopener" class="btn btn--outline btn--sm"><i class="fa-solid fa-map"></i> Map</a>`);
    }
    if (dir && dir !== map) {
      parts.push(`<a href="${escapeAttr(dir)}" target="_blank" rel="noopener" class="btn btn--outline btn--sm"><i class="fa-solid fa-route"></i> Get directions</a>`);
    }
    return parts.join('');
  }

  function applyLocalBusinessSchema(s) {
    const mb = s && s.mainBranch;
    qsa('script[type="application/ld+json"]').forEach((el) => {
      let data;
      try { data = JSON.parse(el.textContent); } catch { return; }
      const list = Array.isArray(data) ? data : [data];
      let changed = false;
      list.forEach((node) => {
        if (!node || node['@type'] !== 'LocalBusiness') return;
        changed = true;
        // Main Branch structured address is authoritative — never flatten to a free-text streetAddress.
        if (mb && mb.address) {
          node.name = mb.name || node.name;
          if (mb.alternateName) node.alternateName = mb.alternateName;
          node.address = { ...mb.address, '@type': 'PostalAddress' };
          if (mb.mapsUrl && isHttpsUrl(mb.mapsUrl)) node.hasMap = mb.mapsUrl;
        } else if (node.address && typeof node.address === 'object' && node.address.streetAddress) {
          // Keep existing structured address from static HTML; do not overwrite with s.address.
        } else if (s.address) {
          node.address = {
            '@type': 'PostalAddress',
            addressCountry: 'IN',
            streetAddress: s.address
          };
        }
        const same = new Set((Array.isArray(node.sameAs) ? node.sameAs : []).filter(Boolean));
        [s.facebookUrl, s.instagramUrl, s.youtubeUrl, mb && mb.mapsUrl, s.gmb_url].forEach((u) => {
          if (u && isHttpsUrl(u)) same.add(u);
        });
        node.sameAs = [...same];
        if (!node.hasMap && s.gmb_url && isHttpsUrl(s.gmb_url)) node.hasMap = s.gmb_url;
        if (hasLatLng(s.latitude, s.longitude)) {
          node.geo = {
            '@type': 'GeoCoordinates',
            latitude: Number(s.latitude),
            longitude: Number(s.longitude)
          };
        }
        // Keep JSON-LD telephones on the two official numbers only (never stale Sheet/HTML values).
        const OFFICIAL = ['9748481630', '7980108587'];
        const BLOCKED = new Set(['7980110273']);
        const fromSettings = (Array.isArray(s.phones) ? s.phones : String(s.phones || '').split(/[,|·]/))
          .map((p) => String(p).replace(/\D/g, ''))
          .filter((d) => d && !BLOCKED.has(d) && OFFICIAL.includes(d));
        const phones = fromSettings.length ? [...new Set(fromSettings)] : OFFICIAL;
        node.telephone = phones.map((p) => (p.startsWith('+') ? p : `+91${p}`));
      });
      if (changed) el.textContent = JSON.stringify(Array.isArray(data) ? list : list[0]);
    });
  }

  function fillAcademyLocation(s) {
    const mb = s && s.mainBranch;
    const mapsUrl = (mb && mb.mapsUrl && isHttpsUrl(mb.mapsUrl))
      ? mb.mapsUrl
      : (s.gmb_url && isHttpsUrl(s.gmb_url) ? s.gmb_url : '');
    const bits = [];
    if (mapsUrl) {
      bits.push(`<a class="btn btn--primary btn--sm" href="${escapeAttr(mapsUrl)}" target="_blank" rel="noopener">Find us on Google</a>`);
    }
    const dir = mapsDirectionsUrl(s.latitude, s.longitude);
    if (dir) {
      bits.push(`<a class="btn btn--outline btn--sm" href="${escapeAttr(dir)}" target="_blank" rel="noopener">Get directions</a>`);
    }
    const actions = qs('#gmbActions');
    if (actions) {
      const slot = actions.querySelector('[data-gmb-btns]') || actions;
      slot.innerHTML = bits.join(' ');
      actions.hidden = bits.length === 0;
    }

    let embedSrc = '';
    if (mb && mb.embedUrl && isHttpsUrl(mb.embedUrl)) embedSrc = mb.embedUrl;
    else if (s.map_embed_url && isHttpsUrl(s.map_embed_url)) embedSrc = s.map_embed_url;
    else embedSrc = mapsEmbedUrl(s.latitude, s.longitude);
    const wrap = qs('#academyMapWrap');
    if (wrap) {
      if (embedSrc) {
        wrap.hidden = false;
        wrap.innerHTML = `<iframe title="Main branch location map" src="${escapeAttr(embedSrc)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`;
      } else {
        wrap.hidden = true;
        wrap.innerHTML = '';
      }
    }

    const ext = mapsUrl || dir;
    qsa('[data-gmb-link]').forEach((el) => {
      if (ext) {
        el.href = ext;
        el.target = '_blank';
        el.rel = 'noopener';
      } else {
        el.href = '/pages/branches.html';
        el.removeAttribute('target');
        el.removeAttribute('rel');
      }
    });

    qsa('[data-main-branch-address]').forEach((el) => {
      el.textContent = (mb && mb.formattedAddress) || s.address || el.textContent;
    });
    qsa('[data-main-branch-name]').forEach((el) => {
      el.textContent = (mb && mb.name) || el.textContent;
    });
  }

  function applySettings(s) {
    if (!s) return;
    if (s.baseUrl) {
      const base = String(s.baseUrl).replace(/\/$/, '');
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        const path = location.pathname.replace(/\/$/, '') || '/';
        canonical.href = path === '/' ? `${base}/` : `${base}${path}`;
      }
      const ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) {
        const path = location.pathname.replace(/\/$/, '') || '/';
        ogUrl.setAttribute('content', path === '/' ? `${base}/` : `${base}${path}`);
      }
    }
    qsa('[data-whatsapp]').forEach((el) => {
      const num = s.whatsapp || '9748481630';
      if (el.tagName === 'A') el.href = `https://wa.me/91${String(num).replace(/\D/g, '').slice(-10)}`;
    });
    qsa('[data-whatsapp-number]').forEach((el) => {
      el.textContent = s.whatsapp || '9748481630';
    });
    qsa('[data-social="facebook"]').forEach((el) => {
      if (s.facebookUrl) { el.href = s.facebookUrl; el.target = '_blank'; el.rel = 'noopener'; }
    });
    qsa('[data-social="instagram"]').forEach((el) => {
      if (s.instagramUrl) { el.href = s.instagramUrl; el.target = '_blank'; el.rel = 'noopener'; }
    });
    qsa('[data-social="youtube"]').forEach((el) => {
      if (s.youtubeUrl) { el.href = s.youtubeUrl; el.target = '_blank'; el.rel = 'noopener'; }
    });
    qsa('[data-setting="trainedCandidates"]').forEach((el) => { el.textContent = s.trainedCandidates || '5000+'; });
    qsa('[data-setting="foundedYear"]').forEach((el) => { el.textContent = s.foundedYear || '2018'; });
    qsa('[data-setting="googleRating"]').forEach((el) => { el.textContent = s.googleRating || '4.9'; });
    qsa('[data-setting="facebookRating"]').forEach((el) => { el.textContent = s.facebookRating || '4.8'; });
    qsa('[data-setting="reviewCount"]').forEach((el) => { el.textContent = `${s.reviewCount || 500}+`; });
    qsa('[data-setting="tagline"]').forEach((el) => {
      const raw = s.tagline || el.textContent;
      el.innerHTML = formatTitle(raw, s.tagline_bold);
    });
    const OFFICIAL_PHONES = ['9748481630', '7980108587'];
    const BLOCKED = new Set(['7980110273']);
    const phonesRaw = Array.isArray(s.phones)
      ? s.phones
      : String(s.phones || '').split(/[,|·]/).map((x) => x.trim()).filter(Boolean);
    const phones = phonesRaw
      .map((p) => String(p).replace(/\D/g, ''))
      .filter((d) => d && !BLOCKED.has(d) && OFFICIAL_PHONES.includes(d));
    const displayPhones = phones.length ? [...new Set(phones)] : OFFICIAL_PHONES;
    const phoneHtml = displayPhones
      .map((p) => `<a href="tel:${p}">${p}</a>`)
      .join(' <span class="phone-sep" aria-hidden="true">·</span> ');
    qsa('[data-footer-phones]').forEach((el) => {
      el.innerHTML = phoneHtml;
      el.classList.add('phones-inline');
    });
    qsa('[data-footer-phones-list]').forEach((el) => {
      el.innerHTML = displayPhones.map((p) => `<i class="fa-solid fa-phone"></i> <a href="tel:${p}">${p}</a>`).join('<br>');
    });
    qsa('[data-phones]').forEach((el) => {
      el.innerHTML = phoneHtml;
      el.classList.add('phones-inline');
    });
    if (displayPhones[0]) {
      qsa('[data-call-primary]').forEach((el) => {
        el.href = `tel:${displayPhones[0]}`;
      });
    }
    qsa('[data-setting="workingHours"]').forEach((el) => { el.textContent = s.workingHours || el.textContent; });
    qsa('[data-setting="email"]').forEach((el) => {
      if (s.email) {
        if (el.tagName === 'A') { el.href = `mailto:${s.email}`; el.textContent = s.email; }
        else el.textContent = s.email;
      }
    });
    qsa('[data-setting="header_cta_text"]').forEach((el) => { if (s.header_cta_text) el.textContent = s.header_cta_text; });
    qsa('[data-setting="footer_cta_title"]').forEach((el) => { if (s.footer_cta_title) el.textContent = s.footer_cta_title; });
    qsa('[data-setting="footer_cta_text"]').forEach((el) => { if (s.footer_cta_text) el.textContent = s.footer_cta_text; });
    qsa('[data-setting="footer_cta_button"]').forEach((el) => { if (s.footer_cta_button) el.textContent = s.footer_cta_button; });
    qsa('[data-setting="copyright_text"]').forEach((el) => { if (s.copyright_text) el.textContent = s.copyright_text; });
    qsa('[data-setting="logo_subline"]').forEach((el) => { if (s.logo_subline) el.textContent = s.logo_subline; });
    qsa('[data-href-setting]').forEach((el) => {
      const key = el.getAttribute('data-href-setting');
      if (key && s[key]) el.setAttribute('href', s[key]);
    });
    fillAcademyLocation(s);
    applyLocalBusinessSchema(s);
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
    sectionError, siteUrl, API_BASE, sanitizeHtml, stripHtml, formatTitle,
    courseDetailHref, sectionCardHref, classesLabel, branchMapButtonsHtml, mapsDirectionsUrl, hasLatLng
  };
})();

window.Seekho = Seekho;
