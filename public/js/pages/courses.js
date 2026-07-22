/* Courses page — equal 4:3 framed cards */
(function () {
  const { api, qs, formatPrice, safeImg } = Seekho;

  const COURSE_MAP = {
    'Scooty Training': 'scooty',
    'Bike Training': 'bike',
    'Ladies Training': 'ladies',
    'Electric Vehicle Training': 'ev',
    'Road Practice': 'road',
    'RTO Practice': 'rto'
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
      wrap.className = 'course-grid';
      wrap.innerHTML = data.map((c, i) => {
        const id = COURSE_MAP[c.courseName] || c.id;
        const img = c.image || `/images/courses/seekho-0${(i % 7) + 1}.webp`;
        return `
          <article class="course-card course-anchor" id="${id}" data-aos="fade-up" data-aos-delay="${i * 50}">
            <div class="course-card__media media-frame media-frame--43">
              ${safeImg(img, c.courseName, { w: 1200, h: 900 })}
            </div>
            <div class="course-card__body">
              <h2 class="course-card__title">${escapeHtml(c.courseName)}</h2>
              <p class="course-card__desc">${escapeHtml(c.description || '')}</p>
              <div class="course-card__meta">
                <span class="course-card__price">${formatPrice(c.price)}</span>
                <span class="course-card__duration"><i class="fa-regular fa-clock"></i> ${escapeHtml(c.duration || 'Flexible')}</span>
              </div>
              <a href="/pages/booking.html?course=${encodeURIComponent(c.courseName)}" class="btn btn--primary btn--block">Book Now</a>
            </div>
          </article>`;
      }).join('');
    } catch {
      wrap.innerHTML = '<p class="empty-state">Unable to load courses.</p>';
    }

    const hash = location.hash.replace('#', '');
    if (hash) {
      const el = document.getElementById(hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
    }
    if (window.AOS) AOS.refresh();
  }

  init();
})();
