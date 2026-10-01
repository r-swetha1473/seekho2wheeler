/* Generic detail page: /p/:slug or ?type=course&slug= / ?type=home&slug= */
(function () {
  const { api, qs, formatPrice, safeImg, sanitizeHtml, stripHtml, formatTitle, classesLabel, siteUrl } = Seekho;

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function parseRoute() {
    const pathMatch = location.pathname.match(/^\/p\/([^/]+)\/?$/);
    if (pathMatch) {
      return { mode: 'page', slug: decodeURIComponent(pathMatch[1]) };
    }
    const params = new URLSearchParams(location.search);
    const type = params.get('type') || '';
    const slug = params.get('slug') || '';
    if (type === 'course') return { mode: 'course', slug };
    return { mode: 'page', slug };
  }

  function applySeo({ title, description, canonical, noindex }) {
    const fullTitle = title || 'Details | Seekho Two Wheeler Academy';
    document.title = fullTitle;
    const desc = description || '';
    const setMeta = (selector, attr, value) => {
      const el = document.querySelector(selector);
      if (el && value != null) el.setAttribute(attr, value);
    };
    setMeta('meta[name="description"]', 'content', desc);
    setMeta('meta[property="og:title"]', 'content', fullTitle);
    setMeta('meta[property="og:description"]', 'content', desc);
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.rel = 'canonical';
      document.head.appendChild(canonicalEl);
    }
    if (canonical) canonicalEl.href = canonical;
    setMeta('meta[property="og:url"]', 'content', canonical || '');
    let robots = document.querySelector('meta[name="robots"]');
    if (noindex) {
      if (!robots) {
        robots = document.createElement('meta');
        robots.setAttribute('name', 'robots');
        document.head.appendChild(robots);
      }
      robots.setAttribute('content', 'noindex, follow');
    }
  }

  const route = parseRoute();
  const loading = qs('#detailLoading');
  const article = qs('#detailArticle');
  const heroTitle = qs('#detailHeroTitle');
  const crumb = qs('#detailCrumb');
  const crumbParent = qs('#detailCrumbParent');
  const crumbMid = qs('#detailCrumbMidWrap');

  function normalizeSlug(value) {
    try {
      return decodeURIComponent(String(value || '').trim()).toLowerCase();
    } catch {
      return String(value || '').trim().toLowerCase();
    }
  }

  function stopLoading() {
    if (loading) loading.remove();
  }

  function setCrumbParent(href, label) {
    if (crumbMid) crumbMid.hidden = !href;
    if (!crumbParent || !href) return;
    crumbParent.href = href;
    crumbParent.textContent = label;
  }

  function showNotFound(slug) {
    stopLoading();
    if (heroTitle) heroTitle.textContent = 'Page not found';
    if (crumb) crumb.textContent = 'Not found';
    setCrumbParent('', '');
    applySeo({
      title: 'Page not found | Seekho Two Wheeler Academy',
      description: 'This page is not available.',
      canonical: `${siteUrl()}/p/${encodeURIComponent(slug || '')}`,
      noindex: true
    });
    if (article) {
      article.hidden = false;
      article.innerHTML = `
        <p class="empty-state">This page was not found.</p>
        <p style="text-align:center;margin-top:1rem"><a class="btn btn--primary" href="/">Back to home</a></p>`;
    }
  }

  function showError(retry) {
    stopLoading();
    if (heroTitle) heroTitle.textContent = 'Unable to load';
    if (article) {
      article.hidden = false;
      Seekho.sectionError(article, 'Unable to load this page right now. Please try again.', retry);
    }
  }

  function comingSoon(title, canonical, extra = {}) {
    const heading = title || 'Details';
    if (heroTitle) heroTitle.textContent = heading;
    if (crumb) crumb.textContent = heading;
    applySeo({
      title: extra.seo_title || `${heading} | Seekho Two Wheeler Academy`,
      description: extra.seo_description || 'Full details will be published here soon.',
      canonical,
      noindex: true
    });
    stopLoading();
    if (article) {
      article.hidden = false;
      article.innerHTML = `
        <p class="empty-state">Details coming soon.</p>
        <p style="text-align:center;margin-top:1rem"><a class="btn btn--primary" href="/">Back to home</a></p>`;
    }
  }

  function showArticle(html) {
    stopLoading();
    if (article) {
      article.hidden = false;
      article.innerHTML = html;
    }
    if (window.AOS) AOS.refresh();
  }

  function bindDetailAccordion(root) {
    if (!root) return;
    root.querySelectorAll('[data-doorstep-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.doorstep-service');
        const open = btn.getAttribute('aria-expanded') === 'true';
        root.querySelectorAll('[data-doorstep-toggle]').forEach((other) => {
          other.setAttribute('aria-expanded', 'false');
          const panel = other.closest('.doorstep-service')?.querySelector('.doorstep-service__panel');
          if (panel) panel.hidden = true;
        });
        if (!open && card) {
          btn.setAttribute('aria-expanded', 'true');
          const panel = card.querySelector('.doorstep-service__panel');
          if (panel) panel.hidden = false;
        }
      });
    });
  }

  function sectionExtrasHtml(section, pageBody) {
    if (!section) return '';
    const feats = Array.isArray(section.features) ? section.features.filter((f) => f && (f.text || f.icon || f.detail)) : [];
    if (!feats.length && !section.description) return '';
    const cards = feats.length
      ? `<div class="doorstep-grid" style="margin-top:1rem">
          ${feats.map((f, i) => {
            const heading = f.text || `Service ${i + 1}`;
            const panelHtml = f.detail ? sanitizeHtml(f.detail) : sanitizeHtml(section.description || '');
            return `
            <article class="doorstep-service">
              <button type="button" class="doorstep-service__toggle" data-doorstep-toggle aria-expanded="false">
                <span class="doorstep-service__icon">${escapeHtml(f.icon || '')}</span>
                <span class="doorstep-service__copy">
                  <span class="doorstep-service__title">${escapeHtml(heading)}</span>
                  <span class="doorstep-service__hint">View details</span>
                </span>
                <i class="fa-solid fa-chevron-down doorstep-service__chevron" aria-hidden="true"></i>
              </button>
              <div class="doorstep-service__panel rich-html" hidden>${panelHtml}</div>
            </article>`;
          }).join('')}
        </div>`
      : '';
    const lede = (!pageBody && section.description)
      ? `<div class="blog-detail__content rich-html">${sanitizeHtml(section.description)}</div>`
      : '';
    return `${lede}${cards}`;
  }

  async function matchingHomeSection(slug) {
    try {
      const { data } = await api('/home-sections');
      const needle = normalizeSlug(slug);
      return (data || []).find((s) => normalizeSlug(s.link_slug) === needle) || null;
    } catch {
      return null;
    }
  }

  async function loadCourse() {
    const slug = route.slug;
    const canonical = `${siteUrl()}/pages/detail.html?type=course&slug=${encodeURIComponent(slug)}`;
    if (!slug) {
      comingSoon('Details', `${siteUrl()}/pages/detail.html`);
      return;
    }
    try {
      const { data } = await api('/pricing');
      const needle = String(slug || '').toLowerCase();
      const courseSlug = (c) => {
        const own = String(c.slug || '').trim().toLowerCase();
        if (own) return own;
        return String(c.name || c.courseName || '')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      };
      const course = (data || []).find((c) => courseSlug(c) === needle);
      if (!course) {
        comingSoon('Details', canonical);
        return;
      }
      const name = course.name || course.courseName || 'Course';
      applySeo({
        title: `${name} | Seekho Two Wheeler Academy`,
        description: stripHtml(course.description || name).slice(0, 160),
        canonical
      });
      if (heroTitle) heroTitle.textContent = name;
      if (crumb) crumb.textContent = name;
      setCrumbParent('/pages/courses.html', 'Courses');
      const features = Array.isArray(course.features) ? course.features.filter(Boolean) : [];
      showArticle(`
        <div class="course-detail">
          <div class="course-detail__media media-frame media-frame--43" data-aos="fade-up">
            ${course.badge ? `<span class="course-card__badge">${escapeHtml(course.badge)}</span>` : ''}
            ${safeImg(course.image_url || course.image, name, { w: 1200, h: 900, priority: true })}
          </div>
          <aside class="course-detail__aside" data-aos="fade-up">
            <p class="course-detail__aside-label">This programme</p>
            <p class="course-detail__price">${formatPrice(course.price)}</p>
            <p class="course-detail__classes"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${escapeHtml(classesLabel(course))}</p>
            <a href="/pages/booking.html?course=${encodeURIComponent(course.slug || name)}" class="btn btn--primary btn--lg course-detail__book">Book Training Now</a>
          </aside>
          <div class="course-detail__main" data-aos="fade-up">
            <div class="blog-detail__content rich-html">${sanitizeHtml(course.description || '')}</div>
            ${features.length ? `
              <h2 class="course-detail__list-title">What's included</h2>
              <ul class="course-detail__features">
                ${features.map((f) => `<li><i class="fa-solid fa-check" aria-hidden="true"></i><span>${escapeHtml(f)}</span></li>`).join('')}
              </ul>` : ''}
          </div>
        </div>`);
    } catch {
      comingSoon('Details', canonical);
    }
  }

  async function loadGeneric() {
    const slug = route.slug;
    const canonical = slug ? `${siteUrl()}/p/${encodeURIComponent(slug)}` : `${siteUrl()}/pages/detail.html`;
    if (!slug) {
      showNotFound('');
      return;
    }
    try {
      const res = await api(`/pages/${encodeURIComponent(slug)}`);
      if (res.found === false || !res.data) {
        showNotFound(slug);
        return;
      }
      const page = res.data;
      const title = page.title || 'Details';
      setCrumbParent('', '');
      if (heroTitle) heroTitle.innerHTML = sanitizeHtml(title);
      if (crumb) crumb.textContent = stripHtml(title);
      applySeo({
        title: page.seo_title || `${stripHtml(title)} | Seekho Two Wheeler Academy`,
        description: page.seo_description || stripHtml(page.body_html || '').slice(0, 160),
        canonical
      });

      const section = await matchingHomeSection(slug);
      const body = String(page.body_html || '').trim();
      const fallbackCopy = !body && page.seo_description
        ? `<p>${escapeHtml(page.seo_description)}</p>`
        : '';
      const extras = sectionExtrasHtml(section, body);
      const image = page.hero_image_url || (section && section.image_url) || '';

      showArticle(`
        ${image ? `
          <div class="blog-detail__cover media-frame media-frame--blog" data-aos="fade-up">
            ${safeImg(image, stripHtml(title), { w: 1600, h: 900, priority: true })}
          </div>` : ''}
        ${body ? `<div class="blog-detail__content rich-html" data-aos="fade-up">${sanitizeHtml(body)}</div>` : ''}
        ${!body && fallbackCopy ? `<div class="blog-detail__content rich-html" data-aos="fade-up">${fallbackCopy}</div>` : ''}
        ${extras}
        <div class="blog-detail__cta" data-aos="fade-up">
          <a class="btn btn--primary" href="/pages/booking.html">Book Training</a>
        </div>`);
      bindDetailAccordion(article);
    } catch (err) {
      console.error('[detail]', err);
      showError(loadGeneric);
    }
  }

  if (route.mode === 'course') loadCourse();
  else loadGeneric();
})();
