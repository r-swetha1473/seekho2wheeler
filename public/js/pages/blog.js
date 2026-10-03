/* Blog listing — 1200x630 frames + short description + Read More */
(function () {
  const { api, qs, formatDate, safeImg, formatTitle } = Seekho;

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
    grid.innerHTML = Array.from({ length: 6 }, () => '<div class="skeleton media-skeleton" style="height:300px"></div>').join('');
    try {
      const { data } = await api('/blogs');
      grid.className = 'blog-grid blog-grid--page';
      grid.innerHTML = data.length
        ? data.map((b) => `
          <article class="blog-card">
            <a href="/blog/${b.slug}" class="blog-card__link">
              <div class="blog-card__media media-frame media-frame--blog">
                ${safeImg(b.featuredImage, b.title, { w: 1200, h: 630 })}
              </div>
              <div class="blog-card__body">
                <div class="blog-card__date">${formatDate(b.publishedAt || b.createdAt)}</div>
                ${b.category ? `<div class="blog-card__category">${escapeHtml(b.category)}</div>` : ''}
                <h2 class="blog-card__title">${formatTitle(b.title, b.title_bold)}</h2>
                <p class="blog-card__excerpt">${escapeHtml(b.shortDescription || b.metaDescription || '').slice(0, 160)}${(b.shortDescription || b.metaDescription || '').length > 160 ? '…' : ''}</p>
                <span class="blog-card__more">Read More <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
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
