/* Gallery — uniform grid + lightbox */
(function () {
  const { api, qs, qsa, openLightbox, safeImg } = Seekho;

  const grid = qs('#galleryGrid');
  let items = [];

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function paint(filter = 'all') {
    if (!grid) return;
    const list = filter === 'all' ? items : items.filter((g) => g.category === filter);
    grid.className = 'gallery-grid-uniform';
    grid.innerHTML = list.length
      ? list.map((g) => `
        <div class="gallery-item media-frame media-frame--square" data-aos="fade-up" data-src="${g.image}" data-alt="${escapeHtml(g.title || g.category)}" tabindex="0" role="button" aria-label="Open gallery image">
          ${safeImg(g.image, g.title || g.category, { w: 800, h: 800 })}
          <div class="gallery-item__overlay"><span>${escapeHtml(g.category)}</span><i class="fa-solid fa-expand"></i></div>
        </div>`).join('')
      : '<p class="empty-state">No images in this category.</p>';
    if (window.AOS) AOS.refresh();
  }

  async function init() {
    if (!grid) return;
    grid.className = 'gallery-grid-uniform';
    grid.innerHTML = Array.from({ length: 6 }, () => '<div class="skeleton media-skeleton" style="height:220px"></div>').join('');
    try {
      items = (await api('/gallery')).data;
      paint();
    } catch {
      grid.innerHTML = '<p class="empty-state">Gallery unavailable. Please try again later.</p>';
      return;
    }

    grid.addEventListener('click', (e) => {
      const item = e.target.closest('.gallery-item');
      if (item) openLightbox(item.dataset.src, item.dataset.alt);
    });
    grid.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const item = e.target.closest('.gallery-item');
      if (!item) return;
      e.preventDefault();
      openLightbox(item.dataset.src, item.dataset.alt);
    });

    qsa('.gallery-filters .filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        qsa('.gallery-filters .filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        paint(btn.dataset.filter);
      });
    });
  }

  init();
})();
