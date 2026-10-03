/* Location page enhancements — gallery, reviews, FAQ, New Town floats */
(function () {
  function boot() {
    if (!window.Seekho) {
      setTimeout(boot, 40);
      return;
    }
    const { api, qs, openLightbox, initFaq, safeImg, formatTitle, stars } = Seekho;
    const slug = document.body.getAttribute('data-location-slug');
    const category = document.body.getAttribute('data-gallery-category') || '';

    const faq = qs('#locFaq');
    if (faq && typeof initFaq === 'function') initFaq(faq);

    async function loadGallery() {
      const grid = qs('#locGallery');
      if (!grid) return;
      try {
        const { data } = await api('/gallery');
        const items = (data || []).filter((g) => g.active !== false && g.category === category);
        if (!items.length) {
          grid.innerHTML = `<p class="empty-state">No photos in “${category}” yet. Admins can upload under Gallery → ${category}.</p>`;
          return;
        }
        grid.className = 'gallery-grid-uniform';
        grid.innerHTML = items
          .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0))
          .map(
            (g) => `
          <div class="gallery-item media-frame media-frame--square" data-src="${g.image}" data-alt="${(g.title || g.category || '').replace(/"/g, '&quot;')}" tabindex="0" role="button">
            ${safeImg(g.image, g.title || g.category, { w: 800, h: 800 })}
            <div class="gallery-item__overlay"><span>${formatTitle(g.title || g.category, g.title_bold)}</span><i class="fa-solid fa-expand"></i></div>
          </div>`
          )
          .join('');
        grid.onclick = (e) => {
          const item = e.target.closest('.gallery-item');
          if (item) openLightbox(item.dataset.src, item.dataset.alt);
        };
      } catch {
        grid.innerHTML = '<p class="empty-state">Gallery unavailable.</p>';
      }
    }

    async function loadReviews() {
      const wrap = qs('#locReviews');
      if (!wrap) return;
      try {
        const { data } = await api('/testimonials');
        const list = (data || []).filter((t) => t.active !== false).slice(0, 3);
        if (!list.length) {
          wrap.innerHTML = '<p class="empty-state">Reviews will appear here when published.</p>';
          return;
        }
        wrap.innerHTML = `<div class="testimonial-grid">${list
          .map(
            (t) => `
          <article class="testimonial-card">
            <div class="rating-badge__stars" style="color:var(--primary)">${stars(t.rating)}</div>
            <h3>${formatTitle(t.headline || t.name, t.title_bold)}</h3>
            <p>${(t.review || '').slice(0, 180)}${(t.review || '').length > 180 ? '…' : ''}</p>
            <p><strong>${t.name || ''}</strong></p>
          </article>`
          )
          .join('')}</div>`;
      } catch {
        wrap.innerHTML = '<p class="empty-state">Reviews unavailable.</p>';
      }
    }

    function setupFloatingReviews() {
      const box = qs('[data-loc-float-reviews]');
      if (!box) return;
      const s = window.SEEKHO_SETTINGS || {};
      const href = s.gmb_url || s.mainBranch?.mapsUrl || '/pages/reviews.html';
      const link = box.querySelector('[data-gmb-link]');
      if (link) {
        link.href = href;
        if (/^https?:/i.test(href)) {
          link.target = '_blank';
          link.rel = 'noopener';
        }
      }
      box.hidden = false;
    }

    loadGallery();
    loadReviews();
    // Settings may load async via app.js
    const waitSettings = setInterval(() => {
      if (window.SEEKHO_SETTINGS) {
        clearInterval(waitSettings);
        setupFloatingReviews();
      }
    }, 80);
    setTimeout(() => clearInterval(waitSettings), 4000);
    if (window.AOS) AOS.init({ once: true, duration: 600 });
  }
  boot();
})();
