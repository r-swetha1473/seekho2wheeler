/* Reviews — slider on mobile, grid on larger screens via Swiper breakpoints */
(function () {
  const { api, qs, stars, safeImg } = Seekho;

  const grid = qs('#testimonialGrid');

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function init() {
    if (!grid) return;
    grid.innerHTML = Array.from({ length: 3 }, () => '<div class="skeleton media-skeleton" style="height:360px"></div>').join('');
    try {
      const { data } = await api('/testimonials');
      if (!data.length) {
        grid.innerHTML = '<p class="empty-state">No reviews available yet.</p>';
        return;
      }

      grid.className = 'swiper reviews-swiper';
      grid.setAttribute('aria-label', 'Student reviews');
      grid.innerHTML = `
        <div class="swiper-wrapper">
          ${data.map((t) => `
            <div class="swiper-slide">
              <article class="testimonial-card">
                <div class="testimonial-card__media media-frame media-frame--square media-frame--contain">
                  ${safeImg(t.photo, t.name, { w: 800, h: 800, className: 'img-contain' })}
                  ${t.type === 'video' || t.videoUrl ? '<div class="testimonial-card__play"><i class="fa-solid fa-circle-play"></i></div>' : ''}
                </div>
                <div class="testimonial-card__body">
                  <div class="rating-badge__stars" style="color:var(--primary);margin-bottom:0.4rem">${stars(t.rating)}</div>
                  <h2 class="testimonial-card__headline">${escapeHtml(t.headline || 'Student Story')}</h2>
                  <p class="testimonial-card__text">"${escapeHtml(t.review)}"</p>
                  <div class="testimonial-card__author">— ${escapeHtml(t.name)}</div>
                </div>
              </article>
            </div>`).join('')}
        </div>
        <div class="swiper-pagination reviews-swiper__dots"></div>`;

      const swiper = new Swiper(grid, {
        slidesPerView: 1,
        spaceBetween: 16,
        loop: data.length > 1,
        autoplay: data.length > 1 ? { delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true } : false,
        pagination: { el: grid.querySelector('.reviews-swiper__dots'), clickable: true },
        breakpoints: {
          720: { slidesPerView: 2, spaceBetween: 16 },
          1024: { slidesPerView: 3, spaceBetween: 20 }
        },
        a11y: { enabled: true }
      });

      if (swiper.autoplay) {
        grid.addEventListener('touchstart', () => swiper.autoplay.stop(), { passive: true });
        grid.addEventListener('touchend', () => {
          setTimeout(() => swiper.autoplay.start(), 2500);
        }, { passive: true });
      }
    } catch {
      grid.innerHTML = '<p class="empty-state">Unable to load reviews.</p>';
    }
  }

  init();
})();
