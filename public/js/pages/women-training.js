/* Women's Training page — gallery from existing /api/gallery?category=Women Riders */
(function () {
  const { api, qs, safeImg, formatTitle, openLightbox } = Seekho;

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function renderGallery() {
    const grid = qs('#womenGalleryGrid');
    if (!grid) return;
    const category = document.body.getAttribute('data-gallery-category') || 'Women Riders';
    try {
      const { data } = await api(`/gallery?category=${encodeURIComponent(category)}`);
      const items = Array.isArray(data) ? data : [];
      if (!items.length) {
        grid.innerHTML = '<p class="empty-state">Women Riders gallery photos will appear here once uploaded in Admin Gallery.</p>';
        return;
      }
      grid.innerHTML = items
        .map(
          (g) => `
        <div class="gallery-item media-frame media-frame--square" data-src="${escapeHtml(g.image)}" data-alt="${escapeHtml(g.title || g.category)}" tabindex="0" role="button" aria-label="Open gallery image">
          ${safeImg(g.image, g.title || g.category, { w: 800, h: 800 })}
          <div class="gallery-item__overlay"><span>${formatTitle(g.title || g.category, g.title_bold)}</span><i class="fa-solid fa-expand"></i></div>
        </div>`
        )
        .join('');

      grid.onclick = (e) => {
        const item = e.target.closest('.gallery-item');
        if (item) openLightbox(item.dataset.src, item.dataset.alt);
      };
      grid.onkeydown = (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const item = e.target.closest('.gallery-item');
        if (!item) return;
        e.preventDefault();
        openLightbox(item.dataset.src, item.dataset.alt);
      };
    } catch (err) {
      console.error('[women-training] gallery', err);
      grid.innerHTML = '<p class="empty-state">Unable to load the women riders gallery right now.</p>';
    }
  }

  document.querySelector('.page-loader')?.remove();
  if (window.AOS) AOS.init({ once: true, duration: 500, easing: 'ease-out' });
  renderGallery();
})();
