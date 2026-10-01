/* Courses page — swipe carousel (mobile) / multi-card (desktop) */
(function () {
  const { api, qs, formatPrice, safeImg, sanitizeHtml, formatTitle, courseDetailHref, classesLabel } = Seekho;

  const HASH_ALIASES = {
    scooty: 'scooty-training',
    bike: 'bike-training',
    ladies: 'ladies-training',
    ev: 'electric-vehicle-training',
    road: 'road-practice',
    rto: 'rto-practice'
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function init() {
    const wrap = qs('#coursesPageGrid') || qs('#courseCards');
    if (!wrap) return;

    try {
      const { data } = await api('/pricing');
      wrap.className = 'swiper course-swiper';
      wrap.setAttribute('aria-label', 'Training courses');
      wrap.innerHTML = `
        <div class="swiper-wrapper">
          ${data.map((c, i) => {
            const name = c.name || c.courseName || '';
            const img = c.image_url || c.image || `/images/courses/seekho-0${(i % 7) + 1}.webp`;
            return `
              <div class="swiper-slide">
                <a class="course-card course-anchor" id="${escapeHtml(c.slug || c.id)}" href="${courseDetailHref(c)}" aria-label="${escapeHtml(name)} details">
                    <div class="course-card__media media-frame media-frame--43">
                      ${c.badge ? `<span class="course-card__badge">${escapeHtml(c.badge)}</span>` : ''}
                      ${safeImg(img, name, { w: 1200, h: 900 })}
                    </div>
                    <div class="course-card__body">
                      <h2 class="course-card__title">${formatTitle(name, c.title_bold)}</h2>
                      <div class="course-card__desc rich-html">${sanitizeHtml(c.description || '')}</div>
                      <div class="course-card__meta">
                        <span class="course-card__price">${formatPrice(c.price)}</span>
                        <span class="course-card__duration"><i class="fa-regular fa-clock"></i> ${escapeHtml(classesLabel(c))}</span>
                      </div>
                    </div>
                </a>
              </div>`;
          }).join('')}
        </div>
        <div class="swiper-pagination course-swiper__dots"></div>`;

      if (typeof Swiper !== 'undefined') {
        new Swiper(wrap, {
          slidesPerView: 1.15,
          spaceBetween: 16,
          grabCursor: true,
          pagination: { el: wrap.querySelector('.course-swiper__dots'), clickable: true },
          breakpoints: {
            720: { slidesPerView: 2.15, spaceBetween: 16 },
            1024: { slidesPerView: 3, spaceBetween: 20 }
          },
          a11y: { enabled: true }
        });
      }
    } catch {
      wrap.innerHTML = '<p class="empty-state">Unable to load courses.</p>';
    }

    const hash = location.hash.replace('#', '');
    if (hash) {
      const id = HASH_ALIASES[hash] || hash;
      const el = document.getElementById(id);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
    }
    if (window.AOS) AOS.refresh();
  }

  init();
})();
