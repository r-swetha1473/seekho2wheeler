/* Reviews — 1:1 face-safe contain frames */
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
      grid.innerHTML = data.length
        ? data.map((t, i) => `
          <article class="testimonial-card" data-aos="fade-up" data-aos-delay="${(i % 6) * 60}">
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
          </article>`).join('')
        : '<p class="empty-state">No reviews available yet.</p>';
      if (window.AOS) AOS.refresh();
    } catch {
      grid.innerHTML = '<p class="empty-state">Unable to load reviews.</p>';
    }
  }

  init();
})();
