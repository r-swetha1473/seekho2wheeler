/* Blog listing — 1200x630 frames */
(function () {
  const { api, qs, formatDate, safeImg } = Seekho;

  const grid = qs('#blogGrid');

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function init() {
    if (!grid) return;
    grid.innerHTML = Array.from({ length: 3 }, () => '<div class="skeleton media-skeleton" style="height:300px"></div>').join('');
    try {
      const { data } = await api('/blogs');
      grid.className = 'blog-rail blog-rail--page';
      grid.innerHTML = data.length
        ? data.map((b) => `
          <article class="blog-card blog-rail__card">
            <a href="/blog/${b.slug}">
              <div class="blog-card__media media-frame media-frame--blog">
                ${safeImg(b.featuredImage, b.title, { w: 1200, h: 630 })}
              </div>
              <div class="blog-card__body">
                <div class="blog-card__date">${formatDate(b.publishedAt || b.createdAt)}</div>
                <h2 class="blog-card__title">${escapeHtml(b.title)}</h2>
                <p class="blog-card__excerpt">${escapeHtml(b.metaDescription || '').slice(0, 140)}${(b.metaDescription || '').length > 140 ? '…' : ''}</p>
              </div>
            </a>
          </article>`).join('')
        : '<p class="empty-state">No blog posts yet. Check back soon!</p>';
      if (window.AOS) AOS.refresh();
    } catch {
      grid.innerHTML = '<p class="empty-state">Unable to load blog posts.</p>';
    }
  }

  init();
})();
