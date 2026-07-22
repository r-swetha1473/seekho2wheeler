/* Blog detail — slug from /blog/:slug */
(function () {
  const { api, qs, formatDate, toast } = Seekho;

  const slug = location.pathname.replace(/^\/blog\/?/, '').replace(/\/$/, '');
  const article = qs('#blogArticle');
  const loading = qs('#blogLoading');

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function updateMeta(blog) {
    document.title = blog.metaTitle || blog.title;
    const desc = blog.metaDescription || '';
    const setMeta = (sel, val) => {
      const el = document.querySelector(sel);
      if (el) el.setAttribute('content', val);
    };
    setMeta('meta[name="description"]', desc);
    setMeta('meta[property="og:title"]', blog.title);
    setMeta('meta[property="og:description"]', desc);
    setMeta('meta[property="og:url"]', `http://localhost:3000/blog/${blog.slug}`);
    setMeta('meta[name="twitter:title"]', blog.title);
    setMeta('meta[name="twitter:description"]', desc);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = `http://localhost:3000/blog/${blog.slug}`;
    const ld = document.getElementById('blogJsonLd');
    if (ld) {
      ld.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: blog.title,
        description: desc,
        image: blog.featuredImage,
        datePublished: blog.publishedAt || blog.createdAt,
        author: { '@type': 'Organization', name: 'Seekho Two Wheeler Academy' },
        publisher: { '@type': 'Organization', name: 'Seekho Two Wheeler Academy' }
      });
    }
  }

  async function init() {
    if (!slug) {
      location.href = '/pages/blog.html';
      return;
    }
    try {
      const { data: blog } = await api(`/blogs/${encodeURIComponent(slug)}`);
      updateMeta(blog);
      if (loading) loading.remove();
      if (article) {
        article.innerHTML = `
          <div class="blog-detail__cover media-frame media-frame--blog" data-aos="fade-up">
            ${Seekho.safeImg(blog.featuredImage, blog.title, { w: 1200, h: 630, priority: true })}
          </div>
          <div class="blog-detail__meta" data-aos="fade-up">
            <time datetime="${blog.publishedAt || blog.createdAt}">${formatDate(blog.publishedAt || blog.createdAt)}</time>
            <span>· Seekho Two Wheeler Academy</span>
          </div>
          <h1 class="blog-detail__title" data-aos="fade-up">${escapeHtml(blog.title)}</h1>
          <div class="blog-detail__content" data-aos="fade-up">${blog.content}</div>
          <div class="blog-detail__cta" data-aos="fade-up">
            <p>Ready to start your riding journey?</p>
            <a href="/pages/booking.html" class="btn btn--primary">Book Training Now</a>
          </div>`;
        article.hidden = false;
      }
      if (window.AOS) AOS.refresh();
    } catch {
      if (loading) loading.textContent = 'Article not found.';
      toast('Blog post not found.', 'error');
      setTimeout(() => { location.href = '/pages/blog.html'; }, 2000);
    }
  }

  init();
})();
